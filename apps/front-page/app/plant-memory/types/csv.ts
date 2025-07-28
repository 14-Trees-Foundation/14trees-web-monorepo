import { DedicatedName } from './forms';

export interface CSVRow {
  [key: string]: string;
}

export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  processedData?: DedicatedName[];
}

export interface CSVUploadState {
  file: File | null;
  data: CSVRow[];
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isProcessing: boolean;
}