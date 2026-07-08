import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  whiteText?: boolean;
}

export function Logo({ className = "h-10", iconOnly = false, whiteText = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Neo-Brutalist Logo Icon */}
      <div className="relative h-full aspect-square shrink-0">
        <div className="absolute inset-0 bg-[#FF6666] border-[3px] border-black translate-x-1 translate-y-1" />
        <div className="absolute inset-0 bg-[#E0FF4F] border-[3px] border-black flex items-center justify-center font-black text-black">
          K
        </div>
      </div>

      {!iconOnly && (
        <span
          className={`font-display font-black text-2xl tracking-tighter uppercase ${
            whiteText ? 'text-white' : 'text-black'
          }`}
          style={{
            WebkitTextStroke: whiteText ? 'none' : '1px black',
            textShadow: whiteText ? '2px 2px 0px rgba(0,0,0,1)' : '3px 3px 0px rgba(255,102,102,1)'
          }}
        >
          kudi
        </span>
      )}
    </div>
  );
}
