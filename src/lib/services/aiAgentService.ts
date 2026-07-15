import { api } from '../api';

/**
 * Client-side AI Agent Service for the Dashboard Chat Widget.
 * Fetches business context from the server API, then routes the query
 * to the backend Gemini endpoint. API keys stay server-side only.
 */

export const dashboardAgentService = {
  /**
   * Check if the backend has a Gemini API key configured.
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
   * Send chat query to backend AI Assistant.
   * Fetches live business context from the server so the AI always has
   * accurate data regardless of what's in localStorage.
   */
  async processQuery(businessId: string, query: string): Promise<string> {
    try {
      // Fetch live business profile from server
      let bizName = 'Unknown Business';
      let ownerPhone = '';
      let category = 'Retail';
      let location = 'Nigeria';
      let storefrontSlug = '';
      let kycTier = 0;
      let cacStatus = 'Not Registered';
      let tinNumber = 'Not Added';
      let productCount = 0;
      let productDetailsText = 'No products listed.';
      let orderCount = 0;
      let totalStorefrontSales = 0;
      let bankInfo = 'None linked';
      let bankBalance = '0';
      let recentTxsText = 'No bank transactions found.';
      let latestScore = 0;

      // Fetch business profile by ID
      try {
        const bizData = await api.get(`/businesses/by-id/${businessId}`);
        const b = bizData.business;
        if (b) {
          bizName = b.businessName || b.business_name;
          ownerPhone = b.ownerPhone || b.owner_phone;
          category = b.category;
          location = `${b.lga || ''}, ${b.state || ''} State`.trim().replace(/^,\s*/, '');
          storefrontSlug = b.storefrontSlug || b.storefront_slug;
          kycTier = b.kycTier ?? b.kyc_tier ?? 0;
          tinNumber = b.tinNumber || b.tin_number || 'Not Added';
          const cacVerification = b.cacVerification || b.cac_verification;
          const isCacVerified = cacVerification && typeof cacVerification === 'object' && Object.keys(cacVerification).length > 0;
          cacStatus = isCacVerified ? 'Verified (Registered)' : 'Not Registered';
        }
      } catch (e) {
        console.error('Failed to fetch business profile for AI context:', e);
        // Fallback to localStorage if server unreachable
        try {
          const bizStr = localStorage.getItem('kudi_businesses');
          const phone = localStorage.getItem('kudi_session_phone');
          if (bizStr && phone) {
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
              const isCacVerified = b.cacVerification && Object.keys(b.cacVerification).length > 0;
              cacStatus = isCacVerified ? 'Verified (Registered)' : 'Not Registered';
            }
          }
        } catch {}
      }

      // Fetch products from server
      try {
        const prodsData = await api.get(`/products?businessId=${encodeURIComponent(businessId)}`);
        const products = prodsData.products || [];
        productCount = products.length;
        if (products.length > 0) {
          productDetailsText = products.slice(0, 20).map((p: any) =>
            `• ${p.name} — ₦${Number(p.price).toLocaleString()}${p.stockCount != null ? ` (Stock: ${p.stockCount})` : ''}`
          ).join('\n');
        }
      } catch {}

      // Fetch orders count + sales from server
      try {
        const ordersData = await api.get(`/orders?businessId=${encodeURIComponent(businessId)}`);
        const orders = ordersData.orders || [];
        orderCount = orders.length;
        totalStorefrontSales = orders
          .filter((o: any) => o.status === 'paid' || o.status === 'fulfilled')
          .reduce((sum: number, o: any) => sum + Number(o.totalAmount || o.total_amount || 0), 0);
      } catch {}

      // Fetch bank account info from server
      try {
        const bankData = await api.get(`/bank/accounts?businessId=${encodeURIComponent(businessId)}`);
        const bank = bankData.account;
        if (bank) {
          bankInfo = `${bank.institution} (Acct: ${bank.account_number || bank.accountNumber})`;
          bankBalance = String(bank.balance);

          const txData = await api.get(`/bank/transactions?businessId=${encodeURIComponent(businessId)}`);
          const txs = (txData.transactions || []).slice(0, 5);
          if (txs.length > 0) {
            recentTxsText = txs.map((t: any) =>
              `${new Date(t.date).toLocaleDateString()}: ${t.type === 'credit' ? '+' : '-'}₦${Number(t.amount).toLocaleString()} (${t.narration})`
            ).join('\n');
          }
        }
      } catch {}

      // Fetch trust score snapshot from server
      try {
        const scoreData = await api.get(`/trust-score/snapshots?businessId=${encodeURIComponent(businessId)}`);
        const snaps = scoreData.snapshots || [];
        if (snaps.length > 0) {
          latestScore = Number(snaps[snaps.length - 1].score);
        }
      } catch {}

      const response = await api.post('/assistant/chat', {
        businessId, query, clientContext: {
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
          productDetailsText,
          orderCount,
          totalStorefrontSales,
          bankInfo,
          bankBalance,
          recentTxsText
        }
      });
      return response.reply;
    } catch (err) {
      console.error('Dashboard AI Agent Error:', err);
      return 'Sorry, I am having trouble connecting to the assistant engine right now. Please try again shortly.';
    }
  },

  /**
   * Get chat history from the server (last 30 days).
   */
  async getHistory(): Promise<{ id: string; sender: string; text: string; timestamp: string; type?: string }[]> {
    try {
      const data = await api.get('/assistant/history');
      return (data.messages || []).map((m: any) => {
        const d = new Date(m.created_at);
        const isCommandsText = m.message?.includes("Here's everything I can do") || m.message?.includes('📋 Here\'s everything');
        return {
          id: m.id,
          sender: m.sender,
          text: m.message,
          timestamp: !isNaN(d.getTime()) ? String(d.getTime()) : String(Date.now()),
          type: (m.msg_type === 'commands' || isCommandsText) ? 'commands' : undefined
        };
      });
    } catch {
      return [];
    }
  },

  /**
   * Save chat messages to the server.
   */
  async saveHistory(messages: { id: string; sender: string; text: string; timestamp: string; type?: string }[]): Promise<void> {
    try {
      const payload = messages.map(m => {
        const ts = Number(m.timestamp);
        const created_at = !isNaN(ts) ? new Date(ts).toISOString() : new Date().toISOString();
        return { id: m.id, sender: m.sender, text: m.text, msg_type: m.type || 'text', created_at };
      });
      await api.post('/assistant/history', { messages: payload });
    } catch (err) {
      console.error('Failed to save chat history:', err);
    }
  }
};

function answerFromClientContext(queryText: string, ctx: typeof DEFAULT_CONTEXT): string | null {
  const q = queryText.toLowerCase().trim();

  if (q.includes('product') || q.includes('inventory') || q.includes('stock') || q.includes('item')) {
    return ctx.productCount === 0
      ? "You have no products listed yet. Go to the Storefront page to add your first product."
      : `You have ${ctx.productCount} product(s) listed on your storefront.`;
  }

  if (q.includes('order') || q.includes('sale') || (q.includes('how many') && (q.includes('order') || q.includes('sale')))) {
    return `You have received ${ctx.orderCount} order(s) with a total paid sales value of ₦${Number(ctx.totalStorefrontSales).toLocaleString()}.`;
  }

  if ((q.includes('bank') || q.includes('account') || q.includes('balance')) && (q.includes('link') || q.includes('balance') || q.includes('what') || q.includes('detail') || q.includes('name'))) {
    return `Your linked bank account is ${ctx.bankInfo} with a current balance of ₦${Number(ctx.bankBalance).toLocaleString()}.`;
  }

  if (q.includes('storefront') || q.includes('store link') || q.includes('shop link') || q.includes('url') || q.includes('my link')) {
    return `Your storefront link is: https://kudipay.com/store/${ctx.storefrontSlug}`;
  }

  if (q.includes('kyc') || q.includes('verification') || q.includes('tier') || q.includes('cac') || q.includes('tin')) {
    return `KYC Status:\n• KYC Tier: ${ctx.kycTier}\n• CAC Registration: ${ctx.cacStatus}\n• Tax ID (TIN): ${ctx.tinNumber}`;
  }

  if (q.includes('trust') || q.includes('score') || q.includes('credit') || q.includes('rating')) {
    return `Your current trust score is ${ctx.latestScore}/1000.`;
  }

  if (q.includes('overview') || q.includes('summary') || q.includes('full') || q.includes('all') || q.includes('dashboard')) {
    return [
      `📊 Business Overview for ${ctx.businessName}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📍 Location: ${ctx.location}`,
      `🏷️ Category: ${ctx.category}`,
      `⭐ Trust Score: ${ctx.latestScore}/1000`,
      `🔐 KYC Tier: ${ctx.kycTier} | CAC: ${ctx.cacStatus}`,
      ``,
      `📦 Products: ${ctx.productCount}`,
      `🛒 Orders: ${ctx.orderCount}`,
      `💰 Total Sales: ₦${Number(ctx.totalStorefrontSales).toLocaleString()}`,
      ``,
      `🏦 Bank: ${ctx.bankInfo}`,
      `💵 Balance: ₦${Number(ctx.bankBalance).toLocaleString()}`,
    ].join('\n');
  }

  if (q.includes('loan') || q.includes('borrow') || q.includes('funding') || q.includes('eligib')) {
    if (ctx.latestScore < 300) {
      return `You need a trust score of at least 300 to qualify for a loan. Your current score is ${ctx.latestScore}/1000. Link your bank account and keep transacting to improve your score.`;
    }
    return `You qualify for loans with your current score of ${ctx.latestScore}/1000. Visit the Lending page to view available loan tiers and apply.`;
  }

  if (q.includes('transaction') || q.includes('history') || q.includes('recent') || q.includes('spending') || q.includes('income')) {
    if (!ctx.recentTxsText || ctx.recentTxsText === 'No bank transactions found.') {
      return "No recent bank transactions found. Link your bank account and sync to see your transaction history.";
    }
    return `Here are your recent transactions:\n${ctx.recentTxsText}`;
  }

  return "I'm a business assistant and can only help with questions about your dashboard data. Type /commands to see what I can do.";
}

const DEFAULT_CONTEXT = {
  businessName: 'Unknown Business',
  ownerPhone: '',
  category: 'Retail',
  location: 'Nigeria',
  storefrontSlug: '',
  kycTier: 0,
  cacStatus: 'Not Registered',
  tinNumber: 'Not Added',
  latestScore: 0,
  productCount: 0,
  productDetailsText: 'No products listed.',
  orderCount: 0,
  totalStorefrontSales: 0,
  bankInfo: 'None linked',
  bankBalance: '0',
  recentTxsText: 'No bank transactions found.',
};
