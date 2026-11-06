import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';

export interface ContactPhone {
  id: string;
  number: string;
  label: string;
}

export interface SocialLink {
  id: string;
  platform: 'facebook' | 'tiktok' | 'instagram' | 'other';
  name: string;
  url: string;
}

export interface ContactConfig {
  phones: ContactPhone[];
  socials: SocialLink[];
  updatedAt: string;
}

export const DEFAULT_CONTACT_CONFIG: ContactConfig = {
  phones: [
    { id: 'phone-1', number: '01141761261', label: 'الرقم الأول (المبيعات والمعارض)' },
    { id: 'phone-2', number: '01060524985', label: 'الرقم الثاني (المعاينة والتركيبات)' },
  ],
  socials: [
    {
      id: 'soc-fb',
      platform: 'facebook',
      name: 'Facebook',
      url: 'https://www.facebook.com/almekawy.home?rdid=w6WDP7dzE0GGC2Up&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1FM7yzL2Wx%2F#',
    },
    {
      id: 'soc-tk',
      platform: 'tiktok',
      name: 'TikTok',
      url: 'https://www.tiktok.com/@almekawy.home?_r=1&_t=ZS-9AARNosDKOS',
    },
    {
      id: 'soc-ig',
      platform: 'instagram',
      name: 'Instagram',
      url: 'https://www.instagram.com/almekawy.home?stkn=bXBqZmw3NGt4bzVs',
    },
  ],
  updatedAt: new Date().toISOString(),
};

const CONTACT_DOC_PATH = 'settings/contact_config';

/**
 * Subscribes to real-time contact and social media settings in Firestore
 */
export function subscribeToContactConfig(
  onUpdate: (config: ContactConfig) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, 'settings', 'contact_config');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<ContactConfig>;
        onUpdate({
          ...DEFAULT_CONTACT_CONFIG,
          ...data,
          phones: Array.isArray(data.phones) && data.phones.length > 0 ? data.phones : DEFAULT_CONTACT_CONFIG.phones,
          socials: Array.isArray(data.socials) && data.socials.length > 0 ? data.socials : DEFAULT_CONTACT_CONFIG.socials,
        });
      } else {
        onUpdate(DEFAULT_CONTACT_CONFIG);
      }
    },
    (error) => {
      console.warn('Real-time contact config listener notice:', error.message);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, CONTACT_DOC_PATH);
    }
  );
}

/**
 * Gets one-time contact config from Firestore
 */
export async function getContactConfig(): Promise<ContactConfig> {
  try {
    const docRef = doc(db, 'settings', 'contact_config');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as Partial<ContactConfig>;
      return {
        ...DEFAULT_CONTACT_CONFIG,
        ...data,
        phones: Array.isArray(data.phones) && data.phones.length > 0 ? data.phones : DEFAULT_CONTACT_CONFIG.phones,
        socials: Array.isArray(data.socials) && data.socials.length > 0 ? data.socials : DEFAULT_CONTACT_CONFIG.socials,
      };
    }
    return DEFAULT_CONTACT_CONFIG;
  } catch (error) {
    console.error('Error fetching contact config:', error);
    return DEFAULT_CONTACT_CONFIG;
  }
}

/**
 * Saves contact config permanently to Firebase Firestore
 */
export async function saveContactConfig(
  config: Partial<ContactConfig>
): Promise<ContactConfig> {
  const current = await getContactConfig();
  const updated: ContactConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, 'settings', 'contact_config');
    await setDoc(docRef, updated, { merge: true });
    return updated;
  } catch (error) {
    console.error('Failed to save contact config to Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, CONTACT_DOC_PATH);
    throw error;
  }
}
