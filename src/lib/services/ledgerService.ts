import { LedgerEntry } from '../types';
import { api } from '../api';

function serializeEntry(row: any): LedgerEntry {
  return {
    id: row.id,
    businessId: row.business_id || row.businessId,
    type: row.type,
    amount: Number(row.amount),
    source: row.source,
    verificationStatus: row.verification_status || row.verificationStatus || 'pending',
    verificationSource: row.verification_source || row.verificationSource || 'manual_unverified',
    bankTransactionId: row.bank_transaction_id || row.bankTransactionId || undefined,
    verifiedAt: row.verified_at || row.verifiedAt || undefined,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {}),
    createdAt: row.created_at || row.createdAt,
  };
}

export const ledgerService = {
  async getEntries(businessId: string): Promise<LedgerEntry[]> {
    try {
      const data = await api.get(`/ledger?businessId=${encodeURIComponent(businessId)}`);
      return data.entries.map(serializeEntry);
    } catch {
      return this._getLocalEntries(businessId);
    }
  },

  async addEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry> {
    const body = {
      type: entry.type,
      amount: entry.amount,
      source: entry.source,
      verificationStatus: entry.verificationStatus,
      verificationSource: entry.verificationSource,
      bankTransactionId: entry.bankTransactionId,
      metadata: entry.metadata,
    };
    try {
      const data = await api.post('/ledger', body);
      const newEntry = serializeEntry(data.entry);
      this._syncToLocal(newEntry);
      return newEntry;
    } catch {
      const newEntry: LedgerEntry = {
        ...entry,
        id: `ent_${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        createdAt: new Date().toISOString()
      };
      const existing = this._getAllEntries();
      existing.push(newEntry);
      localStorage.setItem('kudi_ledger', JSON.stringify(existing));
      return newEntry;
    }
  },

  async addEntries(entries: Omit<LedgerEntry, 'id' | 'createdAt'>[]): Promise<LedgerEntry[]> {
    const results: LedgerEntry[] = [];
    for (const entry of entries) {
      results.push(await this.addEntry(entry));
    }
    return results;
  },

  async getStats(businessId: string): Promise<{ revenue: number; expenses: number; profit: number; balance: number }> {
    try {
      const data = await api.get(`/ledger/stats?businessId=${encodeURIComponent(businessId)}`);
      return data;
    } catch {
      const entries = await this.getEntries(businessId);
      let revenue = 0;
      let expenses = 0;
      entries.forEach(e => {
        if (e.verificationStatus === 'verified' || e.verificationSource === 'bank_api') {
          if (e.type === 'revenue') revenue += e.amount;
          else if (e.type === 'expense') expenses += e.amount;
        }
      });
      const profit = revenue - expenses;
      return { revenue, expenses, profit, balance: profit };
    }
  },

  _syncToLocal(entry: LedgerEntry) {
    const all = this._getAllEntries();
    const idx = all.findIndex(e => e.id === entry.id);
    if (idx >= 0) all[idx] = entry;
    else all.push(entry);
    localStorage.setItem('kudi_ledger', JSON.stringify(all));
  },

  _getAllEntries(): LedgerEntry[] {
    if (typeof window !== 'undefined') {
      const str = localStorage.getItem('kudi_ledger');
      return str ? JSON.parse(str) : [];
    }
    return [];
  },

  _getLocalEntries(businessId: string): LedgerEntry[] {
    const existing = this._getAllEntries();
    return existing
      .filter(e => e.businessId === businessId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};
