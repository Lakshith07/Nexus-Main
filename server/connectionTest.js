// server/connectionTest.js
const db = require('./db');

async function testConnection() {
  try {
    const result = await db.query('SELECT 1 AS test');
    console.log('PostgreSQL connection successful:', result.rows[0]);
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } finally {
    // End the pool to exit the process (optional)
    if (db.pool) {
      await db.pool.end();
    }
  }
}

testConnection();
