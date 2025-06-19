// apps/front-page/components/CsvUpload.tsx
'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';

interface CsvRow {
  'Recipient Name': string;
  'Recipient Email': string;
  'Number of Trees': string;
  _errors?: string[];
}

interface ValidationResult {
  validData: CsvRow[];
  invalidData: CsvRow[];
  totalTrees: number;
  headerErrors: string[];
  rowErrors: string[];
  hasErrors: boolean;
}

interface CsvUploadProps {
  onDataParsed: (result: ValidationResult) => void;
  maxTrees: number;
}

const CsvUpload = ({ onDataParsed, maxTrees }: CsvUploadProps) => {
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowsPerPage = 5;

  const sampleCsvData = `Recipient Name,Recipient Email,Number of Trees
John Doe,john@example.com,2
Jane Smith,jane@example.com,5
Team Members,team@company.org,10`;

  const totalPages = Math.ceil(csvData.length / rowsPerPage);
  const currentRows = csvData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const downloadSampleCsv = (e: React.MouseEvent) => {
    e.preventDefault();
    const blob = new Blob([sampleCsvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recipients_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const validateHeaders = (headers: string[] | undefined): boolean => {
    if (!headers) return false;
    const requiredHeaders = ['Recipient Name', 'Recipient Email', 'Number of Trees'];
    return requiredHeaders.every(header => headers.includes(header));
  };

  const validateRow = (row: any): CsvRow => {
    const rowErrors: string[] = [];

    if (!row['Recipient Name']?.trim()) {
      rowErrors.push('Recipient Name is required');
    }

    if (row['Recipient Email']?.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['Recipient Email'])) {
        rowErrors.push('Invalid email format');
      }
    }

    if (!row['Number of Trees']?.trim()) {
      rowErrors.push('Number of Trees is required');
    } else if (isNaN(Number(row['Number of Trees']))) {
      rowErrors.push('Number of Trees must be a number');
    } else if (Number(row['Number of Trees']) <= 0) {
      rowErrors.push('Number of Trees must be positive');
    }

    return {
      ...row,
      _errors: rowErrors.length > 0 ? rowErrors : undefined
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrors([]);
    setCsvData([]);
    setCurrentPage(1);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headerValid = validateHeaders(results.meta.fields);

        if (!headerValid) {
          const headerError = 'CSV must contain headers: Recipient Name, Recipient Email, Number of Trees';
          setErrors([headerError]);
          if (fileInputRef.current) fileInputRef.current.value = '';

          onDataParsed({
            validData: [],
            invalidData: [],
            totalTrees: 0,
            headerErrors: [headerError],
            rowErrors: [],
            hasErrors: true
          });
          return;
        }

        let validatedData = (results.data as CsvRow[]).map((row, i) => validateRow(row));

        const nameMap = new Map<string, number[]>();
        validatedData.forEach((row, idx) => {
          const name = row['Recipient Name']?.trim();
          if (name) {
            if (!nameMap.has(name)) nameMap.set(name, []);
            nameMap.get(name)!.push(idx);
          }
        });

        const duplicateNameSet = new Set<string>();
        const duplicateIndexes = Array.from(nameMap.entries())
          .filter(([_, indices]) => indices.length > 1)
          .flatMap(([name, indices]) => {
            duplicateNameSet.add(name);
            return indices.map(i => ({ index: i, name }));
          });

        duplicateIndexes.forEach(({ index, name }) => {
          const row = validatedData[index];
          row._errors = row._errors || [];
          row._errors.push(`Duplicate recipient name '${name}' not allowed`);
        });

        const validRows = validatedData.filter(row => !row._errors);
        const invalidRows = validatedData.filter(row => row._errors);

        const totalTrees = validRows.reduce((sum, row) => {
          return sum + (Number(row['Number of Trees']) || 0);
        }, 0);

        if (totalTrees > maxTrees) {
          const treeLimitError = `Total trees (${totalTrees}) exceeds the selected limit of ${maxTrees}`;
          setErrors([treeLimitError]);
          if (fileInputRef.current) fileInputRef.current.value = '';

          onDataParsed({
            validData: [],
            invalidData: validatedData,
            totalTrees,
            headerErrors: [],
            rowErrors: [treeLimitError],
            hasErrors: true
          });
          return;
        }

        const rowErrorMessages = invalidRows.flatMap((row, i) =>
          row._errors?.map(error => `Row ${i + 1}: ${error}`) || []
        );

        if (rowErrorMessages.length > 0 || duplicateNameSet.size > 0) {
          const duplicateSummary = duplicateNameSet.size > 0
            ? [`Duplicate recipient names found: ${Array.from(duplicateNameSet).join(', ')}`]
            : [];

          setErrors([...duplicateSummary, ...rowErrorMessages]);
        }

        setCsvData(validatedData);

        onDataParsed({
          validData: validRows,
          invalidData: invalidRows,
          totalTrees,
          headerErrors: [],
          rowErrors: rowErrorMessages,
          hasErrors: rowErrorMessages.length > 0
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => {
        const parseError = `CSV Error: ${error.message}`;
        setErrors([parseError]);
        if (fileInputRef.current) fileInputRef.current.value = '';

        onDataParsed({
          validData: [],
          invalidData: [],
          totalTrees: 0,
          headerErrors: [],
          rowErrors: [parseError],
          hasErrors: true
        });
      }
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <div className="space-y-2">
        <h3 className="font-medium">Bulk Upload Recipients via CSV</h3>
        <p className="text-sm text-gray-500">
          You can upload Recipient details via CSV.{" "}
          <button onClick={downloadSampleCsv} className="text-blue-600 hover:underline">
            Click here to download sample CSV file
          </button>
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {errors.length > 0 && (
        <div className="mt-2 text-sm text-red-600">
          <h4 className="font-medium">Validation Errors:</h4>
          <p className="text-xs text-gray-500 mb-1">Hover over ✕ icon to see errors</p>
          <ul className="list-disc pl-5">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {csvData.length > 0 && (
        <div className="mt-4">
          <div className="border rounded overflow-hidden">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Recipient Name</th>
                  <th className="px-4 py-2 text-left">Recipient Email</th>
                  <th className="px-4 py-2 text-left">Number of Trees</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {row._errors ? (
                        <span className="text-red-500" title={row._errors.join('\n')}>✕</span>
                      ) : (
                        <span className="text-green-500" title="Valid">✓</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{row['Recipient Name']}</td>
                    <td className="px-4 py-2">{row['Recipient Email']}</td>
                    <td className="px-4 py-2">{row['Number of Trees']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
              {Math.min(currentPage * rowsPerPage, csvData.length)} of {csvData.length} records
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-gray-100 rounded-md">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 hover:bg-gray-300'
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvUpload;