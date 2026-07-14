import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initSchema } from '../api/_lib/db';

const PORT = process.env.PORT || 3001;

initSchema().then(() => {
  console.log('Database schema initialized');
}).catch(err => {
  console.error('Schema initialization failed:', err.message);
});

app.listen(PORT, () => {
  console.log(`Kudi API Server running on http://localhost:${PORT}`);
});
