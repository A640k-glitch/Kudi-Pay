# CODA — Design System
## Apple-inspired structure, spacing, and brand palette

This document governs the layout rhythm, color system, typography, and component specs of the application interface.

---

## 1. Principles (Apple HIG-inspired)

- **Clarity:** Legible typography, precise icons, and one clear primary action per screen.
- **Deference:** Clean, muted frames that make merchant products and financial data stand out.
- **Depth:** Structured layering using subtle border-lines or single-shade changes, avoiding heavy nested shadows.
- **Restraint:** One primary filled button per view; secondary actions use outlines or ghost states.

---

## 2. Spacing — 8pt grid

| Token | Value | Use |
|---|---|---|
| `space-1` | 4px | Icon-to-label gap |
| `space-2` | 8px | Label-to-input gap, tight items |
| `space-3` | 16px | Between elements in a group, layout margins |
| `space-4` | 24px | Card internal padding, block gap |
| `space-5` | 32px | Section spacing |
| `space-6` | 48px | Major layout breaks |
| `space-7` | 64px | Page header padding |

- **Margins:** 16px on mobile (viewport margin), 24px on tablet, 32px on desktop.
- **Touch targets:** Minimum 44x44px.

---

## 3. Structure & Component Specs

- **Radii scale**:
  - Buttons/Inputs: `8px` (`rounded-lg`)
  - Cards: `12px` (`rounded-xl`)
  - Modals/Sheets: `20px` (`rounded-3xl`)
  - Badges/Toggles: `999px` (`rounded-full`)
- **Elevation**: Use flat, fine borders (`0.5px border-gray-200`) by default. Apply shadow only to floating components like modals or dropdowns.
- **Progressive disclosure**: Keep main cards clean, showing detailed info behind taps.

---

## 4. Typography

- **UI Text Font**: Inter.
- **Display/Storefront Font**: Space Grotesk.
- **Scale (Mobile / Desktop)**:
  - Display: 32px / 40px (weight 600)
  - Title: 22px / 28px (weight 600)
  - Heading: 17px / 20px (weight 500)
  - Body: 15px / 16px (weight 400)
  - Caption: 13px (weight 400)
  - Micro: 11px (weight 500)

---

## 5. Color Scheme

| Role | Light mode | Dark mode | Use |
|---|---|---|---|
| Page Background | `#F5F5F4` | `#0A0A0A` | Canvas backdrop |
| Surface | `#FFFFFF` | `#151515` | Cards, sheets |
| Primary / Brand | `#312E81` (Indigo 900) | `#818CF8` | Primary button fill, active tabs |
| Primary Accent | `#6D28D9` (Indigo bright) | `#A78BFA` | Interactive hover states |
| Success / Growth | `#059669` (Emerald 600) | `#34D399` | Revenue, repayment, positive signals |
| Warning | `#D97706` | `#FBBF24` | Pending KYC, alerts |
| Danger | `#DC2626` | `#F87171` | Overdue loans, failures |
| Text Primary | `#18181B` | `#F4F4F5` | Main titles and labels |
| Text Secondary | `#52525B` | `#A1A1AA` | Supporting descriptions |
| Border | `#E4E4E7` | `#27272A` | Clean hairline strokes (0.5px) |
