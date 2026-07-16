# Kudi — Embedded-Finance Commerce OS
## Complete platform for Nigerian micro-merchants

Kudi is a premium digital storefront and embedded-finance platform tailored for small businesses in Nigeria. It allows merchants to create online shops, record manual sales, scan receipt invoices via AI, track credit health scores, and unlock tiered loans based on active trade activity.

---

## Brand Details
- **Brand Name**: Kudi
- **Logo Symbol**: An interlocking double-loop geometric emblem representing the cycle between merchant sales (commerce) and scoring history (banking).
- **Core Theme Color**: Primary Indigo (`#312E81`), Success Emerald (`#059669`), and Warm White base canvas (`#F5F5F4`).
- **Typography**: Arial Rounded MT Bold is used for an approachable yet bold display aesthetic.
- **Design Philosophy**: High-end, premium modernist layout with asymmetrical elements and bold structural containers.

---

## Features Built
1. **Level 0-3 Onboarding**: Phone and password signup with OTP verification.
2. **Instant Storefront Generator**: Business profiling form with real-time storefront slug links.
3. **Interactive Merchant Dashboard**: Features a 70% Capital Readiness progress ring, live balance totals, quick actions, and recent storefront orders tracking.
4. **AI Receipt Scanner**: Ingests raw invoice images, letting users edit parsed vendor fields and post expenses directly to the transaction ledger.
5. **Trust Score Factor Breakdown**: Interactive Dial (`640 / 1000`) showing the weighted credit scores of the business.
6. **Progressive Loans Marketplace**: Tiers 1-5 micro-business loans with instant disbursement simulation and repayments.
7. **WhatsApp Assistant Simulator**: Interactive chat interface enabling merchants to log transactions or query profits by typing text commands.

---

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the application:
   `npm run dev`
3. View the app:
   `http://localhost:3000`

---

## Health Monitoring

Kudi includes a built-in API and database connection health check script. You can run this script to verify that the Express backend server is active and the PostgreSQL database is connected.

### Running the Health Check

Run the monitor script with:
```bash
node scripts/monitor-health.js
```

### Specifying a Custom Target URL

By default, the script checks the local development API at `http://localhost:3001/api/health`. To test a production Vercel deployment or another endpoint, pass the URL as a command line argument or set the `API_HEALTH_URL` environment variable:

```bash
# Pass as CLI argument:
node scripts/monitor-health.js https://your-production-domain.vercel.app/api/health

# Or set env variable:
API_HEALTH_URL=https://your-production-domain.vercel.app/api/health node scripts/monitor-health.js
```
