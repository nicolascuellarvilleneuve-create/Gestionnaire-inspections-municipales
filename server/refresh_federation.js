const { Client } = require('pg');
require('dotenv').config();

const DB_CONFIG = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'city_hub', // Connect to HUB
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
};

const SPOKES = [
    { name: 'city_industrie', schemaName: 'foreign_city_industrie' },
    { name: 'city_habitation', schemaName: 'foreign_city_habitation' },
    { name: 'city_permis', schemaName: 'foreign_city_permis' },
    { name: 'city_plans', schemaName: 'foreign_city_plans' }
];

async function refresh() {
    console.log(">>> REFRESHING FEDERATION LINKS (CITY_HUB)...");
    const client = new Client(DB_CONFIG);
    try {
        await client.connect();

        for (const spoke of SPOKES) {
            console.log(`\nImporting from ${spoke.name}...`);
            // We assume SERVER server_${spoke.name} already exists from setup_federation.js
            // Just re-import schema.

            // Drop tables/views if we want a clean slate? 
            // Better to LIMIT TO specific tables or just import all.
            // IMPORT FOREIGN SCHEMA public FROM SERVER ... INTO ... logic:
            // "If the remote table has the same name as an existing local foreign table, it is skipped unless..."

            // To ensure we get the new tables, we can drop the schema CASCADE (drastic) or try to import.
            // Let's drop the schema to be safe since we are in dev/prototype mode and want to ensure new tables appear.

            console.log(`   - Re-creating Schema ${spoke.schemaName}...`);
            await client.query(`DROP SCHEMA IF EXISTS ${spoke.schemaName} CASCADE;`);
            await client.query(`CREATE SCHEMA ${spoke.schemaName};`);

            const importQuery = `
                IMPORT FOREIGN SCHEMA public
                FROM SERVER server_${spoke.name}
                INTO ${spoke.schemaName};
            `;
            await client.query(importQuery);
            console.log(`   - ✅ Imported public tables into ${spoke.schemaName}`);
        }

    } catch (e) {
        console.error("Federation Refresh Error:", e);
    } finally {
        await client.end();
    }
}

refresh();
