import { GoogleGenAI } from '@google/genai';

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
      
      return response.text;
    } catch (err) {
      console.error("AI Agent Error:", err);
      return "Sorry, I am having trouble connecting to the financial engine right now. Please try again later.";
    }
  }
};
