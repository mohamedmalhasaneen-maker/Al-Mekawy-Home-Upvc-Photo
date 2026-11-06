import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';

export interface PublishingSettings {
  isGalleryPublished: boolean; // Master switch for publishing gallery to visitors
  publishWindows: boolean; // Publish windows category
  publishDoors: boolean; // Publish doors category
  publishBalconies: boolean; // Publish balconies category
  unpublishedPhotoIds: string[]; // Specific photo IDs withheld from publication
  allowLightboxViewing: boolean; // Allow visitors to open enlarged photo lightbox
  watermarkOrBadgeVisible: boolean; // Display verified Al-Mekawy Home badge
  noticeMessage: string; // Message shown if gallery or section is unpublished
  updatedAt: string;
}

export const DEFAULT_PUBLISHING_SETTINGS: PublishingSettings = {
  isGalleryPublished: true,
  publishWindows: true,
  publishDoors: true,
  publishBalconies: true,
  unpublishedPhotoIds: [],
  allowLightboxViewing: true,
  watermarkOrBadgeVisible: true,
  noticeMessage: 'معرض صور منتجات Al Mekawy Home UPVC قيد التحديث وسيتم إعادة عرضه قريباً بأحدث الأعمال.',
  updatedAt: new Date().toISOString(),
};

const SETTINGS_DOC_PATH = 'settings/publishing';

/**
 * Subscribes to real-time publishing settings in Firestore
 */
export function subscribeToPublishingSettings(
  onUpdate: (settings: PublishingSettings) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, 'settings', 'publishing');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<PublishingSettings>;
        onUpdate({
          ...DEFAULT_PUBLISHING_SETTINGS,
          ...data,
          unpublishedPhotoIds: Array.isArray(data.unpublishedPhotoIds)
            ? data.unpublishedPhotoIds
            : [],
        });
      } else {
        // If document doesn't exist yet, return defaults
        onUpdate(DEFAULT_PUBLISHING_SETTINGS);
      }
    },
    (error) => {
      console.warn('Real-time settings listener notice:', error.message);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, SETTINGS_DOC_PATH);
    }
  );
}

/**
 * Gets one-time publishing settings from Firestore
 */
export async function getPublishingSettings(): Promise<PublishingSettings> {
  try {
    const docRef = doc(db, 'settings', 'publishing');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as Partial<PublishingSettings>;
      return {
        ...DEFAULT_PUBLISHING_SETTINGS,
        ...data,
        unpublishedPhotoIds: Array.isArray(data.unpublishedPhotoIds)
          ? data.unpublishedPhotoIds
          : [],
      };
    }
    return DEFAULT_PUBLISHING_SETTINGS;
  } catch (error) {
    console.error('Error fetching publishing settings:', error);
    return DEFAULT_PUBLISHING_SETTINGS;
  }
}

/**
 * Saves publishing settings permanently to Firebase Firestore
 */
export async function savePublishingSettings(
  settings: Partial<PublishingSettings>
): Promise<PublishingSettings> {
  const updatedSettings: PublishingSettings = {
    ...DEFAULT_PUBLISHING_SETTINGS,
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, 'settings', 'publishing');
    await setDoc(docRef, updatedSettings, { merge: true });
    return updatedSettings;
  } catch (error) {
    console.error('Failed to save publishing settings to Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, SETTINGS_DOC_PATH);
    throw error;
  }
}
