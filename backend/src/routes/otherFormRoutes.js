const express = require('express');
const { getDbPool } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  console.log('Request Body:', req.body);

  const pool = await getDbPool();
  const client = await pool.connect();
  try {
    const { businessId, menuTypes } = req.body;

    // Ensure that the values are arrays before converting them to JSON strings
    const parsedMenuTypes = Array.isArray(menuTypes) ? menuTypes : JSON.parse(menuTypes || '[]');

    // Insert into play table
    const otherResult = await client.query(
      'INSERT INTO other (business_id, other_types) VALUES ($1, $2) RETURNING id',
      [businessId, JSON.stringify(parsedMenuTypes)]
    );
    const otherId = otherResult.rows[0].id;

    res.status(200).json({ otherFormId: otherId });
  } catch (error) {
    console.error('Error submitting other form:', error);
    res.status(500).json({ error: 'Error submitting other form' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const { businessId, menuTypes } = req.body;
  const pool = await getDbPool();
  const client = await pool.connect();

  try {
      // Ensure that menuTypes, special_days, and hours are parsed correctly
      const parsedMenuTypes = typeof menuTypes === 'string' ? JSON.parse(menuTypes) : menuTypes;

      // Check if businessId is provided to update the existing entry
      if (businessId) {
          const result = await client.query(
              'UPDATE other SET other_types = $1 WHERE business_id = $2',
              [JSON.stringify(parsedMenuTypes), businessId]
          );
          res.status(200).json({ message: 'Other form updated successfully' });
      } else {
          res.status(400).json({ error: 'businessId is missing' });
      }
  } catch (error) {
      console.error('Error updating other form:', error);
      res.status(500).json({ error: 'Error updating other form' });
  } finally {
      client.release();
  }
});


module.exports = router;