// apps/front-page/components/CsvUpload.tsx
'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';

const CsvUpload = ({ onDataParsed }: { onDataParsed: (data: any[]) => void }) => {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Fixed download handler - forces download instead of redirect
  const downloadSampleCsv = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Create an invisible iframe to trigger download
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `https://docs.google.com/spreadsheets/d/1ey-ENqRzeq_S0UTl9CFbBypuxpdc0HAhThpAN_9vySU/export?format=csv&force=1`;
    document.body.appendChild(iframe);
    
    // Clean up after download starts
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 5000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    console.log(file)
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        console.log(results)
        const validData = results.data.filter((row: any) => row.Name);
        setCsvData(validData);
        onDataParsed(validData);
      },
      error: (error) => {
        console.log(error)
        setErrors([`CSV Error: ${error.message}`]);
      }
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="space-y-2">
        <h3 className="font-medium">Bulk Upload Recipients</h3>
        <button
          type="button"
          onClick={downloadSampleCsv}
          className="text-blue-600 hover:underline"
        >
          Download sample CSV
        </button>
      </div>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {csvData.length > 0 && (
        <div className="mt-4 border rounded">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Phone</th>
              </tr>
            </thead>
            <tbody>
              {csvData.slice(0, 5).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{row.Name}</td>
                  <td className="px-4 py-2">{row['Email-id'] || '-'}</td>
                  <td className="px-4 py-2">{row['Phone Number'] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CsvUpload;