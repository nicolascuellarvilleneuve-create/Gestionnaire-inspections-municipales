const { Client } = require('pg');
require('dotenv').config();

const DB_CONFIG = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'city_hub',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
};

async function inspect() {
    const client = new Client(DB_CONFIG);
    try {
        await client.connect();
        console.log("Connected to city_hub.");

        const res = await client.query(`select definition from pg_views where viewname = 'lots'`);
        if (res.rows.length > 0) {
            console.log("View 'lots' definition:");
            console.log(res.rows[0].definition);
        } else {
            console.log("View 'lots' not found in pg_views. Checking Foreign Tables...");
            const ft = await client.query(`
                SELECT foreign_table_schema, foreign_table_name 
                FROM information_schema.foreign_tables 
                WHERE foreign_table_name = 'lots'
            `);
            if (ft.rows.length > 0) {
                console.log("It is a Foreign Table:", ft.rows[0]);
            } else {
                console.log("Not a View or Foreign Table.");
            }
        }

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.end();
    }
}

inspect();
