/**
 * Trust Score Service
 * 
 * Pure computation engine. Takes bank transactions, orders, products,
 * loans, and business metadata as inputs. Outputs a TrustScoreBreakdown.
 * 
 * ZERO hardcoded scores. Every number is derived from real data.
 * 
 * Scoring model per Kudi_SPEC.md Section 5:
 *   Revenue Stability   — 25%
 *   Expense Tracking     — 20%
 *   Repayment History    — 20%
 *   Inventory Movement   — 15%
 *   Account Activity     — 10%
 *   Business Age         — 10%
 */

import type {
  BankTransaction,
  TrustScoreBreakdown,
  FactorScore,
  FactorStatus,
  ScoreTier,
  ScoreSnapshot,
  LoanEligibility,
  LoanTier,
  ActiveLoan,
  Product,
  CACVerification,
} from '../types';

// ── Constants ───────────────────────────────────────────────
const SCORE_MIN = 0;
const SCORE_MAX = 1000;
const MIN_DATA_WEEKS = 4; // Minimum weeks before score is computed
const MAX_DAILY_POSITIVE_DELTA = 15;
const MAX_DAILY_NEGATIVE_DELTA = -50;
const INACTIVITY_DECAY_PER_WEEK = 2;
const SCORE_SNAPSHOTS_KEY = 'kudi_score_snapshots';
const SCORE_CACHE_KEY = 'kudi_score_cache';

// ── Loan Tiers (from PRD Section 6) ────────────────────────
export const LOAN_TIERS: LoanTier[] = [
  { id: 't1', name: 'Micro Starter', amountText: '₦10,000–₦20,000', amountMax: 20000, term: '7 days', termDays: 7, interest: 3, requiredScore: 300 },
  { id: 't2', name: 'Inventory Booster', amountText: '₦50,000', amountMax: 50000, term: '14 days', termDays: 14, interest: 5, requiredScore: 500 },
  { id: 't3', name: 'Growth Catalyst', amountText: '₦100,000', amountMax: 100000, term: '30 days', termDays: 30, interest: 8, requiredScore: 700 },
  { id: 't4', name: 'Expansion Scale', amountText: '₦250,000', amountMax: 250000, term: '60 days', termDays: 60, interest: 10, requiredScore: 800 },
  { id: 't5', name: 'Custom Partner', amountText: '₦500,000+', amountMax: 500000, term: 'Negotiated', termDays: 90, interest: 12, requiredScore: 900 },
];

// ── Helpers ─────────────────────────────────────────────────
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getFactorStatus(score: number): FactorStatus {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'New';
}

function getScoreTier(score: number): ScoreTier {
  if (score >= 800) return 'Excellent';
  if (score >= 600) return 'Very Good';
  if (score >= 400) return 'Good';
  if (score >= 200) return 'Fair';
  return 'Poor';
}

function getWeekNumber(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

function getDayKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ── Factor Computation Functions ────────────────────────────

/**
 * Factor 1: Revenue Stability (25%)
 * Measures consistency of weekly revenue via Coefficient of Variation.
 * Lower CV = more stable = higher score.
 */
function computeRevenueStability(transactions: BankTransaction[]): { rawScore: number; description: string } {
  // Get credits from last 12 weeks
  const now = Date.now();
  const twelveWeeksAgo = now - 12 * 7 * 24 * 60 * 60 * 1000;

  const recentCredits = transactions.filter(
    t => t.type === 'credit' && new Date(t.date).getTime() >= twelveWeeksAgo
  );

  if (recentCredits.length < 3) {
    return { rawScore: 5, description: 'Insufficient revenue data. Keep receiving payments.' };
  }

  // Group by week
  const weeklyRevenue: Record<string, number> = {};
  recentCredits.forEach(t => {
    const week = getWeekNumber(new Date(t.date));
    weeklyRevenue[week] = (weeklyRevenue[week] || 0) + t.amount;
  });

  const weeks = Object.values(weeklyRevenue);
  if (weeks.length < 2) {
    return { rawScore: 10, description: 'Need at least 2 weeks of revenue data.' };
  }

  // Coefficient of Variation = stdDev / mean
  const mean = weeks.reduce((a, b) => a + b, 0) / weeks.length;
  if (mean === 0) return { rawScore: 5, description: 'No revenue recorded.' };

  const variance = weeks.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / weeks.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  // Score: CV of 0 = 100, CV of 1.5+ = 10
  // Lower CV is better (more consistent)
  const rawScore = Math.round(clamp(100 - (cv * 60), 10, 100));

  const avgWeekly = Math.round(mean);
  const weekCount = weeks.length;
  const description = cv < 0.3
    ? `Very consistent revenue. Avg ₦${avgWeekly.toLocaleString()}/week over ${weekCount} weeks.`
    : cv < 0.6
    ? `Moderately stable revenue. Some weekly variation. Avg ₦${avgWeekly.toLocaleString()}/week.`
    : `Revenue is inconsistent. Aim for regular weekly income to improve this score.`;

  return { rawScore, description };
}

/**
 * Factor 2: Expense Tracking (20%)
 * Measures bookkeeping discipline via ratio of weeks with categorized expenses.
 */
function computeExpenseTracking(transactions: BankTransaction[]): { rawScore: number; description: string } {
  const now = Date.now();
  const twelveWeeksAgo = now - 12 * 7 * 24 * 60 * 60 * 1000;

  const recentDebits = transactions.filter(
    t => t.type === 'debit' && new Date(t.date).getTime() >= twelveWeeksAgo
  );

  // Determine active weeks (any transaction)
  const allRecent = transactions.filter(t => new Date(t.date).getTime() >= twelveWeeksAgo);
  const activeWeeks = new Set(allRecent.map(t => getWeekNumber(new Date(t.date))));
  const totalActiveWeeks = activeWeeks.size;

  if (totalActiveWeeks < 2) {
    return { rawScore: 10, description: 'Need more weeks of activity to assess expense tracking.' };
  }

  // Weeks with at least 1 expense
  const expenseWeeks = new Set(recentDebits.map(t => getWeekNumber(new Date(t.date))));
  const weeksWithExpenses = expenseWeeks.size;

  // Ratio of weeks with expense tracking vs active weeks
  const ratio = weeksWithExpenses / totalActiveWeeks;
  const rawScore = Math.round(clamp(ratio * 100, 5, 100));

  const description = ratio >= 0.8
    ? `Strong bookkeeping. Expenses tracked in ${weeksWithExpenses} of ${totalActiveWeeks} active weeks.`
    : ratio >= 0.5
    ? `Moderate tracking. ${weeksWithExpenses} of ${totalActiveWeeks} weeks have expense records.`
    : `Weak expense tracking. Record business expenses regularly to improve this score.`;

  return { rawScore, description };
}

/**
 * Factor 3: Repayment History (20%)
 * No loans = neutral 50. Perfect repayment = 100. Late = heavy penalty.
 */
function computeRepaymentHistory(
  loans: ActiveLoan[]
): { rawScore: number; description: string } {
  if (loans.length === 0) {
    return { rawScore: 50, description: 'No loan history yet. Take and repay a loan on time to build this score.' };
  }

  const repaid = loans.filter(l => l.status === 'repaid');
  const overdue = loans.filter(l => l.status === 'overdue');
  const active = loans.filter(l => l.status === 'active');

  // Check if any active loans are past due
  const now = Date.now();
  const activePastDue = active.filter(l => new Date(l.dueAt).getTime() < now);

  const totalCompleted = repaid.length + overdue.length;
  const onTimeRatio = totalCompleted > 0 ? repaid.length / totalCompleted : 1;

  // Base score from on-time ratio
  let rawScore = Math.round(onTimeRatio * 100);

  // Heavy penalty for current overdue loans
  rawScore -= activePastDue.length * 30;
  rawScore -= overdue.length * 15;

  // Bonus for multiple successful repayments
  if (repaid.length >= 3) rawScore = Math.min(100, rawScore + 10);

  rawScore = clamp(rawScore, 0, 100);

  const description = rawScore >= 80
    ? `Excellent repayment record. ${repaid.length} loan(s) repaid on time.`
    : rawScore >= 50
    ? `Decent repayment history. Ensure timely repayments to improve.`
    : activePastDue.length > 0
    ? `Overdue loan detected. Repay immediately to prevent further score damage.`
    : `Repayment history needs improvement. Late payments heavily impact your score.`;

  return { rawScore, description };
}

/**
 * Factor 4: Inventory Movement (15%)
 * Ratio of products with recent order-driven stock changes.
 */
function computeInventoryMovement(
  products: Product[],
  transactions: BankTransaction[]
): { rawScore: number; description: string } {
  if (products.length === 0) {
    return { rawScore: 20, description: 'No products listed. Add inventory to build this score.' };
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  // Count products that are available and have activity indicators
  const activeProducts = products.filter(p => p.isAvailable);
  const totalProducts = products.length;

  // Use bank credits as proxy for sales movement (since sales = bank credits)
  const recentCredits = transactions.filter(
    t => t.type === 'credit' && new Date(t.date).getTime() >= thirtyDaysAgo
  );

  // If there are recent credits relative to product count, inventory is "moving"
  // Heuristic: at least 2 transactions per product per month = full score
  const expectedTxCount = totalProducts * 2;
  const ratio = Math.min(1, recentCredits.length / Math.max(1, expectedTxCount));

  // Also factor in product availability ratio
  const availabilityRatio = activeProducts.length / totalProducts;
  const combinedScore = (ratio * 0.7 + availabilityRatio * 0.3);

  const rawScore = Math.round(clamp(combinedScore * 100, 5, 100));

  const description = rawScore >= 70
    ? `Healthy inventory movement. ${recentCredits.length} sales against ${totalProducts} products.`
    : rawScore >= 40
    ? `Moderate movement. Consider promotions or expanding product range.`
    : `Low inventory activity. Products may need better visibility or pricing.`;

  return { rawScore, description };
}

/**
 * Factor 5: Account Activity (10%)
 * Distinct days with any bank transaction in last 30 days.
 */
function computeAccountActivity(transactions: BankTransaction[]): { rawScore: number; description: string } {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const recentTxDays = new Set(
    transactions
      .filter(t => new Date(t.date).getTime() >= thirtyDaysAgo)
      .map(t => getDayKey(new Date(t.date)))
  );

  const activeDays = recentTxDays.size;
  // Max score at 25 active days (roughly daily business activity)
  const ratio = Math.min(1, activeDays / 25);
  const rawScore = Math.round(clamp(ratio * 100, 0, 100));

  const description = activeDays >= 20
    ? `Very active account. Transactions on ${activeDays} of last 30 days.`
    : activeDays >= 10
    ? `Moderately active. ${activeDays} active days in the last month.`
    : activeDays >= 1
    ? `Low activity. Only ${activeDays} active days. Consistent daily usage improves this score.`
    : `No recent activity. Use your account regularly to maintain this score.`;

  return { rawScore, description };
}

/**
 * Factor 6: Business Age (10%)
 * Days since CAC registration (or business creation), linear to 365 days max.
 */
function computeBusinessAge(
  businessCreatedAt: string,
  cacVerification?: CACVerification
): { rawScore: number; description: string } {
  // Use CAC registration date if available (more authoritative)
  const referenceDate = cacVerification?.registrationDate || businessCreatedAt;
  const created = new Date(referenceDate).getTime();
  const ageDays = Math.max(0, Math.floor((Date.now() - created) / (24 * 60 * 60 * 1000)));

  // Linear scale: 0 days = 0, 365 days = 100
  const rawScore = Math.round(clamp((ageDays / 365) * 100, 0, 100));

  const months = Math.floor(ageDays / 30);
  const source = cacVerification ? 'CAC registration' : 'account creation';

  const description = ageDays >= 365
    ? `Established business. Over ${months} months since ${source}.`
    : ageDays >= 180
    ? `Growing business. ${months} months since ${source}.`
    : ageDays >= 30
    ? `New business. ${months} month(s) since ${source}. Time builds this score naturally.`
    : `Very new business. Less than 1 month since ${source}.`;

  return { rawScore, description };
}

// ── Main Score Computation ──────────────────────────────────
export const trustScoreService = {
  /**
   * Compute the full trust score breakdown from real data.
   * This is the single source of truth for all scoring.
   */
  computeScore(params: {
    businessId: string;
    businessCreatedAt: string;
    cacVerification?: CACVerification;
    transactions: BankTransaction[];
    products: Product[];
    loans: ActiveLoan[];
  }): TrustScoreBreakdown {
    const { businessId, businessCreatedAt, cacVerification, transactions, products, loans } = params;

    // Determine data availability
    const allDates = transactions.map(t => new Date(t.date).getTime());
    const oldestTx = allDates.length > 0 ? Math.min(...allDates) : Date.now();
    const dataWeeks = Math.floor((Date.now() - oldestTx) / (7 * 24 * 60 * 60 * 1000));
    const isBuilding = dataWeeks < MIN_DATA_WEEKS && transactions.length < 10;

    // Compute each factor
    const revenueStability = computeRevenueStability(transactions);
    const expenseTracking = computeExpenseTracking(transactions);
    const repaymentHistory = computeRepaymentHistory(loans);
    const inventoryMovement = computeInventoryMovement(products, transactions);
    const accountActivity = computeAccountActivity(transactions);
    const businessAge = computeBusinessAge(businessCreatedAt, cacVerification);

    // Build factor scores
    const factors: FactorScore[] = [
      {
        key: 'revenue_stability',
        label: 'Revenue Stability',
        weight: 0.25,
        rawScore: revenueStability.rawScore,
        weightedScore: Math.round(revenueStability.rawScore * 0.25 * 10),
        status: isBuilding ? 'Building' : getFactorStatus(revenueStability.rawScore),
        description: revenueStability.description,
      },
      {
        key: 'expense_tracking',
        label: 'Expense Tracking',
        weight: 0.20,
        rawScore: expenseTracking.rawScore,
        weightedScore: Math.round(expenseTracking.rawScore * 0.20 * 10),
        status: isBuilding ? 'Building' : getFactorStatus(expenseTracking.rawScore),
        description: expenseTracking.description,
      },
      {
        key: 'repayment_history',
        label: 'Repayment History',
        weight: 0.20,
        rawScore: repaymentHistory.rawScore,
        weightedScore: Math.round(repaymentHistory.rawScore * 0.20 * 10),
        status: getFactorStatus(repaymentHistory.rawScore),
        description: repaymentHistory.description,
      },
      {
        key: 'inventory_movement',
        label: 'Inventory Movement',
        weight: 0.15,
        rawScore: inventoryMovement.rawScore,
        weightedScore: Math.round(inventoryMovement.rawScore * 0.15 * 10),
        status: isBuilding ? 'Building' : getFactorStatus(inventoryMovement.rawScore),
        description: inventoryMovement.description,
      },
      {
        key: 'account_activity',
        label: 'Account Activity',
        weight: 0.10,
        rawScore: accountActivity.rawScore,
        weightedScore: Math.round(accountActivity.rawScore * 0.10 * 10),
        status: isBuilding ? 'Building' : getFactorStatus(accountActivity.rawScore),
        description: accountActivity.description,
      },
      {
        key: 'business_age',
        label: 'Business Age',
        weight: 0.10,
        rawScore: businessAge.rawScore,
        weightedScore: Math.round(businessAge.rawScore * 0.10 * 10),
        status: getFactorStatus(businessAge.rawScore),
        description: businessAge.description,
      },
    ];

    // Sum weighted scores
    let rawTotal = factors.reduce((sum, f) => sum + f.weightedScore, 0);
    rawTotal = clamp(rawTotal, SCORE_MIN, SCORE_MAX);

    // Apply daily movement cap
    const previousSnapshot = this.getLatestSnapshot(businessId);
    const previousScore = previousSnapshot?.score ?? 0;
    let dailyDelta = rawTotal - previousScore;

    if (dailyDelta > MAX_DAILY_POSITIVE_DELTA) {
      dailyDelta = MAX_DAILY_POSITIVE_DELTA;
    } else if (dailyDelta < MAX_DAILY_NEGATIVE_DELTA) {
      dailyDelta = MAX_DAILY_NEGATIVE_DELTA;
    }

    // Apply inactivity decay
    const lastActivity = transactions
      .filter(t => t.type === 'credit')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (lastActivity) {
      const daysSinceActivity = Math.floor(
        (Date.now() - new Date(lastActivity.date).getTime()) / (24 * 60 * 60 * 1000)
      );
      const inactiveWeeks = Math.floor(daysSinceActivity / 7);
      if (inactiveWeeks > 0) {
        dailyDelta -= inactiveWeeks * INACTIVITY_DECAY_PER_WEEK;
      }
    }

    const totalScore = clamp(
      previousScore + dailyDelta,
      SCORE_MIN,
      SCORE_MAX
    );

    // If this is the very first computation (no previous snapshot), use raw total
    const finalScore = previousSnapshot ? totalScore : rawTotal;

    // Save today's snapshot
    this.saveSnapshot(businessId, finalScore);

    // Compute verified transaction stats
    const credits = transactions.filter(t => t.type === 'credit');

    // Compute loan eligibility
    const loanEligibility: LoanEligibility[] = LOAN_TIERS.map(tier => ({
      tierId: tier.id,
      tierName: tier.name,
      requiredScore: tier.requiredScore,
      eligible: finalScore >= tier.requiredScore,
      currentScore: finalScore,
      gap: Math.max(0, tier.requiredScore - finalScore),
    }));

    return {
      totalScore: Math.round(finalScore),
      previousScore: Math.round(previousScore),
      dailyDelta: Math.round(dailyDelta),
      tier: getScoreTier(finalScore),
      factors,
      lastComputed: new Date().toISOString(),
      dataWeeks,
      isBuilding,
      verifiedTransactionCount: credits.length,
      totalTransactionCount: transactions.length,
      loanEligibility,
    };
  },

  // ── Score Snapshot Persistence ───────────────────────────

  /**
   * Save a daily score snapshot. Only one snapshot per day.
   */
  saveSnapshot(businessId: string, score: number): void {
    const today = getDayKey(new Date());
    const snapshots = this.getSnapshots(businessId);

    // Update or add today's snapshot
    const existing = snapshots.findIndex(s => s.date === today);
    const snapshot: ScoreSnapshot = {
      date: today,
      score: Math.round(score),
      tier: getScoreTier(score),
    };

    if (existing >= 0) {
      snapshots[existing] = snapshot;
    } else {
      snapshots.push(snapshot);
    }

    // Keep last 365 days only
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 365);
    const cutoffStr = getDayKey(cutoff);
    const trimmed = snapshots.filter(s => s.date >= cutoffStr);

    localStorage.setItem(`${SCORE_SNAPSHOTS_KEY}_${businessId}`, JSON.stringify(trimmed));
  },

  /**
   * Get all score snapshots for a business.
   */
  getSnapshots(businessId: string): ScoreSnapshot[] {
    if (typeof window === 'undefined') return [];
    const str = localStorage.getItem(`${SCORE_SNAPSHOTS_KEY}_${businessId}`);
    return str ? JSON.parse(str) : [];
  },

  /**
   * Get the latest snapshot (yesterday's or today's earlier computation).
   */
  getLatestSnapshot(businessId: string): ScoreSnapshot | null {
    const snapshots = this.getSnapshots(businessId);
    if (snapshots.length === 0) return null;
    return snapshots.sort((a, b) => b.date.localeCompare(a.date))[0];
  },

  /**
   * Get score history for chart display.
   * Returns snapshots from the last N days, filling gaps with previous values.
   */
  getScoreHistory(businessId: string, days: number = 90): ScoreSnapshot[] {
    const snapshots = this.getSnapshots(businessId);
    if (snapshots.length === 0) return [];

    // Create a filled array with all dates
    const result: ScoreSnapshot[] = [];
    const now = new Date();
    let lastKnownScore = 0;
    let lastKnownTier: ScoreTier = 'Poor';

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = getDayKey(d);

      const snapshot = snapshots.find(s => s.date === dayStr);
      if (snapshot) {
        lastKnownScore = snapshot.score;
        lastKnownTier = snapshot.tier;
        result.push(snapshot);
      } else if (lastKnownScore > 0) {
        // Fill gap with last known score
        result.push({ date: dayStr, score: lastKnownScore, tier: lastKnownTier });
      }
    }

    return result;
  },

  /**
   * Get the LOAN_TIERS constant for UI usage.
   */
  getLoanTiers(): LoanTier[] {
    return LOAN_TIERS;
  },

  /**
   * Get all loans for a business (from localStorage).
   */
  getLoans(businessId: string): ActiveLoan[] {
    if (typeof window === 'undefined') return [];
    const str = localStorage.getItem(`kudi_loans_${businessId}`);
    return str ? JSON.parse(str) : [];
  },

  /**
   * Save a loan record.
   */
  saveLoan(loan: ActiveLoan): void {
    const loans = this.getLoans(loan.businessId);
    const existing = loans.findIndex(l => l.id === loan.id);
    if (existing >= 0) {
      loans[existing] = loan;
    } else {
      loans.push(loan);
    }
    localStorage.setItem(`kudi_loans_${loan.businessId}`, JSON.stringify(loans));
  },

  /**
   * Get the active (non-repaid) loan for a business.
   */
  getActiveLoan(businessId: string): ActiveLoan | null {
    const loans = this.getLoans(businessId);
    return loans.find(l => l.status === 'active' || l.status === 'overdue') || null;
  },
};
