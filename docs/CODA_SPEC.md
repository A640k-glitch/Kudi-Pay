# CODA — Embedded-Finance Commerce OS
## Master build spec

This file merges the three CODA PRDs (marketplace pivot doc, OS deep-dive, and Business OS PRD) into one buildable spec, reconciled against a React/TypeScript/Vite stack.

---

## 1. Product decision (what changed, and why)

You are pivoting from "ERP first" to **marketplace-first**.
- **Lead with the storefront, not the ledger.** A user registers a business and gets a public marketplace page before anything financial exists.
- **Bookkeeping must be invisible.** Every ledger entry is a side effect of an action the merchant already wanted to take (a sale, an invoice, a receipt photo) — never a form the merchant fills out because "the app needs it."
- **Verification is tiered and progressive**, not a signup gate. The level model (0–3) is adopted (Section 3 below).
- **The trust score and reward engine are the retention mechanism.** The weighted scoring model (Section 5) and reward table feed the "Capital Readiness" gauge.
- **Low-bandwidth channels (WhatsApp, USSD, SMS) are first-class interfaces**, represented as interactive simulations.

---

## 2. Tech Stack (React prototype)

- **Frontend**: Vite + React + TypeScript + Tailwind CSS v4.
- **Data storage**: LocalStorage based simulated services (`authService`, `businessService`, `productService`, `orderService`).
- **OCR Engine**: Simulated Claude Multimodal OCR processing receipts into ledger entries.
- **Assistant**: AI Q&A assistant for merchant analytics.

---

## 3. Verification Tiers

| Level | Requirement | Unlocks | Daily limit |
|---|---|---|---|
| 0 — Anonymous | Phone number + OTP | Browse marketplace, create business, upload products, log manual cash sales | ₦0, no banking |
| 1 — Phone verified | (same as 0, this is the default post-signup state) | Sales recording, inventory, marketplace visibility | ₦0, no banking |
| 2 — Identity verified | BVN or NIN + selfie liveness check | Virtual account, payment collection, trust score activation | ₦30,000/day |
| 3 — Business verified | CAC registration + tax info + address verification | Loan marketplace, higher limits, advanced analytics | ₦500,000/day |

---

## 4. Data Model Schema (Mocked in LocalStorage)

- **users**: id, phone, password_hash, created_at
- **businesses**: id, owner_id, name, category, state, city, description, slug, verification_level (0-3), trust_score (0-1000)
- **products**: id, business_id, name, price, stock, description, image_url, category, isAvailable
- **sales**: id, business_id, customer_name, customer_phone, amount, channel, status ('new'|'paid'|'fulfilled'|'cancelled'), created_at
- **ledger_entries**: id, business_id, type ('revenue'|'expense'), amount, source ('sale'|'receipt_ocr'|'manual'), metadata, created_at

---

## 5. Trust Score (Weighted 0–1000)

- Revenue stability — 25%
- Expense tracking consistency — 20%
- Repayment history — 20%
- Inventory movement — 15%
- Account activity — 10%
- Business age — 10%

Reward point actions feeding Capital Readiness:
- Record sale: +5
- Upload receipt: +10
- Create invoice: +5
- Monthly reconciliation: +50
- Loan repayment: +100

---

## 6. Progressive Lending Tiers

- Tier 1: ₦10,000–₦20,000 (7 days)
- Tier 2: ₦50,000 (14 days)
- Tier 3: ₦100,000 (30 days)
- Tier 4: ₦250,000 (60 days)
- Tier 5: ₦500,000+ (negotiated)

Eligibility: Tier 1 requires Verification Level 2 and a Trust Score of 300+.

---

## 7. Screens to build
1. **Level 0 Onboarding**: Phone and password signup.
2. **Create Business**: Profile form generating storefront slug.
3. **Public Storefront**: `/store/[slug]` layout for customers.
4. **Product Management**: Merchant upload flow.
5. **Dashboard Overview**: Gauge, metrics (Revenue, Trust Score), quick actions (Get paid, Scan receipt, Inventory).
6. **WhatsApp Bot Simulator**: Interactive messaging UI simulating ledger Q&A and sale commands.
7. **Trust Score detail page**: Breakdown charts.
8. **Loans Marketplace**: Apply, disburse, and repay loans.
