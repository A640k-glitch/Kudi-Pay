import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
  fill?: string;
}

const defaultProps = {
  size: 24,
  color: 'currentColor',
  strokeWidth: 2.5,
  strokeLinecap: 'square' as const,
  strokeLinejoin: 'miter' as const,
};

export const NeoStar = ({ size, color, className, ...props }: IconProps) => (
  <svg width={size || defaultProps.size} height={size || defaultProps.size} viewBox="0 0 24 24" fill="none" stroke={color || defaultProps.color} className={className} {...defaultProps} {...props}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const NeoShield = ({ size, color, className, ...props }: IconProps) => (
  <svg width={size || defaultProps.size} height={size || defaultProps.size} viewBox="0 0 24 24" fill="none" stroke={color || defaultProps.color} className={className} {...defaultProps} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const NeoStore = ({ size, color, className, ...props }: IconProps) => (
  <svg width={size || defaultProps.size} height={size || defaultProps.size} viewBox="0 0 24 24" fill="none" stroke={color || defaultProps.color} className={className} {...defaultProps} {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const NeoCoins = ({ size, color, className, ...props }: IconProps) => (
  <svg width={size || defaultProps.size} height={size || defaultProps.size} viewBox="0 0 24 24" fill="none" stroke={color || defaultProps.color} className={className} {...defaultProps} {...props}>
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="M16.71 13.88l.7.71-2.82 2.82" />
  </svg>
);

export const NeoTarget = ({ size, color, className, ...props }: IconProps) => (
  <svg width={size || defaultProps.size} height={size || defaultProps.size} viewBox="0 0 24 24" fill="none" stroke={color || defaultProps.color} className={className} {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const NeoActivity = ({ size, color, className, ...props }: IconProps) => (
  <svg width={size || defaultProps.size} height={size || defaultProps.size} viewBox="0 0 24 24" fill="none" stroke={color || defaultProps.color} className={className} {...defaultProps} {...props}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export const NeoCheckSquare = ({ size, color, className, ...props }: IconProps) => (
  <svg width={size || defaultProps.size} height={size || defaultProps.size} viewBox="0 0 24 24" fill="none" stroke={color || defaultProps.color} className={className} {...defaultProps} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const NeoRoller = ({ size, color, className, ...props }: IconProps) => (
  <svg width={size || defaultProps.size} height={size || defaultProps.size} viewBox="0 0 24 24" fill="none" stroke={color || defaultProps.color} className={className} {...defaultProps} {...props}>
    <rect x="2" y="4" width="16" height="6" rx="1" />
    <path d="M18 7h2v6h-4v7a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-7" />
  </svg>
);
