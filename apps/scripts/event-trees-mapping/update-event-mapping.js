#!/usr/bin/env node

/**
 * Update trees.event_id by sapling_id list.
 * - Supports providing event_id directly or resolving by event name.
 * - Reads DB creds from .env (defaults to apps/api/.env).
 *
 * Usage examples:
 *   node update-event-mapping.js --sapling-ids 1001,1002,1003 --event-id 42
 *   node update-event-mapping.js --sapling-ids 1001 1002 1003 --event-name "Company Day 2024"
 *   node update-event-mapping.js --file ./saplings.txt --event-name "CSR Week" --dry-run
 *   node update-event-mapping.js --file ./saplings.csv --csv --column sapling_id --event-id 10 --env ../../api/.env
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

function printHelp() {
  console.log(`\nUpdate trees.event_id by sapling_id list\n\nOptions:\n  --sapling-ids <list>     Comma or space-separated sapling IDs\n  --file <path>            File containing sapling IDs (txt: one per line; csv: use --csv and --column)\n  --csv                     Treat input file as CSV\n  --column <name>          CSV column name for sapling IDs (default: sapling_id)\n  --event-id <id>          Event ID to assign\n  --event-name <name>      Event name to lookup (resolves to latest matching by exact name; use --ilike for case-insensitive partial)\n  --ilike                  Use ILIKE %%name%% for event lookup (partial match)\n  --dry-run                Show what would change without updating\n  --env <path>             Path to .env (default: ../../api/.env from this script)\n  --strict-ssl             Enforce strict SSL (reject self-signed certs). Default: false\n  --help                   Show help\n`);
}

function parseArgs(argv) {
  const args = {
    saplingIds: [],
    file: null,
    csv: false,
    column: 'sapling_id',
    eventId: null,
    eventName: null,
    ilike: false,
    dryRun: false,
    envPath: path.resolve(__dirname, '../../api/.env'),
    strictSsl: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--sapling-ids': {
        const v = next();
        if (!v) throw new Error('--sapling-ids requires a value');
        const parts = v.split(/[,\s]+/).filter(Boolean);
        args.saplingIds.push(...parts);
        break;
      }
      case '--file': args.file = next(); break;
      case '--csv': args.csv = true; break;
      case '--column': args.column = next() || 'sapling_id'; break;
      case '--event-id': args.eventId = Number(next()); break;
      case '--event-name': args.eventName = next(); break;
      case '--ilike': args.ilike = true; break;
      case '--dry-run': args.dryRun = true; break;
      case '--env': args.envPath = path.resolve(process.cwd(), next()); break;
      case '--strict-ssl': args.strictSsl = true; break;
      case '--help': printHelp(); process.exit(0);
      default: {
        // allow space-separated sapling IDs after --sapling-ids, or positional list
        if (/^\d/.test(a)) args.saplingIds.push(a);
        else {
          console.warn(`Unknown arg: ${a}`);
        }
      }
    }
  }
  return args;
}

function loadEnv(envPath) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`[INFO] Loaded env from ${envPath}`);
  } else {
    dotenv.config();
    console.log('[INFO] Loaded env from process environment');
  }
}

function validateEnv() {
  // If a connection string is provided, we can skip granular checks
  const conn = process.env.pg_str || process.env.PG_STR || process.env.DATABASE_URL;
  if (conn && String(conn).length > 0) return;

  // Otherwise, verify discrete fields. Accept reader creds if primary user not set.
  const required = ['POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_PD'];
  const missing = required.filter((k) => !process.env[k] || String(process.env[k]).length === 0);

  const hasUser = !!(process.env.POSTGRES_USER && String(process.env.POSTGRES_USER).length > 0) ||
                  !!(process.env.POSTGRES_READER_USER && String(process.env.POSTGRES_READER_USER).length > 0);

  if (!hasUser) missing.push('POSTGRES_USER|POSTGRES_READER_USER');

  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(', ')}. Provide pg_str or the required fields in .env`);
  }
}

async function getPool() {
  let connStr = process.env.pg_str || process.env.PG_STR || process.env.DATABASE_URL;
  const strict = process.env.STRICT_SSL === 'true';
  // Mirror API behavior: allow self-signed unless strict SSL is requested
  const ssl = strict ? { rejectUnauthorized: true } : { rejectUnauthorized: false };

  // Also set Node's global TLS behavior when not strict to avoid self-signed errors
  if (!strict) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  if (connStr && String(connStr).length > 0) {
    if (!strict) {
      // Normalize sslmode to no-verify when not strict, aligning with rejectUnauthorized:false
      if (connStr.includes('sslmode=verify-full') || connStr.includes('sslmode=verify-ca') || connStr.includes('sslmode=require')) {
        connStr = connStr.replace(/sslmode=(verify-full|verify-ca|require)/, 'sslmode=no-verify');
      } else if (!/[\?&]sslmode=/.test(connStr)) {
        connStr += (connStr.includes('?') ? '&' : '?') + 'sslmode=no-verify';
      }
    }
    return new Pool({ connectionString: connStr, ssl, max: 5 });
  }
  const user = process.env.POSTGRES_USER || process.env.POSTGRES_READER_USER;
  const password = process.env.POSTGRES_PD || process.env.POSTGRES_READER_PD;
  const database = process.env.POSTGRES_DB || 'defaultdb';
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user,
    password,
    database,
    ssl,
    max: 5,
  });
  return pool;
}

async function resolveEventId(client, name, ilike) {
  if (!name) return null;
  const schema = process.env.POSTGRES_SCHEMA ? `"${process.env.POSTGRES_SCHEMA}".` : '';
  if (ilike) {
    const { rows } = await client.query(
      `SELECT id, name, event_date FROM ${schema}events WHERE name ILIKE $1 ORDER BY event_date DESC NULLS LAST, id DESC LIMIT 1`,
      [`%${name}%`]
    );
    return rows[0]?.id || null;
  } else {
    const { rows } = await client.query(
      `SELECT id, name, event_date FROM ${schema}events WHERE name = $1 ORDER BY id DESC LIMIT 1`,
      [name]
    );
    return rows[0]?.id || null;
  }
}

function readSaplingIdsFromFile(filePath, csv, column) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  if (!csv) {
    // plain text: one per line
    return content
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  // simple CSV parser for one column (no quotes/escapes handling to keep script lightweight)
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const idx = headers.indexOf(column);
  if (idx === -1) throw new Error(`Column '${column}' not found in CSV header: ${headers.join(', ')}`);
  const ids = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const v = (cols[idx] || '').trim();
    if (v) ids.push(v);
  }
  return ids;
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.file && args.saplingIds.length === 0) {
    printHelp();
    console.error('\n[ERROR] Provide --sapling-ids or --file');
    process.exit(1);
  }
  if (!args.eventId && !args.eventName) {
    printHelp();
    console.error('\n[ERROR] Provide --event-id or --event-name');
    process.exit(1);
  }

  loadEnv(args.envPath);
  // Map CLI --strict-ssl to env var used by getPool without overwriting existing setting
  if (args.strictSsl && process.env.STRICT_SSL !== 'true') {
    process.env.STRICT_SSL = 'true';
  }
  validateEnv();

  // Collect sapling IDs
  let saplingIds = [...args.saplingIds];
  if (args.file) {
    const fromFile = readSaplingIdsFromFile(args.file, args.csv, args.column);
    saplingIds.push(...fromFile);
  }
  saplingIds = [...new Set(saplingIds.map(String))];
  if (saplingIds.length === 0) {
    console.error('[ERROR] No sapling IDs to process');
    process.exit(1);
  }

  console.log(`[INFO] Sapling IDs: ${saplingIds.length}`);

  const pool = await getPool();
  const client = await pool.connect();

  try {
    // Set schema if provided
    if (process.env.POSTGRES_SCHEMA) {
      await client.query(`SET search_path TO "${process.env.POSTGRES_SCHEMA}"`);
      console.log(`[INFO] search_path set to ${process.env.POSTGRES_SCHEMA}`);
    } else {
      // If connection string has schema search_path in query, pg will handle it; otherwise default remains.
    }

    await client.query('BEGIN');

    // Resolve event ID if needed
    let eventId = args.eventId || null;
    if (!eventId && args.eventName) {
      eventId = await resolveEventId(client, args.eventName, args.ilike);
      if (!eventId) {
        throw new Error(`Event not found for name: ${args.eventName}`);
      }
      console.log(`[INFO] Resolved event '${args.eventName}' -> id=${eventId}`);
    }

    // Verify which sapling_ids exist
    const { rows: existing } = await client.query(
      'SELECT sapling_id FROM trees WHERE sapling_id = ANY($1::text[])',
      [saplingIds]
    );
    const existingSet = new Set(existing.map((r) => String(r.sapling_id)));
    const missing = saplingIds.filter((id) => !existingSet.has(String(id)));

    if (missing.length) {
      console.warn(`[WARN] ${missing.length} sapling_id(s) not found and will be skipped:`, missing.slice(0, 20).join(', '), missing.length > 20 ? '...' : '');
    }

    if (args.dryRun) {
      console.log(`[DRY-RUN] Would update trees.event_id=${eventId} for ${existingSet.size} tree(s)`);
      await client.query('ROLLBACK');
      return;
    }

    const { rows: updated } = await client.query(
      `UPDATE trees SET event_id = $1 WHERE sapling_id = ANY($2::text[]) RETURNING id, sapling_id, event_id`,
      [eventId, Array.from(existingSet)]
    );

    await client.query('COMMIT');

    console.log(`[SUCCESS] Updated ${updated.length} tree(s) to event_id=${eventId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[ERROR]', err.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('[FATAL]', e);
  process.exit(1);
});