const express = require('express');
const router = express.Router();
const { ensureDatabaseSchema } = require('../db/initialSetup');
console.log("Setup route handler for /setup is now active");

router.get('/', async (req, res) => {
    console.log("Received request at /setup");
    try {
        await ensureDatabaseSchema();
        res.status(200).json({ message: 'Setup completed successfully' });
    } catch (error) {
        console.error('Setup failed:', error);
        res.status(500).json({ message: 'Setup failed', error: error.message });
    }
});

module.exports = router;
