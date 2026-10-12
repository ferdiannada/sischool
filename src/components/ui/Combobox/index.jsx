import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { cn } from '../../../utils/cn';

export const Combobox = ({
    value,
    onChange,
    options = [],
    placeholder = "Pilih...",
    className,
    disabled = false,
    icon: Icon,
    emptyMessage = "Tidak ada data."
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Get selected label
    const selectedOption = options.find(opt => String(opt.value) === String(value));

    // Filter options
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when opening
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={cn(
                    "flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm transition-all shadow-sm hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
                    isOpen && "border-primary-500 ring-2 ring-primary-500/20",
                    disabled && "cursor-not-allowed opacity-50 bg-gray-50",
                    className
                )}
                disabled={disabled}
            >
                <div className="flex items-center gap-2 truncate text-gray-700 w-full text-left">
                    {Icon && <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />}
                    <span className={cn("truncate flex-1", !selectedOption && "text-gray-400")}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ml-2", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-100 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden min-w-[200px]">
                    {/* Search Input */}
                    <div className="flex items-center border-b border-gray-100 px-3 py-2 bg-gray-50/50">
                        <Search className="h-4 w-4 text-gray-400 mr-2" />
                        <input
                            ref={inputRef}
                            className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder:text-gray-400"
                            placeholder="Cari..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="ml-2 hover:bg-gray-200 rounded p-0.5">
                                <X className="h-3 w-3 text-gray-500" />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-200">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left",
                                        String(value) === String(option.value)
                                            ? "bg-primary-50 text-primary-700 font-medium"
                                            : "text-gray-700 hover:bg-gray-50"
                                    )}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {String(value) === String(option.value) && (
                                        <Check className="h-4 w-4 text-primary-600 flex-shrink-0 ml-2" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-sm text-gray-500">
                                {emptyMessage}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
