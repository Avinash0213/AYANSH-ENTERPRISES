import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
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
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  disabled = false,
  id,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => String(o.value) === String(value));

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

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); }
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = options.findIndex(o => String(o.value) === String(value));
      if (idx < options.length - 1) onChange(options[idx + 1].value);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = options.findIndex(o => String(o.value) === String(value));
      if (idx > 0) onChange(options[idx - 1].value);
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
        <span className={cn('truncate', !selected && 'text-muted-foreground')}>
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
            <div className="max-h-56 overflow-y-auto py-1.5 divide-y divide-border/50">
              {options.map(option => {
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
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
