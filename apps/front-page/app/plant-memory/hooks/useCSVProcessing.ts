import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { CSVService } from '../services/csvService';
import { DedicatedName } from '../types/forms';

interface UseCSVProcessingReturn {
  csvFile: File | null;
  csvPreview: DedicatedName[];
  csvErrors: string[];
  currentPage: number;
  itemsPerPage: number;
  paginatedData: DedicatedName[];
  filteredData: DedicatedName[];
  hasTableErrors: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  // Search and filter states
  searchName: string;
  searchEmail: string;
  validFilter: 'all' | 'valid' | 'invalid';
  setSearchName: (value: string) => void;
  setSearchEmail: (value: string) => void;
  setValidFilter: (value: 'all' | 'valid' | 'invalid') => void;
  clearFilters: () => void;
  // Functions
  handleCsvUpload: (e: React.ChangeEvent<HTMLInputElement>, maxTreeCount: number) => Promise<void>;
  downloadSampleCsv: () => Promise<void>;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  clearCSVData: () => void;
  updateCSVPreview: (data: DedicatedName[]) => void;
  setCsvFile: (file: File | null) => void;
  setCsvPreview: (data: DedicatedName[]) => void;
  setCsvErrors: (errors: string[]) => void;
}

export const useCSVProcessing = (): UseCSVProcessingReturn => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<DedicatedName[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search and filter states
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [validFilter, setValidFilter] = useState<'all' | 'valid' | 'invalid'>('all');

  // Filter and search logic
  const filteredData = useMemo(() => {
    return csvPreview.filter(recipient => {
      // Search filters
      const nameMatch = recipient.recipient_name?.toLowerCase().includes(searchName.toLowerCase()) ?? true;
      const emailMatch = recipient.recipient_email?.toLowerCase().includes(searchEmail.toLowerCase()) ?? true;
      
      // Valid filter - check for errors
      const hasErrors = Array.isArray((recipient as any)._errors) && (recipient as any)._errors.length > 0;
      
      let validMatch = true;
      if (validFilter === 'valid') {
        validMatch = !hasErrors;
      } else if (validFilter === 'invalid') {
        validMatch = hasErrors;
      }
      
      return nameMatch && emailMatch && validMatch;
    });
  }, [csvPreview, searchName, searchEmail, validFilter]);

  const paginatedData = filteredData.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );
  const hasTableErrors = csvPreview.some(row => Array.isArray((row as any)._errors) && (row as any)._errors.length > 0);

  // Reset search and filters when CSV data changes
  useEffect(() => {
    setSearchName('');
    setSearchEmail('');
    
    // If there are errors in the CSV, default to showing invalid rows
    const hasIssues = csvPreview.some(recipient => {
      const hasErrors = Array.isArray((recipient as any)._errors) && (recipient as any)._errors.length > 0;
      return hasErrors;
    });
    setValidFilter(hasIssues ? 'invalid' : 'all');
    
    setCurrentPage(0);
  }, [csvPreview.length, csvPreview]);

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
  }, []);

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
    setSearchName('');
    setSearchEmail('');
    setValidFilter('all');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const clearFilters = useCallback((): void => {
    setSearchName('');
    setSearchEmail('');
    setValidFilter('all');
    setCurrentPage(0);
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
    filteredData,
    hasTableErrors,
    fileInputRef,
    // Search and filter states
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
    setItemsPerPage,
    clearCSVData,
    updateCSVPreview
  };
};