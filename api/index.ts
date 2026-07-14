import { initSchema } from './_lib/db';
import app from '../server/app';

initSchema().catch(err => {
  console.error('[Vercel] Schema init failed at cold start:', err);
});

export default app;
