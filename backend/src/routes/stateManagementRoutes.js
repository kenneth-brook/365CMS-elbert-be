const express = require('express');
const router = express.Router();
const { getDbPool } = require('../db');

router.get('/', async (req, res) => {
    try {
        const pool = await getDbPool();
        const client = await pool.connect();
        try {
            // Attempt to fetch data to check table existence
            await client.query('SELECT 1 FROM users LIMIT 1');
            await client.query('SELECT 1 FROM posts LIMIT 1');

            // If above queries pass, fetch actual data
            const users = await client.query('SELECT * FROM users');
            const posts = await client.query('SELECT * FROM posts');
            res.status(200).json({ users: users.rows, posts: posts.rows });
        } catch (error) {
            if (error.message.includes('does not exist')) {
                // If error message indicates missing tables, return this specific message
                res.status(200).json({ message: "No tables yet, but connection good." });
            } else {
                // For all other errors, return a generic error message
                throw error;
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching state:', error);
        res.status(500).json({ message: 'Error fetching state', error: error.message });
    }
});

module.exports = router;
