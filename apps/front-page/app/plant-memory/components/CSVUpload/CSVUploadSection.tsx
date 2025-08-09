import React from 'react';
import CsvUpload from 'components/CsvUpload';

interface CSVRow {
  'Recipient Name': string;
  'Recipient Email': string;
  'Recipient Communication Email': string;
  'Number of Trees': string;
  _errors?: string[];
}

interface ValidationResult {
  validData: CSVRow[];
  invalidData: CSVRow[];
  totalTrees: number;
  headerErrors: string[];
  rowErrors: string[];
  hasErrors: boolean;
}

interface CSVUploadSectionProps {
  maxTrees: number;
  onDataParsed: (result: ValidationResult) => void;
  initialData?: CSVRow[];
}

export const CSVUploadSection: React.FC<CSVUploadSectionProps> = ({
  maxTrees,
  onDataParsed,
  initialData = []
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Upload Recipients via CSV</h3>
      <CsvUpload
        maxTrees={maxTrees}
        onDataParsed={onDataParsed}
        initialData={initialData}
      />
    </div>
  );
};