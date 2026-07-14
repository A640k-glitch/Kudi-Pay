import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { sendJSON, setCORS } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  if (req.method !== 'GET') return sendJSON(res, 405, { error: 'Method not allowed' });

  try {
    const url = new URL(req.url || '', 'http://localhost');
    const businessId = url.searchParams.get('businessId');

    if (!businessId) return sendJSON(res, 400, { error: 'businessId query parameter required' });

    const result = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'revenue' AND (verification_status = 'verified' OR verification_source = 'bank_api') THEN amount ELSE 0 END), 0) as revenue,
         COALESCE(SUM(CASE WHEN type = 'expense' AND (verification_status = 'verified' OR verification_source = 'bank_api') THEN amount ELSE 0 END), 0) as expenses
       FROM ledger_entries WHERE business_id = $1`,
      [businessId]
    );

    const { revenue, expenses } = result.rows[0];

    return sendJSON(res, 200, {
      revenue: Number(revenue),
      expenses: Number(expenses),
      profit: Number(revenue) - Number(expenses),
      balance: Number(revenue) - Number(expenses)
    });
  } catch (error) {
    console.error('ledger stats error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
