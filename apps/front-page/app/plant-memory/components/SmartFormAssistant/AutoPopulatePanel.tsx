import React from 'react';
import { Modal } from "ui";
import { SavedFormData } from '../../types/forms';

interface AutoPopulatePanelProps {
  show: boolean;
  onClose: () => void;
  savedForms: SavedFormData[];
  onLoadForm: (form: SavedFormData) => void;
  onDeleteForm: (formId: string) => void;
}

export const AutoPopulatePanel: React.FC<AutoPopulatePanelProps> = ({
  show,
  onClose,
  savedForms,
  onLoadForm,
  onDeleteForm,
}) => {
  return (
    <Modal
      show={show}
      onClose={onClose}
      title="Load Saved Form"
      showCloseButton
      panelClass="rounded-lg p-6 max-w-2xl"
    >
      <div className="space-y-4">
        {savedForms.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No saved forms found.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {savedForms.map((form) => (
              <div key={form.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{form.name}</h4>
                    <p className="text-sm text-gray-600">
                      Saved on {new Date(form.timestamp).toLocaleDateString()}
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      {form.data.fullName && `Name: ${form.data.fullName}`}
                      {form.data.eventName && ` • Event: ${form.data.eventName}`}
                      {form.data.dedicatedNames && ` • Recipients: ${form.data.dedicatedNames.length}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onLoadForm(form)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => onDeleteForm(form.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};