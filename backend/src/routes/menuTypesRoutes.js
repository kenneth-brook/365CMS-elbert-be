const express = require('express');
const { getDbPool } = require('../db');

const router = express.Router();

// GET endpoint to fetch all types for a given table
router.get('/', async (req, res) => {
  const { table } = req.query;

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
    console.error(`Error fetching types from table ${table}:`, error);
    res.status(500).send(`Error fetching types from table ${table}`);
  }
});

// POST endpoint to add a new type to a given table
router.post('/', async (req, res) => {
  const { name, table } = req.body;

  console.log('Received request to add new type:', { name, table });

  if (!name || !table) {
    return res.status(400).send('Name and table are required');
  }

  try {
    const pool = await getDbPool();
    const client = await pool.connect();
    try {
      const query = `INSERT INTO ${table} (name) VALUES ($1) RETURNING *`;
      const result = await client.query(query, [name]);
      console.log('New type added:', result.rows[0]);
      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error adding new type to table ${table}:`, error);
    res.status(500).send(`Error adding new type to table ${table}`);
  }
});

module.exports = router;
