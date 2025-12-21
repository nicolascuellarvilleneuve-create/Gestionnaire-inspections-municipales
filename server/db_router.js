const { Client } = require('pg');
require('dotenv').config();

// CONFIG
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_PORT = process.env.DB_PORT || 5432;

// MAPPING: Form Type -> Specific Table Suffix
// e.g. 'industrie' -> 'foreign_city_industrie.inspection_details_industrie'
const TABLE_MAP = {
    'industrie': 'foreign_city_industrie.inspection_details_industrie',
    'habitation': 'foreign_city_habitation.inspection_details_habitation',
    'commerce': 'foreign_city_industrie.inspection_details_industrie', // FALLBACK: Commerce schema missing, using Industrie
    'public': 'foreign_city_industrie.inspection_details_industrie', // FALLBACK: Public schema missing, using Industrie
    'permis': 'foreign_city_permis.avis_permis'
};

class DatabaseRouter {
    constructor() {
        // Simple connection factory
    }

    // HELPER: Find or Create Address in city_geo_ref
    async _resolveAddressId(client, addressString, lat, lng) {
        // 1. Try to parse "123 Rue Principale"
        // This is a naive parser for the prototype. In prod, use standardizer.
        const parts = addressString.split(' ');
        const number = parts[0];
        const street = parts.slice(1).join(' ');

        // 2. Check Database (Active Address)
        const checkQuery = `
            SELECT id FROM adresses 
            WHERE numero_civique = $1 AND rue ILIKE $2 AND active_to IS NULL
            LIMIT 1;
        `;
        const res = await client.query(checkQuery, [number, `%${street}%`]);

        if (res.rows.length > 0) {
            return res.rows[0].id; // Found!
        }

        // 3. Fallback: Create "Provisional" Address
        // If we can't find it, we create it to respect the "Smart City" constraint.
        console.log(`[ROUTER] Auto-creating unknown address: ${addressString}`);

        // We also need a dummy LOT for this address to be valid.
        // For prototype, we create a placeholder lot if needed or link to a "Zero Lot".
        // Let's create a Provisionary Lot first.
        const lotQuery = `
            INSERT INTO lots (id, matricule, data_source, geom_quality, active_from)
            VALUES (gen_random_uuid(), 'PROV-' || gen_random_uuid(), 'manual_correction', 5, NOW())
            RETURNING id;
        `;
        const lotRes = await client.query(lotQuery);
        const lotId = lotRes.rows[0].id;

        const insertQuery = `
            INSERT INTO adresses (id, lot_id, numero_civique, rue, geom, active_from)
            VALUES (gen_random_uuid(), $1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), NOW())
            RETURNING id;
        `;
        const newAddr = await client.query(insertQuery, [lotId, number, street, lng || -77.78, lat || 48.09]);
        return newAddr.rows[0].id;
    }

    // HELPER: Find or Create Usage in city_codes
    async _resolveUsageId(client, typeString) {
        const checkQuery = `SELECT id FROM usages WHERE code ILIKE $1 LIMIT 1`;
        const res = await client.query(checkQuery, [typeString]);

        if (res.rows.length > 0) return res.rows[0].id;

        // Create if missing
        console.log(`[ROUTER] Auto-creating unknown usage: ${typeString}`);
        const insertQuery = `
            INSERT INTO usages (code, description) VALUES ($1, 'Auto-generated') RETURNING id;
        `;
        const newUsage = await client.query(insertQuery, [typeString || 'UNKNOWN']);
        return newUsage.rows[0].id;
    }

    async saveInspection(formData) {
        // 1. DETERMINE DESTINATION
        const rawType = (formData.type_activite || 'industrie').toLowerCase();

        // Map 'commerce' or 'public' to 'industrie' for now if specific tables don't exist yet?
        // Actually, let's strictly map basic types.
        let targetTable = TABLE_MAP['industrie'];
        if (rawType.includes('habitation')) targetTable = TABLE_MAP['habitation'];
        else if (rawType.includes('permis')) targetTable = TABLE_MAP['permis'];

        console.log(`[ROUTER] Routing inspection (${rawType}) to Table: ${targetTable}`);

        const client = new Client({ user: DB_USER, host: DB_HOST, password: DB_PASSWORD, port: DB_PORT, database: 'city_hub' });

        try {
            await client.connect();
            await client.query('BEGIN'); // Transaction

            // 2. INSERT INTO SPOKE TABLE (The Details)
            // Fix: Explicitly generate ID to avoid FDW "Not Null" issues if Default is not triggered
            const spokeQuery = `
                INSERT INTO ${targetTable} (id, raw_form_data, hub_ref_id)
                VALUES (gen_random_uuid(), $1, NULL) 
                RETURNING id;
            `;
            const spokeRes = await client.query(spokeQuery, [JSON.stringify(formData)]);
            const spokeId = spokeRes.rows[0].id;

            // 3. RESOLVE SMART IDs
            // Prefer component fields if available
            let addressString = formData.adresse;
            if (!addressString && formData.numero_civique && formData.nom_rue) {
                addressString = `${formData.numero_civique} ${formData.nom_rue}`;
            }
            addressString = addressString || "0 Unknown";

            const addressId = await this._resolveAddressId(client, addressString, formData.latitude, formData.longitude);
            const usageId = await this._resolveUsageId(client, rawType);

            // 4. INSERT INTO HUB (The Map)
            const hubQuery = `
                INSERT INTO inspections_hub 
                (address_id, usage_code_id, status_conformite, date_inspection, source_db, source_id, geom)
                VALUES ($1, $2, $3, NOW(), $4, $5, (SELECT geom FROM adresses WHERE id = $1))
                RETURNING id;
            `;
            await client.query(hubQuery, [
                addressId,
                usageId,
                'Conforme',
                targetTable, // e.g. 'inspection_details_industrie'
                spokeId
            ]);

            await client.query('COMMIT');
            console.log(`   -> Saved to ${targetTable} and Linked to Hub.`);
            return { success: true, id: spokeId };

        } catch (e) {
            await client.query('ROLLBACK');
            console.error(`[ROUTER] TRANSACTION FAILED:`, e.message);
            throw new Error(`Failed to save inspection: ${e.message}`);
        } finally {
            await client.end();
        }
    }

    async getInspectionById(hubId) {
        const client = new Client({ user: DB_USER, host: DB_HOST, password: DB_PASSWORD, port: DB_PORT, database: 'city_hub' });
        try {
            await client.connect();

            // 1. Get Hub Pointer
            const hubQuery = `
                SELECT source_db, source_id, address_id 
                FROM inspections_hub 
                WHERE id = $1
            `;
            const hubRes = await client.query(hubQuery, [hubId]);
            if (hubRes.rowCount === 0) throw new Error("Inspection not found");

            const { source_db, source_id } = hubRes.rows[0];

            // 2. Fetch Details from Spoke Table
            // source_db here holds the TABLE NAME (e.g. 'inspection_details_industrie') based on our save logic
            // Verify it is a valid table name to prevent injection
            const validTables = Object.values(TABLE_MAP);
            if (!validTables.includes(source_db)) {
                throw new Error("Invalid source table ref: " + source_db);
            }

            const detailQuery = `SELECT raw_form_data FROM ${source_db} WHERE id = $1`;
            const detailRes = await client.query(detailQuery, [source_id]);

            if (detailRes.rowCount === 0) {
                // Orphaned hub record?
                return null;
            }

            return detailRes.rows[0].raw_form_data;

        } catch (e) {
            console.error("[ROUTER] Detail Fetch Error:", e.message);
            throw e;
        } finally {
            await client.end();
        }
    }

    async deleteInspection(hubId) {
        const client = new Client({ user: DB_USER, host: DB_HOST, password: DB_PASSWORD, port: DB_PORT, database: 'city_hub' });
        try {
            await client.connect();

            // 1. Get Source Info
            const hubQuery = 'SELECT source_db, source_id FROM inspections_hub WHERE id = $1';
            const hubRes = await client.query(hubQuery, [hubId]);

            if (hubRes.rowCount === 0) return false; // Already gone

            const { source_db, source_id } = hubRes.rows[0];

            // 2. Delete from Spoke (If valid table)
            const validTables = Object.values(TABLE_MAP);
            if (validTables.includes(source_db)) {
                await client.query(`DELETE FROM ${source_db} WHERE id = $1`, [source_id]);
                console.log(`[ROUTER] Deleted spoke record from ${source_db}`);
            }

            // 3. Delete from Hub
            await client.query('DELETE FROM inspections_hub WHERE id = $1', [hubId]);
            console.log(`[ROUTER] Deleted hub record ${hubId}`);

            return true;
        } catch (e) {
            console.error("Delete Error:", e.message);
            throw e;
        } finally {
            await client.end();
        }
    }

    async getInspections() {
        console.log("[ROUTER] Fetching Map Data from Hub...");
        const client = new Client({ user: DB_USER, host: DB_HOST, password: DB_PASSWORD, port: DB_PORT, database: 'city_hub' });

        try {
            await client.connect();
            // JOIN with Geo Ref and Codes to get human readable data
            const query = `
                SELECT 
                    h.id, 
                    (a.numero_civique || ' ' || a.rue) as adresse, -- Alias for Dashboard
                    u.code as zone, -- Alias for Dashboard (Type/Use)
                    h.status_conformite as status, -- Alias for Dashboard
                    h.date_inspection as date, -- Alias for Dashboard
                    h.source_db,
                    'N/A' as proprietaire, -- Placeholder until Owner tables linked
                    ST_X(a.geom::geometry) as lng, 
                    ST_Y(a.geom::geometry) as lat 
                FROM inspections_hub h
                JOIN adresses a ON h.address_id = a.id
                JOIN usages u ON h.usage_code_id = u.id
                WHERE a.active_to IS NULL -- Only show active addresses
                ORDER BY h.date_inspection DESC;
            `;
            const res = await client.query(query);
            console.log(`[ROUTER] Found ${res.rowCount} points.`);
            return res.rows;
        } catch (e) {
            console.error("[ROUTER] Map Fetch Error:", e.message);
            throw new Error("Failed to load map data.");
        } finally {
            await client.end();
        }
    }
}

module.exports = new DatabaseRouter();
