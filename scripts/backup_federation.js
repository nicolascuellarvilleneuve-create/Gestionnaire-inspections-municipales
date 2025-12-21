
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ESM path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../server/.env') });

// CONFIG
const DB_USER = process.env.DB_USER || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
// Note: pg_dump uses PGPASSWORD env var
process.env.PGPASSWORD = process.env.DB_PASSWORD;

const DATABASES = [
    'city_hub',
    'city_industrie',
    'city_habitation',
    'city_permis',
    'city_commerce_service',
    'city_commerce_gros_industrie',
    'city_public_institutionnel',
    'city_recreation'
];

const BACKUP_DIR = path.join(__dirname, '../backups');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

console.log(`>>> STARTING FEDERATION BACKUP (The Black Box)`);
console.log(`    Time: ${TIMESTAMP}`);
console.log(`    Location: ${BACKUP_DIR}`);
console.log(`------------------------------------------------`);

// Path to pg_dump
// Note: Double backslashes for JS string escaping
const PG_DUMP_PATH = `C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe`;

async function backup() {
    for (const db of DATABASES) {
        const file = path.join(BACKUP_DIR, `${db}_${TIMESTAMP}.sql`);
        const cmd = `"${PG_DUMP_PATH}" -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -F p -f "${file}" "${db}"`;

        console.log(`[BACKUP] Saving Vault: ${db}...`);

        await new Promise((resolve) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    // Check if error is just 'warning' or fatal
                    // pg_dump might output to stderr even on success
                    if (stderr && !stderr.includes('pg_dump:')) {
                        console.error(`   ⚠️ Notice: ${stderr}`);
                    }
                    if (error.code !== 0) {
                        console.error(`   ❌ Failed: ${error.message}`);
                    } else {
                        console.log(`   ✅ Secure.`);
                    }
                } else {
                    console.log(`   ✅ Secure.`);
                }
                resolve(); // Continue even if one fails
            });
        });
    }
    console.log(`------------------------------------------------`);
    console.log(`>>> BACKUP COMPLETE. Keep these files safe.`);
}

backup();
