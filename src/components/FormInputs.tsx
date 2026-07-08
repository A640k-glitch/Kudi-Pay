import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from './Button';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, prefix, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1 md:gap-1.5">
        {label && (
          <label className="text-xs md:text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs md:text-sm text-gray-400 font-medium">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "flex h-11 md:h-12 w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-xs md:text-sm ring-offset-white transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
              prefix && "pl-10",
              error && "border-destructive focus:border-destructive focus:ring-destructive",
              className
            )}
            {...props}
          />
        </div>
        {(error || helperText) && (
          <p className={cn("text-[11px] md:text-xs", error ? "text-destructive" : "text-gray-400")}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-base ring-offset-white placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors",
            error && "border-destructive focus:border-destructive focus:ring-destructive",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
  labelClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, labelClassName, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1 md:gap-1.5">
        {label && (
          <label className={cn("text-xs md:text-sm font-semibold text-gray-600", labelClassName)}>
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "flex h-11 md:h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-xs md:text-sm ring-offset-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
              error && "border-destructive focus:border-destructive focus:ring-destructive",
              className
            )}
            {...props}
          >
            <option value="" disabled hidden>Select an option</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom arrow */}
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
             <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
             </svg>
          </div>
        </div>
        {error && (
          <p className="text-[11px] md:text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export const Toggle = ({ 
  checked, 
  onChange, 
  label, 
  description 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex flex-col pr-4">
        <span className="text-base font-medium text-neutral-text">{label}</span>
        {description && <span className="text-sm text-gray-500">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          checked ? "bg-primary" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
};
