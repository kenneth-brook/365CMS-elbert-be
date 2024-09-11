const { Pool } = require('pg');
const { getDatabaseCredentials } = require('../config/index');

let dbPool = null;

async function getDbPool() {
    if (!dbPool) {
        const secret = await getDatabaseCredentials();
        dbPool = new Pool({
            user: secret.username,
            password: secret.password,
            host: 'elbert-db.cx7nkm5j7v6b.us-east-1.rds.amazonaws.com',
            database: 'elbert-easy-flow',
            port: 5432,
            ssl: { rejectUnauthorized: false } // specify CA in production
        });
    }
    return dbPool;
}

module.exports = { getDbPool };
