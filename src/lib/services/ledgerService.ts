import { Order } from "../types";

export interface LedgerEntry {
  id: string;
  businessId: string;
  type: 'revenue' | 'expense';
  amount: number;
  source: 'sale' | 'receipt_ocr' | 'manual' | 'loan_disbursement' | 'loan_repayment';
  metadata: {
    description?: string;
    vendor?: string;
    category?: string;
    itemsCount?: number;
    [key: string]: any;
  };
  createdAt: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ledgerService = {
  async getEntries(businessId: string): Promise<LedgerEntry[]> {
    await delay(300);
    const existing = this._getAllEntries();
    // Default mock data if empty, so the user starts with the specified ₦148,000 revenue
    if (existing.filter(e => e.businessId === businessId).length === 0) {
      const mockEntries: LedgerEntry[] = [
        {
          id: 'ent_mock1',
          businessId,
          type: 'revenue',
          amount: 85000,
          source: 'sale',
          metadata: { description: 'Bulk fabric order' },
          createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
        },
        {
          id: 'ent_mock2',
          businessId,
          type: 'revenue',
          amount: 63000,
          source: 'sale',
          metadata: { description: 'Ankara dresses order' },
          createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        },
        {
          id: 'ent_mock3',
          businessId,
          type: 'expense',
          amount: 62000,
          source: 'receipt_ocr',
          metadata: { vendor: 'Alaba Textile Supplier', category: 'Raw Materials' },
          createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        }
      ];
      const all = [...existing, ...mockEntries];
      localStorage.setItem("aza_ledger", JSON.stringify(all));
      return mockEntries;
    }
    return existing.filter(e => e.businessId === businessId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry> {
    await delay(500);
    const newEntry: LedgerEntry = {
      ...entry,
      id: `ent_${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      createdAt: new Date().toISOString()
    };
    const existing = this._getAllEntries();
    existing.push(newEntry);
    localStorage.setItem("aza_ledger", JSON.stringify(existing));

    // Also award trust score points
    awardTrustPoints(entry.businessId, entry.type === 'revenue' ? 5 : 10);

    return newEntry;
  },

  async getStats(businessId: string): Promise<{ revenue: number; expenses: number; profit: number; balance: number }> {
    const entries = await this.getEntries(businessId);
    let revenue = 0;
    let expenses = 0;
    
    entries.forEach(e => {
      if (e.type === 'revenue') {
        revenue += e.amount;
      } else if (e.type === 'expense') {
        expenses += e.amount;
      }
    });

    const profit = revenue - expenses;
    // Balance represents liquid funds (loans are added to this, repayments deducted)
    const balance = profit; 
    
    return { revenue, expenses, profit, balance };
  },

  _getAllEntries(): LedgerEntry[] {
    if (typeof window !== "undefined") {
      const str = localStorage.getItem("aza_ledger");
      return str ? JSON.parse(str) : [];
    }
    return [];
  }
};

// Award points to capital readiness score
function awardTrustPoints(businessId: string, points: number) {
  const scoreKey = `aza_trust_points_${businessId}`;
  const current = Number(localStorage.getItem(scoreKey) || "350"); // base mock progress starts at 70% (350 points out of 500)
  const newPoints = Math.min(500, current + points);
  localStorage.setItem(scoreKey, String(newPoints));
}
