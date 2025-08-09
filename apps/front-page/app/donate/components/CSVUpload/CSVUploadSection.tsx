import React from 'react';
import { UploadIcon } from "lucide-react";

interface CSVUploadSectionProps {
  csvFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadSampleCsv: () => void;
}

export const CSVUploadSection: React.FC<CSVUploadSectionProps> = ({
  csvFile,
  fileInputRef,
  handleCsvUpload,
  handleImageUpload,
  downloadSampleCsv
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Bulk Upload Recipients via CSV</h3>
      <p className="text-sm text-gray-600">
        <button
          type="button"
          onClick={downloadSampleCsv}
          className="text-blue-600 hover:underline"
        >
          Download sample CSV
        </button>
      </p>

      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          onChange={handleCsvUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md"
        >
          Select CSV File
        </button>
        {csvFile && (
          <span className="self-center text-sm">
            {csvFile.name}
          </span>
        )}
      </div>

      <div className="pt-2">
        <label className="block text-sm font-medium mb-1">
          Upload Recipient Images
        </label>
        <input
          type="file"
          id="recipient-images"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <label
          htmlFor="recipient-images"
          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md cursor-pointer"
        >
          <UploadIcon className="w-4 h-4" />
          Select Images
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Upload images matching CSV names (e.g. &quot;john_doe.jpg&quot;)
        </p>
      </div>
    </div>
  );
};