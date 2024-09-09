const express = require('express');
const { getDbPool } = require('../db'); // Ensure correct path to your DB connection module

const router = express.Router();

// GET endpoint to fetch user details from the login table, excluding password
router.get('/', async (req, res) => {
  try {
    const pool = await getDbPool();  // Get the DB pool
    const client = await pool.connect();  // Connect to the database
    try {
      // Select relevant columns but exclude the password
      const result = await client.query('SELECT id, email, role FROM login');
      res.status(200).json(result.rows);  // Send the users' data as JSON
    } finally {
      client.release();  // Release the client connection
    }
  } catch (error) {
    console.error('Error fetching users from login table:', error);
    res.status(500).send('Error fetching users');
  }
});

module.exports = router;
