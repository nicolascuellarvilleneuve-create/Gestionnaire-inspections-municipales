
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// CONFIG
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_PORT = process.env.DB_PORT || 5432;

// THE FEDERATION (The Heptagon)
const DATABASES = [
    { name: 'city_hub', schemaFile: '00_hub.sql', isHub: true },
    { name: 'city_industrie', schemaFile: '01_industrie.sql' },
    { name: 'city_habitation', schemaFile: '02_habitation.sql' },
    { name: 'city_permis', schemaFile: '06_permis.sql' },
    // Placeholders (Generic Structure)
    { name: 'city_commerce_service', schemaFile: '01_industrie.sql' },
    { name: 'city_commerce_gros_industrie', schemaFile: '01_industrie.sql' }, // Alias for clarity
    { name: 'city_public_institutionnel', schemaFile: '01_industrie.sql' },
    { name: 'city_recreation', schemaFile: '01_industrie.sql' },
    // Phase 4: Document Vault
    { name: 'city_plans', schemaFile: '08_plans.sql' }
];

async function createDatabase(dbName) {
    const client = new Client({ user: DB_USER, host: DB_HOST, password: DB_PASSWORD, port: DB_PORT, database: 'postgres' });
    try {
        await client.connect();
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
        if (res.rowCount === 0) {
            console.log(`[BUILD] Creating Database: ${dbName}...`);
            await client.query(`CREATE DATABASE "${dbName}"`);
        } else {
            console.log(`[SKIP] Database ${dbName} already exists.`);
        }
    } catch (e) {
        console.error(`ERROR creating ${dbName}:`, e.message);
    } finally {
        await client.end();
    }
}

async function applySchema(dbConfig) {
    const client = new Client({ user: DB_USER, host: DB_HOST, password: DB_PASSWORD, port: DB_PORT, database: dbConfig.name });
    try {
        await client.connect();

        let schemaPath = path.join(__dirname, '../docs/schemas', dbConfig.schemaFile);

        // Fallback for placeholders reusing industrie schema
        if (!fs.existsSync(schemaPath) && dbConfig.schemaFile === '01_industrie.sql') {
            schemaPath = path.join(__dirname, '../docs/schemas/01_industrie.sql');
        }

        if (fs.existsSync(schemaPath)) {
            console.log(`[SCHEMA] Applying ${dbConfig.schemaFile} to ${dbConfig.name}...`);
            const sql = fs.readFileSync(schemaPath, 'utf8');
            await client.query(sql);
            console.log(`   -> Success.`);
        }

        // Configure FDW Link on HUB
        if (dbConfig.isHub) {
            console.log("[HUB] Configuring Foreign Data Wrappers...");
            // Allow Hub to talk to itself (loopback) or others.
            // In a real FDW setup, we would loop through OTHERS here.
        }

    } catch (e) {
        // Ignore "relation already exists" errors for idempotency
        if (e.code !== '42P07') {
            console.error(`ERROR applying schema to ${dbConfig.name}:`, e.message);
        }
    } finally {
        await client.end();
    }
}

async function linkFederation() {
    console.log("\n[LINK] Establishing Fiber Optic Cables (FDW)...");
    const hubClient = new Client({ user: DB_USER, host: DB_HOST, password: DB_PASSWORD, port: DB_PORT, database: 'city_hub' });

    try {
        await hubClient.connect();

        // For every spoke, create a server link
        for (const db of DATABASES) {
            if (db.isHub) continue;

            console.log(`   -> Linking Hub to ${db.name}...`);
            try {
                // 1. Create Server Definition
                await hubClient.query(`
                    CREATE SERVER IF NOT EXISTS server_${db.name} 
                    FOREIGN DATA WRAPPER postgres_fdw 
                    OPTIONS (host 'localhost', dbname '${db.name}', port '5432');
                `);

                // 2. Create User Mapping
                await hubClient.query(`
                    CREATE USER MAPPING IF NOT EXISTS FOR ${DB_USER}
                    SERVER server_${db.name}
                    OPTIONS (user '${DB_USER}', password '${DB_PASSWORD}');
                `);

                // 3. Import Schema (Virtual Tables)
                await hubClient.query(`
                    CREATE SCHEMA IF NOT EXISTS foreign_${db.name};
                    IMPORT FOREIGN SCHEMA public 
                    FROM SERVER server_${db.name} 
                    INTO foreign_${db.name};
                `);
            } catch (e) {
                console.error(`      -> Link Failed: ${e.message}`);
            }
        }

    } finally {
        await hubClient.end();
    }
}

async function run() {
    console.log(">>> STARTING FEDERATION BUILD (The Heptagon)...");

    // 1. Create All DBs
    for (const db of DATABASES) {
        await createDatabase(db.name);
    }

    // 2. Apply Schemas
    for (const db of DATABASES) {
        await applySchema(db);
    }

    // 3. Link Them (FDW)
    await linkFederation(); // Step skipped in simplified run to avoid complexity if FDW ext missing, but included code.

    console.log("\n>>> CONSTRUCTION COMPLETE.");
}

run();
