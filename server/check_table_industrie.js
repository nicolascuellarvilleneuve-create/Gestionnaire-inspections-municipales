const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'city_industrie',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function check() {
    try {
        await client.connect();
        console.log("Connected to city_industrie.");

        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        console.log("Tables in public schema:");
        if (res.rows.length === 0) {
            console.log("  (No tables found)");
        } else {
            res.rows.forEach(r => console.log(`  - ${r.table_name}`));
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

check();
