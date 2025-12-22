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

// MOCK STORE for Offline/Demo Mode
let MOCK_USERS = [
    { id: 1, username: 'admin', password_hash: '$2a$10$YourHashHere', role: 'admin', created_at: new Date().toISOString() }
];

// Helper to simulate DB delay
const mockDelay = () => new Promise(resolve => setTimeout(resolve, 300));

const AuthController = {
    // 1. LOGIN
    async login(req, res) {
        const { username, password } = req.body;
        const client = getHubClient();

        try {
            await client.connect();
            const result = await client.query(`
                SELECT id, username, password_hash, role 
                FROM users 
                WHERE username = $1
            `, [username]);

            if (result.rows.length === 0) return res.status(401).json({ error: "Utilisateur ou mot de passe incorrect." });
            const user = result.rows[0];
            const valid = await bcrypt.compare(password, user.password_hash);
            if (!valid) return res.status(401).json({ error: "Utilisateur ou mot de passe incorrect." });

            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '8h' });
            res.json({ message: "Connexion réussie", token: token, user: { id: user.id, username: user.username, role: user.role } });

        } catch (e) {
            console.error("Login Error:", e);
            // FALLBACK MOCK LOGIN
            const mockUser = MOCK_USERS.find(u => u.username === username);
            if (mockUser && (password === 'admin123' || (mockUser.mockPassword && password === mockUser.mockPassword))) {
                console.warn("⚠️ Login Failed (DB Error). Returning MOCK session.");
                const mockToken = jwt.sign({ id: mockUser.id, username: mockUser.username, role: mockUser.role }, SECRET_KEY, { expiresIn: '1h' });
                return res.json({ message: "Mode Démo (Hors-ligne)", token: mockToken, user: { id: mockUser.id, username: mockUser.username, role: mockUser.role } });
            }
            res.status(500).json({ error: "Erreur serveur lors de la connexion." });
        } finally {
            try { await client.end(); } catch { }
        }
    },

    // 2. REGISTER (Admin Only)
    async register(req, res) {
        const { username, password, role } = req.body;
        if (!username || !password || !role) return res.status(400).json({ error: "Tous les champs sont requis." });

        const client = getHubClient();
        try {
            await client.connect();
            const distinct = await client.query('SELECT 1 FROM users WHERE username = $1', [username]);
            if (distinct.rowCount > 0) return res.status(400).json({ error: "Ce nom d'utilisateur existe déjà." });

            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(password, salt);
            const insert = await client.query(`
                INSERT INTO users (username, password_hash, role)
                VALUES ($1, $2, $3)
                RETURNING id, username, role, created_at
            `, [username, hashed, role]);

            res.status(201).json({ message: "Utilisateur créé avec succès.", user: insert.rows[0] });

        } catch (e) {
            console.error("Register Error:", e);
            // FALLBACK MOCK REGISTER
            if (e.code === 'ECONNREFUSED' || e.message.includes('connect')) {
                console.warn("⚠️ DB Error. Creating MOCK user.");
                if (MOCK_USERS.find(u => u.username === username)) return res.status(400).json({ error: "Utilisateur existe déjà (Mode Démo)." });

                const newUser = {
                    id: MOCK_USERS.length + 1,
                    username,
                    role,
                    mockPassword: password, // Store plain for mock login to work easily
                    password_hash: 'mock_hash',
                    created_at: new Date().toISOString()
                };
                MOCK_USERS.push(newUser);
                await mockDelay();
                return res.status(201).json({ message: "Utilisateur créé (Mode Démo).", user: newUser });
            }
            res.status(500).json({ error: e.message });
        } finally {
            try { await client.end(); } catch { }
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
            // FALLBACK MOCK LIST
            if (e.code === 'ECONNREFUSED' || e.message.includes('connect')) {
                console.warn("⚠️ DB Error. Returning MOCK users.");
                await mockDelay();
                return res.json(MOCK_USERS);
            }
            res.status(500).json({ error: e.message });
        } finally {
            try { await client.end(); } catch { }
        }
    },

    // 4. DELETE USER (Admin Only)
    async deleteUser(req, res) {
        const { id } = req.params;
        const client = getHubClient();
        try {
            await client.connect();
            await client.query('DELETE FROM users WHERE id = $1', [id]);
            res.json({ message: "Utilisateur supprimé." });
        } catch (e) {
            // FALLBACK MOCK DELETE
            if (e.code === 'ECONNREFUSED' || e.message.includes('connect')) {
                console.warn("⚠️ DB Error. Deleting MOCK user.");
                MOCK_USERS = MOCK_USERS.filter(u => u.id !== parseInt(id));
                await mockDelay();
                return res.json({ message: "Utilisateur supprimé (Mode Démo)." });
            }
            res.status(500).json({ error: e.message });
        } finally {
            try { await client.end(); } catch { }
        }
    },

    // 5. VERIFY TOKEN (Session Check)
    async verify(req, res) {
        res.json({ valid: true, user: req.user });
    }
};

module.exports = AuthController;
