// CSV-related type definitions

import { DedicatedName } from './donation';

export interface CSVState {
  csvFile: File | null;
  csvPreview: DedicatedName[];
  csvErrors: string[];
  nameEntryMethod: "manual" | "csv";
  currentPage: number;
  uploadedImages: Record<string, File>;
}

export interface CSVValidationError {
  row: number;
  field: string;
  message: string;
}

export interface CSVProcessingResult {
  data: DedicatedName[];
  errors: string[];
  hasErrors: boolean;
}