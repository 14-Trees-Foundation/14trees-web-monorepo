import React from 'react';
import Recipients from "components/Recipients";
import { DedicatedName } from '../../types/forms';
import { RecipientEntryToggle } from '../../../../components/shared/RecipientEntryToggle';
import { CSVUploadSectionNew } from '../CSVUpload/CSVUploadSectionNew';
import { CSVPreviewTable } from '../CSVUpload/CSVPreviewTable';

interface RecipientDetailsSectionProps {
  recipientOption: 'manual' | 'csv';
  dedicatedNames: DedicatedName[];
  errors: Record<string, string>;
  formData: {
    numberOfTrees: string;
    [key: string]: any;
  };
  onRecipientOptionChange: (option: 'manual' | 'csv') => void;
  onNameChange: (index: number, field: keyof DedicatedName, value: string | number) => void;
  onAddName: () => void;
  onRemoveName: (index: number) => void;
  setHasAssigneeError: (hasError: boolean) => void;
  // CSV processing props
  csvFile: File | null;
  csvPreview: DedicatedName[];
  csvErrors: string[];
  currentPage: number;
  itemsPerPage: number;
  paginatedData: DedicatedName[];
  filteredData: DedicatedName[];
  hasTableErrors: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  // Search and filter props
  searchName: string;
  searchEmail: string;
  validFilter: 'all' | 'valid' | 'invalid';
  setSearchName: (value: string) => void;
  setSearchEmail: (value: string) => void;
  setValidFilter: (value: 'all' | 'valid' | 'invalid') => void;
  clearFilters: () => void;
  // Functions
  handleCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadSampleCsv: () => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
}

export const RecipientDetailsSection: React.FC<RecipientDetailsSectionProps> = ({
  recipientOption,
  dedicatedNames,
  errors,
  formData,
  onRecipientOptionChange,
  onNameChange,
  onAddName,
  onRemoveName,
  setHasAssigneeError,
  // CSV processing props
  csvFile,
  csvPreview,
  csvErrors,
  currentPage,
  itemsPerPage,
  paginatedData,
  filteredData,
  hasTableErrors,
  fileInputRef,
  // Search and filter props
  searchName,
  searchEmail,
  validFilter,
  setSearchName,
  setSearchEmail,
  setValidFilter,
  clearFilters,
  // Functions
  handleCsvUpload,
  downloadSampleCsv,
  setCurrentPage,
  setItemsPerPage
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold">Who would you like to honour with this living tribute?</h3>
      
      {/* Recipient Entry Method Toggle */}
      <RecipientEntryToggle
        entryMethod={recipientOption}
        onMethodChange={onRecipientOptionChange}
      />

      {/* Conditional Rendering */}
      {recipientOption === 'manual' ? (
        <>
          <Recipients
            dedicatedNames={dedicatedNames}
            errors={errors}
            formData={formData}
            handleNameChange={onNameChange}
            handleAddName={onAddName}
            handleRemoveName={onRemoveName}
            setHasAssigneeError={setHasAssigneeError}
          />
        </>
      ) : (
        <>
          <CSVUploadSectionNew
            csvFile={csvFile}
            fileInputRef={fileInputRef}
            handleCsvUpload={handleCsvUpload}
            downloadSampleCsv={downloadSampleCsv}
          />
          
          <CSVPreviewTable
            csvPreview={csvPreview}
            csvErrors={csvErrors}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            paginatedData={paginatedData}
            filteredData={filteredData}
            hasTableErrors={hasTableErrors}
            searchName={searchName}
            searchEmail={searchEmail}
            validFilter={validFilter}
            setSearchName={setSearchName}
            setSearchEmail={setSearchEmail}
            setValidFilter={setValidFilter}
            clearFilters={clearFilters}
            setCurrentPage={setCurrentPage}
            setItemsPerPage={setItemsPerPage}
          />
        </>
      )}
    </div>
  );
};