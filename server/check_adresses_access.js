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
    console.log("Attempting SELECT FROM adresses...");
    try {
        const res = await client.query("SELECT * FROM adresses LIMIT 1");
        console.log(`✅ Success. Rows: ${res.rowCount}`);
        if (res.rowCount > 0) console.log(res.rows[0]);
    } catch (e) {
        console.log("❌ Select Failed:", e.message);
    }
    await client.end();
}

check();
