const express = require('express');
const { getDbPool } = require('../db');

const router = express.Router();

// GET endpoint to fetch average costs based on the table
router.get('/', async (req, res) => {
  const table = req.query.table;
  if (!table) {
    return res.status(400).send('Table name is required');
  }

  try {
    const pool = await getDbPool();
    const client = await pool.connect();
    try {
      const result = await client.query(`SELECT * FROM ${table}`);
      res.status(200).json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error fetching average costs from table ${table}:`, error);
    res.status(500).send('Error fetching average costs');
  }
});

module.exports = router;
