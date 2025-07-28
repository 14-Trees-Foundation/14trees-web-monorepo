import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AutoCompleteData, 
  AutoPopulateSettings, 
  SavedFormData 
} from '../types/forms';
import {
  getStoredAutoCompleteData,
  updateAutoCompleteData,
  getStoredSettings,
  saveSettings,
  getSavedForms,
  saveFormData,
  deleteSavedForm
} from '../utils/localStorage';
import { defaultAutoPopulateSettings } from '../utils/constants';

interface UseAutoCompleteProps {
  formData: any;
  eventName: string | null;
  eventType: string | null;
  plantedBy: string | null;
  primaryMessage: string;
  secondaryMessage: string;
  dedicatedNames: any[];
}

interface UseAutoCompleteReturn {
  autoCompleteData: AutoCompleteData;
  autoPopulateSettings: AutoPopulateSettings;
  savedForms: SavedFormData[];
  showAutoPopulatePanel: boolean;
  showSettingsPanel: boolean;
  showSaveFormDialog: boolean;
  saveFormName: string;
  setShowAutoPopulatePanel: (show: boolean) => void;
  setShowSettingsPanel: (show: boolean) => void;
  setShowSaveFormDialog: (show: boolean) => void;
  setSaveFormName: (name: string) => void;
  debouncedUpdateAutoComplete: (field: keyof AutoCompleteData, value: string, delay?: number) => void;
  loadSavedForm: (formData: SavedFormData) => void;
  handleSaveForm: () => void;
  handleExportData: () => void;
  handleImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSettingsChange: (newSettings: AutoPopulateSettings) => void;
  handleDeleteSavedForm: (formId: string) => void;
}

export const useAutoComplete = ({
  formData,
  eventName,
  eventType,
  plantedBy,
  primaryMessage,
  secondaryMessage,
  dedicatedNames
}: UseAutoCompleteProps): UseAutoCompleteReturn => {
  const [autoCompleteData, setAutoCompleteData] = useState<AutoCompleteData>({
    fullNames: [],
    emails: [],
    phones: [],
    panNumbers: [],
    eventNames: [],
    eventTypes: [],
    plantedByNames: [],
    primaryMessages: [],
    secondaryMessages: [],
  });
  
  const [autoPopulateSettings, setAutoPopulateSettings] = useState<AutoPopulateSettings>(defaultAutoPopulateSettings);
  const [savedForms, setSavedForms] = useState<SavedFormData[]>([]);
  const [showAutoPopulatePanel, setShowAutoPopulatePanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showSaveFormDialog, setShowSaveFormDialog] = useState(false);
  const [saveFormName, setSaveFormName] = useState("");

  // Debounce refs for auto-complete updates
  const debounceRefs = useRef<Record<string, NodeJS.Timeout>>({});

  // Initialize auto-complete data on mount
  useEffect(() => {
    setAutoCompleteData(getStoredAutoCompleteData());
    setAutoPopulateSettings(getStoredSettings());
    setSavedForms(getSavedForms());
    
    // Cleanup function to clear all debounce timeouts
    return () => {
      Object.values(debounceRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Debounced auto-complete update function
  const debouncedUpdateAutoComplete = useCallback((field: keyof AutoCompleteData, value: string, delay: number = 500) => {
    // Clear existing timeout for this field
    if (debounceRefs.current[field]) {
      clearTimeout(debounceRefs.current[field]);
    }
    
    // Set new timeout
    debounceRefs.current[field] = setTimeout(() => {
      updateAutoCompleteData(field, value);
      setAutoCompleteData(getStoredAutoCompleteData());
    }, delay);
  }, []);

  const loadSavedForm = useCallback((savedFormData: SavedFormData) => {
    const settings = getStoredSettings();
    
    // This would typically be passed as callbacks from the parent component
    // For now, we'll return the data that the parent needs to apply
    return {
      formData: savedFormData.data,
      eventData: {
        eventName: settings.eventName && savedFormData.data.eventName ? savedFormData.data.eventName : null,
        eventType: settings.eventType && savedFormData.data.eventType ? savedFormData.data.eventType : null,
        plantedBy: settings.plantedBy && savedFormData.data.plantedBy ? savedFormData.data.plantedBy : null,
        primaryMessage: settings.primaryMessage && savedFormData.data.primaryMessage ? savedFormData.data.primaryMessage : "",
        secondaryMessage: settings.secondaryMessage && savedFormData.data.secondaryMessage ? savedFormData.data.secondaryMessage : "",
      },
      dedicatedNames: settings.recipients && savedFormData.data.dedicatedNames ? savedFormData.data.dedicatedNames : null
    };
  }, []);

  const handleSaveForm = useCallback(() => {
    if (!saveFormName.trim()) {
      alert("Please enter a name for this form");
      return;
    }

    const eventData = {
      eventName,
      eventType,
      plantedBy,
      primaryMessage,
      secondaryMessage,
    };

    const formId = saveFormData(saveFormName, formData, eventData, dedicatedNames);
    setSavedForms(getSavedForms());
    setSaveFormName("");
    setShowSaveFormDialog(false);
    alert("Form saved successfully!");
  }, [saveFormName, formData, eventName, eventType, plantedBy, primaryMessage, secondaryMessage, dedicatedNames]);

  const handleExportData = useCallback(() => {
    const exportData = {
      formData,
      eventData: { eventName, eventType, plantedBy, primaryMessage, secondaryMessage },
      dedicatedNames,
      timestamp: Date.now(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gift-trees-form-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [formData, eventName, eventType, plantedBy, primaryMessage, secondaryMessage, dedicatedNames]);

  const handleImportData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Return the data that the parent component needs to apply
        return {
          formData: data.formData || null,
          eventData: data.eventData || null,
          dedicatedNames: data.dedicatedNames || null
        };
      } catch (error) {
        alert("Error importing data. Please check the file format.");
        return null;
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  }, []);

  const handleSettingsChange = useCallback((newSettings: AutoPopulateSettings) => {
    setAutoPopulateSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const handleDeleteSavedForm = useCallback((formId: string) => {
    deleteSavedForm(formId);
    setSavedForms(getSavedForms());
  }, []);

  return {
    autoCompleteData,
    autoPopulateSettings,
    savedForms,
    showAutoPopulatePanel,
    showSettingsPanel,
    showSaveFormDialog,
    saveFormName,
    setShowAutoPopulatePanel,
    setShowSettingsPanel,
    setShowSaveFormDialog,
    setSaveFormName,
    debouncedUpdateAutoComplete,
    loadSavedForm,
    handleSaveForm,
    handleExportData,
    handleImportData,
    handleSettingsChange,
    handleDeleteSavedForm
  };
};