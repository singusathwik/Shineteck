import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { filterWithPrefixPriority } from '../../data/locationData.js';

export function SearchableCombobox({
  id,
  value = '',
  onChange,
  options = [],
  placeholder = 'Select or type...',
  hasError = false,
  icon: Icon = null,
  disabled = false,
  className = '',
  emptyNotice = 'No matching options. Press Enter or click to use this value.'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Synchronize internal search query when external value changes
  useEffect(() => {
    setSearchQuery(value || '');
  }, [value]);

  // Filter options with prefix priority
  const filteredOptions = filterWithPrefixPriority(options, searchQuery);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Auto-scroll list when highlighted item changes
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    setSearchQuery(newVal);
    onChange(newVal);
    if (!isOpen) setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleSelectOption = (option) => {
    setSearchQuery(option);
    onChange(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchQuery('');
    onChange('');
    setIsOpen(true);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleToggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (!isOpen) {
      setIsOpen(true);
      setHighlightedIndex(-1);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => {
          const total = filteredOptions.length + (searchQuery && !filteredOptions.some(o => o.toLowerCase() === searchQuery.toLowerCase()) ? 1 : 0);
          return prev < total - 1 ? prev + 1 : 0;
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(filteredOptions.length - 1);
      } else {
        setHighlightedIndex((prev) => {
          const total = filteredOptions.length + (searchQuery && !filteredOptions.some(o => o.toLowerCase() === searchQuery.toLowerCase()) ? 1 : 0);
          return prev > 0 ? prev - 1 : total - 1;
        });
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0) {
        e.preventDefault();
        if (highlightedIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        } else {
          // Selecting the custom typed value
          handleSelectOption(searchQuery.trim());
        }
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const hasExactMatch = filteredOptions.some(
    (opt) => opt.toLowerCase() === (searchQuery || '').trim().toLowerCase()
  );

  const showCustomOption = searchQuery.trim().length > 0 && !hasExactMatch;

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={searchQuery}
          disabled={disabled}
          placeholder={placeholder}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className={`w-full ${Icon ? 'pl-9' : 'pl-3.5'} pr-16 py-2.5 text-xs font-medium border rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-600/12 focus:border-blue-600 transition-all shadow-2xs ${
            hasError
              ? 'border-rose-400 bg-rose-50/30'
              : 'border-slate-300 hover:border-slate-400'
          } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              aria-label="Clear input"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={handleToggleDropdown}
            aria-label="Toggle options dropdown"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Options Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto py-1.5 divide-y divide-slate-100 text-xs font-medium"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => {
                const isSelected = (value || '').trim().toLowerCase() === option.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={`${option}-${idx}`}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectOption(option);
                    }}
                    className={`px-3.5 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                      isHighlighted
                        ? 'bg-blue-50/90 text-blue-900 font-semibold'
                        : isSelected
                        ? 'bg-blue-50/50 text-blue-800 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{option}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            ) : null}

            {/* Custom typed option if no exact match */}
            {showCustomOption && (
              <div
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectOption(searchQuery.trim());
                }}
                className={`px-3.5 py-2 cursor-pointer flex items-center justify-between border-t border-slate-100 transition-colors ${
                  highlightedIndex === filteredOptions.length
                    ? 'bg-blue-50 text-blue-900 font-semibold'
                    : 'bg-slate-50/60 text-slate-700 hover:bg-blue-50/60'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-slate-400 font-normal">Use custom:</span>
                  <span className="font-bold text-slate-900 truncate">"{searchQuery.trim()}"</span>
                </div>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider bg-blue-100/70 px-1.5 py-0.5 rounded ml-2 shrink-0">
                  Custom
                </span>
              </div>
            )}

            {filteredOptions.length === 0 && !showCustomOption && (
              <div className="px-3.5 py-3 text-center text-slate-400 text-xs italic">
                {emptyNotice}
              </div>
            )}
          </div>

          {/* Bottom count / hint info */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10.5px] text-slate-400 font-medium flex items-center justify-between">
            <span>
              {filteredOptions.length} suggestion{filteredOptions.length === 1 ? '' : 's'}
            </span>
            <span className="text-[10px] text-slate-400">Type or select</span>
          </div>
        </div>
      )}
    </div>
  );
}
