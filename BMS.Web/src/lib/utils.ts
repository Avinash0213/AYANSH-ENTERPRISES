import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a date value as DD/MM/YYYY */
export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB'); // en-GB gives DD/MM/YYYY
}
/** Formats a name string to "First Name [Initials]" (e.g., "John Doe" -> "John D.") */
export function formatName(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  const firstName = parts[0];
  const initials = parts.slice(1).map(p => p[0].toUpperCase()).join(' ');
  return `${firstName} ${initials}`;
}
