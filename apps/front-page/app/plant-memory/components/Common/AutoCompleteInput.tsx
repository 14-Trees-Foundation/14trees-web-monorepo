import React, { useState, useEffect, useRef } from 'react';

interface AutoCompleteInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  name: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const AutoCompleteInput: React.FC<AutoCompleteInputProps> = ({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  name,
  type = "text",
  required,
  disabled,
  onBlur
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.length > 0) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase()) && 
        suggestion.toLowerCase() !== value.toLowerCase() // Don't show exact matches
      ).slice(0, 5);
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [value, suggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    const event = {
      target: { name, value: suggestion }
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(event);
    setShowSuggestions(false);
    // Force immediate hide
    setFilteredSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Call the external blur handler if provided
    if (onBlur) {
      onBlur(e);
    }
    
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }, 200);
  };

  const handleFocus = () => {
    if (value.length > 0 && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={type}
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        required={required}
        disabled={disabled}
      />
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};