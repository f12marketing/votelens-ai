import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  value: string | number;
}

interface FilterGroup {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'search';
  options?: FilterOption[];
  min?: number;
  max?: number;
}

interface InteractiveFiltersProps {
  filterGroups: FilterGroup[];
  onFilterChange: (filters: Record<string, any>) => void;
  activeFiltersCount?: number;
}

export const InteractiveFilters: React.FC<InteractiveFiltersProps> = ({
  filterGroups,
  onFilterChange,
  activeFiltersCount = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...selectedFilters, [filterId]: value };
    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleMultiSelect = (filterId: string, value: string) => {
    const currentValues = selectedFilters[filterId] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];
    handleFilterChange(filterId, newValues);
  };

  const clearFilter = (filterId: string) => {
    const newFilters = { ...selectedFilters };
    delete newFilters[filterId];
    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    onFilterChange({});
    setSearchTerm('');
  };

  const activeFiltersCount = Object.keys(selectedFilters).length + (searchTerm ? 1 : 0);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && !isExpanded && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {Object.entries(selectedFilters).map(([filterId, value]) => {
            const filterGroup = filterGroups.find(fg => fg.id === filterId);
            if (!filterGroup) return null;

            const displayValue = Array.isArray(value)
              ? `${value.length} selected`
              : typeof value === 'object'
              ? `${value.min} - ${value.max}`
              : String(value);

            return (
              <div
                key={filterId}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-sm"
              >
                <span className="font-medium">{filterGroup.label}:</span>
                <span>{displayValue}</span>
                <button
                  onClick={() => clearFilter(filterId)}
                  className="ml-1 hover:text-blue-900 dark:hover:text-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          {searchTerm && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-sm">
              <span className="font-medium">Search:</span>
              <span>{searchTerm}</span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  onFilterChange({ ...selectedFilters });
                }}
                className="ml-1 hover:text-blue-900 dark:hover:text-blue-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search constituencies, parties..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Groups */}
              {filterGroups.map((filterGroup) => (
                <div key={filterGroup.id}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {filterGroup.label}
                  </label>

                  {filterGroup.type === 'select' && filterGroup.options && (
                    <select
                      value={selectedFilters[filterGroup.id] || ''}
                      onChange={(e) => handleFilterChange(filterGroup.id, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All</option>
                      {filterGroup.options.map((option) => (
                        <option key={option.id} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {filterGroup.type === 'multiselect' && filterGroup.options && (
                    <div className="flex flex-wrap gap-2">
                      {filterGroup.options.map((option) => {
                        const isSelected = (selectedFilters[filterGroup.id] || []).includes(option.value);
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleMultiSelect(filterGroup.id, option.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {filterGroup.type === 'range' && (
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={selectedFilters[filterGroup.id]?.min || filterGroup.min || ''}
                          onChange={(e) => {
                            const current = selectedFilters[filterGroup.id] || { min: filterGroup.min, max: filterGroup.max };
                            handleFilterChange(filterGroup.id, { ...current, min: Number(e.target.value) });
                          }}
                          placeholder="Min"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <span className="text-gray-500">to</span>
                      <div className="flex-1">
                        <input
                          type="number"
                          value={selectedFilters[filterGroup.id]?.max || filterGroup.max || ''}
                          onChange={(e) => {
                            const current = selectedFilters[filterGroup.id] || { min: filterGroup.min, max: filterGroup.max };
                            handleFilterChange(filterGroup.id, { ...current, max: Number(e.target.value) });
                          }}
                          placeholder="Max"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Apply Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Skeleton loader
export const InteractiveFiltersSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-5 w-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  );
};
