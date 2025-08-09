// Shared localStorage utilities for common storage operations

import { FORM_LIMITS } from './constants';

// Generic localStorage wrapper with error handling
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get item from localStorage for key: ${key}`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to set item in localStorage for key: ${key}`, error);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove item from localStorage for key: ${key}`, error);
      return false;
    }
  },

  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage', error);
      return false;
    }
  }
};

// Generic JSON storage utilities
export const jsonStorage = {
  get: <T>(key: string, defaultValue: T): T => {
    const stored = safeLocalStorage.getItem(key);
    try {
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): boolean => {
    try {
      return safeLocalStorage.setItem(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },

  remove: (key: string): boolean => {
    return safeLocalStorage.removeItem(key);
  }
};

// Auto-complete data management utilities
export interface BaseAutoCompleteData {
  fullNames: string[];
  emails: string[];
  phones: string[];
  panNumbers: string[];
}

export const createAutoCompleteManager = <T extends BaseAutoCompleteData>(
  storageKey: string,
  defaultData: T
) => {
  return {
    getData: (): T => {
      return jsonStorage.get(storageKey, defaultData);
    },

    updateField: (field: keyof T, value: string): void => {
      if (!value || value.trim().length < FORM_LIMITS.minValueLength) return;
      
      const data = jsonStorage.get(storageKey, defaultData);
      const trimmedValue = value.trim();
      
      if (Array.isArray(data[field]) && !data[field].includes(trimmedValue)) {
        (data[field] as string[]) = [
          ...(data[field] as string[]).slice(-(FORM_LIMITS.autoCompleteLimit - 1)), 
          trimmedValue
        ];
        jsonStorage.set(storageKey, data);
      }
    },

    clearData: (): boolean => {
      return jsonStorage.remove(storageKey);
    }
  };
};

// Generic form data persistence utilities
export const createFormDataManager = <T>(storageKey: string) => {
  return {
    save: (formData: T): boolean => {
      return jsonStorage.set(storageKey, formData);
    },

    load: (): T | null => {
      const stored = safeLocalStorage.getItem(storageKey);
      try {
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    },

    clear: (): boolean => {
      return jsonStorage.remove(storageKey);
    }
  };
};

// Generic settings persistence utilities
export const createSettingsManager = <T>(storageKey: string, defaultSettings: T) => {
  return {
    getSettings: (): T => {
      return jsonStorage.get(storageKey, defaultSettings);
    },

    saveSettings: (settings: T): boolean => {
      return jsonStorage.set(storageKey, settings);
    },

    resetSettings: (): boolean => {
      return jsonStorage.set(storageKey, defaultSettings);
    },

    clearSettings: (): boolean => {
      return jsonStorage.remove(storageKey);
    }
  };
};

// Generic saved forms manager
export interface SavedForm<T> {
  id: string;
  name: string;
  timestamp: number;
  data: T;
}

export const createSavedFormsManager = <T>(storageKey: string) => {
  return {
    getSavedForms: (): SavedForm<T>[] => {
      return jsonStorage.get(storageKey, []);
    },

    saveForm: (name: string, data: T): string => {
      const savedForms = jsonStorage.get(storageKey, []);
      const newForm: SavedForm<T> = {
        id: Date.now().toString(),
        name,
        timestamp: Date.now(),
        data,
      };
      
      const updatedForms = [newForm, ...savedForms.slice(0, FORM_LIMITS.maxSavedForms - 1)];
      jsonStorage.set(storageKey, updatedForms);
      return newForm.id;
    },

    loadForm: (id: string): SavedForm<T> | null => {
      const savedForms = jsonStorage.get(storageKey, []);
      return savedForms.find((form: SavedForm<T>) => form.id === id) || null;
    },

    deleteForm: (id: string): boolean => {
      const savedForms = jsonStorage.get(storageKey, []);
      const updatedForms = savedForms.filter((form: SavedForm<T>) => form.id !== id);
      return jsonStorage.set(storageKey, updatedForms);
    },

    clearAllForms: (): boolean => {
      return jsonStorage.remove(storageKey);
    }
  };
};

// Utility to clear multiple storage keys with a pattern
export const clearStorageByPattern = (pattern: string): number => {
  let clearedCount = 0;
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(pattern)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      if (safeLocalStorage.removeItem(key)) {
        clearedCount++;
      }
    });
  } catch (error) {
    console.error('Failed to clear storage by pattern:', error);
  }
  
  return clearedCount;
};