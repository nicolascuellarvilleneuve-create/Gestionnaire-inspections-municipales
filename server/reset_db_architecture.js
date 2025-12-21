const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'city_hub',
    password: process.env.DB_PASSWORD || 'admin',
    port: process.env.DB_PORT || 5432,
});

async function runSQL(filePath) {
    const fullPath = path.join(__dirname, '..', 'docs', 'schemas', filePath);
    console.log(`Applying: ${filePath}...`);
    try {
        const sql = fs.readFileSync(fullPath, 'utf8');
        await pool.query(sql);
        console.log(`✅ Success: ${filePath}`);
    } catch (err) {
        console.error(`❌ Error details for ${filePath}:`, err.message);
        // We don't throw here to allow partial success in some dev scenarios, 
        // but for a reset we ideally want to stop. 
        // Let's analyze: if DROP fails because table doesn't exist, that's fine.
        // But CREATE failures are bad.
        if (!err.message.includes('does not exist')) {
            throw err;
        }
    }
}

async function resetDatabase() {
    try {
        console.log("🔥 INITIATING DATABASE RESET & ARCHITECTURE UPGRADE 🔥");

        // 1. DROP EVERYTHING (Clean Slate)
        // We do this manually to ensure no lingering constraints block us.
        console.log("Dropping old tables...");
        await pool.query(`
            DROP VIEW IF EXISTS v_current_rules CASCADE;
            DROP VIEW IF EXISTS v_active_lots CASCADE;
            DROP TABLE IF EXISTS conformity_snapshots CASCADE;
            DROP TABLE IF EXISTS regulatory_rules CASCADE;
            DROP TABLE IF EXISTS usages CASCADE;
            DROP TABLE IF EXISTS zones CASCADE;
            DROP TABLE IF EXISTS inspections_hub CASCADE;
            DROP TABLE IF EXISTS adresses CASCADE;
            DROP TABLE IF EXISTS lot_owners CASCADE;
            DROP TABLE IF EXISTS proprietaires CASCADE;
            DROP TABLE IF EXISTS lots CASCADE;
            -- Spoke Tables (Simulated as they are in same DB for this prototype)
            DROP TABLE IF EXISTS inspection_details_industrie CASCADE; 
            DROP TABLE IF EXISTS inspection_details_habitation CASCADE; 
            DROP TABLE IF EXISTS avis_permis CASCADE;
            DROP TABLE IF EXISTS validations_professionnelles CASCADE;
            DROP TABLE IF EXISTS documents_urbanisme CASCADE;
            DROP TABLE IF EXISTS security_audit_log CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
        `);

        // 2. APPLY SCHEMAS IN ORDER (Dependency Order)

        // Pillar 1: Geo Ref (The Land)
        await runSQL('09_geo_ref.sql');

        // Pillar 2: City Codes (The Law)
        await runSQL('10_codes.sql');

        // Pillar 3: Central Hub (The Ledger)
        // Note: 00_hub.sql also creates the 'users' table.
        await runSQL('00_hub.sql');

        // Spoke DBs (The Details)
        await runSQL('01_industrie.sql');
        await runSQL('02_habitation.sql');
        await runSQL('06_permis.sql');
        await runSQL('08_plans.sql');

        console.log("✅ DATABASE ARCHITECTURE SUCCESSFULLY UPGRADED!");
        console.log("Ready for Smart Regulation & Temporal Geomatics.");

    } catch (err) {
        console.error("🚨 CRITICAL FAILURE:", err);
    } finally {
        await pool.end();
    }
}

resetDatabase();
