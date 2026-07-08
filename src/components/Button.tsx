import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'destructive' | 'ghost';
  size?: 'default' | 'small';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
    
    const variants = {
      primary: "btn_3d",
      accent: "relative bg-accent px-6 py-2.5 text-white rounded-xl font-semibold transition-all shadow-[0_4px_0_#047857] active:translate-y-[4px] active:shadow-none hover:-translate-y-0.5 hover:shadow-[0_6px_0_#047857]",
      secondary: "bg-white/80 backdrop-blur-md text-primary border border-slate-200 hover:bg-slate-50 shadow-sm active:translate-y-[1px]",
      destructive: "bg-destructive text-white hover:bg-destructive-dark focus:ring-destructive",
      ghost: "bg-transparent text-primary hover:bg-slate-100",
    };

    const sizes = {
      default: "h-12 px-6 text-base",
      small: "h-9 px-4 text-sm",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
