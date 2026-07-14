import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { sendJSON, setCORS, parseBody, requireAuth } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);

  return sendJSON(res, 405, { error: 'Method not allowed' });
}

async function handleList(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url || '', 'http://localhost');
    const businessId = url.searchParams.get('businessId');

    if (!businessId) return sendJSON(res, 400, { error: 'businessId query parameter required' });

    const result = await query(
      `SELECT * FROM ledger_entries WHERE business_id = $1 ORDER BY created_at DESC`,
      [businessId]
    );

    return sendJSON(res, 200, { entries: result.rows });
  } catch (error) {
    console.error('list ledger entries error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}

async function handleCreate(req: IncomingMessage, res: ServerResponse) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const body = await parseBody(req);
    const { type, amount, source, verificationStatus, verificationSource, bankTransactionId, metadata } = body;

    if (!type || !amount || !source) {
      return sendJSON(res, 400, { error: 'Type, amount, and source are required' });
    }

    const id = `ent_${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    const result = await query(
      `INSERT INTO ledger_entries (id, business_id, type, amount, source, verification_status, verification_source, bank_transaction_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, auth.businessId, type, amount, source, verificationStatus || 'pending', verificationSource || 'manual_unverified', bankTransactionId || null, metadata ? JSON.stringify(metadata) : '{}']
    );

    return sendJSON(res, 201, { entry: result.rows[0] });
  } catch (error) {
    console.error('create ledger entry error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
