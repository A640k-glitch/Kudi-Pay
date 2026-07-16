import express from 'express';
import crypto from 'crypto';
import { aiAgentService } from './aiAgent.js';

export const whatsappRouter = express.Router();

// Verification token for setting up the webhook with Meta
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'kudi_verify_token';

/**
 * Middleware to verify request signature from Meta (WhatsApp)
 */
function verifyWhatsAppSignature(req: express.Request, res: express.Response, next: express.NextFunction) {
  const signature = req.headers['x-hub-signature-256'] as string;
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  // Bypassed if app secret is not set (convenient for local dev/testing)
  if (!appSecret) {
    return next();
  }

  if (!signature) {
    return res.status(401).send('Missing signature');
  }

  try {
    const elements = signature.split('=');
    const signatureHash = elements[1];
    const payload = JSON.stringify(req.body);
    const expectedHash = crypto.createHmac('sha256', appSecret).update(payload).digest('hex');

    if (signatureHash !== expectedHash) {
      return res.status(401).send('Signature mismatch');
    }
  } catch (err) {
    console.error('[WhatsApp Signature] Verification failed:', err);
    return res.status(401).send('Signature verification failed');
  }

  next();
}

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
whatsappRouter.post('/webhook', verifyWhatsAppSignature, (req, res) => {
  const body = req.body;

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0] &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const changeValue = body.entry[0].changes[0].value;
      const message = changeValue.messages[0];
      const from = message.from; // sender's phone number
      const msg_body = message.text?.body; // text message content with optional chaining

      // If it's a non-text message (e.g. image, document, location), skip processing
      if (!msg_body) {
        console.log(`Received non-text WhatsApp message from ${from}`);
        return res.sendStatus(200);
      }

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
