const { Client } = require('pg');
require('dotenv').config();

// CONFIG
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_PORT = process.env.DB_PORT || 5432;

// MAPPING: Form Type -> Database Name
const DB_MAP = {
    'industrie': 'city_industrie', // or commerce_gros_industrie
    'habitation': 'city_habitation',
    'commerce': 'city_commerce_service',
    'public': 'city_public_institutionnel',
    'recreation': 'city_recreation',
    'permis': 'city_permis'
};

class DatabaseRouter {
    constructor() {
        // We will create clients on the fly or pool them. 
        // For simplicity in this phase, we create fresh connections per request 
        // to ensure we respect "Roadblocks" (Auth failures) instantly.
    }

    async saveInspection(formData) {
        // 1. DETERMINE DESTINATION
        // Default to industrie if unknown, or handle error
        // The form likely sends 'type_batiment' or similar.
        const type = (formData.type_activite || 'industrie').toLowerCase();
        let targetDb = DB_MAP['industrie']; // Default

        // Simple mapping logic (adjust based on exact string from dropdown)
        if (type.includes('habitation')) targetDb = DB_MAP['habitation'];
        else if (type.includes('commerce')) targetDb = DB_MAP['commerce'];
        else if (type.includes('public') || type.includes('institution')) targetDb = DB_MAP['public'];
        else if (type.includes('recreation')) targetDb = DB_MAP['recreation'];

        console.log(`[ROUTER] Routing inspection (${type}) to Vault: ${targetDb}`);

        // 2. CONNECT TO SPOKE (The Vault)
        const spokeClient = new Client({
            user: DB_USER, host: DB_HOST, password: DB_PASSWORD, port: DB_PORT,
            database: targetDb
        });

        let spokeId = null;

        try {
            await spokeClient.connect();

            // 3. INSERT INTO SPOKE
            // We use the Safety Bucket (raw_form_data) for almost everything.
            // We only extract specific columns if they exist in the logic.
            const query = `
                INSERT INTO inspection_details (raw_form_data, hub_ref_id)
                VALUES ($1, $2)
                RETURNING id;
            `;
            // Note: hub_ref_id is initially NULL, we update it later or generate UUID here.
            // Better approach: Generate UUID in Node.

            const res = await spokeClient.query(query, [JSON.stringify(formData), null]);
            spokeId = res.rows[0].id;
            console.log(`   -> Saved to Vault ${targetDb}. ID: ${spokeId}`);

        } catch (e) {
            console.error(`[ROUTER] FAILED to save to Vault ${targetDb}:`, e.message);
            throw new Error(`Roadblock: The ${type} database is offline or unreachable.`);
        } finally {
            await spokeClient.end();
        }

        // 4. CONNECT TO HUB (The Map)
        const hubClient = new Client({
            user: DB_USER, host: DB_HOST, password: DB_PASSWORD, port: DB_PORT,
            database: 'city_hub'
        });

        try {
            await hubClient.connect();

            // 5. INSERT INTO HUB
            // We need address and coordinates.
            const address = formData.adresse || "Adresse Inconnue";
            // coordinates usually come as { lat, lng } or similar
            // For now, defaulting to Montreal center if missing
            const lat = formData.latitude || 45.5017;
            const lng = formData.longitude || -73.5673;

            const hubQuery = `
                INSERT INTO inspections_hub (adresse_civique, type_batiment, status_conformite, date_inspection, source_db, source_id, geom)
                VALUES ($1, $2, $3, NOW(), $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326))
                RETURNING id;
            `;

            await hubClient.query(hubQuery, [
                address,
                type,
                'Conforme', // Default, should extract from form
                targetDb,
                spokeId,
                lng, lat
            ]);

            console.log(`   -> Linked to Map (Hub).`);

        } catch (e) {
            console.error(`[ROUTER] FAILED to update Map:`, e.message);
            // Critical decision: Do we rollback the spoke? 
            // For now, we assume Spoke success is priority. Map can be synced later.
        } finally {
            await hubClient.end();
        }

        return { success: true, id: spokeId };
    }
}

module.exports = new DatabaseRouter();
