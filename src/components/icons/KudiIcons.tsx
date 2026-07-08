import React from 'react';

/**
 * Custom Kudi icon set.
 * Dashboard tab icons: viewBox 0 0 24 24, strokeWidth="2", round caps/joins.
 * Paths are designed to fill the full 24×24 viewBox edge-to-edge,
 * matching Lucide's optical sizing exactly.
 *
 * Public page icons: strokeWidth="1.5" for larger rendering.
 */

interface IconProps {
  className?: string;
  strokeWidth?: number;
}

// ─── DASHBOARD TAB ICONS ───────────────────────────────────────────────────

/** Themes tab — a paint palette with three color dots */
export const IconThemesTab: React.FC<IconProps> = ({ className, strokeWidth = 2 }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.63 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.49-9-10-9z" />
    <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="11" cy="7" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="9.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

/** Trust Score tab — a gem/diamond with inner facet lines */
export const IconTrustTab: React.FC<IconProps> = ({ className, strokeWidth = 2 }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 13L2 9z" />
    <path d="M2 9h20" />
    <path d="M12 22l-2-13" />
    <path d="M12 22l2-13" />
    <path d="M8 3l2 6" />
    <path d="M16 3l-2 6" />
  </svg>
);

/** Loans tab — a circle with ₦ Naira symbol (two horizontal bars + diagonal) */
export const IconLoansTab: React.FC<IconProps> = ({ className, strokeWidth = 2 }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 7v10" />
    <path d="M15 7v10" />
    <path d="M9 7l6 10" />
    <path d="M7.5 10.5h9" />
    <path d="M7.5 13.5h9" />
  </svg>
);

// ─── STOREFRONT PAGE ICONS ─────────────────────────────────────────────────

/** Hero — storefront awning with door */
export const IconStorefront: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7l1.5-4h15L21 7" />
    <path d="M3 7c0 1.66 1.34 3 3 3s3-1.34 3-3" />
    <path d="M9 7c0 1.66 1.34 3 3 3s3-1.34 3-3" />
    <path d="M15 7c0 1.66 1.34 3 3 3s3-1.34 3-3" />
    <path d="M4 10v10h16V10" />
    <path d="M9 20v-6h6v6" />
  </svg>
);

/** Feature — layout grid tiles */
export const IconLayouts: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="10" rx="2" />
    <rect x="13" y="3" width="8" height="6" rx="2" />
    <rect x="13" y="11" width="8" height="10" rx="2" />
    <rect x="3" y="15" width="8" height="6" rx="2" />
  </svg>
);

/** Feature — circular arrows with bolt for auto-sync */
export const IconAutoSync: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 1-15.36 6.36" />
    <path d="M3 12a9 9 0 0 1 15.36-6.36" />
    <polyline points="21 3 21 9 15 9" />
    <polyline points="3 21 3 15 9 15" />
    <path d="M13 8l-2 4h2l-2 4" />
  </svg>
);

// ─── TRUST SCORE PAGE ICONS ────────────────────────────────────────────────

/** Hero — gem with pulse line through the horizontal facet */
export const IconTrustScore: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 13L2 9z" />
    <path d="M2 9h7l1.5-2 1.5 3 1.5-2.5L15 9h7" />
    <path d="M8 3l2 6" />
    <path d="M16 3l-2 6" />
  </svg>
);

/** Feature — bar chart with upward trend arrow */
export const IconAutoGrowth: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20h18" />
    <rect x="5" y="13" width="3" height="7" rx="1" />
    <rect x="10.5" y="9" width="3" height="11" rx="1" />
    <rect x="16" y="5" width="3" height="15" rx="1" />
    <polyline points="5 8 10 4 16 6 21 2" />
    <polyline points="18 2 21 2 21 5" />
  </svg>
);

/** Feature — fingerprint with checkmark */
export const IconVerified: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 10c1.1 0 2 .9 2 2v3" />
    <path d="M7 13.5C7 10.74 9.24 8.5 12 8.5s5 2.24 5 5v1" />
    <path d="M5 14c0-3.87 3.13-7 7-7s7 3.13 7 7v0.5" />
    <path d="M10 12.5v2.5" />
    <path d="M14.5 18l1.5 1.5 3-3" />
  </svg>
);

// ─── LOANS PAGE ICONS ──────────────────────────────────────────────────────

/** Hero — stacked coins with upward arrow */
export const IconLoans: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="10" cy="17" rx="6" ry="2" />
    <path d="M4 17v-3c0 1.1 2.69 2 6 2s6-.9 6-2v3" />
    <ellipse cx="10" cy="14" rx="6" ry="2" />
    <path d="M4 14v-3c0 1.1 2.69 2 6 2s6-.9 6-2v3" />
    <ellipse cx="10" cy="11" rx="6" ry="2" />
    <path d="M19 11V6" />
    <polyline points="17 8 19 6 21 8" />
  </svg>
);

/** Feature — hand with coins */
export const IconDisburse: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 18c-2 0-4-1-4-3v-2l3-3h6l2 2" />
    <path d="M4 13h3" />
    <circle cx="16" cy="4" r="2" />
    <circle cx="20" cy="7" r="1.5" />
    <path d="M16 6v4" />
    <path d="M20 8.5v3" />
    <path d="M12 16h8c1 0 1.5-.5 1.5-1.5v-1" />
  </svg>
);

/** Feature — speedometer/gauge */
export const IconGauge: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5a9 9 0 1 1 15 0" />
    <path d="M12 12l3.5-3.5" />
    <circle cx="12" cy="12" r="1.5" />
    <path d="M12 5v1.5" />
    <path d="M6.34 7.34l1.06 1.06" />
    <path d="M17.66 7.34l-1.06 1.06" />
    <path d="M4.5 16.5h1.5" />
    <path d="M18 16.5h1.5" />
  </svg>
);
