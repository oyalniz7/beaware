"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAsset = exports.updateAsset = exports.createAsset = exports.getAssetById = exports.getAssets = void 0;
const index_1 = require("../index");
const zod_1 = require("zod");
const assetSchema = zod_1.z.object({
    name: zod_1.z.string(),
    type: zod_1.z.string(),
    vendor: zod_1.z.string().optional(),
    model: zod_1.z.string().optional(),
    ipAddress: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    snmpEnabled: zod_1.z.boolean().optional(),
    snmpCommunity: zod_1.z.string().optional(),
});
const getAssets = async (req, res) => {
    try {
        const assets = await index_1.prisma.asset.findMany({
            orderBy: { lastSeen: 'desc' }
        });
        res.json(assets);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching assets' });
    }
};
exports.getAssets = getAssets;
const getAssetById = async (req, res) => {
    try {
        const { id } = req.params;
        const asset = await index_1.prisma.asset.findUnique({
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
        if (!asset)
            return res.status(404).json({ message: 'Asset not found' });
        res.json(asset);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching asset' });
    }
};
exports.getAssetById = getAssetById;
const createAsset = async (req, res) => {
    try {
        const data = assetSchema.parse(req.body);
        const asset = await index_1.prisma.asset.create({
            data: data,
        });
        res.status(201).json(asset);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ message: 'Error creating asset' });
    }
};
exports.createAsset = createAsset;
const updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const data = assetSchema.partial().parse(req.body);
        const asset = await index_1.prisma.asset.update({
            where: { id },
            data: data
        });
        res.json(asset);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating asset' });
    }
};
exports.updateAsset = updateAsset;
const deleteAsset = async (req, res) => {
    try {
        const { id } = req.params;
        await index_1.prisma.asset.delete({ where: { id } });
        res.json({ message: 'Asset deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting asset' });
    }
};
exports.deleteAsset = deleteAsset;
