const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'city_hub',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function runDiagnostics() {
    try {
        console.log("🩺 STARTING DATABASE DIAGNOSTICS...");
        await client.connect();

        // 1. CHECK TABLE EXISTENCE
        const tablesToCheck = [
            'lots', 'adresses', 'proprietaires', // Geo Ref
            'usages', 'zones', 'regulatory_rules', // Codes
            'inspections_hub', 'users', // Hub
            'inspection_details_industrie', 'inspection_details_habitation', // Spokes
            'avis_permis', 'documents_urbanisme'
        ];

        console.log("\n📦 CHECKING TABLES:");
        for (const table of tablesToCheck) {
            const res = await client.query(`SELECT to_regclass('${table}') as exists;`);
            const exists = res.rows[0].exists !== null;
            console.log(`   - ${table}: ${exists ? '✅ OK' : '❌ MISSING'}`);
        }

        // 2. CHECK FOREIGN KEYS (Hub -> Geo/Codes)
        console.log("\n🔗 CHECKING CONSTRAINTS:");
        const fkQuery = `
            SELECT kcu.column_name, ccu.table_name AS foreign_table_name
            FROM information_schema.key_column_usage AS kcu
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = kcu.constraint_name
            WHERE kcu.table_name = 'inspections_hub';
        `;
        const fks = await client.query(fkQuery);
        fks.rows.forEach(fk => {
            console.log(`   - Hub.${fk.column_name} references ${fk.foreign_table_name} ✅`);
        });

        // 3. PERFORMANCE (Indexes)
        console.log("\n🚀 CHECKING SPATIAL INDEXES:");
        const idxQuery = `
            SELECT tablename, indexname, indexdef 
            FROM pg_indexes 
            WHERE indexdef LIKE '%gist%';
        `;
        const indexes = await client.query(idxQuery);
        indexes.rows.forEach(idx => {
            console.log(`   - ${idx.tablename} has spatial index: ${idx.indexname} ✅`);
        });

        console.log("\n✅ DIAGNOSTICS COMPLETE.");

    } catch (err) {
        console.error("❌ DIAGNOSTIC FAILURE:", err);
    } finally {
        await client.end();
    }
}

runDiagnostics();
