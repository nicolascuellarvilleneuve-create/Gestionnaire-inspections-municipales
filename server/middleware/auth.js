const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_urbops_key_2025';

// Middleware to protect routes
const verifyToken = (req, res, next) => {
    // 1. Get Token from Header
    const authHeader = req.headers['authorization'];

    // Format: "Bearer <token>"
    if (!authHeader) {
        return res.status(403).json({ error: "Accès refusé. Token manquant." });
    }

    const token = authHeader.split(' ')[1]; // Remove "Bearer" prefix

    if (!token) {
        return res.status(403).json({ error: "Accès refusé. Token malformé." });
    }

    // 2. Verify Token
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Session expirée ou invalide. Veuillez vous reconnecter." });
        }

        // 3. Attach User to Request
        req.user = decoded; // { id, username, role }
        next(); // Proceed to actual route
    });
};

// Middleware to require Admin role
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Accès refusé. Droits d'administrateur requis." });
    }
    next();
};

module.exports = { verifyToken, requireAdmin };
