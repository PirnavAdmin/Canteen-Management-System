/**
 * Storage Service - handles caching with localStorage and in-memory fallback.
 * Allows realistic frontend CRUD interactions without requiring a live backend.
 */

const memoryStore = new Map();

export const storageService = {
  getItem: (key, defaultValue = null) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          return JSON.parse(item);
        }
      }
    } catch (e) {
      console.warn(`Error reading ${key} from localStorage:`, e);
    }
    return memoryStore.has(key) ? memoryStore.get(key) : defaultValue;
  },

  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn(`Error writing ${key} to localStorage:`, e);
    }
    memoryStore.set(key, value);
  },

  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`Error removing ${key} from localStorage:`, e);
    }
    memoryStore.delete(key);
  }
};

