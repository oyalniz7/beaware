"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScan = exports.getScans = void 0;
const index_1 = require("../index");
const zod_1 = require("zod");
const scanSchema = zod_1.z.object({
    assetId: zod_1.z.string(),
    type: zod_1.z.enum(['QUICK', 'FULL']).optional(),
});
const getScans = async (req, res) => {
    try {
        const { assetId } = req.query;
        let where = {};
        if (assetId) {
            where = { assetId: assetId };
        }
        const scans = await index_1.prisma.scan.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                asset: { select: { name: true } }
            }
        });
        res.json(scans);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching scans' });
    }
};
exports.getScans = getScans;
const startScan = async (req, res) => {
    try {
        const { assetId } = scanSchema.parse(req.body);
        // Check if asset exists
        const asset = await index_1.prisma.asset.findUnique({ where: { id: assetId } });
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        // Create initial scan record
        const scan = await index_1.prisma.scan.create({
            data: {
                assetId,
                status: 'PENDING',
                startedAt: new Date(),
            }
        });
        // Simulate scan process (async)
        // In a real app, this would be a job queue
        simulateScan(scan.id);
        res.status(201).json(scan);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ message: 'Error starting scan' });
    }
};
exports.startScan = startScan;
// Mock scan simulation
const simulateScan = async (scanId) => {
    setTimeout(async () => {
        try {
            await index_1.prisma.scan.update({
                where: { id: scanId },
                data: { status: 'RUNNING' }
            });
            // Simulate working time
            await new Promise(resolve => setTimeout(resolve, 5000));
            await index_1.prisma.scan.update({
                where: { id: scanId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    vulnerabilitiesFound: Math.floor(Math.random() * 5),
                }
            });
        }
        catch (e) {
            console.error('Scan simulation failed', e);
            await index_1.prisma.scan.update({
                where: { id: scanId },
                data: { status: 'FAILED', errorMessage: 'Simulation failed' }
            });
        }
    }, 1000);
};
