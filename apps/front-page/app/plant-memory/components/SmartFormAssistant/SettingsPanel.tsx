import React from 'react';
import { Modal } from "ui";
import { AutoPopulateSettings } from '../../types/forms';

interface SettingsPanelProps {
  show: boolean;
  onClose: () => void;
  settings: AutoPopulateSettings;
  onSettingsChange: (settings: AutoPopulateSettings) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  show,
  onClose,
  settings,
  onSettingsChange,
}) => {
  const handleSettingChange = (key: keyof AutoPopulateSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      title="Auto-populate Settings"
      showCloseButton
      panelClass="rounded-lg p-6 max-w-lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Choose which fields should be auto-populated when loading saved forms:
        </p>
        <div className="space-y-3">
          {Object.entries(settings).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleSettingChange(key as keyof AutoPopulateSettings, e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm capitalize">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
        <div className="pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>
      </div>
    </Modal>
  );
};