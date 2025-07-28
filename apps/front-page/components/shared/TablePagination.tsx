import React from 'react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  itemsPerPageOptions?: number[];
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50],
  className = ''
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-col sm:flex-row justify-between items-center mt-4 gap-2 ${className}`}>
      <div className="text-sm text-gray-600">
        Page {currentPage + 1} of {totalPages} 
        {totalItems > 0 && ` (${totalItems} items)`}
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label htmlFor="pageSize" className="text-sm text-gray-600">Items per page:</label>
          <select
            id="pageSize"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              currentPage === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-2 mx-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageIndex;
              if (totalPages <= 5) {
                pageIndex = i;
              } else if (currentPage < 3) {
                pageIndex = i;
              } else if (currentPage >= totalPages - 3) {
                pageIndex = totalPages - 5 + i;
              } else {
                pageIndex = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageIndex}
                  type="button"
                  onClick={() => onPageChange(pageIndex)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentPage === pageIndex
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pageIndex + 1}
                </button>
              );
            })}
          </div>
          
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              currentPage >= totalPages - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};