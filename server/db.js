// server/db.js
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const hasSslQuery = process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('sslmode=require') || process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('supabase'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction || hasSslQuery ? { rejectUnauthorized: false } : false,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
