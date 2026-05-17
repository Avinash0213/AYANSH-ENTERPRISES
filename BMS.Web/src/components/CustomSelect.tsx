import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  showSearch?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  disabled = false,
  id,
  showSearch = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => String(o.value) === String(value));

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(o => 
      o.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Auto-focus search input
  useEffect(() => {
    if (open && showSearch) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    if (!open) {
      setSearchTerm('');
    }
  }, [open, showSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') { 
      if (open && showSearch && document.activeElement === searchInputRef.current) return;
      e.preventDefault(); 
      setOpen(o => !o); 
    }
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const idx = filteredOptions.findIndex(o => String(o.value) === String(value));
      if (idx < filteredOptions.length - 1) onChange(filteredOptions[idx + 1].value);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = filteredOptions.findIndex(o => String(o.value) === String(value));
      if (idx > 0) onChange(filteredOptions[idx - 1].value);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)} id={id}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'w-full flex items-center justify-between gap-2',
          'px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm font-medium',
          'focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50',
          'transition-all duration-200 cursor-pointer',
          'hover:border-red-500/30 hover:bg-card',
          open && 'border-red-500/50 ring-2 ring-red-500/20',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
        style={{ color: 'var(--foreground)' }}
      >
        <span className={cn('whitespace-normal break-all text-left', !selected && 'text-muted-foreground')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200',
            open && 'rotate-180 text-red-500'
          )}
        />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 mt-1.5 w-full',
              'bg-card border border-border rounded-xl overflow-hidden',
              'shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
            )}
            role="listbox"
          >
            {showSearch && (
              <div className="p-2 border-b border-border/50 sticky top-0 bg-card z-10">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className={cn(
                      "w-full pl-8 pr-8 py-1.5 text-xs bg-muted/50 border border-border rounded-lg",
                      "focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50",
                      "placeholder:text-muted-foreground"
                    )}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-md transition-colors"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div className="max-h-56 overflow-y-auto py-1.5 divide-y divide-border/50">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(option => {
                  const isSelected = String(option.value) === String(value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => { onChange(option.value); setOpen(false); }}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left',
                        'transition-colors duration-100 cursor-pointer',
                        isSelected
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold'
                          : 'text-foreground hover:bg-background/80 font-medium'
                      )}
                    >
                      <span className="whitespace-normal break-all">{option.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-muted-foreground">No results found for "{searchTerm}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
