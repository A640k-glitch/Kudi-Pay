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
    const data = await api.get(`/ledger?businessId=${encodeURIComponent(businessId)}`);
    return data.entries.map(serializeEntry);
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
    const data = await api.post('/ledger', body);
    return serializeEntry(data.entry);
  },

  async addEntries(entries: Omit<LedgerEntry, 'id' | 'createdAt'>[]): Promise<LedgerEntry[]> {
    const results: LedgerEntry[] = [];
    for (const entry of entries) {
      results.push(await this.addEntry(entry));
    }
    return results;
  },

  async getStats(businessId: string): Promise<{ revenue: number; expenses: number; profit: number; balance: number }> {
    const data = await api.get(`/ledger/stats?businessId=${encodeURIComponent(businessId)}`);
    return data;
  }
};
