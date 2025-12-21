
const pdf = require('pdf-parse');
const proj4 = require('proj4');
const { Client } = require('pg');
const multer = require('multer');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// CONFIG
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_PORT = process.env.DB_PORT || 5432;

// HELPER: DB Client
const getHubClient = () => new Client({
    user: DB_USER, host: DB_HOST, password: DB_PASSWORD, port: DB_PORT,
    database: 'city_hub'
});

// PROJ4 DEFINITIONS
// SCOPQ Zone 9 (NAD83) - EPSG:32189
proj4.defs("EPSG:32189", "+proj=tmerc +lat_0=0 +lon_0=-76.5 +k=0.9999 +x_0=304800 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
// WGS84 (Web)
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

const AuditController = {

    // 1. SESSION START: Upload PDF -> Extract Data
    // NOTE: Does NOT save file. Processing is transient.
    async startSession(req, res) {
        if (!req.file) {
            return res.status(400).json({ error: "Aucun fichier PDF fourni." });
        }

        try {
            console.log(`[AUDIT] Assessing Plan: ${req.file.originalname}`);

            // A. TEXT PARSING (Metadata)
            let pdfParser = pdf;

            console.log("PDF Lib Initial Type:", typeof pdf);

            // Try to unwrap if it's an object (CommonJS/ESM interop issues)
            if (typeof pdfParser !== 'function') {
                if (pdfParser && typeof pdfParser.default === 'function') {
                    console.log("Found .default function, using it.");
                    pdfParser = pdfParser.default;
                }
            }

            if (typeof pdfParser !== 'function') {
                const debugType = typeof pdf;
                const debugKeys = pdf ? Object.keys(pdf).join(',') : 'null';
                console.error(`CRITICAL: pdf-parse is ${debugType} with keys [${debugKeys}]`);
                throw new Error(`Internal PDF Library Error: Loaded as ${debugType} keys:[${debugKeys}]`);
            }

            const dataBuffer = req.file.buffer;
            const pdfData = await pdfParser(dataBuffer);
            const text = pdfData.text;

            // B. REGEX EXTRACTION
            // 1. Find Lot Number (e.g., "LOT(S) : 6 693 027" or "Lot 1 234 567")
            // Matches: "Lot" or "LOT(S)", optional colon, then digits with spaces
            const lotMatch = text.match(/(?:LOT(?:\(S\))?|Lot)\s*[:#]?\s*(\d[\d\s]{3,})/i);
            const lotNumber = lotMatch ? lotMatch[1].replace(/\s/g, '') : null;

            // 2. Find Surveyor
            // Strategy: Full Text Scan for Isolated Uppercase Name candidates.
            // Text analysis showed the name can appear far AFTER the title in the stream.
            let surveyor = "Non détecté";

            // Split ALL text into lines
            const allLines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

            // STRICT BLACKLIST (Terms found in the file that look like names but aren't)
            const globalBlacklist = [
                /ARPENTEUR/i, /G[ÉE]OM/i, /LOCALISATION/i, /CERTIFICAT/i, /IMPLANTATION/i,
                /R[ÈE]GLEMENT/i, /ZONAGE/i, /VILLE/i, /MUNICIPALIT[ÉE]/i, /CADASTRE/i,
                /MINUTE/i, /GREFFE/i, /DOSSIER/i, /PROJET/i, /L[ÉE]GENDE/i, /STATIONNEMENT/i,
                /MATR[ÄA]/i, /GESTION/i, /CONSTRUCTION/i, /INC\./i, // Company names
                /SCOPQ/i, /NAD\s*83/i, /FUSEAU/i, /SYST[ÈE]ME/i,
                /ZONE/i, /INDUSTRIELLE/i, /CONTRAINTE/i, /B[ÂA]TIMENT/i,
                /MARGE/i, /[ÉE]CHELLE/i, /REQU[ÉE]RANT/i, /ADRESSE/i, /PROPRI[ÉE]TAIRE/i,
                /Sign[ée]/i, /Signature/i, /Vraie\s+copie/i, /Original/i, /Matricule/i,
                /Val\-d'Or/i, /Montr[ée]al/i, /Qu[ée]bec/i, // Cities
                /CIRCONSCRIPTION/i, /FONCI[ÈE]RE/i, /ABITIBI/i, // Land Registry Headers
                /GEOPOSITION/i, /OAGQ/i, // Firm/Stamp info
                /,\s*le\s+\d/i, // Date patterns
                /Av\./i, /Boul\./i, /Rue\s+/i, /Avenue/i, // Addresses
                /CI[- ]HAUT/i, /MENTIONN[ÉE]/i, // "L'arpentage ci-haut mentionné..."
                /^PAR$/i, /^DE$/i, /^ET$/i, // Stop words
                /^\d+$/, // Numbers
                /^[.,;:\-\[\]]+$/ // Symbols
            ];

            const candidates = [];

            for (let i = 0; i < allLines.length; i++) {
                const line = allLines[i];
                // 1. Must be reasonably short (Names aren't sentences)
                if (line.length < 5 || line.length > 40) continue;

                // 2. Must be UPPERCASE letters and spaces (mostly)
                if (/[a-z]/.test(line)) continue;

                // 3. Must NOT match Blacklist
                if (globalBlacklist.some(rx => rx.test(line))) continue;

                // 4. Must look like a name (At least 2 parts)
                const parts = line.split(/\s+/).filter(p => p.length > 1);
                if (parts.length < 2 || parts.length > 5) continue;

                // 5. Must NOT contain numbers
                if (/\d/.test(line)) continue;

                // Store candidate with its original line index
                candidates.push({ text: line, index: i });
            }

            // DEBUG
            console.log(`[AUDIT] Global Name Candidates:`, candidates);

            // Selection Logic: Pick candidate CLOSEST to the "ARPENTEUR-GÉOMÈTRE" title line
            if (candidates.length > 0) {
                const titleIdx = allLines.findIndex(l => /ARPENTEUR[\- ]?G[ÉE]OM/.test(l.toUpperCase()));

                if (titleIdx !== -1) {
                    // Find candidate with min line distance to titleIdx
                    // We prefer candidates AFTER the title usually (signature block), but visually
                    // "MATTHIEU MAURO" (113) is after Title (93).
                    // "CIRCONSCRIPTION" (74) is before.

                    let bestCand = candidates[0];
                    let minDist = 9999;

                    for (const cand of candidates) {
                        const dist = Math.abs(cand.index - titleIdx);
                        if (dist < minDist) {
                            minDist = dist;
                            bestCand = cand;
                        }
                    }
                    surveyor = bestCand.text;
                } else {
                    surveyor = candidates[0].text;
                }
            } else {
                // Fallback: Try regex for "Par:" again
                const parMatch = text.match(/\bPar\s*[:\.]\s*([A-Z\.\-\s]{5,})/i);
                if (parMatch) surveyor = parMatch[1].trim();
            }

            // Final Cleanup
            surveyor = surveyor.replace(/[.,;:]+$/, '').trim();

            // Final Cleanup
            surveyor = surveyor.replace(/[.,;:]+$/, '').trim();

            // 3. Find Date (YYYY-MM-DD or DD/MM/YYYY)
            const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})/);
            const planDate = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];

            // 4. Find Scale (1:500 etc)
            const scaleMatch = text.match(/1\s?:\s?(\d+)/);
            const scale = scaleMatch ? `1:${scaleMatch[1]}` : "1:? (Non détecté)";

            // C. COORDINATE EXTRACTION

            // Define MTM Zone 9 (Québec) for Proj4
            // EPSG:32189 - NAD83 / MTM zone 9
            proj4.defs("EPSG:32189", "+proj=tmerc +lat_0=0 +lon_0=-76.5 +k=0.9999 +x_0=304800 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

            // Try to find Real Georeference from DB if Lot Number exists
            let lat = 0, lng = 0;
            // Default Mock (Val-d'Or Center)
            const mockScopqX = 237000;
            const mockScopqY = 5334000;

            if (lotNumber) {
                try {
                    // Search in local georef DB
                    const client = getHubClient();
                    await client.connect();
                    // Assuming city_geo_ref schema and lots table exists with 'numero_lot'
                    // We try to find the centroid of the lot
                    // NOTE: using ST_Transform to get WGS84 for the frontend (Leaflet)
                    const geoRes = await client.query(`
                        SELECT ST_X(ST_Transform(ST_Centroid(geom), 4326)) as lng, 
                               ST_Y(ST_Transform(ST_Centroid(geom), 4326)) as lat
                        FROM city_geo_ref.lots 
                        WHERE numero = $1 OR numero = $2
                        LIMIT 1
                    `, [lotNumber, lotNumber.replace(/\s/g, '')]);

                    if (geoRes.rows.length > 0) {
                        lat = geoRes.rows[0].lat;
                        lng = geoRes.rows[0].lng;
                        console.log(`[AUDIT] Found Lot ${lotNumber} in DB at ${lat}, ${lng}`);
                    } else {
                        console.log(`[AUDIT] Lot ${lotNumber} not found in DB. Using Mock.`);
                        // Fallback to mock
                        [lng, lat] = proj4("EPSG:32189", "EPSG:4326", [mockScopqX, mockScopqY]);
                    }
                    await client.end();
                } catch (dbErr) {
                    console.error("Geocoding DB Error:", dbErr.message);
                    // Fallback to mock
                    [lng, lat] = proj4("EPSG:32189", "EPSG:4326", [mockScopqX, mockScopqY]);
                }
            } else {
                [lng, lat] = proj4("EPSG:32189", "EPSG:4326", [mockScopqX, mockScopqY]);
            }

            const extractedData = {
                filename: req.file.originalname,
                metadata: {
                    lot_number: lotNumber,
                    surveyor: surveyor,
                    date: planDate,
                    scale: scale,
                    crs: "SCOPQ Zone 9 (NAD83)", // We assume this for now
                },
                // The "Ghost" geometry 
                ghost_centroid: { lat, lng },
                ghost_vectors: null
            };

            res.json({
                message: "Analyse terminée.",
                data: extractedData
            });

        } catch (e) {
            console.error("Audit Session Error:", e);
            // Return actual error message for debugging
            res.status(500).json({
                error: "Erreur lors de l'analyse du plan: " + e.message,
                details: e.stack
            });
        }
    },

    // 2. COMMIT: Save Audit Log
    async commitAudit(req, res) {
        const { inspection_id, inspector_id, action, metadata, location } = req.body;
        // location expected as { lat: 123, lng: 456 }

        const client = getHubClient();
        try {
            await client.connect();

            // 1. Save Audit Record
            const query = `
                INSERT INTO inspection_audits 
                (inspection_id, inspector_id, inspector_name, action_type, location_snapshot, metadata)
                VALUES 
                ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7)
                RETURNING id;
            `;

            // Note: inspector_name should be fetched or passed. Assuming passed or simplified.
            // Using placeholder "Admin" if ID not found for prototype.
            const inspectorName = `Inspecteur #${inspector_id}`;

            const resDB = await client.query(query, [
                inspection_id || null,
                inspector_id,
                inspectorName,
                action, // 'PERMIT_ISSUED', 'REJECTED'
                location.lng,
                location.lat,
                JSON.stringify(metadata)
            ]);

            const auditId = resDB.rows[0].id;

            // 2. If Permit Issued, Create Map Marker (Update Inspection or Create new?)
            // If inspection_id is present, we update that inspection's geom if it was null?
            if (inspection_id && action === 'PERMIT_ISSUED') {
                // Update inspection header with location?? 
                // Currently inspections_hub has lat/lng ?? No, it has 'source_id'.
                // Ideally we update the SPOKE table. 
                // For safety/IP, we just keep the Audit Log as the "Registry".
            }

            res.json({
                message: "Audit enregistré avec succès.",
                audit_id: auditId,
                permit_number: `PERM-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`
            });

        } catch (e) {
            console.error("Commit Error:", e);
            res.status(500).json({ error: e.message });
        } finally {
            await client.end();
        }
    }
};

module.exports = AuditController;
