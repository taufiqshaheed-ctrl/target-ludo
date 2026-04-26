import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import adminRoutes from './routes/admin.js';
import battleRoutes from './routes/battles.js';
import kycRoutes from './routes/kyc.js';
import depositRoutes from './routes/deposits.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;

// CORS
const allowedOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.NODE_ENV !== 'production'
        ? ['http://localhost:5173', 'http://localhost:8080']
        : []),
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Database
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB error:', err));

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/deposits', depositRoutes);

app.get('/', (req, res) => res.send('Target Ludo API is running'));

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
