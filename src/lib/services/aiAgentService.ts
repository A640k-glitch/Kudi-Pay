import { api } from '../api';
import { trustScoreService } from './trustScoreService';

/**
 * Client-side AI Agent Service for the Dashboard Chat Widget.
 * Communicates with the Express backend to keep API keys secure.
 */

export const dashboardAgentService = {
  /**
   * Check if the backend has Gemini API key configured.
   */
  async checkStatus(): Promise<boolean> {
    try {
      const status = await api.get('/assistant/status');
      return !!status.active;
    } catch {
      return false;
    }
  },

  /**
   * Send chat query to backend AI Assistant with complete client-side context.
   */
  async processQuery(businessId: string, query: string): Promise<string> {
    try {
      // 1. Gather client-side context (from localStorage) to support mock data in dev
      const bizStr = localStorage.getItem('kudi_businesses');
      let bizName = "Unknown Business";
      let ownerPhone = "";
      let category = "Retail";
      let location = "Nigeria";
      let storefrontSlug = "";
      let kycTier = 0;
      let cacStatus = "Not Registered";
      let tinNumber = "Not Added";

      if (bizStr) {
        try {
          const businesses = JSON.parse(bizStr);
          const b = businesses.find((x: any) => x.id === businessId);
          if (b) {
            bizName = b.businessName;
            ownerPhone = b.ownerPhone;
            category = b.category;
            location = `${b.lga || ''}, ${b.state || ''} State`;
            storefrontSlug = b.storefrontSlug;
            kycTier = b.kycTier ?? 0;
            tinNumber = b.tinNumber || 'Not Added';
            
            const isCacVerified = b.cacVerification && typeof b.cacVerification === 'object' && Object.keys(b.cacVerification).length > 0;
            cacStatus = isCacVerified ? 'Verified (Registered)' : 'Not Registered';
          }
        } catch (e) {
          console.error("Failed to parse businesses in aiAgentService", e);
        }
      }

      // Products count
      let productCount = 0;
      try {
        const prodsStr = localStorage.getItem('kudi_products') || '[]';
        const prods = JSON.parse(prodsStr).filter((p: any) => p.businessId === businessId);
        productCount = prods.length;
      } catch {}

      // Orders count
      let orderCount = 0;
      let totalStorefrontSales = 0;
      try {
        const ordersStr = localStorage.getItem('kudi_orders') || '[]';
        const orders = JSON.parse(ordersStr).filter((o: any) => o.businessId === businessId);
        orderCount = orders.length;
        totalStorefrontSales = orders
          .filter((o: any) => o.status === 'paid' || o.status === 'completed' || o.status === 'fulfilled')
          .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
      } catch {}

      // Bank info
      let bankInfo = "None linked";
      let bankBalance = "0";
      let recentTxsText = "No bank transactions found.";
      try {
        const accountsStr = localStorage.getItem('kudi_bank_accounts') || '[]';
        const bank = JSON.parse(accountsStr).find((a: any) => a.businessId === businessId && a.isActive);
        if (bank) {
          bankInfo = `${bank.institution} (Acct: ${bank.accountNumber})`;
          bankBalance = String(bank.balance);

          const txsStr = localStorage.getItem('kudi_bank_transactions') || '[]';
          const txs = JSON.parse(txsStr)
            .filter((t: any) => t.bankAccountId === bank.id)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

          if (txs.length > 0) {
            recentTxsText = txs.map((t: any) => 
              `${new Date(t.date).toLocaleDateString()}: ${t.type === 'credit' ? '+' : '-'}${t.amount} (${t.narration})`
            ).join('\n');
          }
        }
      } catch {}

      // Trust Score
      let latestScore = 0;
      try {
        const scoreSnapshots = trustScoreService.getSnapshots(businessId);
        latestScore = scoreSnapshots.length > 0 ? scoreSnapshots[scoreSnapshots.length - 1].score : 0;
      } catch {}

      const clientContext = {
        businessName: bizName,
        ownerPhone,
        category,
        location,
        storefrontSlug,
        kycTier,
        cacStatus,
        tinNumber,
        latestScore,
        productCount,
        orderCount,
        totalStorefrontSales,
        bankInfo,
        bankBalance,
        recentTxsText
      };

      const response = await api.post('/assistant/chat', { businessId, query, clientContext });
      return response.reply;
    } catch (err) {
      console.error("Dashboard AI Agent Error:", err);
      return "Sorry, I am having trouble connecting to the assistant engine right now.";
    }
  }
};
