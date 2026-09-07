import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, User, Sparkles, Building2 } from 'lucide-react';

function formatLPA(amount, country = 'India') {
  const num = parseFloat(amount) || 0;
  if (country === 'India') {
    const lpa = (num / 100000).toFixed(1);
    return `${lpa} LPA`;
  }
  return `$${(num / 1000).toFixed(0)}k/yr`;
}

export function EmployeeSearchableDropdown({
  employees = [],
  selectedEmployeeId = '',
  onSelectEmployee
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selectedEmployee = employees.find(e => e.employee_id === selectedEmployeeId);

  // Filter employees based on search query (matches name, ID, role, or country)
  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = emp.full_name?.toLowerCase().includes(q);
    const idMatch = emp.employee_id?.toLowerCase().includes(q);
    const roleMatch = emp.designation?.toLowerCase().includes(q);
    const countryMatch = emp.country?.toLowerCase().includes(q);
    return nameMatch || idMatch || roleMatch || countryMatch;
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
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

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredEmployees.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredEmployees.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredEmployees.length) {
        handleSelect(filteredEmployees[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleSelect = (emp) => {
    onSelectEmployee(emp.employee_id);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* ── Main Combobox Input Field ───────────────────────────────── */}
      <div
        onClick={() => {
          setIsOpen(true);
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }}
        className={`w-full min-h-[46px] px-3.5 py-1.5 bg-white border rounded-2xl flex items-center gap-2.5 transition-all cursor-text ${
          isOpen
            ? 'border-blue-500 ring-3 ring-blue-500/15 shadow-sm'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50 shadow-2xs'
        }`}
      >
        <Search className="w-4 h-4 text-slate-400 shrink-0" />

        {/* If closed and not searching, show selected employee preview */}
        {!isOpen && selectedEmployee ? (
          <div className="flex-1 flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-base shrink-0 leading-none">
                {selectedEmployee.country === 'India' ? '🇮🇳' : '🌐'}
              </span>
              <span className="font-bold text-slate-900 text-xs truncate">
                {selectedEmployee.full_name}
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-mono text-[11px] font-bold shrink-0">
                {selectedEmployee.employee_id}
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline truncate">
                • {selectedEmployee.designation}
              </span>
            </div>

            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full font-mono shrink-0 ml-2">
              {formatLPA(selectedEmployee.annual_salary || 1000000, selectedEmployee.country)}
            </span>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedEmployee
                ? `Search: "${selectedEmployee.full_name}" or type ID, name, role...`
                : 'Search employee by name, ID (e.g. SH-2008), or role...'
            }
            className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-slate-900 placeholder:text-slate-400"
          />
        )}

        {/* Clear search icon button */}
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Dropdown Toggle Chevron */}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(prev => !prev);
            if (!isOpen && inputRef.current) {
              inputRef.current.focus();
            }
          }}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-transform cursor-pointer"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
          />
        </button>
      </div>

      {/* ── Dropdown Menu List ─────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search stats subheader */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">
              {searchQuery ? `Matching "${searchQuery}":` : 'All Registered Staff:'}
            </span>
            <span className="font-mono text-[10px]">
              {filteredEmployees.length} of {employees.length} employees
            </span>
          </div>

          <div ref={listRef} className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-0.5">
            {filteredEmployees.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <User className="w-6 h-6 mx-auto mb-1 opacity-40" />
                <p className="font-semibold text-xs text-slate-600">No matching employees found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try searching by full name, ID, title, or country
                </p>
              </div>
            ) : (
              filteredEmployees.map((emp, idx) => {
                const isSelected = emp.employee_id === selectedEmployeeId;
                const isHighlighted = idx === highlightedIndex;
                const isIndia = emp.country === 'India';

                return (
                  <div
                    key={emp.employee_id}
                    onClick={() => handleSelect(emp)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border border-blue-200 text-blue-950 font-bold'
                        : isHighlighted
                          ? 'bg-slate-100 text-slate-900'
                          : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {/* Left: Avatar, Name, ID, Designation */}
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-[#0f2b48] text-white shadow-2xs'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {emp.first_name?.[0] || 'E'}{emp.last_name?.[0] || 'M'}
                      </div>

                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm shrink-0 leading-none">
                            {isIndia ? '🇮🇳' : '🌐'}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {emp.full_name}
                          </span>
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-semibold shrink-0">
                            {emp.employee_id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {emp.designation} • {emp.city || emp.country}
                        </div>
                      </div>
                    </div>

                    {/* Right: LPA Package Badge & Checkmark */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono border ${
                        isIndia
                          ? 'bg-orange-50 text-orange-800 border-orange-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {formatLPA(emp.annual_salary || 1000000, emp.country)}
                      </span>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
