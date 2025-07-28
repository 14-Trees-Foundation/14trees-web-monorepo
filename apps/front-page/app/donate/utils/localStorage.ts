// Local storage management functions for donate module

import { FormData, DedicatedName } from '../types';
import { 
  createAutoCompleteManager, 
  createFormDataManager, 
  BaseAutoCompleteData 
} from '../../../components/Common/Utils/localStorage';

// Storage keys
const AUTO_COMPLETE_STORAGE_KEY = 'donate_auto_complete_data';
const FORM_DATA_STORAGE_KEY = 'donate_form_data';
const DEDICATED_NAMES_STORAGE_KEY = 'donate_dedicated_names';

// Auto Complete Data Interface (extending base interface)
interface AutoCompleteData extends BaseAutoCompleteData {
  comments: string[];
  relations: string[];
  recipientNames: string[];
}

// Auto-complete manager using shared utilities
const defaultAutoCompleteData: AutoCompleteData = {
  fullNames: [],
  emails: [],
  phones: [],
  panNumbers: [],
  comments: [],
  relations: [],
  recipientNames: [],
};

const autoCompleteManager = createAutoCompleteManager(AUTO_COMPLETE_STORAGE_KEY, defaultAutoCompleteData);

// Export functions that use the shared manager
export const getStoredAutoCompleteData = autoCompleteManager.getData;
export const updateAutoCompleteData = autoCompleteManager.updateField;

// Form data manager using shared utilities
const formDataManager = createFormDataManager<FormData>(FORM_DATA_STORAGE_KEY);

// Export functions that use the shared manager
export const saveFormDataToStorage = formDataManager.save;
export const getStoredFormData = formDataManager.load;
export const clearStoredFormData = formDataManager.clear;

// Dedicated names manager using shared utilities
const dedicatedNamesManager = createFormDataManager<DedicatedName[]>(DEDICATED_NAMES_STORAGE_KEY);

// Export functions that use the shared manager
export const saveDedicatedNamesToStorage = (dedicatedNames: DedicatedName[]) => {
  return dedicatedNamesManager.save(dedicatedNames);
};

export const getStoredDedicatedNames = (): DedicatedName[] => {
  return dedicatedNamesManager.load() || [];
};

export const clearStoredDedicatedNames = dedicatedNamesManager.clear;

// Clear all donate-related storage
export const clearAllDonateStorage = () => {
  clearStoredFormData();
  clearStoredDedicatedNames();
  autoCompleteManager.clearData();
};