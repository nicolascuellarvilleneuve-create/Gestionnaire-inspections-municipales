// THE ENGINE (Server)
const express = require('express');
const cors = require('cors');
const router = require('./db_router');

const app = express();
const PORT = 3001;

// Middleware (The "Pipeline")
app.use(cors()); // Allow frontend to talk to us
app.use(express.json()); // Understand JSON data

// ROUTE: Save Inspection
app.post('/api/inspections', async (req, res) => {
    try {
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
