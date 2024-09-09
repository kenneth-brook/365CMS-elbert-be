const { getDbPool } = require('../db');

async function fetchBusinessData(businessId) {
  const pool = await getDbPool();
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM businesses WHERE id = $1', [businessId]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

module.exports = { fetchBusinessData };
