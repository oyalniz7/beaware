import { Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

const assetSchema = z.object({
    name: z.string(),
    type: z.string(),
    vendor: z.string().optional(),
    model: z.string().optional(),
    ipAddress: z.string().optional(),
    location: z.string().optional(),
    snmpEnabled: z.boolean().optional(),
    snmpCommunity: z.string().optional(),
});

export const getAssets = async (req: Request, res: Response) => {
    try {
        const assets = await prisma.asset.findMany({
            orderBy: { lastSeen: 'desc' }
        });
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching assets' });
    }
};

export const getAssetById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const asset = await prisma.asset.findUnique({
            where: { id },
            include: {
                scans: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                risks: {
                    include: {
                        vulnerability: true
                    }
                }
            }
        });
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json(asset);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching asset' });
    }
};

export const createAsset = async (req: Request, res: Response) => {
    try {
        const data = assetSchema.parse(req.body);
        const asset = await prisma.asset.create({
            data: data,
        });
        res.status(201).json(asset);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        res.status(500).json({ message: 'Error creating asset' });
    }
};

export const updateAsset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = assetSchema.partial().parse(req.body);
        const asset = await prisma.asset.update({
            where: { id },
            data: data
        });
        res.json(asset);
    } catch (error) {
        res.status(500).json({ message: 'Error updating asset' });
    }
};

export const deleteAsset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.asset.delete({ where: { id } });
        res.json({ message: 'Asset deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting asset' });
    }
};
