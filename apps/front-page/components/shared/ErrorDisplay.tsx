import React from 'react';

interface ErrorDisplayProps {
  errors: string[];
  title?: string;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errors,
  title = 'Errors:',
  className = ''
}) => {
  if (errors.length === 0) return null;

  return (
    <div className={`bg-red-50 border-l-4 border-red-500 p-4 ${className}`}>
      {title && <h4 className="font-medium text-red-700">{title}</h4>}
      <ul className="list-disc pl-5 text-red-600">
        {errors.map((error, i) => (
          <li key={i} className="text-sm">{error}</li>
        ))}
      </ul>
    </div>
  );
};

interface ValidationErrorDisplayProps {
  error: string;
  className?: string;
}

export const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  error,
  className = ''
}) => {
  if (!error) return null;

  return (
    <div className={`bg-red-50 border-l-4 border-red-500 p-4 mb-4 ${className}`}>
      <p className="text-red-700">{error}</p>
    </div>
  );
};