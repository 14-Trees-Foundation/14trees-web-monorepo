import React from 'react';
import { Modal } from "ui";

interface SaveFormDialogProps {
  show: boolean;
  onClose: () => void;
  formName: string;
  onFormNameChange: (name: string) => void;
  onSave: () => void;
}

export const SaveFormDialog: React.FC<SaveFormDialogProps> = ({
  show,
  onClose,
  formName,
  onFormNameChange,
  onSave,
}) => {
  return (
    <Modal
      show={show}
      onClose={onClose}
      title="Save Current Form"
      showCloseButton
      panelClass="rounded-lg p-6 max-w-md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Form Name</label>
          <input
            type="text"
            value={formName}
            onChange={(e) => onFormNameChange(e.target.value)}
            placeholder="Enter a name for this form"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Form
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};