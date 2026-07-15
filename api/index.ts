import type { IncomingMessage, ServerResponse } from 'http';

// Lazy-load the Express app so any module-level crash is catchable
// and returns useful JSON instead of FUNCTION_INVOCATION_FAILED
let _app: any = null;
let _loadError: { message: string; stack?: string } | null = null;

async function getApp() {
  if (_app) return _app;
  if (_loadError) return null;
  try {
    const mod = await import('./app');
    _app = mod.default;
    return _app;
  } catch (err: any) {
    _loadError = { message: err?.message ?? String(err), stack: err?.stack };
    console.error('[Vercel] Failed to load app module:', err);
    return null;
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();

  if (!app) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Server module failed to load',
      detail: _loadError?.message,
      stack: _loadError?.stack,
    }));
    return;
  }

  app(req, res);
}
