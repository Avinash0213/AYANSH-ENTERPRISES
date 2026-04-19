import { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { fmtDate } from '../lib/utils';
import { cn } from '../lib/utils';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function DateInput({ value, onChange, className, placeholder = "DD/MM/YYYY" }: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert YYYY-MM-DD to DD/MM/YYYY for display
  const displayValue = value ? fmtDate(value) : '';

  return (
    <div className="relative group w-full">
      <div 
        onClick={() => {
          try {
            inputRef.current?.showPicker();
          } catch (e) {
            inputRef.current?.click();
          }
        }}
        className={cn(
          "input-field flex items-center justify-between cursor-pointer hover:border-red-400/50 transition-colors",
          className
        )}
      >
        <span className={cn("text-sm", !displayValue && "text-muted-foreground")}>
          {displayValue || placeholder}
        </span>
        <Calendar className="w-4 h-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
      </div>
      
      {/* Hidden native date input */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
