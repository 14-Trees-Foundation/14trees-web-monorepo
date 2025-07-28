import React from 'react';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SaveIcon from '@mui/icons-material/Save';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SettingsIcon from '@mui/icons-material/Settings';

interface SmartFormAssistantProps {
  testMode: string | null;
  onLoadSaved: () => void;
  onSaveForm: () => void;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onShowSettings: () => void;
}

export const SmartFormAssistant: React.FC<SmartFormAssistantProps> = ({
  testMode,
  onLoadSaved,
  onSaveForm,
  onExportData,
  onImportData,
  onShowSettings,
}) => {
  // Only show when test parameter is present
  if (!testMode) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
          <AutoFixHighIcon className="text-blue-600" />
          Smart Form Assistant
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onLoadSaved}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <FileUploadIcon fontSize="small" />
            Load Saved
          </button>
          <button
            type="button"
            onClick={onSaveForm}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            <SaveIcon fontSize="small" />
            Save Form
          </button>
          <button
            type="button"
            onClick={onExportData}
            className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
          >
            <FileDownloadIcon fontSize="small" />
            Export
          </button>
          <label className="flex items-center gap-1 px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm cursor-pointer">
            <FileUploadIcon fontSize="small" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={onImportData}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={onShowSettings}
            className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
          >
            <SettingsIcon fontSize="small" />
            Settings
          </button>
        </div>
      </div>
      <p className="text-sm text-blue-700">
        Save time with auto-complete suggestions, form templates, and import/export functionality.
      </p>
    </div>
  );
};