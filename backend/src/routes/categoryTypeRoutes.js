const express = require('express');
const { getDbPool } = require('../db'); // Adjust the path to your db module if necessary

const router = express.Router();

// GET endpoint to fetch all category types
router.get('/', async (req, res) => {
    try {
        const pool = await getDbPool();
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM category_type');
            res.status(200).json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching category types:', error);
        res.status(500).send('Error fetching category types');
    }
});

module.exports = router;
