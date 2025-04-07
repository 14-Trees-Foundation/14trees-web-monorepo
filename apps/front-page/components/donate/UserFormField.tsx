// components/donate/UserFormField.tsx
import React from 'react';

interface UserFormFieldProps {
  type: 'text' | 'email' | 'tel' | 'number' | 'select';
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string | number) => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
  min?: number;
  options?: Array<{value: string, label: string}>;
  className?: string;
}

export const UserFormField: React.FC<UserFormFieldProps> = ({
  type,
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder = '',
  error,
  min,
  options = [],
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newValue = type === 'number' ? Number(e.target.value) : e.target.value;
    onChange(newValue);
  };

  const baseInputClass = `w-full rounded-md border ${
    error ? 'border-red-500' : 'border-gray-300'
  } px-3 py-2 ${className}`;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>
      
      {type === 'select' ? (
        <select
          name={name}
          value={value as string}
          onChange={handleChange}
          className={baseInputClass}
          required={required}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          className={baseInputClass}
          required={required}
          placeholder={placeholder}
          min={min}
          pattern={type === 'tel' ? "[0-9]{10,15}" : undefined}
          title={type === 'tel' ? "10-15 digit phone number" : undefined}
        />
      )}
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};