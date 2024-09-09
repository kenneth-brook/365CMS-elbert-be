const express = require('express');
const { getDbPool } = require('../db');

const router = express.Router();

// GET endpoint to fetch all types for a given table
router.get('/', async (req, res) => {
  try {
    const pool = await getDbPool();
    const client = await pool.connect();
    try {
      const result = await client.query(`SELECT * FROM events`);
      res.status(200).json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error fetching types from table events:`, error);
    res.status(500).send(`Error fetching types from table events`);
  }
});

module.exports = router;
