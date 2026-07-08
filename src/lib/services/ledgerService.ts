import { LedgerEntry } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const LEDGER_KEY = "kudi_ledger";

export const ledgerService = {
  /**
   * Get all ledger entries for a business.
   */
  async getEntries(businessId: string): Promise<LedgerEntry[]> {
    await delay(300);
    const existing = this._getAllEntries();
    return existing
      .filter(e => e.businessId === businessId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Add a new ledger entry.
   * This is now an internal service method. The UI should NOT call this directly
   * for "sales" anymore. Sales should come from bank webhooks or syncs.
   */
  async addEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry> {
    await delay(500);
    const newEntry: LedgerEntry = {
      ...entry,
      id: `ent_${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      createdAt: new Date().toISOString()
    };
    const existing = this._getAllEntries();
    existing.push(newEntry);
    localStorage.setItem(LEDGER_KEY, JSON.stringify(existing));

    return newEntry;
  },

  /**
   * Add multiple entries at once (useful for bank sync).
   */
  async addEntries(entries: Omit<LedgerEntry, 'id' | 'createdAt'>[]): Promise<LedgerEntry[]> {
    await delay(500);
    const newEntries: LedgerEntry[] = entries.map(entry => ({
      ...entry,
      id: `ent_${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      createdAt: new Date().toISOString()
    }));
    
    const existing = this._getAllEntries();
    const all = [...existing, ...newEntries];
    localStorage.setItem(LEDGER_KEY, JSON.stringify(all));

    return newEntries;
  },

  /**
   * Calculate basic financial stats from the ledger.
   * Only includes verified entries for accurate financial reporting.
   */
  async getStats(businessId: string): Promise<{ revenue: number; expenses: number; profit: number; balance: number }> {
    const entries = await this.getEntries(businessId);
    let revenue = 0;
    let expenses = 0;
    
    entries.forEach(e => {
      // Only count verified entries or those from trusted sources
      if (e.verificationStatus === 'verified' || e.verificationSource === 'bank_api') {
        if (e.type === 'revenue') {
          revenue += e.amount;
        } else if (e.type === 'expense') {
          expenses += e.amount;
        }
      }
    });

    const profit = revenue - expenses;
    const balance = profit; 
    
    return { revenue, expenses, profit, balance };
  },

  _getAllEntries(): LedgerEntry[] {
    if (typeof window !== "undefined") {
      const str = localStorage.getItem(LEDGER_KEY);
      // Migrate from old "aza_ledger" key if necessary, but we are wiping the slate clean for V2.
      // If we wanted to keep old data, we'd fall back, but new types are incompatible.
      return str ? JSON.parse(str) : [];
    }
    return [];
  }
};
