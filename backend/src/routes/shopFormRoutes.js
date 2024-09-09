const express = require('express');
const { getDbPool } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  console.log('Request Body:', req.body);

  const pool = await getDbPool();
  const client = await pool.connect();
  try {
    const { businessId, menuTypes, specialDays, hours } = req.body;

    // Ensure that the values are arrays before converting them to JSON strings
    const parsedMenuTypes = Array.isArray(menuTypes) ? menuTypes : JSON.parse(menuTypes || '[]');
    const parsedSpecialDays = Array.isArray(specialDays) ? specialDays : JSON.parse(specialDays || '[]');
    const parsedHours = Array.isArray(hours) ? hours : JSON.parse(hours || '[]');

    // Insert into shop table
    const shopResult = await client.query(
      'INSERT INTO shop (business_id, shop_types, special_days, hours) VALUES ($1, $2, $3, $4) RETURNING id',
      [businessId, JSON.stringify(parsedMenuTypes), JSON.stringify(parsedSpecialDays), JSON.stringify(parsedHours)]
    );
    const shopId = shopResult.rows[0].id;

    res.status(200).json({ shopFormId: shopId });
  } catch (error) {
    console.error('Error submitting shop form:', error);
    res.status(500).json({ error: 'Error submitting shop form' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const { businessId, menuTypes, special_days, hours } = req.body;
  const pool = await getDbPool();
  const client = await pool.connect();

  try {
      // Ensure that menuTypes, special_days, and hours are parsed correctly
      const parsedMenuTypes = typeof menuTypes === 'string' ? JSON.parse(menuTypes) : menuTypes;
      const parsedSpecialDays = typeof special_days === 'string' ? JSON.parse(special_days) : special_days;
      const parsedHours = typeof hours === 'string' ? JSON.parse(hours) : hours;

      // Check if businessId is provided to update the existing entry
      if (businessId) {
          const result = await client.query(
              'UPDATE shop SET shop_types = $1, special_days = $2, hours = $3 WHERE business_id = $4',
              [JSON.stringify(parsedMenuTypes), JSON.stringify(parsedSpecialDays), JSON.stringify(parsedHours), businessId]
          );
          res.status(200).json({ message: 'Shop form updated successfully' });
      } else {
          res.status(400).json({ error: 'businessId is missing' });
      }
  } catch (error) {
      console.error('Error updating shop form:', error);
      res.status(500).json({ error: 'Error updating shop form' });
  } finally {
      client.release();
  }
});


module.exports = router;