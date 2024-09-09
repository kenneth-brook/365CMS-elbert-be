const express = require('express');
const router = express.Router();
const { checkJwt } = require('../middlewares/auth');
const { getDbPool } = require('../db');

// Middleware to check JWT
router.use(checkJwt);

router.post('/', async (req, res) => {
  let client;
  try {
      // Extract data from request body
      const {
          eventName, streetAddress, city, state, zipCode, latitude, longitude,
          startDate, endDate, startTime, endTime, description, phone, email,
          website, socialMediaPairs, logoUrl, imageUrls
      } = req.body;

      const pool = await getDbPool();
      client = await pool.connect();

      // Parse arrays
      const socialMediaArray = socialMediaPairs ? JSON.parse(socialMediaPairs) : [];
      const imageUrlsArray = imageUrls ? JSON.parse(imageUrls) : [];

      // Insert into events table
      const eventResult = await client.query(
          `INSERT INTO events (name, street_address, city, state, zip, lat, long, start_date, end_date, start_time, end_time, description, phone, email, web, social_platforms, logo, images) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
          RETURNING id`,
          [
              eventName, streetAddress, city, state, zipCode, 
              latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null, 
              startDate, endDate || null, startTime || null, endTime || null, 
              description, phone, email, website, 
              JSON.stringify(socialMediaArray), logoUrl || null, imageUrlsArray.length ? imageUrlsArray : null
          ]
      );

      const eventId = eventResult.rows[0].id;
      res.status(200).json({ eventId });
  } catch (error) {
      console.error('Error submitting event form:', error);
      res.status(500).json({ error: 'Error submitting event form' });
  } finally {
      if (client) client.release();
  }
});

router.put('/:id', async (req, res) => {
  let client;
  try {
      const {
          eventName, streetAddress, city, state, zipCode, latitude, longitude,
          startDate, endDate, startTime, endTime, description, phone, email,
          website, socialMediaPairs, logoUrl, imageUrls
      } = req.body;
      const { id } = req.params;

      const pool = await getDbPool();
      client = await pool.connect();

      // Parse arrays
      const socialMediaArray = socialMediaPairs ? JSON.parse(socialMediaPairs) : [];
      const imageUrlsArray = imageUrls ? JSON.parse(imageUrls) : [];

      // Update the existing event
      await client.query(
          `UPDATE events SET 
              name = $1, street_address = $2, city = $3, state = $4, zip = $5, lat = $6, long = $7,
              start_date = $8, end_date = $9, start_time = $10, end_time = $11, description = $12, 
              phone = $13, email = $14, web = $15, social_platforms = $16, logo = $17, images = $18
          WHERE id = $19`,
          [
              eventName, streetAddress, city, state, zipCode,
              latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null,
              startDate, endDate || null, startTime || null, endTime || null,
              description, phone, email, website,
              JSON.stringify(socialMediaArray), logoUrl || null, imageUrlsArray.length ? imageUrlsArray : null,
              id
          ]
      );

      res.status(200).json({ message: 'Event updated successfully' });
  } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: 'Error updating event' });
  } finally {
      if (client) client.release();
  }
});

router.delete('/:id', async (req, res) => {
  let client;
  try {
      const { id } = req.params; // Get event ID from URL parameters

      const pool = await getDbPool();
      client = await pool.connect();

      // Delete the event from the database
      const result = await client.query('DELETE FROM events WHERE id = $1', [id]);

      if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Event not found' });
      }

      res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Error deleting event' });
  } finally {
      if (client) client.release();
  }
});

module.exports = router;
