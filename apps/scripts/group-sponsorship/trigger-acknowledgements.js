/*
  Trigger acknowledgements for a list of donation IDs.

  Usage examples:
  - node trigger-acknowledgements.js --ids 101,102,103
  - node trigger-acknowledgements.js --file donation_ids.txt
  - node trigger-acknowledgements.js --ids 101 --test-mails test@example.com --cc-mails cc1@example.com,cc2@example.com

  Config via env vars (CLI flags override env):
  - API_BASE_URL: default 'http://localhost:8088/api'
  - TEST_MAILS: comma-separated list
  - CC_MAILS: comma-separated list
  - DELAY_MS: delay between requests (default 500)
*/

const fs = require('fs');
const path = require('path');

const DEFAULT_API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8088/api';
const DEFAULT_DELAY_MS = Number(process.env.DELAY_MS || 500);

function parseArgValue(flag) {
  const idx = process.argv.findIndex((a) => a === flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  const pref = `${flag}=`;
  const entry = process.argv.find((a) => a.startsWith(pref));
  if (entry) return entry.slice(pref.length);
  return undefined;
}

function parseList(val) {
  if (!val) return [];
  return val
    .split(/[\n,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function ensureFetch() {
  if (typeof fetch === 'undefined') {
    try {
      global.fetch = require('node-fetch');
    } catch (e) {
      console.error('fetch is not available. Install node-fetch or use Node 18+');
      console.error('npm install node-fetch');
      process.exit(1);
    }
  }
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body || {}),
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch (_) { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${res.statusText}`);
    err.response = json;
    throw err;
  }
  return json;
}

async function loadDonationIds() {
  const idsArg = parseArgValue('--ids');
  const fileArg = parseArgValue('--file');

  if (idsArg) {
    const ids = parseList(idsArg).map(Number).filter((n) => Number.isFinite(n));
    if (ids.length === 0) throw new Error('No valid donation IDs found in --ids');
    return ids;
  }

  if (fileArg) {
    const filePath = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg);
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const ids = parseList(content).map(Number).filter((n) => Number.isFinite(n));
    if (ids.length === 0) throw new Error('No valid donation IDs found in file');
    return ids;
  }

  throw new Error('Provide donation IDs via --ids "1,2,3" or --file path');
}

function getConfig() {
  const apiBase = parseArgValue('--api') || DEFAULT_API_BASE_URL;
  const testMails = parseList(parseArgValue('--test-mails') || process.env.TEST_MAILS);
  const ccMails = parseList(parseArgValue('--cc-mails') || process.env.CC_MAILS);
  const delayMs = Number(parseArgValue('--delay') || DEFAULT_DELAY_MS);
  return { apiBase, testMails, ccMails, delayMs };
}

async function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function triggerAcknowledgement(apiBase, donationId, testMails, ccMails) {
  const url = `${apiBase.replace(/\/$/, '')}/donations/requests/${donationId}/acknowledgement`;
  const payload = {};
  if (testMails && testMails.length) payload.test_mails = testMails;
  if (ccMails && ccMails.length) payload.cc_mails = ccMails;
  return postJson(url, payload);
}

async function main() {
  await ensureFetch();

  const ids = await loadDonationIds();
  const { apiBase, testMails, ccMails, delayMs } = getConfig();

  console.log('Starting acknowledgement trigger');
  console.log(`API: ${apiBase}`);
  if (testMails.length) console.log(`Test mails: ${testMails.join(', ')}`);
  if (ccMails.length) console.log(`CC mails: ${ccMails.join(', ')}`);
  console.log(`Donations to process: ${ids.join(', ')}`);

  const results = [];

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    process.stdout.write(`\n[${i + 1}/${ids.length}] Donation ${id} → `);
    try {
      const resp = await triggerAcknowledgement(apiBase, id, testMails, ccMails);
      console.log('OK');
      results.push({ donationId: id, success: true, response: resp });
    } catch (err) {
      const msg = err?.message || 'Unknown error';
      console.log(`FAIL (${msg})`);
      results.push({ donationId: id, success: false, error: msg, response: err?.response });
    }
    if (i < ids.length - 1 && delayMs > 0) await delay(delayMs);
  }

  const ok = results.filter((r) => r.success).length;
  const fail = results.length - ok;
  console.log(`\nDone. Success: ${ok}, Failed: ${fail}, Total: ${results.length}`);

  const outFile = path.join(__dirname, `ack-results-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ apiBase, testMails, ccMails, results }, null, 2));
  console.log(`Results saved to: ${outFile}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error('\nFatal:', e.message);
    process.exit(1);
  });
}