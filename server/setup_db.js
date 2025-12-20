
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

async function setup() {
    console.log(">>> STARTING DATABASE SETUP...");

    // 1. Connect to default 'postgres' db to create the new database
    const clientRoot = new Client({ ...dbConfig, database: 'postgres' });
    try {
        await clientRoot.connect();
        console.log("Connected to root.");

        const res = await clientRoot.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`Creating database: ${process.env.DB_NAME}...`);
            await clientRoot.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
            console.log("Database created.");
        } else {
            console.log("Database already exists.");
        }
    } catch (err) {
        console.error("Error creating DB:", err);
        return;
    } finally {
        await clientRoot.end();
    }

    // 2. Connect to the NEW database to install extensions and schema
    const clientApp = new Client({ ...dbConfig, database: process.env.DB_NAME });
    try {
        await clientApp.connect();
        console.log(`Connected to ${process.env.DB_NAME}.`);

        // Enable PostGIS
        console.log("Enabling PostGIS extension...");
        await clientApp.query("CREATE EXTENSION IF NOT EXISTS postgis;");
        console.log("PostGIS enabled.");

        // Read and Run Schema
        const schemaPath = path.join(__dirname, '../docs/database_schema.sql');
        console.log("Reading schema from:", schemaPath);
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Applying Schema Tables...");
        await clientApp.query(schemaSql);
        console.log(">>> SUCCESS: Database is fully set up and ready!");

    } catch (err) {
        console.error("Error setting up schema:", err);
    } finally {
        await clientApp.end();
    }
}

setup();
