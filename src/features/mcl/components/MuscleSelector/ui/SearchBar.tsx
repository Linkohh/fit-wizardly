import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Muscle } from '../../../types';
import { searchMuscles } from '../../../data/muscles';
import { getMuscleGroupColor } from '../../../data/muscleGroups';

interface SearchBarProps {
  onMuscleSelect: (muscle: Muscle) => void;
  onMuscleHover?: (muscle: Muscle | null) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onMuscleSelect,
  onMuscleHover,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    return searchMuscles(query).slice(0, 8);
  }, [query]);

  const handleSelect = useCallback(
    (muscle: Muscle) => {
      onMuscleSelect(muscle);
      setQuery('');
    },
    [onMuscleSelect]
  );

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  const showResults = isFocused && results.length > 0;

  return (
    <div className="relative">
      {/* Search input */}
      <div
        className={`
          relative flex items-center gap-2 px-4 py-2.5
          bg-gray-100 dark:bg-gray-800 rounded-lg
          transition-all duration-200
          ${isFocused ? 'ring-2 ring-primary-500' : ''}
        `}
      >
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          placeholder="Search muscles..."
          className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 text-sm"
        />
        {query && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-64 overflow-y-auto"
          >
            {results.map((muscle) => (
              <button
                key={muscle.id}
                onClick={() => handleSelect(muscle)}
                onMouseEnter={() => onMuscleHover?.(muscle)}
                onMouseLeave={() => onMuscleHover?.(null)}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getMuscleGroupColor(muscle.group) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {muscle.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {muscle.scientificName}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
