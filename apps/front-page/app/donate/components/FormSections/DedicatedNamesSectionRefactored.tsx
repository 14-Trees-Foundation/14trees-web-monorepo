import React, { useState, useRef } from 'react';
import { DedicatedName, NameEntryMethod, DonationType, DonationMethod } from '../../types/donation';
import { SingleRecipientForm } from '../DedicatedNames/SingleRecipientForm';
import { ManualRecipientsSection } from '../DedicatedNames/ManualRecipientsSection';
import { CsvUploadSection } from '../DedicatedNames/CsvUploadSection';
import { CsvPreviewTable } from '../DedicatedNames/CsvPreviewTable';
import { RecipientEntryToggle } from '../../../../components/shared/RecipientEntryToggle';

interface DedicatedNamesSectionProps {
  donationMethod: DonationMethod;
  treeLocation: DonationType;
  showAdditionalInfo: boolean;
  setShowAdditionalInfo: (value: boolean) => void;
  multipleNames: boolean;
  setMultipleNames: (value: boolean) => void;
  dedicatedNames: DedicatedName[];
  setDedicatedNames: React.Dispatch<React.SetStateAction<DedicatedName[]>>;
  donationTreeCount: number;
  errors: Record<string, string>;
  handleNameChange: (index: number, field: string, value: string | number) => void;
  handleAddName: () => void;
  handleRemoveName: (index: number) => void;
  isAssigneeDifferent: boolean;
  nameEntryMethod: NameEntryMethod;
  setNameEntryMethod: (value: NameEntryMethod) => void;
  csvFile: File | null;
  setCsvFile: (file: File | null) => void;
  csvPreview: DedicatedName[];
  setCsvPreview: React.Dispatch<React.SetStateAction<DedicatedName[]>>;
  csvErrors: string[];
  setCsvErrors: React.Dispatch<React.SetStateAction<string[]>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
  uploadedImages: Record<string, File>;
  setUploadedImages: React.Dispatch<React.SetStateAction<Record<string, File>>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadSampleCsv: () => void;
}

export const DedicatedNamesSectionRefactored: React.FC<DedicatedNamesSectionProps> = ({
  donationMethod,
  treeLocation,
  showAdditionalInfo,
  setShowAdditionalInfo,
  multipleNames,
  setMultipleNames,
  dedicatedNames,
  setDedicatedNames,
  donationTreeCount,
  errors,
  handleNameChange,
  handleAddName,
  handleRemoveName,
  isAssigneeDifferent,
  nameEntryMethod,
  setNameEntryMethod,
  csvFile,
  setCsvFile,
  csvPreview,
  setCsvPreview,
  csvErrors,
  setCsvErrors,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  uploadedImages,
  setUploadedImages,
  fileInputRef,
  handleCsvUpload,
  handleImageUpload,
  downloadSampleCsv
}) => {
  if (treeLocation !== "donate" || donationMethod !== "trees") return null;

  const resetMultipleRecipientData = () => {
    setCsvPreview([]);
    setCsvFile(null);
    setCsvErrors([]);
    setUploadedImages({});
    setDedicatedNames([{
      recipient_name: '',
      recipient_email: '',
      recipient_phone: '',
      assignee_name: '',
      assignee_email: '',
      assignee_phone: '',
      relation: '',
      trees_count: donationTreeCount
    }]);
  };

  const handleSingleRecipientNameChange = (field: string, value: string) => {
    handleNameChange(0, field, value);
  };

  const handleEntryMethodChange = (method: NameEntryMethod) => {
    setNameEntryMethod(method);
  };

  return (
    <div className="space-y-4">
      {/* Checkbox to show additional info */}
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="multiplePeople"
          className="h-5 w-5 mr-3"
          checked={showAdditionalInfo}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const checked = e.target.checked;
            setShowAdditionalInfo(checked);
            if (!checked) {
              resetMultipleRecipientData();
            }
          }}
        />
        <label htmlFor="multiplePeople" className="text-gray-700">
          Dedicate trees to someone?
        </label>
      </div>

      {showAdditionalInfo && (
        <>
          <label className="mb-2 block text-lg font-light">
            I&apos;d like my trees to be planted in the following name:
          </label>

          {/* Single recipient form */}
          {!multipleNames && dedicatedNames.length > 0 && (
            <SingleRecipientForm
              recipient={dedicatedNames[0]}
              errors={errors}
              isAssigneeDifferent={isAssigneeDifferent}
              onNameChange={handleSingleRecipientNameChange}
            />
          )}

          {/* Multiple recipients checkbox */}
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="multipleNames"
              className="h-5 w-5 mr-3"
              checked={multipleNames}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const checked = e.target.checked;
                setMultipleNames(checked);
                if (!checked) {
                  resetMultipleRecipientData();
                }
              }}
            />
            <label htmlFor="multipleNames" className="text-gray-700">
              Dedicate to multiple people?
            </label>
          </div>
        </>
      )}

      {/* Multiple recipients section */}
      {multipleNames && (
        <>
          <RecipientEntryToggle
            entryMethod={nameEntryMethod}
            onMethodChange={handleEntryMethodChange}
            manualLabel="Manual"
            csvLabel="Bulk Upload CSV"
            className="inline-flex p-1 space-x-1 rounded-xl w-full sm:w-auto border-2 border-gray-300"
          />

          {nameEntryMethod === "manual" ? (
            <ManualRecipientsSection
              dedicatedNames={dedicatedNames}
              errors={errors}
              donationTreeCount={donationTreeCount}
              onNameChange={handleNameChange}
              onAddName={handleAddName}
              onRemoveName={handleRemoveName}
            />
          ) : (
            <>
              <CsvUploadSection
                csvFile={csvFile}
                csvErrors={csvErrors}
                fileInputRef={fileInputRef}
                onCsvUpload={handleCsvUpload}
                onImageUpload={handleImageUpload}
                onDownloadSample={downloadSampleCsv}
              />
              
              <CsvPreviewTable
                csvPreview={csvPreview}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};