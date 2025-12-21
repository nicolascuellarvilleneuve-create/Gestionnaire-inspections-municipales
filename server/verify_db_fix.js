const { Client } = require('pg');
require('dotenv').config();

const DB_CONFIG = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'city_hub',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
};

async function verify() {
    const client = new Client(DB_CONFIG);
    try {
        await client.connect();
        console.log("Connected to city_hub.");

        const query = `
            INSERT INTO foreign_city_industrie.inspection_details_industrie (id, raw_form_data) 
            VALUES (gen_random_uuid(), '{"test": true}') 
            RETURNING id;
        `;

        console.log("Running Query:", query);
        const res = await client.query(query);
        console.log("✅ Success! ID:", res.rows[0].id);

    } catch (e) {
        console.error("❌ Failed:", e.message);
    } finally {
        await client.end();
    }
}

verify();
