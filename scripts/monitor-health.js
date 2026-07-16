import http from 'http';
import https from 'https';

const url = process.argv[2] || process.env.API_HEALTH_URL || 'http://localhost:3001/api/health';

console.log(`\n\x1b[36m=== Kudi-Pay API Health Monitor ===\x1b[0m`);
console.log(`Checking: ${url}\n`);

const client = url.startsWith('https') ? https : http;

const startTime = Date.now();

const req = client.get(url, (res) => {
  const latency = Date.now() - startTime;
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.log(`\x1b[41m\x1b[37m FAILURE \x1b[0m HTTP Status: ${res.statusCode}`);
      console.log(`Error body: ${body.trim()}`);
      process.exit(1);
    }

    try {
      const data = JSON.parse(body);
      
      console.log(`\x1b[42m\x1b[30m SUCCESS \x1b[0m Server responded in ${latency}ms`);
      console.log(`------------------------------------------`);
      console.log(`Service Status : \x1b[32m${data.status?.toUpperCase() || 'OK'}\x1b[0m`);
      console.log(`Database Connection: ${data.db === 'connected' ? '\x1b[32mCONNECTED\x1b[0m' : '\x1b[31mDISCONNECTED\x1b[0m'}`);
      console.log(`Database Server Time: ${data.time || 'N/A'}`);
      console.log(`Service Engine Name: ${data.service || 'N/A'}`);
      console.log(`API Engine Version : v${data.version || '1.0'}`);
      console.log(`------------------------------------------\n`);

      if (data.db !== 'connected') {
        console.log(`\x1b[33mWarning: The database connection status is not active!\x1b[0m\n`);
        process.exit(1);
      }

      process.exit(0);
    } catch (e) {
      console.log(`\x1b[41m\x1b[37m INVALID RESPONSE \x1b[0m Failed to parse health check JSON`);
      console.log(`Raw output: ${body.trim()}`);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.log(`\x1b[41m\x1b[37m CONNECTION REFUSED \x1b[0m Could not connect to API server`);
  console.log(`Error: ${err.message}`);
  process.exit(1);
});

req.setTimeout(5000, () => {
  req.destroy();
  console.log(`\x1b[41m\x1b[37m TIMEOUT \x1b[0m Connection timed out after 5000ms`);
  process.exit(1);
});
