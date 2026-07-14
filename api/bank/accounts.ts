import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { sendJSON, setCORS, parseBody, requireAuth } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handleLink(req, res);

  return sendJSON(res, 405, { error: 'Method not allowed' });
}

async function handleGet(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url || '', 'http://localhost');
    const businessId = url.searchParams.get('businessId');

    if (!businessId) return sendJSON(res, 400, { error: 'businessId query parameter required' });

    const result = await query(
      `SELECT * FROM bank_accounts WHERE business_id = $1 AND is_active = true`,
      [businessId]
    );

    return sendJSON(res, 200, { account: result.rows[0] || null });
  } catch (error) {
    console.error('get account error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}

async function handleLink(req: IncomingMessage, res: ServerResponse) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const body = await parseBody(req);

    const NIGERIAN_BANKS = [
      { name: 'GTBank', code: '058' },
      { name: 'Access Bank', code: '044' },
      { name: 'Zenith Bank', code: '057' },
      { name: 'First Bank', code: '011' },
      { name: 'UBA', code: '033' },
      { name: 'Fidelity Bank', code: '070' },
    ];

    const bank = body.institutionCode
      ? NIGERIAN_BANKS.find(b => b.code === body.institutionCode) || NIGERIAN_BANKS[Math.floor(Math.random() * NIGERIAN_BANKS.length)]
      : NIGERIAN_BANKS[Math.floor(Math.random() * NIGERIAN_BANKS.length)];

    const bizResult = await query(`SELECT business_name FROM businesses WHERE id = $1`, [auth.businessId]);
    const bizName = bizResult.rows[0]?.business_name || 'Kudi BUSINESS';

    const accountId = `acc_${Date.now()}`;
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const result = await query(
      `INSERT INTO bank_accounts (id, business_id, institution, institution_code, account_number, account_name, paystack_dva)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        accountId, auth.businessId, bank.name, bank.code, accountNumber, bizName.toUpperCase(),
        JSON.stringify({ bankName: 'Wema Bank', accountNumber: Math.floor(7000000000 + Math.random() * 999999999).toString(), accountName: `Kudi/${bizName.toUpperCase()}` })
      ]
    );

    return sendJSON(res, 201, { account: result.rows[0] });
  } catch (error) {
    console.error('link account error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
