import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
dotenv.config();

async function test() {
  const models = [
    'gemini-2.5-flash'
  ];

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  for (const m of models) {
    console.log(`\n--- Testing model: ${m} ---`);
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents: 'Say Hello',
      });
      console.log(`✅ Success with ${m}:`, response.text?.trim());
      return; // Stop on first success
    } catch (e: any) {
      console.error(`❌ Failed with ${m}:`, e.message || e);
    }
  }
}

test();
