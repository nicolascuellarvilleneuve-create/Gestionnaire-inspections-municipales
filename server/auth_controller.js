const bcrypt = require('bcryptjs'); // You will need to install this: npm install bcryptjs
const jwt = require('jsonwebtoken'); // You will need to install this: npm install jsonwebtoken
const { Client } = require('pg');
require('dotenv').config();

// CONFIG
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_PORT = process.env.DB_PORT || 5432;
const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_urbops_key_2025'; // CHANGE THIS IN PROD

// Helper to get Hub Client
const getHubClient = () => new Client({
    user: DB_USER, host: DB_HOST, password: DB_PASSWORD, port: DB_PORT,
    database: 'city_hub'
});

const AuthController = {
    // 1. LOGIN
    async login(req, res) {
        const { username, password } = req.body;
        const client = getHubClient();

        try {
            await client.connect();

            // Fetch User
            const result = await client.query(`
                SELECT id, username, password_hash, role 
                FROM users 
                WHERE username = $1
            `, [username]);

            if (result.rows.length === 0) {
                return res.status(401).json({ error: "Utilisateur ou mot de passe incorrect." });
            }

            const user = result.rows[0];

            // Verify Password
            const valid = await bcrypt.compare(password, user.password_hash);
            if (!valid) {
                return res.status(401).json({ error: "Utilisateur ou mot de passe incorrect." });
            }

            // Generate Token
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                SECRET_KEY,
                { expiresIn: '8h' } // 8 Hour Session
            );

            // Return Success
            res.json({
                message: "Connexion réussie",
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });

        } catch (e) {
            console.error("Login Error:", e);
            res.status(500).json({ error: "Erreur serveur lors de la connexion." });
        } finally {
            await client.end();
        }
    },

    // 2. REGISTER (Admin Only)
    async register(req, res) {
        const { username, password, role } = req.body;

        // Basic Validation
        if (!username || !password || !role) {
            return res.status(400).json({ error: "Tous les champs sont requis." });
        }

        const client = getHubClient();

        try {
            await client.connect();

            // Check if exists
            const distinct = await client.query('SELECT 1 FROM users WHERE username = $1', [username]);
            if (distinct.rowCount > 0) {
                return res.status(400).json({ error: "Ce nom d'utilisateur existe déjà." });
            }

            // Hash Password
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(password, salt);

            // Insert
            const insert = await client.query(`
                INSERT INTO users (username, password_hash, role)
                VALUES ($1, $2, $3)
                RETURNING id, username, role, created_at
            `, [username, hashed, role]);

            res.status(201).json({
                message: "Utilisateur créé avec succès.",
                user: insert.rows[0]
            });

        } catch (e) {
            console.error("Register Error:", e);
            res.status(500).json({ error: e.message });
        } finally {
            await client.end();
        }
    },

    // 3. LIST USERS (Admin Only)
    async listUsers(req, res) {
        const client = getHubClient();
        try {
            await client.connect();
            const result = await client.query(`
                SELECT id, username, role, created_at, status 
                FROM users 
                ORDER BY created_at DESC
            `);
            res.json(result.rows);
        } catch (e) {
            res.status(500).json({ error: e.message });
        } finally {
            await client.end();
        }
    },

    // 4. DELETE USER (Admin Only)
    async deleteUser(req, res) {
        const { id } = req.params;
        const client = getHubClient();
        try {
            await client.connect();
            // Prevent deleting self? (Handled in frontend usually, but good practice here too)
            // if (req.user.id === id) return res.status(400).json({error: "Impossible de se supprimer soi-même."});

            await client.query('DELETE FROM users WHERE id = $1', [id]);
            res.json({ message: "Utilisateur supprimé." });
        } catch (e) {
            res.status(500).json({ error: e.message });
        } finally {
            await client.end();
        }
    },

    // 5. VERIFY TOKEN (Session Check)
    async verify(req, res) {
        // If we are here, middleware already verified the token and attached user to req.user
        res.json({
            valid: true,
            user: req.user
        });
    }
};

module.exports = AuthController;
