const express = require('express');
const { getDbPool } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  console.log('Request Body:', req.body);

  const pool = await getDbPool();
  const client = await pool.connect();
  try {
    const { businessId, menuTypes, averageCost } = req.body;

    // Ensure that the values are arrays before converting them to JSON strings
    const parsedMenuTypes = Array.isArray(menuTypes) ? menuTypes : JSON.parse(menuTypes || '[]');

    // Insert into stay table
    const stayResult = await client.query(
      'INSERT INTO stay (business_id, stay_types, cost) VALUES ($1, $2, $3) RETURNING id',
      [businessId, JSON.stringify(parsedMenuTypes), averageCost]
    );
    const stayId = stayResult.rows[0].id;

    res.status(200).json({ stayFormId: stayId });
  } catch (error) {
    console.error('Error submitting stay form:', error);
    res.status(500).json({ error: 'Error submitting stay form' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const { businessId, menuTypes, averageCost } = req.body;
  const pool = await getDbPool();
  const client = await pool.connect();

  try {
      // Ensure that menuTypes are parsed correctly
      const parsedMenuTypes = typeof menuTypes === 'string' ? JSON.parse(menuTypes) : menuTypes;

      // Check if businessId is provided to update the existing entry
      if (businessId) {
          const result = await client.query(
              'UPDATE stay SET stay_types = $1, cost = $2 WHERE business_id = $3',
              [JSON.stringify(parsedMenuTypes), averageCost, businessId]
          );
          res.status(200).json({ message: 'Stay form updated successfully' });
      } else {
          res.status(400).json({ error: 'businessId is missing' });
      }
  } catch (error) {
      console.error('Error updating stay form:', error);
      res.status(500).json({ error: 'Error updating stay form' });
  } finally {
      client.release();
  }
});

module.exports = router;