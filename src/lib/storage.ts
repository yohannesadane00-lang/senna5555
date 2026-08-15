/**
 * Secure Storage Helper Module
 * Encapsulates all LocalStorage access with mandatory user UID scoping.
 */

export const getKey = (key: string, uid: string): string => {
  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    throw new Error(`[SecureStorage] Cannot construct storage key '${key}' without a valid user UID.`);
  }
  if (key === 'subscribers') {
    return `subscribers_${uid}`;
  }
  return `senna_${uid}_${key}`;
};

export const getSecureItem = <T>(key: string, uid: string | undefined): T | null => {
  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    return null;
  }
  try {
    const primaryKey = key === 'subscribers' ? `subscribers_${uid}` : `senna_${uid}_${key}`;
    let item = localStorage.getItem(primaryKey);
    
    // Backward compatibility check for legacy storage key format
    if (!item && key === 'subscribers') {
      item = localStorage.getItem(`senna_${uid}_subscribers`);
    }

    if (!item) return null;
    
    const parsed = JSON.parse(item);
    return parsed as T;
  } catch (err) {
    console.warn(`[SecureStorage] Failed to read '${key}' for UID '${uid}':`, err);
    return null;
  }
};

export const setSecureItem = <T>(key: string, uid: string | undefined, value: T): void => {
  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    return;
  }
  try {
    const primaryKey = key === 'subscribers' ? `subscribers_${uid}` : `senna_${uid}_${key}`;
    localStorage.setItem(primaryKey, JSON.stringify(value));
  } catch (err) {
    console.warn(`[SecureStorage] Failed to write '${key}' for UID '${uid}':`, err);
  }
};

export const removeSecureItem = (key: string, uid: string | undefined): void => {
  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    return;
  }
  try {
    const primaryKey = key === 'subscribers' ? `subscribers_${uid}` : `senna_${uid}_${key}`;
    localStorage.removeItem(primaryKey);
    if (key === 'subscribers') {
      localStorage.removeItem(`senna_${uid}_subscribers`);
    }
  } catch (err) {
    console.warn(`[SecureStorage] Failed to remove '${key}' for UID '${uid}':`, err);
  }
};

/**
 * Clears only session and authentication state tokens on logout.
 * Subscriber records stored under subscribers_${userId} are strictly preserved.
 */
export const clearAllLocalStorage = (): void => {
  try {
    localStorage.removeItem('senna_org_id');
    localStorage.removeItem('senna_org_name');
    localStorage.removeItem('senna_demo_user');
    localStorage.removeItem('senna_pending_org_name');
  } catch (err) {
    console.warn('[SecureStorage] Error clearing session storage:', err);
  }
};

