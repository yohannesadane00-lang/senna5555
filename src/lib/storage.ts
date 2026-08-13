/**
 * Secure Storage Helper Module
 * Encapsulates all LocalStorage access with mandatory user UID scoping.
 */

export const getKey = (key: string, uid: string): string => {
  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    throw new Error(`[SecureStorage] Cannot construct storage key '${key}' without a valid user UID.`);
  }
  return `senna_${uid}_${key}`;
};

export const getSecureItem = <T>(key: string, uid: string | undefined): T | null => {
  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    return null;
  }
  try {
    const fullKey = getKey(key, uid);
    const item = localStorage.getItem(fullKey);
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
    const fullKey = getKey(key, uid);
    localStorage.setItem(fullKey, JSON.stringify(value));
  } catch (err) {
    console.warn(`[SecureStorage] Failed to write '${key}' for UID '${uid}':`, err);
  }
};

export const removeSecureItem = (key: string, uid: string | undefined): void => {
  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    return;
  }
  try {
    const fullKey = getKey(key, uid);
    localStorage.removeItem(fullKey);
  } catch (err) {
    console.warn(`[SecureStorage] Failed to remove '${key}' for UID '${uid}':`, err);
  }
};

export const clearAllLocalStorage = (): void => {
  try {
    localStorage.clear();
  } catch (err) {
    console.warn('[SecureStorage] Error clearing local storage:', err);
  }
};
