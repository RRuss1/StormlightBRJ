#!/usr/bin/env node
/**
 * ============================================================
 * db/migrate.js — Database Migration Runner
 * CYOAhub
 * ============================================================
 * Runs all pending SQL migrations against the Neon database.
 * Tracks which migrations have been applied in a _migrations table.
 *
 * Usage:
 *   DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" node db/migrate.js
 *
 * Options:
 *   --status    Show which migrations have been applied
 *   --rollback  (future) Roll back last migration
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  console.error('Usage: DATABASE_URL="postgresql://..." node db/migrate.js');
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Neon database.\n');

    // Ensure _migrations table exists (bootstrap)
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name        TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Check --status flag
    if (process.argv.includes('--status')) {
      const { rows } = await client.query('SELECT name, applied_at FROM _migrations ORDER BY name');
      if (rows.length === 0) {
        console.log('No migrations applied yet.');
      } else {
        console.log('Applied migrations:');
        rows.forEach(r => console.log(`  ✓ ${r.name}  (${r.applied_at.toISOString()})`));
      }
      await client.end();
      return;
    }

    // Get list of migration files
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found in db/migrations/');
      await client.end();
      return;
    }

    // Get already-applied migrations
    const { rows: applied } = await client.query('SELECT name FROM _migrations');
    const appliedSet = new Set(applied.map(r => r.name));

    // Run pending migrations
    let count = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  ⏭ ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`  ▶ Running ${file}...`);

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  ✓ ${file} applied.`);
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ✕ ${file} FAILED:`, err.message);
        console.error('    Migration halted. Fix the error and re-run.');
        break;
      }
    }

    if (count === 0) {
      console.log('\nAll migrations already applied. Database is up to date.');
    } else {
      console.log(`\n${count} migration(s) applied successfully.`);
    }

  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
