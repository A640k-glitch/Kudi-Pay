// ── Theme & UI ──────────────────────────────────────────────
export interface ThemeConfig {
  primaryColor?: string;
  heroImageUrl?: string;
  ctaText?: string;
}

// ── Verification & Compliance ───────────────────────────────
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';
export type VerificationSource = 'bank_api' | 'order_payment' | 'receipt_ocr' | 'manual_unverified';
export type KYCTier = 0 | 1 | 2 | 3;

// ── Business ────────────────────────────────────────────────
export interface Business {
  id: string;
  ownerPhone: string;
  businessName: string;
  category: string;
  state: string;
  lga: string;
  logoUrl?: string;
  storefrontSlug: string;
  theme: 'brutal' | 'modern';
  themeConfig?: ThemeConfig;
  createdAt: string;
  kycTier: KYCTier;
  // Bank & verification fields (Phase 1+)
  linkedBankAccountId?: string;
  cacVerification?: CACVerification;
  tinNumber?: string;
  bankConsentGrantedAt?: string;
}

// ── CAC Verification ────────────────────────────────────────
export interface CACVerification {
  rcNumber: string;
  companyName: string;
  registrationDate: string;
  companyType: string;  // 'RC' | 'BN' | 'IT'
  status: 'active' | 'inactive' | 'unknown';
  verifiedAt: string;
}

// ── Bank Account ────────────────────────────────────────────
export interface BankAccount {
  id: string;
  businessId: string;
  institution: string;       // e.g. "GTBank", "Access Bank"
  institutionCode: string;   // Bank code
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
  lastSyncedAt: string;
  linkedAt: string;
  isActive: boolean;
  // Mono-specific (populated in production)
  monoAccountId?: string;
  // Paystack DVA (dedicated virtual account)
  paystackDVA?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

// ── Bank Transaction ────────────────────────────────────────
export interface BankTransaction {
  id: string;
  bankAccountId: string;
  type: 'credit' | 'debit';
  amount: number;
  narration: string;
  date: string;
  balance: number;
  category?: string;
  // Matching to internal records
  matchedLedgerEntryId?: string;
  matchedOrderId?: string;
}

// ── Products ────────────────────────────────────────────────
export interface Product {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stockCount?: number;
  isAvailable: boolean;
  category?: string;
  attributes?: Record<string, string>;
  createdAt: string;
}

// ── Orders ──────────────────────────────────────────────────
export interface Order {
  id: string;
  businessId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'new' | 'paid' | 'fulfilled' | 'cancelled';
  paymentMethod: 'card' | 'bank_transfer' | 'ussd';
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

// ── Ledger ──────────────────────────────────────────────────
export interface LedgerEntry {
  id: string;
  businessId: string;
  type: 'revenue' | 'expense';
  amount: number;
  source: 'bank_credit' | 'bank_debit' | 'receipt_ocr' | 'loan_disbursement' | 'loan_repayment' | 'order_payment';
  verificationStatus: VerificationStatus;
  verificationSource: VerificationSource;
  bankTransactionId?: string;
  verifiedAt?: string;
  metadata: {
    description?: string;
    vendor?: string;
    category?: string;
    narration?: string;
    itemsCount?: number;
    [key: string]: any;
  };
  createdAt: string;
}

// ── Trust Score ─────────────────────────────────────────────
export type ScoreTier = 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent';
export type FactorStatus = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'New' | 'Building';

export interface FactorScore {
  key: string;
  label: string;
  weight: number;       // 0.10 to 0.25
  rawScore: number;     // 0-100
  weightedScore: number; // rawScore × weight × 10 (contributes to 0-1000 total)
  status: FactorStatus;
  description: string;
}

export interface TrustScoreBreakdown {
  totalScore: number;             // 0-1000
  previousScore: number;          // Yesterday's score
  dailyDelta: number;             // Today's change
  tier: ScoreTier;
  factors: FactorScore[];
  lastComputed: string;
  dataWeeks: number;              // Weeks of bank data available
  isBuilding: boolean;            // True if < 4 weeks of data
  verifiedTransactionCount: number;
  totalTransactionCount: number;
  loanEligibility: LoanEligibility[];
}

export interface LoanEligibility {
  tierId: string;
  tierName: string;
  requiredScore: number;
  eligible: boolean;
  currentScore: number;
  gap: number;                    // Points needed to unlock (0 if eligible)
}

export interface ScoreSnapshot {
  date: string;                   // ISO date string (YYYY-MM-DD)
  score: number;
  tier: ScoreTier;
}

// ── Loan ────────────────────────────────────────────────────
export interface ActiveLoan {
  id: string;
  businessId: string;
  tierId: string;
  tierName: string;
  amount: number;
  interestRate: number;
  repaymentAmount: number;
  disbursedAt: string;
  dueAt: string;
  status: 'active' | 'repaid' | 'overdue';
  repaidAt?: string;
}

export interface LoanTier {
  id: string;
  name: string;
  amountText: string;
  amountMax: number;
  term: string;
  termDays: number;
  interest: number;
  requiredScore: number;
}

// ── Consent ─────────────────────────────────────────────────
export interface ConsentRecord {
  type: 'bank_linking' | 'data_sharing' | 'identity_verification';
  grantedAt: string;
  ipAddress?: string;
  scope: string;
  revoked: boolean;
  revokedAt?: string;
}
