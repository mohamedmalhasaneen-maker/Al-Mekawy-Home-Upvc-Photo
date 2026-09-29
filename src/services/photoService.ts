import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { PhotoItem, PhotoCategory } from '../types/photo';

/**
 * Optimizes and converts an image file to Base64 string client-side.
 */
export async function fileToBase64(file: File, maxDimension = 1920, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export interface UploadPhotoParams {
  file: File;
  category: PhotoCategory;
  title: string;
  onProgress?: (percent: number) => void;
}

/**
 * Uploads a photo to Cloud Storage via backend API, then stores its metadata document in Firestore.
 */
export async function uploadProductPhoto({
  file,
  category,
  title,
  onProgress,
}: UploadPhotoParams): Promise<PhotoItem> {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const docId = `photo_${timestamp}_${randomSuffix}`;

  if (onProgress) onProgress(15);

  // 1. Convert & optimize file to base64
  const base64Data = await fileToBase64(file);
  if (onProgress) onProgress(35);

  // 2. Upload to Cloud Storage API endpoint
  let uploadResult: { imageUrl: string; storagePath: string };

  try {
    if (onProgress) onProgress(55);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: base64Data,
        filename: file.name,
        category,
        title,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.imageUrl) {
      throw new Error('لم يتم استلام رابط الصورة من السحابة');
    }

    uploadResult = {
      imageUrl: data.imageUrl,
      storagePath: data.storagePath || `cloud_${timestamp}`,
    };

    if (onProgress) onProgress(85);
  } catch (apiError: any) {
    console.warn('Backend upload API error, attempting direct Cloudinary fallback:', apiError);

    // Direct fallback to Cloudinary / ImgBB if needed
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'almekawy_upvc');

      const directRes = await fetch('https://api.cloudinary.com/v1_1/dxk0bmhks/image/upload', {
        method: 'POST',
        body: formData,
      });

      if (directRes.ok) {
        const directData = await directRes.json();
        uploadResult = {
          imageUrl: directData.secure_url,
          storagePath: directData.public_id || `cloudinary_${timestamp}`,
        };
      } else {
        throw new Error(apiError.message || 'فشل رفع الصورة إلى التخزين السحابي');
      }
    } catch (fallbackError) {
      throw new Error(apiError.message || 'فشل رفع الصورة إلى السحابة. يرجى المحاولة مرة أخرى.');
    }
  }

  // 3. Save metadata to Cloud Firestore
  const photoData: PhotoItem = {
    id: docId,
    imageUrl: uploadResult.imageUrl,
    storagePath: uploadResult.storagePath,
    category,
    title: title.trim() || getDefaultTitle(category),
    order: timestamp,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'photos', docId), photoData);
    if (onProgress) onProgress(100);
    return photoData;
  } catch (firestoreError) {
    handleFirestoreError(firestoreError, OperationType.CREATE, `photos/${docId}`);
    throw firestoreError;
  }
}

function getDefaultTitle(category: PhotoCategory): string {
  switch (category) {
    case 'windows':
      return 'شباك UPVC عازل عالي الجودة';
    case 'doors':
      return 'باب UPVC مودرن متميز';
    case 'balconies':
      return 'تقفيل بلكونة UPVC عصرية';
    default:
      return 'منتج UPVC متميز';
  }
}

/**
 * Deletes photo from both Cloud Storage and Firestore.
 */
export async function deleteProductPhoto(photo: PhotoItem): Promise<void> {
  // 1. Delete from Cloud Storage via backend
  try {
    await fetch('/api/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storagePath: photo.storagePath,
        publicId: photo.storagePath,
      }),
    });
  } catch (storageErr) {
    console.warn('Cloud storage delete notice:', storageErr);
  }

  // 2. Delete document from Firestore
  try {
    await deleteDoc(doc(db, 'photos', photo.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `photos/${photo.id}`);
    throw error;
  }
}

/**
 * Updates metadata (title, category, order) in Firestore.
 */
export async function updatePhotoMetadata(
  photoId: string,
  data: Partial<Pick<PhotoItem, 'title' | 'category' | 'order'>>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'photos', photoId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `photos/${photoId}`);
    throw error;
  }
}

/**
 * Subscribes in real-time to all photos from Firestore.
 */
export function subscribeToPhotos(
  onUpdate: (photos: PhotoItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const photosQuery = query(collection(db, 'photos'), orderBy('order', 'desc'));

  return onSnapshot(
    photosQuery,
    (snapshot) => {
      const items: PhotoItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as PhotoItem;
        items.push({
          ...data,
          id: docSnap.id,
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.error('Real-time photos subscription error:', error);
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.GET, 'photos');
    }
  );
}
