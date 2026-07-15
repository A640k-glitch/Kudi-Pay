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
    if (ctx.productCount === 0) {
      return `📦 Products — None Listed Yet\n\nYou currently have 0 products on your storefront. Your store won't be visible to customers until you add at least one product.\n\n📍 How to Add Your First Product:\n1. Go to the "Products" tab in your sidebar\n2. Tap "Add Product"\n3. Fill in the product name, price, description, and upload an image\n4. Set your stock count and save\n\n💡 Tip: Adding products also contributes to your trust score. The more active your storefront, the higher your score climbs.`;
    }
    return `📦 Products (${ctx.productCount})\n\nYou have ${ctx.productCount} product(s) listed on your storefront.\n\n📍 To manage your products, go to the "Products" tab in your sidebar. You can edit prices, update stock counts, and add new items from there.`;
  }

  if (q.includes('order') || q.includes('sale') || (q.includes('how many') && (q.includes('order') || q.includes('sale')))) {
    if (ctx.orderCount === 0) {
      return `🛒 Orders — No Orders Yet\n\nYou haven't received any customer orders yet.\n\n📍 To start receiving orders:\n1. Make sure you have products listed — go to the "Products" tab in your sidebar\n2. Share your storefront link with customers\n3. Customize your store's look via the "Themes" tab to make it more appealing\n\n📍 Once orders come in, you can track and manage them from the "Orders" tab in your sidebar.`;
    }
    return `🛒 Orders & Sales Summary\n\n• Total Orders Received: ${ctx.orderCount}\n• Total Paid Sales Value: ₦${Number(ctx.totalStorefrontSales).toLocaleString()}\n\n📍 View full order details, filter by status (pending, paid, fulfilled), and manage fulfillment from the "Orders" tab in your sidebar.`;
  }

  if ((q.includes('bank') || q.includes('account') || q.includes('balance')) && (q.includes('link') || q.includes('balance') || q.includes('what') || q.includes('detail') || q.includes('name'))) {
    if (ctx.bankInfo === 'None linked') {
      return `🏦 Bank Account — Not Linked\n\nYou don't have a bank account linked yet. Linking your bank is essential for:\n• Building your trust score\n• Tracking real transaction history\n• Qualifying for business loans\n\n📍 How to Link Your Bank:\n1. Tap the profile icon at the top of your dashboard to open the "Account" page\n2. Find the "Bank Connection" card\n3. Tap "Link Bank Account"\n4. Select your bank and enter your account number`;
    }
    return `🏦 Bank Account\n\n• Bank: ${ctx.bankInfo}\n• Current Balance: ₦${Number(ctx.bankBalance).toLocaleString()}\n\n📍 To view or manage your bank connection, tap the profile icon at the top of your dashboard to open the "Account" page.`;
  }

  if (q.includes('storefront') || q.includes('store link') || q.includes('shop link') || q.includes('url') || q.includes('my link')) {
    if (!ctx.storefrontSlug) {
      return `🔗 Storefront Link — Not Set Up\n\nYour storefront slug hasn't been configured yet.\n\n📍 Go to the "Settings" tab in your sidebar to set up your storefront URL.`;
    }
    return `🔗 Your Storefront Link\n\nhttps://kudipay.com/store/${ctx.storefrontSlug}\n\nShare this link with customers so they can browse and buy from your store.\n\n📍 Customize your store's appearance via the "Themes" tab in your sidebar.`;
  }

  if (q.includes('kyc') || q.includes('verification') || q.includes('tier') || q.includes('cac') || q.includes('tin')) {
    const tierDescriptions: Record<number, string> = {
      0: 'Unverified — No identity documents submitted',
      1: 'Phone Verified — Account created with phone number only',
      2: 'Identity Verified — BVN and NIN verified',
      3: 'Fully Verified — BVN, NIN, and CAC (RC Number) verified'
    };
    const currentDesc = tierDescriptions[ctx.kycTier] || tierDescriptions[0];
    
    let response = `🔐 KYC & Verification Status\n\n• Current Tier: Tier ${ctx.kycTier} — ${currentDesc}\n• CAC Registration: ${ctx.cacStatus}\n• Tax ID (TIN): ${ctx.tinNumber}`;
    
    if (ctx.kycTier < 3) {
      response += `\n\n📍 How to Upgrade Your KYC Tier:`;
      if (ctx.kycTier < 2) {
        response += `\n1. Tap the profile icon at the top of your dashboard to open the "Account" page\n2. Tap "Complete Verification"\n3. Enter your BVN and NIN\n4. This will upgrade you to Tier 2`;
      }
      if (ctx.kycTier < 3) {
        response += `\n\nTo reach Tier 3:\n• Submit your CAC RC Number during verification`;
      }
      response += `\n\n💡 Higher KYC tiers improve your trust score and unlock better loan offers on the "Loans" tab.`;
    }
    return response;
  }

  if (q.includes('trust') || q.includes('score') || q.includes('credit') || q.includes('rating')) {
    let response = `⭐ Trust Score\n\n• Current Score: ${ctx.latestScore} / 1,000 PTS`;
    
    if (ctx.latestScore < 300) response += `\n• Rating: Needs Improvement`;
    else if (ctx.latestScore < 500) response += `\n• Rating: Fair`;
    else if (ctx.latestScore < 700) response += `\n• Rating: Good`;
    else response += `\n• Rating: Excellent`;
    
    const suggestions: string[] = [];
    if (ctx.bankInfo === 'None linked') suggestions.push('Link your bank account via the "Account" page (tap profile icon at top)');
    if (ctx.kycTier < 2) suggestions.push('Complete identity verification on the "Account" page (BVN + NIN)');
    if (ctx.productCount === 0) suggestions.push('Add products via the "Products" tab in your sidebar');
    
    if (suggestions.length > 0) {
      response += `\n\n📍 Quick Wins to Boost Your Score:\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    }
    
    response += `\n\n📍 View your full score breakdown on the "Trust Score" tab in your sidebar.`;
    return response;
  }

  if (q.includes('overview') || q.includes('summary') || q.includes('full') || q.includes('all') || q.includes('dashboard')) {
    const lines = [
      `📊 Business Overview — ${ctx.businessName}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📍 Location: ${ctx.location}`,
      `🏷️ Category: ${ctx.category}`,
      `⭐ Trust Score: ${ctx.latestScore}/1,000`,
      `🔐 KYC: Tier ${ctx.kycTier} | CAC: ${ctx.cacStatus}`,
      ``,
      `📦 Products: ${ctx.productCount}`,
      `🛒 Orders: ${ctx.orderCount}`,
      `💰 Total Sales: ₦${Number(ctx.totalStorefrontSales).toLocaleString()}`,
      ``,
      `🏦 Bank: ${ctx.bankInfo}`,
      `💵 Balance: ₦${Number(ctx.bankBalance).toLocaleString()}`,
    ];
    
    const gaps: string[] = [];
    if (ctx.bankInfo === 'None linked') gaps.push('Link bank account → "Account" page (profile icon at top)');
    if (ctx.kycTier < 2) gaps.push('Complete KYC verification → "Account" page (profile icon at top)');
    if (ctx.productCount === 0) gaps.push('Add products → "Products" tab in sidebar');
    
    if (gaps.length > 0) {
      lines.push(``, `⚠️ Setup Recommendations:`, ...gaps.map(g => `• ${g}`));
    }
    
    return lines.join('\n');
  }

  if (q.includes('loan') || q.includes('borrow') || q.includes('funding') || q.includes('eligib')) {
    if (ctx.latestScore < 300) {
      let response = `🏦 Loan Eligibility — Not Yet Qualified\n\nYou need a minimum trust score of 300 to apply for a business loan.\n\n• Your Current Score: ${ctx.latestScore}/1,000\n• Required Minimum: 300/1,000`;
      
      const steps: string[] = [];
      if (ctx.bankInfo === 'None linked') steps.push('Link your bank account → "Account" page (tap profile icon at top)');
      if (ctx.kycTier < 2) steps.push('Complete KYC verification → "Account" page (tap profile icon at top)');
      if (ctx.productCount === 0) steps.push('Add products to your storefront → "Products" tab in sidebar');
      
      if (steps.length > 0) {
        response += `\n\n📍 Steps to Improve Your Score:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
      }
      return response;
    }
    return `🏦 Loan Eligibility — Qualified ✓\n\nYou qualify for business loans with your current trust score of ${ctx.latestScore}/1,000.\n\n📍 Go to the "Loans" tab in your sidebar to view available loan tiers and submit an application.`;
  }

  if (q.includes('transaction') || q.includes('history') || q.includes('recent') || q.includes('spending') || q.includes('income')) {
    if (!ctx.recentTxsText || ctx.recentTxsText === 'No bank transactions found.') {
      return `📋 Transactions — None Found\n\nNo recent bank transactions on record.\n\n📍 To see your transaction history:\n1. Link your bank account via the "Account" page (tap profile icon at top)\n2. Once linked, type "Bank sync" here to sync your latest transactions`;
    }
    return `📋 Recent Transactions\n\n${ctx.recentTxsText}\n\n📍 To sync your latest transactions, type "Sync my bank transactions" here.`;
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
