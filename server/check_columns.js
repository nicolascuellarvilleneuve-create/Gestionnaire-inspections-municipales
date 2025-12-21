const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'city_hub',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function check() {
    await client.connect();
    console.log("Checking columns for 'inspections_hub'...");

    const res = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'inspections_hub'
    `);

    console.log("COLUMNS FOUND:", res.rows.map(r => r.column_name));
    await client.end();
}

check();
