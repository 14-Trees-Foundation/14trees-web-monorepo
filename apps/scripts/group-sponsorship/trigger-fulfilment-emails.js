/*
  Trigger final fulfilment emails for a list of donation IDs.

  Usage examples:
  - node trigger-fulfilment-emails.js --ids 5200,5201
  - node trigger-fulfilment-emails.js --file donation_ids.txt
  - node trigger-fulfilment-emails.js --ids 5200 \
      --event default \
      --email-sponsor true --email-recipient false --email-assignee false \
      --test-mails qa@example.com \
      --sponsor-cc cc1@example.com,cc2@example.com \
      --recipient-cc rcc@example.com \
      --assignee-cc acc@example.com \
      --user-id 13124 \
      --api http://localhost:8088/api

  Config via env vars (CLI flags override env):
  - API_BASE_URL: default 'http://localhost:8088/api'
  - USER_ID: optional header x-user-id
  - TEST_MAILS, SPONSOR_CC, RECIPIENT_CC, ASSIGNEE_CC: comma-separated lists
  - EVENT_TYPE: default 'default'
  - EMAIL_SPONSOR, EMAIL_RECIPIENT, EMAIL_ASSIGNEE: booleans (default: true,false,false)
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
    .split(/[\n,;\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBool(val, fallback) {
  if (val === undefined || val === null || val === '') return fallback;
  const v = String(val).toLowerCase();
  if (["true","1","yes","y"].includes(v)) return true;
  if (["false","0","no","n"].includes(v)) return false;
  return fallback;
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

async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
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
  const userId = parseArgValue('--user-id') || process.env.USER_ID;
  const testMails = parseList(parseArgValue('--test-mails') || process.env.TEST_MAILS);
  const sponsorCC = parseList(parseArgValue('--sponsor-cc') || process.env.SPONSOR_CC);
  const recipientCC = parseList(parseArgValue('--recipient-cc') || process.env.RECIPIENT_CC);
  const assigneeCC = parseList(parseArgValue('--assignee-cc') || process.env.ASSIGNEE_CC);
  const eventType = parseArgValue('--event') || process.env.EVENT_TYPE || 'default';
  const emailSponsor = parseBool(parseArgValue('--email-sponsor') ?? process.env.EMAIL_SPONSOR, true);
  const emailRecipient = parseBool(parseArgValue('--email-recipient') ?? process.env.EMAIL_RECIPIENT, false);
  const emailAssignee = parseBool(parseArgValue('--email-assignee') ?? process.env.EMAIL_ASSIGNEE, false);
  const delayMs = Number(parseArgValue('--delay') || DEFAULT_DELAY_MS);
  return { apiBase, userId, testMails, sponsorCC, recipientCC, assigneeCC, eventType, emailSponsor, emailRecipient, emailAssignee, delayMs };
}

async function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function triggerFulfilment(apiBase, donationId, cfg) {
  const url = `${apiBase.replace(/\/$/, '')}/donations/emails/send`;
  const payload = {
    donation_id: donationId,
    test_mails: cfg.testMails,
    sponsor_cc_mails: cfg.sponsorCC,
    recipient_cc_mails: cfg.recipientCC,
    assignee_cc_mails: cfg.assigneeCC,
    event_type: cfg.eventType,
    email_sponsor: cfg.emailSponsor,
    email_recipient: cfg.emailRecipient,
    email_assignee: cfg.emailAssignee,
  };
  const headers = {};
  if (cfg.userId) headers['x-user-id'] = String(cfg.userId);
  return postJson(url, payload, headers);
}

async function main() {
  await ensureFetch();

  const ids = await loadDonationIds();
  const cfg = getConfig();

  console.log('Starting fulfilment email trigger');
  console.log(`API: ${cfg.apiBase}`);
  if (cfg.userId) console.log(`x-user-id: ${cfg.userId}`);
  console.log(`Event: ${cfg.eventType}`);
  console.log(`Email flags → sponsor:${cfg.emailSponsor} recipient:${cfg.emailRecipient} assignee:${cfg.emailAssignee}`);
  if (cfg.testMails.length) console.log(`Test mails: ${cfg.testMails.join(', ')}`);
  if (cfg.sponsorCC.length) console.log(`Sponsor CC: ${cfg.sponsorCC.join(', ')}`);
  if (cfg.recipientCC.length) console.log(`Recipient CC: ${cfg.recipientCC.join(', ')}`);
  if (cfg.assigneeCC.length) console.log(`Assignee CC: ${cfg.assigneeCC.join(', ')}`);
  console.log(`Donations to process: ${ids.join(', ')}`);

  const results = [];

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    process.stdout.write(`\n[${i + 1}/${ids.length}] Donation ${id} → `);
    try {
      const resp = await triggerFulfilment(cfg.apiBase, id, cfg);
      console.log('OK');
      results.push({ donationId: id, success: true, response: resp });
    } catch (err) {
      const msg = err?.message || 'Unknown error';
      console.log(`FAIL (${msg})`);
      results.push({ donationId: id, success: false, error: msg, response: err?.response });
    }
    if (i < ids.length - 1 && cfg.delayMs > 0) await delay(cfg.delayMs);
  }

  const ok = results.filter((r) => r.success).length;
  const fail = results.length - ok;
  console.log(`\nDone. Success: ${ok}, Failed: ${fail}, Total: ${results.length}`);

  const outFile = path.join(__dirname, `fulfilment-results-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ ...cfg, results }, null, 2));
  console.log(`Results saved to: ${outFile}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error('\nFatal:', e.message);
    process.exit(1);
  });
}