import React from 'react';
import { cn } from "../../lib/utils";

interface MarqueeProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
  itemClassName?: string;
}

export const BrutalMarquee: React.FC<MarqueeProps> = ({ 
  children, 
  direction = 'left', 
  speed = 'normal',
  className,
  itemClassName 
}) => {
  const speedClass = {
    slow: 'animate-marquee-slow',
    normal: 'animate-marquee',
    fast: 'animate-marquee-fast'
  }[speed];

  const dirClass = direction === 'left' ? '' : 'direction-reverse';

  return (
    <div className={cn("flex w-full overflow-hidden bg-black text-white border-y-[3px] border-black py-3", className)}>
      <div className={cn("flex whitespace-nowrap will-change-transform", speedClass, dirClass)}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={cn("flex items-center mx-4 gap-8", itemClassName)}>
            {children}
          </div>
        ))}
      </div>
    </div>
  );
};
