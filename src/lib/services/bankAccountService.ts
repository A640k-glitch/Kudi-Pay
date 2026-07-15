import type { BankAccount, BankTransaction } from '../types';
import { api } from '../api';

export const bankAccountService = {
  /**
   * Link a bank account to a business.
   */
  async linkAccount(businessId: string, institutionCode?: string): Promise<BankAccount> {
    const data = await api.post('/bank/accounts', { businessId, institutionCode });
    return data.account;
  },

  /**
   * Get the linked bank account for a business.
   */
  async getAccount(businessId: string): Promise<BankAccount | null> {
    const data = await api.get(`/bank/accounts?businessId=${encodeURIComponent(businessId)}`);
    return data.account || null;
  },

  /**
   * Sync latest transactions from the bank.
   */
  async syncTransactions(businessId: string): Promise<{ newCount: number; transactions: BankTransaction[] }> {
    const data = await api.post('/bank/transactions/sync', { businessId });
    return {
      newCount: Number(data.newCount),
      transactions: (data.transactions || []).map((t: any) => ({
        id: t.id,
        bankAccountId: t.bank_account_id || t.bankAccountId,
        type: t.type,
        amount: Number(t.amount),
        narration: t.narration,
        date: t.date,
        balance: Number(t.balance),
        category: t.category
      }))
    };
  },

  /**
   * Get all transactions for a business's linked account.
   */
  async getTransactions(
    businessId: string,
    options?: { startDate?: string; endDate?: string; type?: 'credit' | 'debit' }
  ): Promise<BankTransaction[]> {
    const data = await api.get(`/bank/transactions?businessId=${encodeURIComponent(businessId)}`);
    let txs = (data.transactions || []).map((t: any) => ({
      id: t.id,
      bankAccountId: t.bank_account_id || t.bankAccountId,
      type: t.type,
      amount: Number(t.amount),
      narration: t.narration,
      date: t.date,
      balance: Number(t.balance),
      category: t.category
    }));

    if (options?.startDate) {
      const start = new Date(options.startDate).getTime();
      txs = txs.filter((t: any) => new Date(t.date).getTime() >= start);
    }
    if (options?.endDate) {
      const end = new Date(options.endDate).getTime();
      txs = txs.filter((t: any) => new Date(t.date).getTime() <= end);
    }
    if (options?.type) {
      txs = txs.filter((t: any) => t.type === options.type);
    }

    return txs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  /**
   * Get account balance.
   */
  async getBalance(businessId: string): Promise<{ balance: number; lastUpdated: string } | null> {
    const account = await this.getAccount(businessId);
    if (!account) return null;
    return {
      balance: account.balance,
      lastUpdated: account.lastSyncedAt || account.linkedAt
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
   * Unlink a bank account.
   */
  async unlinkAccount(businessId: string): Promise<void> {
    await api.post('/bank/accounts/unlink', { businessId });
  }
};
