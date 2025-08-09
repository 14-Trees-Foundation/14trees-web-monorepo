import { useState, useCallback, useRef } from 'react';
import { CSVService } from '../services/csvService';
import { DedicatedName } from '../types';

interface UseCSVProcessingReturn {
  csvFile: File | null;
  csvPreview: DedicatedName[];
  csvErrors: string[];
  currentPage: number;
  itemsPerPage: number;
  paginatedData: DedicatedName[];
  hasTableErrors: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleCsvUpload: (e: React.ChangeEvent<HTMLInputElement>, maxTreeCount: number) => Promise<void>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadSampleCsv: () => Promise<void>;
  setCurrentPage: (page: number) => void;
  clearCSVData: () => void;
  updateCSVPreview: (data: DedicatedName[]) => void;
}

export const useCSVProcessing = (): UseCSVProcessingReturn => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<DedicatedName[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 10;
  const paginatedData = csvPreview.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );
  const hasTableErrors = csvPreview.some(row => Array.isArray((row as any)._errors) && (row as any)._errors.length > 0);

  const handleCsvUpload = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>,
    maxTreeCount: number
  ): Promise<void> => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCsvFile(files[0]);
    setCsvErrors([]);
    setCsvPreview([]);
    setCurrentPage(0);

    try {
      const result = await CSVService.parseCSV(files[0], maxTreeCount);
      setCsvErrors(result.errors);
      setCsvPreview(result.data);
    } catch (error: any) {
      setCsvErrors([error.message]);
    }

    // Handle multiple files (images)
    if (files.length > 1) {
      const imageFiles = Array.from(files).slice(1);
      const updatedPreview = [...csvPreview];
      
      imageFiles.forEach((file) => {
        const match = file.name.match(/(\d+)/);
        if (match) {
          const rowIndex = parseInt(match[0]) - 1;
          if (rowIndex >= 0 && rowIndex < updatedPreview.length) {
            updatedPreview[rowIndex].image = URL.createObjectURL(file);
          }
        }
      });
      
      setCsvPreview(updatedPreview);
    }
  }, [csvPreview]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { errors: newErrors, updatedData } = CSVService.validateImages(
      csvPreview,
      files,
      csvErrors
    );

    setCsvErrors(newErrors);
    setCsvPreview(updatedData);
  }, [csvPreview, csvErrors]);

  const downloadSampleCsv = useCallback(async (): Promise<void> => {
    try {
      await CSVService.downloadSampleCSV();
    } catch (error: any) {
      console.error("Download failed:", error);
      throw error;
    }
  }, []);

  const clearCSVData = useCallback((): void => {
    setCsvFile(null);
    setCsvPreview([]);
    setCsvErrors([]);
    setCurrentPage(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const updateCSVPreview = useCallback((data: DedicatedName[]): void => {
    setCsvPreview(data);
  }, []);

  return {
    csvFile,
    csvPreview,
    csvErrors,
    setCsvFile,
    setCsvPreview,
    setCsvErrors,
    currentPage,
    itemsPerPage,
    paginatedData,
    hasTableErrors,
    fileInputRef,
    handleCsvUpload,
    handleImageUpload,
    downloadSampleCsv,
    setCurrentPage,
    clearCSVData,
    updateCSVPreview
  };
};