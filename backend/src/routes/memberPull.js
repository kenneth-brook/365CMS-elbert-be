const express = require('express');
const { getDbPool } = require('../db');

const router = express.Router();

// Function to join business data with other tables and filter where active and chamber_member are true
const joinWithBusinessesWhereActiveAndChamberMember = async (client, table) => {
  return client.query(`
    SELECT ${table}.*, businesses.*
    FROM ${table}
    INNER JOIN businesses ON ${table}.business_id = businesses.id
    WHERE businesses.active = true AND businesses.chamber_member = true
  `);
};

// GET all entries from all five dynamic tables, combine them, and order alphabetically
router.get('/all', async (req, res) => {
    const tables = ['eat', 'shop', 'stay', 'play', 'other'];
    const combinedResults = [];
  
    try {
      const pool = await getDbPool();
      const client = await pool.connect();
  
      try {
        // Loop through each table and fetch the joined data
        for (const table of tables) {
          const result = await joinWithBusinessesWhereActiveAndChamberMember(client, table);
          combinedResults.push(...result.rows); // Combine all results into a single array
        }
  
        // Sort combinedResults alphabetically by business_name (or replace with the appropriate field)
        combinedResults.sort((a, b) => {
          const nameA = a.business_name?.toLowerCase() || ''; // Use the relevant field here
          const nameB = b.business_name?.toLowerCase() || '';
          return nameA.localeCompare(nameB);
        });
  
        // Add CORS headers manually to the response
        res.setHeader('Access-Control-Allow-Origin', 'https://review.365dtm.com'); // or '*'
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
        res.status(200).json(combinedResults);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Error fetching data');
    }
  });
  

module.exports = router;
