import React from 'react';
import { cn } from "../../lib/utils";

interface BrutalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
}

export const BrutalCard: React.FC<BrutalCardProps> = ({ 
  children, 
  className, 
  color = "#FFFFFF",
  ...props 
}) => {
  return (
    <div 
      className={cn(
        "border-[3px] border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] p-6 transition-transform duration-200",
        "hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)]",
        className
      )}
      style={{ backgroundColor: color }}
      {...props}
    >
      {children}
    </div>
  );
};
