import React, { useState, useMemo, useEffect } from 'react';
import { DedicatedName } from '../../types/donation';
import { TablePagination } from '../../../../components/shared/TablePagination';

interface CsvPreviewTableProps {
  csvPreview: DedicatedName[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
}

export const CsvPreviewTable: React.FC<CsvPreviewTableProps> = ({
  csvPreview,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage
}) => {
  // Search and filter state
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [validFilter, setValidFilter] = useState<'all' | 'valid' | 'invalid'>('all');

  // Filter and search logic
  const filteredData = useMemo(() => {
    return csvPreview.filter(recipient => {
      // Search filters
      const nameMatch = recipient.recipient_name?.toLowerCase().includes(searchName.toLowerCase()) ?? true;
      const emailMatch = recipient.recipient_email?.toLowerCase().includes(searchEmail.toLowerCase()) ?? true;
      
      // Valid filter - check both errors and missing images
      const hasErrors = Array.isArray(recipient._errors) && recipient._errors.length > 0;
      const hasImageName = recipient.image && typeof recipient.image === 'string' && recipient.image.trim() !== '';
      const hasImageUploaded = hasImageName && recipient.image && recipient.image.startsWith('blob:');
      const hasMissingImage = hasImageName && !hasImageUploaded;
      const isInvalid = hasErrors || hasMissingImage;
      
      let validMatch = true;
      if (validFilter === 'valid') {
        validMatch = !isInvalid;
      } else if (validFilter === 'invalid') {
        validMatch = isInvalid;
      }
      
      return nameMatch && emailMatch && validMatch;
    });
  }, [csvPreview, searchName, searchEmail, validFilter]);

  const paginatedData = filteredData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  // Reset search and filters when CSV data changes
  useEffect(() => {
    setSearchName('');
    setSearchEmail('');
    
    // If there are errors in the CSV or missing images, default to showing invalid rows
    const hasIssues = csvPreview.some(recipient => {
      const hasErrors = Array.isArray(recipient._errors) && recipient._errors.length > 0;
      const hasImageName = recipient.image && typeof recipient.image === 'string' && recipient.image.trim() !== '';
      const hasImageUploaded = hasImageName && recipient.image && recipient.image.startsWith('blob:');
      const hasMissingImage = hasImageName && !hasImageUploaded;
      return hasErrors || hasMissingImage;
    });
    setValidFilter(hasIssues ? 'invalid' : 'all');
    
    setCurrentPage(0);
  }, [csvPreview.length, csvPreview, setCurrentPage]);

  if (csvPreview.length === 0) return null;

  const hasIssues = csvPreview.some(recipient => {
    const hasErrors = Array.isArray(recipient._errors) && recipient._errors.length > 0;
    const hasImageName = recipient.image && typeof recipient.image === 'string' && recipient.image.trim() !== '';
    const hasImageUploaded = hasImageName && recipient.image && recipient.image.startsWith('blob:');
    const hasMissingImage = hasImageName && !hasImageUploaded;
    return hasErrors || hasMissingImage;
  });

  return (
    <div className="space-y-4">
      {/* Error notification when CSV has errors or missing images */}
      {hasIssues && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>CSV contains errors or missing images.</strong> The table is filtered to show invalid rows by default. 
                Review the errors in the "Errors" column and ensure all referenced images are uploaded.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header with pagination info and controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h4 className="font-medium">
            Preview ({filteredData.length} recipients)
          </h4>
          {(searchName || searchEmail || validFilter !== 'all') && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                ({filteredData.length} of {csvPreview.length} shown)
              </span>
              {validFilter === 'invalid' && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  Showing errors only
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearchName('');
                  setSearchEmail('');
                  setValidFilter('all');
                  setCurrentPage(0);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* No results message */}
      {filteredData.length === 0 && csvPreview.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No recipients found matching your search criteria.</p>
          <p className="text-sm mt-2">Try adjusting your search terms or filters.</p>
        </div>
      )}
      
      {filteredData.length > 0 && (
        <>
          <div className="max-h-96 overflow-y-auto border rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee Phone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trees</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Errors</th>
                </tr>
                {/* Search and Filter Row */}
                <tr className="bg-gray-100">
                  <th className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Search name..."
                      value={searchName}
                      onChange={(e) => {
                        setSearchName(e.target.value);
                        setCurrentPage(0);
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </th>
                  <th className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Search email..."
                      value={searchEmail}
                      onChange={(e) => {
                        setSearchEmail(e.target.value);
                        setCurrentPage(0);
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </th>
                  <th className="px-4 py-2"></th>
                  <th className="px-4 py-2"></th>
                  <th className="px-4 py-2"></th>
                  <th className="px-4 py-2">
                    <select
                      value={validFilter}
                      onChange={(e) => {
                        setValidFilter(e.target.value as 'all' | 'valid' | 'invalid');
                        setCurrentPage(0);
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All</option>
                      <option value="valid">Valid</option>
                      <option value="invalid">Invalid</option>
                    </select>
                  </th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((recipient, i) => {
                  const hasImageName = recipient.image && typeof recipient.image === 'string' && recipient.image.trim() !== '';
                  const hasImageUploaded = hasImageName && recipient.image && recipient.image.startsWith('blob:');
                  const hasMissingImage = hasImageName && !hasImageUploaded;
                  const hasErrors = Array.isArray(recipient._errors) && recipient._errors.length > 0;
                  const isInvalid = hasErrors || hasMissingImage;
                  
                  let imageCell;
                  if (hasImageName) {
                    if (hasImageUploaded) {
                      imageCell = <img src={recipient.image} alt="Preview" className="w-8 h-8 object-cover rounded" />;
                    } else {
                      imageCell = <span className="text-red-500 text-xs">Missing</span>;
                    }
                  } else {
                    imageCell = <span className="text-gray-400 text-xs">None</span>;
                  }

                  return (
                    <tr key={i} className={isInvalid ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2 text-sm">{recipient.recipient_name}</td>
                      <td className="px-4 py-2 text-sm">{recipient.recipient_email}</td>
                      <td className="px-4 py-2 text-sm">{recipient.recipient_phone}</td>
                      <td className="px-4 py-2 text-sm">{recipient.trees_count}</td>
                      <td className="px-4 py-2 text-sm">{imageCell}</td>
                      <td className="px-4 py-2 text-sm">
                        {isInvalid ? (
                          <span className="text-red-500">❌</span>
                        ) : (
                          <span className="text-green-500">✅</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {isInvalid ? (
                          <div className="space-y-1">
                            {hasErrors && Array.isArray(recipient._errors) && recipient._errors.map((error, errorIndex) => (
                              <div key={errorIndex} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border">
                                {error}
                              </div>
                            ))}
                            {hasMissingImage && (
                              <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border">
                                Image "{recipient.image}" not found - please upload the image file
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No errors</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <TablePagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredData.length / itemsPerPage)}
            itemsPerPage={itemsPerPage}
            totalItems={filteredData.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(items) => {
              setItemsPerPage(items);
              setCurrentPage(0);
            }}
          />
        </>
      )}
    </div>
  );
};