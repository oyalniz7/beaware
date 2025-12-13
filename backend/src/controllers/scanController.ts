import { Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

const scanSchema = z.object({
    assetId: z.string(),
    type: z.enum(['QUICK', 'FULL']).optional(),
});

export const getScans = async (req: Request, res: Response) => {
    try {
        const { assetId } = req.query;
        let where = {};
        if (assetId) {
            where = { assetId: assetId as string };
        }

        const scans = await prisma.scan.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                asset: { select: { name: true } }
            }
        });
        res.json(scans);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching scans' });
    }
};

export const startScan = async (req: Request, res: Response) => {
    try {
        const { assetId } = scanSchema.parse(req.body);

        // Check if asset exists
        const asset = await prisma.asset.findUnique({ where: { id: assetId } });
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Create initial scan record
        const scan = await prisma.scan.create({
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
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        res.status(500).json({ message: 'Error starting scan' });
    }
};

// Mock scan simulation
const simulateScan = async (scanId: string) => {
    setTimeout(async () => {
        try {
            await prisma.scan.update({
                where: { id: scanId },
                data: { status: 'RUNNING' }
            });

            // Simulate working time
            await new Promise(resolve => setTimeout(resolve, 5000));

            await prisma.scan.update({
                where: { id: scanId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    vulnerabilitiesFound: Math.floor(Math.random() * 5),
                }
            });
        } catch (e) {
            console.error('Scan simulation failed', e);
            await prisma.scan.update({
                where: { id: scanId },
                data: { status: 'FAILED', errorMessage: 'Simulation failed' }
            });
        }
    }, 1000);
};
