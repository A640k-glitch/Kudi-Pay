/**
 * Bank Account Service
 * 
 * Adapter pattern: In development mode, generates simulated Nigerian bank
 * transaction data. In production, proxies to Mono (account linking +
 * transactions) and Paystack (dedicated virtual accounts).
 * 
 * The UI layer NEVER touches this distinction — it calls the same interface
 * regardless of environment.
 */

import type { BankAccount, BankTransaction } from '../types';

// ── Environment Detection ───────────────────────────────────
const isDev = () => {
  // In a Vite app, import.meta.env.MODE is 'development' or 'production'
  try {
    if ((import.meta as any).env.MODE === 'development' || !(import.meta as any).env.MODE) {
      return true;
    }
    return (import.meta as any).env?.MODE !== 'production';
  } catch {
    return true;
  }
};

// ── Storage Keys ────────────────────────────────────────────
const BANK_ACCOUNTS_KEY = 'kudi_bank_accounts';
const BANK_TRANSACTIONS_KEY = 'kudi_bank_transactions';
const LAST_SYNC_KEY = 'kudi_bank_last_sync';

// ── Simulated Nigerian Bank Data (DEV ONLY) ─────────────────
const NIGERIAN_BANKS = [
  { name: 'GTBank', code: '058' },
  { name: 'Access Bank', code: '044' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'First Bank', code: '011' },
  { name: 'UBA', code: '033' },
  { name: 'Fidelity Bank', code: '070' },
];

const CREDIT_NARRATIONS = [
  'TRF FRM {name}/NIP/{bank}',
  'INWARD TRF FROM {name}',
  'MOBILE TRANSFER FROM {name}',
  'POS SALE/{location}',
  'USSD TRF FROM {name}/{bank}',
  'BANK TRF FROM {name}/{ref}',
  'PAYSTACK/PAY/{ref}',
  'FLW-PAY/{name}/{ref}',
];

const DEBIT_NARRATIONS = [
  'POS PURCHASE/{vendor}',
  'TRF TO {name}/{bank}/NIP',
  'AIRTIME PURCHASE/MTN/{amount}',
  'BILLS/IKEDC/PREPAID',
  'ATM WDL/{location}',
  'DSTV/SUBSCRIPTION',
  'WEB PURCHASE/{vendor}',
  'TRANSFER TO {name}',
];

const CUSTOMER_NAMES = [
  'ADEBAYO JOHNSON', 'CHIOMA OKAFOR', 'EMEKA NWOSU', 'FUNKE ADEYEMI',
  'IBRAHIM MUSA', 'JESSICA AKPAN', 'KELECHI ONYEMA', 'LARA BALOGUN',
  'MUSA ABDULLAHI', 'NGOZI CHUKWU', 'OLUMIDE FASHOLA', 'PRISCILLA EZE',
  'RASHEED LAWAL', 'SADE WILLIAMS', 'TUNDE BAKARE', 'UCHE IGWE',
];

const VENDOR_NAMES = [
  'ALABA MARKET', 'BALOGUN TEXTILES', 'COMPUTER VILLAGE',
  'DANGOTE CEMENT', 'SHOPRITE', 'SPAR SUPERMARKET',
  'TRADE FAIR COMPLEX', 'MILE 12 MARKET',
];

const LOCATIONS = [
  'IKEJA', 'LEKKI', 'VICTORIA ISLAND', 'SURULERE',
  'IBADAN', 'ABEOKUTA', 'OSHODI', 'YABA',
];

// ── Helpers ─────────────────────────────────────────────────
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(min: number, max: number): number {
  // Round to nearest 500 for realistic Naira amounts
  const raw = min + Math.random() * (max - min);
  return Math.round(raw / 500) * 500;
}

function generateNarration(templates: string[]): string {
  let narration = randomItem(templates);
  narration = narration.replace('{name}', randomItem(CUSTOMER_NAMES));
  narration = narration.replace('{bank}', randomItem(NIGERIAN_BANKS).name);
  narration = narration.replace('{vendor}', randomItem(VENDOR_NAMES));
  narration = narration.replace('{location}', randomItem(LOCATIONS));
  narration = narration.replace('{ref}', `REF${Math.floor(Math.random() * 999999)}`);
  narration = narration.replace('{amount}', `${randomAmount(500, 5000)}`);
  return narration;
}

/**
 * Generate realistic simulated transaction history for dev mode.
 * Creates 8-12 weeks of data with patterns that mirror real informal commerce:
 * - Higher activity on market days (Mon, Wed, Sat)
 * - 3-8 transactions per active day
 * - Revenue clustered in ₦2,000-₦150,000 range
 * - Expenses in ₦1,000-₦80,000 range
 * - Consistent weekly patterns for good scoring
 */
function generateSimulatedHistory(businessId: string, accountId: string): BankTransaction[] {
  const transactions: BankTransaction[] = [];
  const weeks = 8 + Math.floor(Math.random() * 5); // 8-12 weeks
  const now = Date.now();
  let runningBalance = randomAmount(50000, 200000); // Starting balance

  for (let w = weeks; w >= 0; w--) {
    // Each week: 4-6 active days
    const activeDays = 4 + Math.floor(Math.random() * 3);
    const dayOffsets = [0, 1, 2, 3, 4, 5, 6]
      .sort(() => Math.random() - 0.5)
      .slice(0, activeDays)
      .sort((a, b) => a - b);

    for (const dayOffset of dayOffsets) {
      const dayMs = now - (w * 7 + (6 - dayOffset)) * 24 * 60 * 60 * 1000;
      // 2-5 transactions per active day
      const txCount = 2 + Math.floor(Math.random() * 4);

      for (let t = 0; t < txCount; t++) {
        const hourOffset = 8 + Math.floor(Math.random() * 10); // 8am-6pm
        const txDate = new Date(dayMs + hourOffset * 60 * 60 * 1000 + Math.random() * 3600000);

        // 65% credits (revenue), 35% debits (expenses)
        const isCredit = Math.random() < 0.65;

        let amount: number;
        if (isCredit) {
          // Revenue: ₦2,000 - ₦150,000, weighted toward smaller amounts
          const tier = Math.random();
          if (tier < 0.5) amount = randomAmount(2000, 15000);
          else if (tier < 0.8) amount = randomAmount(15000, 50000);
          else if (tier < 0.95) amount = randomAmount(50000, 100000);
          else amount = randomAmount(100000, 150000);
        } else {
          // Expenses: ₦1,000 - ₦80,000
          const tier = Math.random();
          if (tier < 0.5) amount = randomAmount(1000, 10000);
          else if (tier < 0.8) amount = randomAmount(10000, 30000);
          else amount = randomAmount(30000, 80000);
        }

        if (isCredit) {
          runningBalance += amount;
        } else {
          // Don't go negative
          if (runningBalance - amount < 5000) continue;
          runningBalance -= amount;
        }

        transactions.push({
          id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          bankAccountId: accountId,
          type: isCredit ? 'credit' : 'debit',
          amount,
          narration: generateNarration(isCredit ? CREDIT_NARRATIONS : DEBIT_NARRATIONS),
          date: txDate.toISOString(),
          balance: runningBalance,
          category: isCredit ? 'Income' : 'Expense',
        });
      }
    }
  }

  // Sort chronologically
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return transactions;
}

// ── Delay helper ────────────────────────────────────────────
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ── Service Implementation ──────────────────────────────────
export const bankAccountService = {
  /**
   * Link a bank account to a business.
   * DEV: Creates a simulated account with generated history.
   * PROD: Initiates Mono Connect flow and creates Paystack DVA.
   */
  async linkAccount(businessId: string, institutionCode?: string): Promise<BankAccount> {
    if (isDev()) {
      return this._devLinkAccount(businessId, institutionCode);
    }
    // PROD: Will proxy to server → Mono Connect + Paystack DVA
    throw new Error('Production bank linking requires server API. See Phase 2.');
  },

  /**
   * Get the linked bank account for a business.
   */
  async getAccount(businessId: string): Promise<BankAccount | null> {
    await delay(200);
    const accounts = this._getAllAccounts();
    return accounts.find(a => a.businessId === businessId && a.isActive) || null;
  },

  /**
   * Sync latest transactions from the bank.
   * DEV: Adds a few new simulated transactions.
   * PROD: Calls Mono /v2/accounts/:id/transactions with x-real-time: true
   */
  async syncTransactions(businessId: string): Promise<{ newCount: number; transactions: BankTransaction[] }> {
    if (isDev()) {
      return this._devSyncTransactions(businessId);
    }
    throw new Error('Production sync requires server API. See Phase 2.');
  },

  /**
   * Get all transactions for a business's linked account.
   * Optionally filter by date range.
   */
  async getTransactions(
    businessId: string,
    options?: { startDate?: string; endDate?: string; type?: 'credit' | 'debit' }
  ): Promise<BankTransaction[]> {
    await delay(300);
    const account = await this.getAccount(businessId);
    if (!account) return [];

    let transactions = this._getAllTransactions()
      .filter(t => t.bankAccountId === account.id);

    if (options?.startDate) {
      const start = new Date(options.startDate).getTime();
      transactions = transactions.filter(t => new Date(t.date).getTime() >= start);
    }
    if (options?.endDate) {
      const end = new Date(options.endDate).getTime();
      transactions = transactions.filter(t => new Date(t.date).getTime() <= end);
    }
    if (options?.type) {
      transactions = transactions.filter(t => t.type === options.type);
    }

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  /**
   * Get account balance.
   */
  async getBalance(businessId: string): Promise<{ balance: number; lastUpdated: string } | null> {
    const account = await this.getAccount(businessId);
    if (!account) return null;

    const transactions = this._getAllTransactions()
      .filter(t => t.bankAccountId === account.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const lastTx = transactions[0];
    return {
      balance: lastTx ? lastTx.balance : account.balance,
      lastUpdated: lastTx ? lastTx.date : account.lastSyncedAt,
    };
  },

  /**
   * Check if a business has a linked bank account.
   */
  async hasLinkedAccount(businessId: string): Promise<boolean> {
    const account = await this.getAccount(businessId);
    return account !== null;
  },

  /**
   * Unlink a bank account (for account deletion compliance).
   */
  async unlinkAccount(businessId: string): Promise<void> {
    await delay(500);
    let accounts = this._getAllAccounts();
    accounts = accounts.map(a => {
      if (a.businessId === businessId) {
        return { ...a, isActive: false };
      }
      return a;
    });
    localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(accounts));
  },

  // ── DEV-ONLY implementations ────────────────────────────
  async _devLinkAccount(businessId: string, institutionCode?: string): Promise<BankAccount> {
    await delay(1500); // Simulate Mono Connect flow

    const bank = institutionCode
      ? NIGERIAN_BANKS.find(b => b.code === institutionCode) || randomItem(NIGERIAN_BANKS)
      : randomItem(NIGERIAN_BANKS);

    // Get business name for account name
    const bizStr = localStorage.getItem('kudi_businesses');
    const businesses = bizStr ? JSON.parse(bizStr) : [];
    const biz = businesses.find((b: any) => b.id === businessId);
    const accountName = biz ? biz.businessName.toUpperCase() : 'Kudi BUSINESS';

    const accountId = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const account: BankAccount = {
      id: accountId,
      businessId,
      institution: bank.name,
      institutionCode: bank.code,
      accountNumber,
      accountName,
      balance: 0,
      currency: 'NGN',
      lastSyncedAt: new Date().toISOString(),
      linkedAt: new Date().toISOString(),
      isActive: true,
      paystackDVA: {
        bankName: 'Wema Bank',
        accountNumber: Math.floor(7000000000 + Math.random() * 999999999).toString(),
        accountName: `Kudi/${accountName}`,
      },
    };

    // Save account
    const accounts = this._getAllAccounts();
    accounts.push(account);
    localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(accounts));

    // Generate historical transactions
    const transactions = generateSimulatedHistory(businessId, accountId);
    const existing = this._getAllTransactions();
    localStorage.setItem(BANK_TRANSACTIONS_KEY, JSON.stringify([...existing, ...transactions]));

    // Update balance from last transaction
    if (transactions.length > 0) {
      const lastTx = transactions[transactions.length - 1];
      account.balance = lastTx.balance;
      const accs = this._getAllAccounts();
      const idx = accs.findIndex(a => a.id === accountId);
      if (idx >= 0) {
        accs[idx] = account;
        localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(accs));
      }
    }

    return account;
  },

  async _devSyncTransactions(businessId: string): Promise<{ newCount: number; transactions: BankTransaction[] }> {
    await delay(800);

    const account = await this.getAccount(businessId);
    if (!account) return { newCount: 0, transactions: [] };

    const existingTxs = this._getAllTransactions()
      .filter(t => t.bankAccountId === account.id);
    const lastTx = existingTxs
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    let currentBalance = lastTx ? lastTx.balance : account.balance;

    // Generate 1-4 new transactions since last sync
    const newCount = 1 + Math.floor(Math.random() * 4);
    const newTransactions: BankTransaction[] = [];

    for (let i = 0; i < newCount; i++) {
      const isCredit = Math.random() < 0.65;
      const amount = isCredit
        ? randomAmount(2000, 50000)
        : randomAmount(1000, 20000);

      if (!isCredit && currentBalance - amount < 5000) continue;
      currentBalance = isCredit ? currentBalance + amount : currentBalance - amount;

      const tx: BankTransaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        bankAccountId: account.id,
        type: isCredit ? 'credit' : 'debit',
        amount,
        narration: generateNarration(isCredit ? CREDIT_NARRATIONS : DEBIT_NARRATIONS),
        date: new Date().toISOString(),
        balance: currentBalance,
        category: isCredit ? 'Income' : 'Expense',
      };
      newTransactions.push(tx);
    }

    // Save
    const allTxs = this._getAllTransactions();
    localStorage.setItem(BANK_TRANSACTIONS_KEY, JSON.stringify([...allTxs, ...newTransactions]));

    // Update last sync
    const accounts = this._getAllAccounts();
    const idx = accounts.findIndex(a => a.id === account.id);
    if (idx >= 0) {
      accounts[idx].lastSyncedAt = new Date().toISOString();
      accounts[idx].balance = currentBalance;
      localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    return {
      newCount: newTransactions.length,
      transactions: newTransactions,
    };
  },

  // ── localStorage helpers ────────────────────────────────
  _getAllAccounts(): BankAccount[] {
    if (typeof window === 'undefined') return [];
    const str = localStorage.getItem(BANK_ACCOUNTS_KEY);
    return str ? JSON.parse(str) : [];
  },

  _getAllTransactions(): BankTransaction[] {
    if (typeof window === 'undefined') return [];
    const str = localStorage.getItem(BANK_TRANSACTIONS_KEY);
    return str ? JSON.parse(str) : [];
  },
};
