const express = require('express');
const { getDbPool } = require('../db');

const router = express.Router();

const tableMap = {
  menu_types: 'eat_type',
  play_types: 'play_type',
  stay_types: 'stay_type',
  shop_types: 'shop_type',
};

// Function to fetch type names based on IDs
const fetchTypeNames = async (client, table, ids) => {
  const query = `
    SELECT id, name
    FROM ${table}
    WHERE id = ANY($1::int[])
  `;
  const result = await client.query(query, [ids]);
  return result.rows;
};

router.post('/fetch-type-names', async (req, res) => {
  const { typeCounts } = req.body;

  if (!typeCounts) {
    return res.status(400).send('Type counts are required');
  }

  try {
    const pool = await getDbPool();
    const client = await pool.connect();

    try {
      const result = {};
      for (const [typeKey, ids] of Object.entries(typeCounts)) {
        const table = tableMap[typeKey];
        if (table) {
          const typeNames = await fetchTypeNames(client, table, Object.keys(ids).map(Number));
          result[typeKey] = typeNames.reduce((acc, { id, name }) => {
            acc[id] = { name, count: ids[id] };
            return acc;
          }, {});
        }
      }

      res.status(200).json(result);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching type names:', error);
    res.status(500).send('Error fetching type names');
  }
});

module.exports = router;
