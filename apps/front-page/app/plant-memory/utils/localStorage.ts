import { 
  AutoCompleteData, 
  AutoPopulateSettings, 
  SavedFormData, 
  DedicatedName 
} from '../types/forms';
import { 
  AUTO_POPULATE_STORAGE_KEY, 
  SAVED_FORMS_STORAGE_KEY, 
  AUTO_POPULATE_SETTINGS_KEY,
  defaultAutoPopulateSettings,
  FORM_LIMITS
} from './constants';
import { 
  createAutoCompleteManager, 
  createSettingsManager, 
  createSavedFormsManager,
  BaseAutoCompleteData 
} from '../../../components/Common/Utils/localStorage';

// Auto Complete Data Management using shared utilities
const defaultAutoCompleteData: AutoCompleteData = {
  fullNames: [],
  emails: [],
  phones: [],
  panNumbers: [],
  eventNames: [],
  eventTypes: [],
  plantedByNames: [],
  primaryMessages: [],
  secondaryMessages: [],
};

const autoCompleteManager = createAutoCompleteManager(AUTO_POPULATE_STORAGE_KEY, defaultAutoCompleteData);

// Export functions that use the shared manager
export const getStoredAutoCompleteData = autoCompleteManager.getData;
export const updateAutoCompleteData = autoCompleteManager.updateField;

// Settings Management using shared utilities
const settingsManager = createSettingsManager(AUTO_POPULATE_SETTINGS_KEY, defaultAutoPopulateSettings);

// Export functions that use the shared manager
export const getStoredSettings = settingsManager.getSettings;
export const saveSettings = settingsManager.saveSettings;

// Saved Forms Management using shared utilities
type FormDataComplete = {
  fullName: string;
  email: string;
  phone: string;
  panNumber: string;
  eventName: string;
  eventType: string;
  plantedBy: string;
  primaryMessage: string;
  secondaryMessage: string;
  dedicatedNames: DedicatedName[];
};

const savedFormsManager = createSavedFormsManager<FormDataComplete>(SAVED_FORMS_STORAGE_KEY);

// Export functions that use the shared manager
export const getSavedForms = (): SavedFormData[] => {
  return savedFormsManager.getSavedForms() as SavedFormData[];
};

export const saveFormData = (
  name: string, 
  formData: any, 
  eventData: any, 
  dedicatedNames: DedicatedName[]
): string => {
  const completeData: FormDataComplete = {
    fullName: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    panNumber: formData.panNumber,
    eventName: eventData.eventName,
    eventType: eventData.eventType,
    plantedBy: eventData.plantedBy,
    primaryMessage: eventData.primaryMessage,
    secondaryMessage: eventData.secondaryMessage,
    dedicatedNames: dedicatedNames,
  };
  
  return savedFormsManager.saveForm(name, completeData);
};

export const deleteSavedForm = savedFormsManager.deleteForm;

export const loadSavedForm = (id: string): SavedFormData | null => {
  return savedFormsManager.loadForm(id) as SavedFormData | null;
};