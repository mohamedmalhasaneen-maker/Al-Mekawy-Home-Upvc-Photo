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

export const CLOUDINARY_CLOUD_NAME = 'obvb7rtp';
export const CLOUDINARY_UPLOAD_PRESET = 'AI-Mekawy Home';
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface UploadPhotoParams {
  file: File;
  category: PhotoCategory;
  title: string;
  onProgress?: (percent: number, stepText?: string) => void;
}

/**
 * Uploads a file directly to Cloudinary using the unsigned upload preset.
 * Attempts the exact requested preset ("AI-Mekawy Home"), and gracefully
 * handles the minor Latin I vs l variant ("Al-Mekawy Home") if needed,
 * while printing full diagnostic details to the console on any failure.
 */
async function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number, stepText?: string) => void
): Promise<{ secure_url: string; public_id: string }> {
  const tryUpload = async (presetName: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', presetName);

    console.log(`[Cloudinary Upload] Initiating upload to ${CLOUDINARY_UPLOAD_URL} with preset "${presetName}"...`);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data || !data.secure_url) {
      const errorMsg = data?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error(`[Cloudinary Upload Error] (Preset: "${presetName}"):`, data?.error || data || response.statusText);
      const err = new Error(errorMsg);
      (err as any).cloudinaryData = data;
      (err as any).status = response.status;
      throw err;
    }

    return {
      secure_url: data.secure_url as string,
      public_id: data.public_id as string,
    };
  };

  if (onProgress) onProgress(30, 'جاري رفع الصورة مباشرة إلى Cloudinary...');

  try {
    const result = await tryUpload(CLOUDINARY_UPLOAD_PRESET);
    console.log('[Cloudinary Upload Success]:', result.secure_url);
    return result;
  } catch (primaryErr: any) {
    // If the exact preset name has a visual font typo (Capital I vs small l in Al/AI), test fallback
    if (primaryErr?.message?.includes('Upload preset not found')) {
      console.warn(`[Cloudinary Upload] Preset "${CLOUDINARY_UPLOAD_PRESET}" not found. Trying "Al-Mekawy Home"...`);
      try {
        const fallbackResult = await tryUpload('Al-Mekawy Home');
        console.log('[Cloudinary Upload Fallback Success]:', fallbackResult.secure_url);
        return fallbackResult;
      } catch (fallbackErr) {
        console.error('[Cloudinary Upload Fallback Failed]:', fallbackErr);
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
}

/**
 * Uploads photo directly to Cloudinary -> gets secure_url -> stores document in Firestore
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

  // 1. Direct upload to Cloudinary
  if (onProgress) onProgress(20, 'جاري الاتصال بسحابة Cloudinary...');
  
  let cloudinaryResult: { secure_url: string; public_id: string };
  try {
    cloudinaryResult = await uploadToCloudinary(file, onProgress);
  } catch (uploadError: any) {
    console.error('Fatal Cloudinary Error during upload:', uploadError);
    throw new Error(
      `خطأ في الرفع إلى Cloudinary: ${uploadError?.message || 'تعذر الوصول إلى سحابة Cloudinary'}`
    );
  }

  if (onProgress) onProgress(75, 'تم الحصول على رابط Cloudinary. جاري الحفظ في Firestore...');

  // 2. Save document directly to Firebase Firestore
  const photoItem: PhotoItem = {
    id: docId,
    imageUrl: cloudinaryResult.secure_url,
    storagePath: cloudinaryResult.public_id,
    category,
    title: title.trim() || getDefaultTitle(category),
    order: timestamp,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    console.log(`[Firestore Write] Saving photo document "${docId}" in collection "photos"...`, photoItem);
    await setDoc(doc(db, 'photos', docId), photoItem);
    console.log(`[Firestore Write Success] Photo "${docId}" saved successfully.`);
    if (onProgress) onProgress(100, 'تم رفع وحفظ الصورة بنجاح ✓');
    return photoItem;
  } catch (firestoreError) {
    console.error('Firestore save failed:', firestoreError);
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
 * Deletes photo permanently from Firestore
 */
export async function deleteProductPhoto(photo: PhotoItem): Promise<void> {
  try {
    console.log(`[Firestore Delete] Deleting photo document "${photo.id}"...`);
    await deleteDoc(doc(db, 'photos', photo.id));
    console.log(`[Firestore Delete Success] Photo "${photo.id}" deleted.`);
  } catch (error) {
    console.error('Firestore delete failed:', error);
    handleFirestoreError(error, OperationType.DELETE, `photos/${photo.id}`);
    throw error;
  }
}

/**
 * Updates metadata (title, category, order) in Firestore
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
 * Subscribes in real-time to all photos from Firestore
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
