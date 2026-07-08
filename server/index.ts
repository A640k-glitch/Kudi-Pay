import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// Raw body parser for webhook signature verification
app.use('/api/webhook/paystack', express.raw({ type: 'application/json' }));
app.use(express.json());

import { whatsappRouter } from './whatsapp';
app.use('/api/whatsapp', whatsappRouter);

// ── Webhooks ────────────────────────────────────────────────
app.post('/api/webhook/paystack', (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('PAYSTACK_SECRET_KEY not set');
    return res.status(500).send('Webhook error');
  }

  // Verify signature
  const hash = crypto.createHmac('sha512', secret).update(req.body).digest('hex');
  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body.toString());
  console.log('Received Paystack event:', event.event);

  // Here we would process the event, update order status, 
  // and record the transaction in the DB.
  
  res.status(200).send('Webhook received');
});

// ── Bank Proxy (Mono) ───────────────────────────────────────
app.get('/api/proxy/bank/transactions', async (req, res) => {
  const { accountId } = req.query;
  // In production, this would securely call the Mono API
  // using MONO_SECRET_KEY, fetching real transactions.
  res.json({
    status: 'success',
    message: 'Proxy placeholder for Mono transactions',
    data: []
  });
});

app.post('/api/proxy/bank/link', async (req, res) => {
  const { code } = req.body;
  // In production, exchange the temporary code for an accountId
  res.json({
    status: 'success',
    accountId: 'mono_acc_placeholder_123'
  });
});

// ── Identity Verification Proxy (Dojah) ─────────────────────
app.get('/api/proxy/kyc/bvn', async (req, res) => {
  const { bvn } = req.query;
  // In production, call Dojah API using DOJAH_APP_ID & DOJAH_PRIVATE_KEY
  res.json({
    status: 'success',
    message: 'Proxy placeholder for Dojah BVN'
  });
});

app.get('/api/proxy/kyc/nin', async (req, res) => {
  const { nin } = req.query;
  res.json({
    status: 'success',
    message: 'Proxy placeholder for Dojah NIN'
  });
});

app.get('/api/proxy/kyc/cac', async (req, res) => {
  const { rcNumber } = req.query;
  res.json({
    status: 'success',
    message: 'Proxy placeholder for Dojah CAC'
  });
});

// ── Score Computation Endpoint ──────────────────────────────
app.post('/api/score/compute', async (req, res) => {
  // In a real full-stack architecture, the server runs the 
  // trust score computation using secure DB data, not the client.
  res.json({
    status: 'success',
    score: 0,
    message: 'Trust score computation endpoint placeholder'
  });
});

app.listen(PORT, () => {
  console.log(`CODA_OS API Server running on port ${PORT}`);
});
