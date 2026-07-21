import express from 'express';
import https from 'https';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import cors from 'cors';
import selfsigned from 'selfsigned';

// Basic setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '127.0.0.1';
}

// Generate self-signed TLS certificate (valid for 365 days)
const attrs = [{ name: 'commonName', value: 'paideia.local' }];
const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048 });

const app = express();
const httpsServer = https.createServer(
    { key: pems.private, cert: pems.cert },
    app
);


// Enable CORS for development
app.use(cors());

// Serve static files from the dist directory under the build base path
const distPath = path.resolve(__dirname, '../dist');
app.use('/paideia', express.static(distPath));

// Redirect root to /paideia/
app.get('/', (req, res) => {
    res.redirect('/paideia/');
});

// API: Server info (used by the frontend in Local Mode to get the network URL for QR codes)
app.get('/api/info', (req, res) => {
    const localIp = getLocalIpAddress();
    res.json({
        mode: 'LOCAL',
        ip: localIp,
        port: PORT,
        networkUrl: `http://${localIp}:${PORT}`
    });
});

// Socket.io setup
const io = new Server(httpsServer, {
    cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173", "*"], // Allow connections from Vite dev server and others
        methods: ["GET", "POST"],
        credentials: true
    }
});

// In-memory database (ephemeral, resets on server restart)
const db = {
    sessions: {}
};

// Start server
httpsServer.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalIpAddress();
    console.log(`
  🔒 PAIDEIA LOCAL SERVER RUNNING (HTTPS)!
  
  > Access locally:   https://localhost:${PORT}
  > Network access:   https://${localIp}:${PORT}
  
  Students: scan the QR — tap 'Advanced' → 'Visit Anyway' once on the warning.
  `);
});

httpsServer.on('error', (err) => {
    console.error('❌ FATAL: Server failed to start:', err);
});

// ── Socket.io Logic ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a specific room (session code)
    socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // ── Database Operations (mimicking Firebase) ──

    // WRITES
    socket.on('db:set', ({ path, data }) => {
        // Simple path traversal: sessions/ABCD/tools/gnosis -> db.sessions.ABCD.tools.gnosis
        setDeep(db, path, data);

        // Broadcast update to everyone in the relevant session room
        // Extract session code from path (assumes path starts with "sessions/CODE/...")
        const parts = path.split('/');
        if (parts[0] === 'sessions' && parts[1]) {
            const code = parts[1];
            socket.to(code).emit('db:update', { path, data });
        }
    });

    socket.on('db:update', ({ path, updates }) => {
        const current = getDeep(db, path) || {};
        const newData = { ...current, ...updates };
        setDeep(db, path, newData);

        const parts = path.split('/');
        if (parts[0] === 'sessions' && parts[1]) {
            const code = parts[1];
            socket.to(code).emit('db:update', { path, data: newData });
        }
    });

    // READS
    socket.on('db:get', ({ path, requestId }) => {
        const data = getDeep(db, path);
        socket.emit(`db:get:response:${requestId}`, data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// ── Helpers ────────────────────────────────────────────────────────────────

function setDeep(obj, path, value) {
    const parts = path.split('/');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) current[part] = {};
        current = current[part];
    }
    current[parts[parts.length - 1]] = value;
}

function getDeep(obj, path) {
    const parts = path.split('/');
    let current = obj;
    for (const part of parts) {
        if (current === undefined || current === null) return null;
        current = current[part];
    }
    return current;
}
