import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

import authRoutes from './routes/authRoutes';
import assetRoutes from './routes/assetRoutes';
import riskRoutes from './routes/riskRoutes';
import scanRoutes from './routes/scanRoutes';
import userRoutes from './routes/userRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/risks', riskRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/admin', userRoutes);

// Initialize Prisma
const connectionString = process.env.DATABASE_URL || 'file:prisma/dev.db';
const adapter = new PrismaLibSql({
    url: connectionString,
});
export const prisma = new PrismaClient({ adapter });

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
