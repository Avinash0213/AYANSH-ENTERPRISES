import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import DateInput from './DateInput';
import { cn } from '../lib/utils';

interface DateTimeInputProps {
  value: string; // ISO string
  onChange: (value: string) => void;
  className?: string;
}

export default function DateTimeInput({ value, onChange, className }: DateTimeInputProps) {
  const [datePart, setDatePart] = useState('');
  const [timePart, setTimePart] = useState('');

  useEffect(() => {
    if (!value) return;
    const d = new Date(value);
    if (isNaN(d.getTime())) return;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDatePart(`${yyyy}-${mm}-${dd}`);

    const hh = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    setTimePart(`${hh}:${mins}`);
  }, [value]);

  const handleDateChange = (newDate: string) => {
    setDatePart(newDate);
    updateValue(newDate, timePart);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimePart(newTime);
    updateValue(datePart, newTime);
  };

  const updateValue = (dPart: string, tPart: string) => {
    if (!dPart || !tPart) return;
    const [y, m, d] = dPart.split('-').map(Number);
    const [h, min] = tPart.split(':').map(Number);
    
    if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(h) || isNaN(min)) return;

    const newDate = new Date(y, m - 1, d, h, min);
    onChange(newDate.toISOString());
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1">
        <DateInput 
          value={datePart} 
          onChange={handleDateChange} 
          placeholder="Select Date" 
        />
      </div>
      <div className="relative group w-32 shrink-0">
        <input
          type="time"
          value={timePart}
          onChange={handleTimeChange}
          className="input-field w-full pl-9 cursor-pointer hover:border-red-400/50 transition-colors"
        />
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-red-500 transition-colors pointer-events-none" />
      </div>
    </div>
  );
}
