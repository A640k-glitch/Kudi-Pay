import { GoogleGenAI } from '@google/genai';
import { bankAccountService } from './bankAccountService';
import { trustScoreService } from './trustScoreService';

/**
 * Client-side AI Agent Service for the Dashboard Chat Widget.
 * Note: Exposing the API key to the client is dangerous in production.
 * In Phase 2, this will route through the Express server.
 */

export const dashboardAgentService = {
  async processQuery(businessId: string, query: string) {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.";
    }

    const ai = new GoogleGenAI({ apiKey });

    // Gather context
    const txs = await bankAccountService.getTransactions(businessId);
    const scoreSnapshots = trustScoreService.getSnapshots(businessId);
    const latestScore = scoreSnapshots.length > 0 ? scoreSnapshots[scoreSnapshots.length - 1].score : 0;
    
    const recentTxs = txs.slice(0, 5).map(t => `${t.date}: ${t.type === 'credit' ? '+' : '-'}${t.amount} (${t.narration})`).join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5',
        contents: `
          You are Kudi, the AI financial assistant for Kudi OS. You are embedded in the user's dashboard.
          You help them understand their finances, trust score, and loan eligibility.
          
          Context for this user:
          - Current Trust Score: ${latestScore}/1000
          - Recent Bank Transactions:
          ${recentTxs}

          User Query: "${query}"

          Keep your response concise, helpful, and direct. Format numbers beautifully. Do not invent data. If you don't know, suggest they check their dashboard tabs.
        `,
      });
      
      return response.text;
    } catch (err) {
      console.error("Client AI Agent Error:", err);
      return "Sorry, I encountered an error analyzing your data.";
    }
  }
};
