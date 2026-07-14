import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { sendJSON, setCORS, parseBody } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleSync(req, res);

  return sendJSON(res, 405, { error: 'Method not allowed' });
}

async function handleList(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url || '', 'http://localhost');
    const businessId = url.searchParams.get('businessId');

    if (!businessId) return sendJSON(res, 400, { error: 'businessId query parameter required' });

    const accountResult = await query(
      `SELECT id FROM bank_accounts WHERE business_id = $1 AND is_active = true`,
      [businessId]
    );

    if (accountResult.rows.length === 0) return sendJSON(res, 200, { transactions: [] });

    const accountId = accountResult.rows[0].id;
    const result = await query(
      `SELECT * FROM bank_transactions WHERE bank_account_id = $1 ORDER BY date DESC LIMIT 100`,
      [accountId]
    );

    return sendJSON(res, 200, { transactions: result.rows });
  } catch (error) {
    console.error('list transactions error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}

async function handleSync(req: IncomingMessage, res: ServerResponse) {
  try {
    const body = await parseBody(req);
    const { businessId } = body;

    if (!businessId) return sendJSON(res, 400, { error: 'businessId is required' });

    const accountResult = await query(
      `SELECT id, balance FROM bank_accounts WHERE business_id = $1 AND is_active = true`,
      [businessId]
    );

    if (accountResult.rows.length === 0) return sendJSON(res, 404, { error: 'No bank account found' });

    const account = accountResult.rows[0];
    const newCount = 1 + Math.floor(Math.random() * 4);
    let currentBalance = Number(account.balance);
    const newTransactions: any[] = [];

    const NAMES = ['ADEBAYO JOHNSON', 'CHIOMA OKAFOR', 'EMEKA NWOSU', 'FUNKE ADEYEMI'];
    const VENDORS = ['ALABA MARKET', 'BALOGUN TEXTILES', 'COMPUTER VILLAGE', 'SHOPRITE'];

    for (let i = 0; i < newCount; i++) {
      const isCredit = Math.random() < 0.65;
      const amount = Math.round((isCredit ? 2000 + Math.random() * 48000 : 1000 + Math.random() * 19000) / 500) * 500;

      if (!isCredit && currentBalance - amount < 5000) continue;
      currentBalance = isCredit ? currentBalance + amount : currentBalance - amount;

      const id = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const tx = {
        id,
        bank_account_id: account.id,
        type: isCredit ? 'credit' : 'debit',
        amount,
        narration: isCredit ? `TRF FRM ${NAMES[Math.floor(Math.random() * NAMES.length)]}` : `POS PURCHASE/${VENDORS[Math.floor(Math.random() * VENDORS.length)]}`,
        date: new Date().toISOString(),
        balance: currentBalance,
        category: isCredit ? 'Income' : 'Expense',
      };

      newTransactions.push(tx);
    }

    for (const tx of newTransactions) {
      await query(
        `INSERT INTO bank_transactions (id, bank_account_id, type, amount, narration, date, balance, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
        [tx.id, tx.bank_account_id, tx.type, tx.amount, tx.narration, tx.date, tx.balance, tx.category]
      );
    }

    await query(
      `UPDATE bank_accounts SET balance = $1, last_synced_at = NOW() WHERE id = $2`,
      [currentBalance, account.id]
    );

    return sendJSON(res, 200, { newCount: newTransactions.length, transactions: newTransactions });
  } catch (error) {
    console.error('sync transactions error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
