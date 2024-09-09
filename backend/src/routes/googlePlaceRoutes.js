const express = require('express');
const axios = require('axios');

const router = express.Router();

//const GOOGLE_API_KEY = 'AIzaSyDTbjk-yo62bU2t2IGKCmb0AEgqtm2Pem0';
const GOOGLE_API_KEY = 'AIzaSyAGefyRhxQki08cpUEvDe4dTBh0N8YGArc';

console.log('Received request for Google Reviews, outside call');

router.get('/getGoogleReviews', async (req, res) => {
  console.log('Received request for Google Reviews, inside call');
  const { lat, lng, name } = req.query;

  if (!lat || !lng || !name) {
    console.log('Missing parameters');
    return res.status(400).send('Latitude, longitude, and name are required');
  }

  try {
    const encodedName = encodeURIComponent(name);
    const placeUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50&type=restaurant&keyword=${encodedName}&key=${GOOGLE_API_KEY}`;
    console.log(`Requesting Place ID for ${name} at ${lat}, ${lng}`);
    const placeResponse = await axios.get(placeUrl);
    console.log('Place ID response:', placeResponse.data);

    if (placeResponse.data.status !== 'OK') {
      console.error('Error in Place ID response:', placeResponse.data.status);
      return res.status(500).json({ error: placeResponse.data.status });
    }

    const place = placeResponse.data.results.find(place => place.name.toLowerCase().includes(name.toLowerCase()));
    console.log('Matching place:', place);

    if (!place) {
      return res.status(404).json({ error: 'Place not found' });
    }

    const placeId = place.place_id;
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${GOOGLE_API_KEY}`;
    console.log(`Requesting Place Details for Place ID: ${placeId}`);
    const detailsResponse = await axios.get(detailsUrl);
    console.log('Place details response:', detailsResponse.data);

    if (detailsResponse.data.status !== 'OK') {
      console.error('Error in Place details response:', detailsResponse.data.status);
      return res.status(500).json({ error: detailsResponse.data.status });
    }

    const { rating } = detailsResponse.data.result;
    return res.json({ place_id: placeId, rating });
  } catch (error) {
    console.error('Error fetching place details:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
