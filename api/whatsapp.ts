import express from 'express';
import { aiAgentService } from './aiAgent.js';

export const whatsappRouter = express.Router();

// Verification token for setting up the webhook with Meta
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'coda_os_whatsapp_verify_token';

/**
 * GET /api/whatsapp/webhook
 * Used by Meta to verify the webhook URL.
 */
whatsappRouter.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WhatsApp Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

/**
 * POST /api/whatsapp/webhook
 * Receives incoming messages from WhatsApp users.
 */
whatsappRouter.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0] &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
      const from = body.entry[0].changes[0].value.messages[0].from; // sender's phone number
      const msg_body = body.entry[0].changes[0].value.messages[0].text.body; // text message content

      console.log(`Received message from ${from}: ${msg_body}`);

      // In production, lookup the business using 'from' (phone number)
      // For now, mock data.
      const businessData = {
        name: "Test Business",
        score: 650,
        balance: 150000
      };

      // Call AI Agent asynchronously so we can quickly respond 200 OK to Meta
      (async () => {
        const responseText = await aiAgentService.processWhatsAppQuery(from, msg_body, businessData);
        await whatsappService.sendMessage(from, responseText);
      })();
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

/**
 * WhatsApp Service helper functions
 * For sending messages back to users.
 */
export const whatsappService = {
  async sendMessage(to: string, message: string) {
    const token = process.env.WHATSAPP_API_KEY;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      console.warn("WhatsApp credentials not configured. Message logged to console:");
      console.warn(`[To: ${to}] ${message}`);
      return;
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          text: { body: message },
        }),
      });

      if (!response.ok) {
        console.error("WhatsApp API Error:", await response.text());
      }
    } catch (err) {
      console.error("Failed to send WhatsApp message:", err);
    }
  },

  async sendTemplateMessage(to: string, templateName: string, languageCode = 'en') {
    const token = process.env.WHATSAPP_API_KEY;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) return;

    try {
      await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode }
          }
        }),
      });
    } catch (err) {
      console.error("Failed to send WhatsApp template:", err);
    }
  }
};
