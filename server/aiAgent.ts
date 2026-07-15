import { GoogleGenAI } from '@google/genai';
import { query } from '../api/_lib/db';

/**
 * Server-side AI Agent Service for WhatsApp queries.
 * Handles incoming natural language messages, extracts intents using Function Calling,
 * and responds appropriately based on user's business data.
 */

// NOTE: Ensure process.env.GEMINI_API_KEY is set
// Lazy-loaded to avoid crash when key is missing at cold start
let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _ai;
}

export const aiAgentService = {
  /**
   * Process an incoming WhatsApp message using Gemini.
   */
  async processWhatsAppQuery(phoneNumber: string, messageText: string, businessData: any) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5',
        contents: `
          You are Kudi, the AI financial assistant for CODA OS.
          The user is a business owner.
          
          User's Business Data:
          - Name: ${businessData.name}
          - Trust Score: ${businessData.score}
          - Ledger Balance: ₦${businessData.balance}
          
          User Query: "${messageText}"
          
          Respond briefly and professionally via WhatsApp.
        `,
      });
      
      return response.text || "Sorry, I am unable to process your request at this moment.";
    } catch (err) {
      console.error("AI Agent Error:", err);
      return "Sorry, I am having trouble connecting to the financial engine right now. Please try again later.";
    }
  },

  /**
   * Process a query from the client-side dashboard chat.
   */
  async processDashboardQuery(businessId: string, queryText: string, clientContext?: any) {
    try {
      const ai = getAI();
      
      let bizName = "Unknown Business";
      let ownerPhone = "";
      let category = "Retail";
      let location = "Nigeria";
      let storefrontSlug = "";
      let kycTier = 0;
      let cacStatus = "Not Registered";
      let tinNumber = "Not Added";
      let latestScore = 0;
      let productCount = 0;
      let orderCount = 0;
      let totalStorefrontSales = 0;
      let bankInfo = "None linked";
      let bankBalance = "0";
      let recentTxsText = "No bank transactions found.";

      if (clientContext) {
        const c = clientContext;
        bizName = c.businessName || bizName;
        ownerPhone = c.ownerPhone || ownerPhone;
        category = c.category || category;
        location = c.location || location;
        storefrontSlug = c.storefrontSlug || storefrontSlug;
        kycTier = c.kycTier ?? kycTier;
        cacStatus = c.cacStatus || cacStatus;
        tinNumber = c.tinNumber || tinNumber;
        latestScore = c.latestScore ?? latestScore;
        productCount = c.productCount ?? productCount;
        orderCount = c.orderCount ?? orderCount;
        totalStorefrontSales = c.totalStorefrontSales ?? totalStorefrontSales;
        bankInfo = c.bankInfo || bankInfo;
        bankBalance = c.bankBalance || bankBalance;
        recentTxsText = c.recentTxsText || recentTxsText;
      } else {
        const bizResult = await query('SELECT * FROM businesses WHERE id = $1', [businessId]);
        const biz = bizResult.rows[0];
        if (biz) {
          bizName = biz.business_name;
          ownerPhone = biz.owner_phone;
          category = biz.category;
          location = `${biz.lga}, ${biz.state} State`;
          storefrontSlug = biz.storefront_slug;
          kycTier = biz.kyc_tier;
          tinNumber = biz.tin_number || 'Not Added';
          
          const isCacVerified = biz.cac_verification && typeof biz.cac_verification === 'object' && Object.keys(biz.cac_verification).length > 0;
          cacStatus = isCacVerified ? 'Verified (Registered)' : 'Not Registered';

          const bankResult = await query('SELECT * FROM bank_accounts WHERE business_id = $1 AND is_active = true', [businessId]);
          const bank = bankResult.rows[0];
          if (bank) {
            bankInfo = `${bank.institution} (Acct: ${bank.account_number})`;
            bankBalance = String(bank.balance);
            
            const txsResult = await query(
              'SELECT * FROM bank_transactions WHERE bank_account_id = $1 ORDER BY date DESC LIMIT 5',
              [bank.id]
            );
            recentTxsText = txsResult.rows.map((t: any) => 
              `${new Date(t.date).toLocaleDateString()}: ${t.type === 'credit' ? '+' : '-'}${t.amount} (${t.narration})`
            ).join('\n');
          }

          const scoreResult = await query(
            'SELECT * FROM trust_score_snapshots WHERE business_id = $1 ORDER BY date DESC LIMIT 1',
            [businessId]
          );
          latestScore = scoreResult.rows[0]?.score ?? 0;

          const prodResult = await query('SELECT COUNT(*) as count FROM products WHERE business_id = $1', [businessId]);
          productCount = prodResult.rows[0]?.count ?? 0;

          const orderResult = await query('SELECT COUNT(*) as count FROM orders WHERE business_id = $1', [businessId]);
          orderCount = orderResult.rows[0]?.count ?? 0;

          const paidOrdersResult = await query("SELECT SUM(total_amount) as total FROM orders WHERE business_id = $1 AND (status = 'paid' OR status = 'fulfilled')", [businessId]);
          totalStorefrontSales = paidOrdersResult.rows[0]?.total ?? 0;
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5',
        contents: `
          You are Kudi, the AI financial assistant for Kudi OS. You are embedded in the user's dashboard.
          You help them understand their finances, trust score, storefront metrics, and loan eligibility.
          
          Context for this merchant's business:
          - Business Name: ${bizName}
          - Owner Phone: ${ownerPhone}
          - Business Category: ${category}
          - Location: ${location}, Nigeria
          - Storefront Link: https://kudipay.com/store/${storefrontSlug}
          - KYC Tier: Tier ${kycTier}
          - CAC Registration: ${cacStatus}
          - Tax ID (TIN): ${tinNumber}
          - Current Trust Score: ${latestScore}/1000
          
          Storefront Metrics:
          - Total Products Uploaded: ${productCount}
          - Total Storefront Orders: ${orderCount}
          - Total Paid Sales Value: ₦${Number(totalStorefrontSales).toLocaleString()}

          Bank & Credit Context:
          - Linked Bank Account: ${bankInfo}
          - Current Bank Balance: ₦${Number(bankBalance).toLocaleString()}
          - Recent Bank Transactions:
          ${recentTxsText}

          User Query: "${queryText}"

          Rules:
          1. Answer accurately based on the business details above.
          2. Speak direct and helpful.
          3. If the merchant asks for their storefront link, give them: https://kudipay.com/store/${storefrontSlug} (format as a clean markdown link).
          4. Format all currency amounts in Naira (e.g. ₦1,250) rather than plain numbers.
        `,
      });

      return response.text || "Sorry, I couldn't generate a response.";
    } catch (err) {
      console.error("Dashboard AI Agent Error:", err);
      return "Sorry, I am having trouble connecting to the financial engine right now. Please try again later.";
    }
  }
};
