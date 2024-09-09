const express = require('express');
const { getDbPool } = require('../db');

const router = express.Router();

// Function to join business data with other tables
const joinWithBusinesses = async (client, table) => {
  return client.query(`
    SELECT ${table}.*, businesses.*
    FROM ${table}
    INNER JOIN businesses ON ${table}.business_id = businesses.id
  `);
};

// GET all entries
router.get('/:table', async (req, res) => {
  const { table } = req.params;
  try {
    const pool = await getDbPool();
    const client = await pool.connect();
    try {
      const result = await joinWithBusinesses(client, table);
      res.status(200).json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error fetching data from table ${table}:`, error);
    res.status(500).send('Error fetching data');
  }
});

// GET entry by ID
router.get('/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  try {
    const pool = await getDbPool();
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT ${table}.*, businesses.*
        FROM ${table}
        INNER JOIN businesses ON ${table}.business_id = businesses.id
        WHERE ${table}.id = $1
      `, [id]);
      if (result.rows.length === 0) {
        return res.status(404).send('Entry not found');
      }
      res.status(200).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error fetching data from table ${table} by ID ${id}:`, error);
    res.status(500).send('Error fetching data');
  }
});

module.exports = router;
