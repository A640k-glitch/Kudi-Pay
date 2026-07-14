import type { IncomingMessage, ServerResponse } from 'http';
import { query } from '../_lib/db';
import { sendJSON, setCORS, parseBody } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCORS(res);
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  if (req.method !== 'POST') return sendJSON(res, 405, { error: 'Method not allowed' });

  try {
    const body = await parseBody(req);
    const { businessId, score } = body;

    if (!businessId || score === undefined) {
      return sendJSON(res, 400, { error: 'businessId and score are required' });
    }

    return sendJSON(res, 200, { status: 'success', score });
  } catch (error) {
    console.error('score compute error:', error);
    return sendJSON(res, 500, { error: 'Internal server error' });
  }
}
