import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { sendJSON, setCORS, parseBody } from '../_lib/auth';
import { generateOTP, sendOTP } from '../_lib/sms';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  if (req.method !== 'POST') return sendJSON(res, 405, { error: 'Method not allowed' });

  try {
    const { phone } = await parseBody(req);
    if (!phone) return sendJSON(res, 400, { error: 'Phone is required' });

    await query(`UPDATE otp_codes SET used = true WHERE phone = $1 AND used = false`, [phone]);

    const code = generateOTP();
    await query(
      `INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
      [phone, code]
    );

    await sendOTP(phone, code);

    return sendJSON(res, 200, { success: true });
  } catch (error) {
    console.error('request-otp error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
