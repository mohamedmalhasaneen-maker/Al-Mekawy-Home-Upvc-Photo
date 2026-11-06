import { auth } from '../firebase/config';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

const ADMIN_STORAGE_KEY = 'almekawy_is_admin';
const ADMIN_PASSCODE = '662006';

type AuthListener = (isAdmin: boolean) => void;
const listeners = new Set<AuthListener>();

export function getIsAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  const isStored = sessionStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
  const hasFirebaseUser = Boolean(auth.currentUser);
  return isStored || hasFirebaseUser;
}

export function notifyAdminChange(isAdmin: boolean) {
  if (typeof window !== 'undefined') {
    if (isAdmin) {
      sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true');
    } else {
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  }
  listeners.forEach((listener) => listener(isAdmin));
}

export function subscribeAdminAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  // Initial check
  listener(getIsAdmin());

  // Listen to Firebase auth changes
  const unsubscribeFirebase = auth.onAuthStateChanged((user) => {
    if (user) {
      notifyAdminChange(true);
    } else {
      const isStored = sessionStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
      if (!isStored) {
        notifyAdminChange(false);
      }
    }
  });

  // Listen to storage events across tabs/windows
  const handleStorage = (event: StorageEvent) => {
    if (event.key === ADMIN_STORAGE_KEY) {
      listener(event.newValue === 'true');
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    listeners.delete(listener);
    unsubscribeFirebase();
    window.removeEventListener('storage', handleStorage);
  };
}

/**
 * Login function supporting both:
 * 1) Firebase Auth email/password if configured
 * 2) The site admin passcode '662006'
 */
export async function loginAdmin(password: string, email?: string): Promise<boolean> {
  const cleanPassword = password.trim();
  const cleanEmail = email?.trim() || '';

  // 1. Check Passcode '662006'
  if (cleanPassword === ADMIN_PASSCODE) {
    notifyAdminChange(true);
    return true;
  }

  // 2. If email is provided, attempt Firebase Authentication
  if (cleanEmail && cleanPassword) {
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      notifyAdminChange(true);
      return true;
    } catch (firebaseErr: any) {
      console.warn('Firebase auth attempt returned:', firebaseErr?.code);
      let message = 'فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.';
      if (firebaseErr?.code === 'auth/invalid-credential' || firebaseErr?.code === 'auth/wrong-password') {
        message = 'كلمة المرور أو البريد الإلكتروني غير صحيح.';
      } else if (firebaseErr?.code === 'auth/user-not-found') {
        message = 'حساب المشرف غير موجود بهذا البريد.';
      } else if (firebaseErr?.code === 'auth/too-many-requests') {
        message = 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً.';
      } else if (firebaseErr?.code === 'auth/invalid-email') {
        message = 'صيغة البريد الإلكتروني غير صالحة.';
      }
      throw new Error(message);
    }
  }

  throw new Error('كلمة المرور غير صحيحة. يرجى إدخال كلمة المرور الصحيحة.');
}

export async function logoutAdmin(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out notice:', err);
  }
  notifyAdminChange(false);
}
