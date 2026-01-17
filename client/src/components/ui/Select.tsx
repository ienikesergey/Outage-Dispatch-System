import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import clsx from 'clsx';

interface Option {
    value: string | number;
    label: string;
}

interface SelectProps {
    value: string | number;
    onChange: (value: any) => void;
    options: Option[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    searchable?: boolean;
    clearable?: boolean;
}

export const Select: React.FC<SelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Выберите...',
    disabled = false,
    className,
    searchable = false,
    clearable = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(o => o.value === value);

    // Filter options by search query
    const filteredOptions = searchable && searchQuery
        ? options.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Focus search input when opened
            if (searchable) {
                setTimeout(() => searchInputRef.current?.focus(), 50);
            }
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, searchable]);

    const handleSelect = (optionValue: string | number) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className={clsx("relative", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                title={selectedOption?.label || placeholder}
                className={clsx(
                    "w-full text-left flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-sm shadow-sm min-h-[2.5rem]",
                    disabled ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white hover:bg-slate-50 hover:border-slate-400 cursor-pointer focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
                    isOpen ? "border-brand-500 ring-2 ring-brand-500/20 z-20" : "border-slate-300 text-slate-700",
                    !selectedOption && "text-slate-400"
                )}
                disabled={disabled}
            >
                <span className="block mr-4 whitespace-normal leading-tight">
                    {selectedOption?.label || placeholder}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                    {clearable && selectedOption && !disabled && (
                        <span
                            onClick={(e) => { e.stopPropagation(); onChange(''); }}
                            className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                        >
                            <X size={14} className="text-slate-400 hover:text-slate-600" />
                        </span>
                    )}
                    <ChevronDown
                        size={16}
                        className={clsx("text-slate-400 transition-transform duration-200", isOpen && "rotate-180")}
                    />
                </div>
            </button>

            {isOpen && !disabled && (
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-[300px] overflow-hidden flex flex-col animate-scale-in origin-top">
                    {/* Search Input */}
                    {searchable && (
                        <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative">
                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Поиск..."
                                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
                                />
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    <div className="overflow-y-auto custom-scrollbar py-1 flex-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={clsx(
                                        "px-3 py-2 text-[13px] cursor-pointer flex items-center justify-between transition-colors",
                                        option.value === value
                                            ? "bg-brand-50 text-brand-700 font-semibold"
                                            : "text-slate-700 hover:bg-slate-50"
                                    )}
                                >
                                    <span className="whitespace-normal leading-tight pr-2">{option.label}</span>
                                    {option.value === value && <Check size={14} className="text-brand-500" />}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-3 text-center text-slate-400 text-xs">
                                {searchQuery ? 'Ничего не найдено' : 'Нет данных'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
