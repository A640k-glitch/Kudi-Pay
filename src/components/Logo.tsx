import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  whiteText?: boolean;
}

export function Logo({ className = "h-10", iconOnly = false, whiteText = false }: LogoProps) {
  // Each Logo instance gets a unique gradient ID so multiple instances
  // on the same page (sidebar + mobile topbar) don't clobber each other.
  const uid = useId().replace(/:/g, '');
  const gradId = `kudi-grad-${uid}`;

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Interlocking double-loop emblem */}
      <svg
        className="h-full aspect-square shrink-0"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M32 65C23.7157 65 17 58.2843 17 50C17 41.7157 23.7157 35 32 35C40.2843 35 44 45 50 50C56 55 59.7157 65 68 65C76.2843 65 83 58.2843 83 50C83 41.7157 76.2843 35 68 35C59.7157 35 56 45 50 50C44 55 40.2843 65 32 65Z"
          stroke={`url(#${gradId})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="50" r="5" fill="#059669" />
        <defs>
          <linearGradient id={gradId} x1="17" y1="50" x2="83" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#312E81" />
            <stop offset="0.5" stopColor="#6366F1" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>

      {!iconOnly && (
        <span
          className={`font-display font-black text-2xl tracking-tighter ${
            whiteText
              ? 'text-white'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-[#312E81] via-[#6366F1] to-[#059669]'
          }`}
        >
          kudi
        </span>
      )}
    </div>
  );
}
