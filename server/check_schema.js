const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'city_hub', // Connect to HUB
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function check() {
    await client.connect();
    console.log("Searching for 'adresses' table...");

    // 1. Check Information Schema
    const res = await client.query(`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name = 'adresses'
    `);

    if (res.rows.length === 0) {
        console.log("❌ 'adresses' table NOT FOUND in any schema.");
    } else {
        console.log("✅ FOUND in schemas:");
        res.rows.forEach(r => console.log(`   - ${r.table_schema}.${r.table_name}`));
    }

    // 2. Check Search Path
    const pathRes = await client.query("SHOW search_path");
    console.log(`\nCurrent search_path: ${pathRes.rows[0].search_path}`);

    await client.end();
}

check();
