import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function PasswordField({ label, error, icon, className, ...props }: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative group/pass">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/pass:text-red-500 transition-colors duration-200 pointer-events-none">
            {React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4" })}
          </div>
        )}
        <input
          {...props}
          type={show ? 'text' : 'password'}
          className={cn(
            "input-field !py-2.5",
            icon && "pl-10",
            "pr-11",
            "bg-card border-border hover:border-border/80 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5 transition-all text-sm",
            className
          )}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <motion.p 
          initial={{ opacity: 0, x: -5 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="text-[10px] text-rose-500 font-medium ml-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
