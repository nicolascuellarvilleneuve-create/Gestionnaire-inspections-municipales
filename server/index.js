// THE ENGINE (Server)
const express = require('express');
const cors = require('cors');
const router = require('./db_router');
const AuthController = require('./auth_controller');
const { verifyToken, requireAdmin } = require('./middleware/auth');

const app = express();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const PORT = 3001;

// Middleware (The "Pipeline")
app.use(cors()); // Allow frontend to talk to us
app.use(express.json()); // Understand JSON data

// === KILLSWITCH / HEARTBEAT ===
let lastHeartbeat = Date.now();
// Check every 5 seconds
const KILL_TIMEOUT = 30000; // 30 seconds without heartbeat = DEATH

setInterval(() => {
    const timeSinceLast = Date.now() - lastHeartbeat;
    if (timeSinceLast > KILL_TIMEOUT) {
        console.log(`[KILLSWITCH] No heartbeat for ${timeSinceLast}ms. Shutting down...`);
        // Kill all node processes (Frontend + Backend)
        try {
            require('child_process').exec('taskkill /F /IM node.exe');
        } catch (e) {
            process.exit(0);
        }
    }
}, 5000);

app.post('/api/heartbeat', (req, res) => {
    lastHeartbeat = Date.now();
    res.sendStatus(200);
});

// AUTH ROUTES
app.post('/api/auth/login', AuthController.login);
app.post('/api/auth/register', verifyToken, requireAdmin, AuthController.register);
app.get('/api/auth/users', verifyToken, requireAdmin, AuthController.listUsers);
app.delete('/api/auth/users/:id', verifyToken, requireAdmin, AuthController.deleteUser);
app.get('/api/auth/verify', verifyToken, AuthController.verify);

// ROUTE: Save Inspection (PROTECTED)
app.post('/api/inspections', verifyToken, async (req, res) => {
    try {
        // Optional: Attach user info to the inspection data if needed
        // req.body.inspector_id = req.user.id; 
        console.log(`[API] Received Inspection from ${req.user.username}`);

        console.log("[API] Received Inspection Payload");
        console.log("      Type:", req.body.type_activite || "Unknown");

        const result = await router.saveInspection(req.body);

        console.log("      Result: Success");
        res.json({ message: "Inspection Saved Successfully", id: result.id });
    } catch (error) {
        console.error("      Result: Error -", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ROUTE: Get Single Inspection Details (For Edit)
app.get('/api/inspections/:id', verifyToken, async (req, res) => {
    try {
        const data = await router.getInspectionById(req.params.id);
        if (!data) return res.status(404).json({ error: "Inspection data not found" });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ROUTE: Delete Inspection
app.delete('/api/inspections/:id', verifyToken, async (req, res) => {
    try {
        const success = await router.deleteInspection(req.params.id);
        if (success) {
            res.json({ message: "Inspection deleted" });
        } else {
            res.status(404).json({ error: "Inspection not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === AUDIT & GEOREF ROUTES ===
const AuditController = require('./audit_controller');
// Multer for memory upload
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // File stored in RAM for Transient parsing

app.post('/api/audit/session/start', verifyToken, upload.single('plan'), AuditController.startSession);
app.post('/api/audit/commit', verifyToken, AuditController.commitAudit);

// ROUTE: Get All Inspections (For Map)
app.get('/api/inspections', async (req, res) => {
    try {
        const data = await router.getInspections();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Basic Route (Test if engine is running)
app.get('/', (req, res) => {
    res.json({
        status: 'Online',
        message: 'Federated Inspection Engine is Running',
        timestamp: new Date()
    });
});

// Start the Engine
app.listen(PORT, () => {
    console.log(`\n >>> FEDERATED ENGINE STARTED on http://localhost:${PORT}`);
    console.log(`>>> Waiting for connections (Routes to 7 Databases)...\n`);
});
