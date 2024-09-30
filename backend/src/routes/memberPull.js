const express = require('express');
const { getDbPool } = require('../db');

const router = express.Router();

const tableConfig = {
  eat: { typesField: 'menu_types', typeTable: 'eat_type' },
  shop: { typesField: 'shop_types', typeTable: 'shop_type' },
  stay: { typesField: 'stay_types', typeTable: 'stay_type' },
  play: { typesField: 'play_types', typeTable: 'play_type' },
  other: { typesField: 'other_types', typeTable: 'other_type' },
};

// Existing function remains unchanged
const joinWithBusinessesWhereActiveAndChamberMember = async (client, table) => {
  const { typesField, typeTable } = tableConfig[table];

  return client.query(`
    SELECT ${table}.*, businesses.*, COALESCE(types.type_names, '[]'::json) AS types
    FROM ${table}
    INNER JOIN businesses ON ${table}.business_id = businesses.id
    LEFT JOIN LATERAL (
      SELECT json_agg(type.name) AS type_names
      FROM ${typeTable} AS type
      JOIN LATERAL jsonb_array_elements_text(${table}.${typesField}) AS elem(id)
        ON type.id::text = elem.id
    ) AS types ON true
    WHERE businesses.active = true AND businesses.chamber_member = true
  `);
};

// New function for the shop table
const joinWithBusinessesWhereActive = async (client) => {
  const table = 'shop';
  const { typesField, typeTable } = tableConfig[table];

  return client.query(`
    SELECT ${table}.*, businesses.*, COALESCE(types.type_names, '[]'::json) AS types
    FROM ${table}
    INNER JOIN businesses ON ${table}.business_id = businesses.id
    LEFT JOIN LATERAL (
      SELECT json_agg(type.name) AS type_names
      FROM ${typeTable} AS type
      JOIN LATERAL jsonb_array_elements_text(${table}.${typesField}) AS elem(id)
        ON type.id::text = elem.id
    ) AS types ON true
    WHERE businesses.active = true
  `);
};

// Existing /all endpoint remains unchanged
router.get('/all', async (req, res) => {
  const tables = ['eat', 'shop', 'stay', 'play', 'other'];
  const combinedResults = [];

  try {
    const pool = await getDbPool();
    const client = await pool.connect();

    try {
      for (const table of tables) {
        const result = await joinWithBusinessesWhereActiveAndChamberMember(client, table);

        const { typesField } = tableConfig[table];

        result.rows.forEach(row => {
          row.category = table;
          row.types = row.types || [];
          delete row[typesField]; // Remove the original typesField if desired
        });

        combinedResults.push(...result.rows);
      }

      combinedResults.sort((a, b) => {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });

      res.status(200).json(combinedResults);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  }
});

// New /shop endpoint
router.get('/shop', async (req, res) => {
  try {
    const pool = await getDbPool();
    const client = await pool.connect();

    try {
      const result = await joinWithBusinessesWhereActive(client);

      const table = 'shop';
      const { typesField } = tableConfig[table];

      result.rows.forEach(row => {
        row.category = table;
        row.types = row.types || [];
        delete row[typesField]; // Remove the original typesField if desired
      });

      // Optionally sort the results by name
      result.rows.sort((a, b) => {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });

      res.status(200).json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  }
});

module.exports = router;
