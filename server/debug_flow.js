const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const client = new Client({
    user: process.env.DB_USER, host: process.env.DB_HOST,
    database: 'city_hub', password: process.env.DB_PASSWORD, port: process.env.DB_PORT
});

async function runTest() {
    await client.connect();
    console.log("--- 1. AUTH TEST ---");
    const username = "debug_user_" + Date.now();
    const password = "debug_password";

    // Create
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    await client.query("INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'inspector')", [username, hash]);
    console.log(`Created user: ${username}`);

    // Verify
    const res = await client.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = res.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    console.log(`Login Check (${password} vs hash): ${match ? "✅ PASS" : "❌ FAIL"}`);

    console.log("\n--- 2. MAP DATA TEST ---");
    const query = `
        SELECT 
            h.id, 
            (a.numero_civique || ' ' || a.rue) as adresse_civique,
            ST_X(a.geom::geometry) as lng, 
            ST_Y(a.geom::geometry) as lat 
        FROM inspections_hub h
        JOIN adresses a ON h.address_id = a.id
        WHERE a.active_to IS NULL
        ORDER BY h.date_inspection DESC;
    `;
    const mapRes = await client.query(query);
    console.log(`Found ${mapRes.rowCount} inspections.`);
    if (mapRes.rowCount > 0) {
        console.log("Sample Row:", mapRes.rows[0]);
    } else {
        console.warn("⚠️ No inspections found for map!");
    }

    // Clean up user
    await client.query("DELETE FROM users WHERE username = $1", [username]);
    await client.end();
}
runTest();
