import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Text input for finding muscles by name or nickname. It only reports what was
 * typed; the selector resolves it through the anatomy engine and shows matches.
 */
export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={`
        relative flex w-full items-center gap-2 px-3 py-2.5
        bg-gray-100 dark:bg-gray-800 rounded-lg
        transition-all duration-200
        ${isFocused ? 'ring-2 ring-primary-500' : ''}
      `}
    >
      <Search className="w-4 h-4 shrink-0 text-gray-400" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search muscles..."
        aria-label="Search muscles by name or nickname"
        className="min-w-0 flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
