import { initSchema } from './_lib/db';

initSchema().catch(err => {
  console.error('[Vercel] Schema init failed at cold start:', err);
});

import app from '../server/app';
export default app;
