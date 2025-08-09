import React from 'react';
import { DedicatedName } from '../../types/forms';
import { TablePagination } from '../../../../components/shared/TablePagination';

interface CSVPreviewTableProps {
  csvPreview: DedicatedName[];
  csvErrors: string[];
  currentPage: number;
  itemsPerPage: number;
  paginatedData: DedicatedName[];
  filteredData: DedicatedName[];
  hasTableErrors: boolean;
  // Search and filter props
  searchName: string;
  searchEmail: string;
  validFilter: 'all' | 'valid' | 'invalid';
  setSearchName: (value: string) => void;
  setSearchEmail: (value: string) => void;
  setValidFilter: (value: 'all' | 'valid' | 'invalid') => void;
  clearFilters: () => void;
  // Pagination props
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
}

export const CSVPreviewTable: React.FC<CSVPreviewTableProps> = ({
  csvPreview,
  csvErrors,
  currentPage,
  itemsPerPage,
  paginatedData,
  filteredData,
  hasTableErrors,
  searchName,
  searchEmail,
  validFilter,
  setSearchName,
  setSearchEmail,
  setValidFilter,
  clearFilters,
  setCurrentPage,
  setItemsPerPage
}) => {
  if (csvPreview.length === 0) {
    return null;
  }

  const hasIssues = csvPreview.some(recipient => {
    const hasErrors = Array.isArray((recipient as any)._errors) && (recipient as any)._errors.length > 0;
    return hasErrors;
  });

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {csvErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="text-red-800 font-medium mb-2">CSV Validation Errors:</h4>
          <ul className="text-red-700 text-sm space-y-1">
            {csvErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Error notification when CSV has errors */}
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
                <strong>CSV contains errors.</strong> The table is filtered to show invalid rows by default. 
                Review the errors in the "Errors" column.
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
                onClick={clearFilters}
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient Phone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trees</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee Name</th>
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
                  const hasErrors = Array.isArray((recipient as any)._errors) && (recipient as any)._errors.length > 0;
                  const isInvalid = hasErrors;
                  
                  return (
                    <tr key={i} className={isInvalid ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2 text-sm">{recipient.recipient_name}</td>
                      <td className="px-4 py-2 text-sm">{recipient.recipient_email}</td>
                      <td className="px-4 py-2 text-sm">{recipient.recipient_phone || '-'}</td>
                      <td className="px-4 py-2 text-sm">{recipient.trees_count}</td>
                      <td className="px-4 py-2 text-sm">{recipient.assignee_name}</td>
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
                            {hasErrors && Array.isArray((recipient as any)._errors) && (recipient as any)._errors.map((error: string, errorIndex: number) => (
                              <div key={errorIndex} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border">
                                {error}
                              </div>
                            ))}
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