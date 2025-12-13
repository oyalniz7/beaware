"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRiskStatus = exports.getRisks = exports.createVulnerability = exports.getVulnerabilities = void 0;
const index_1 = require("../index");
const zod_1 = require("zod");
const vulnerabilitySchema = zod_1.z.object({
    cveId: zod_1.z.string(),
    description: zod_1.z.string(),
    severity: zod_1.z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']),
    score: zod_1.z.number().optional(),
    publishedAt: zod_1.z.string().transform((str) => new Date(str)),
});
const riskSchema = zod_1.z.object({
    assetId: zod_1.z.string(),
    vulnerabilityId: zod_1.z.string(),
    status: zod_1.z.enum(['OPEN', 'MITIGATED', 'ACCEPTED', 'FALSE_POSITIVE']),
    notes: zod_1.z.string().optional(),
});
const getVulnerabilities = async (req, res) => {
    try {
        const vulns = await index_1.prisma.vulnerability.findMany({
            orderBy: { publishedAt: 'desc' },
            take: 100
        });
        res.json(vulns);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching vulnerabilities' });
    }
};
exports.getVulnerabilities = getVulnerabilities;
const createVulnerability = async (req, res) => {
    try {
        const data = vulnerabilitySchema.parse(req.body);
        const vuln = await index_1.prisma.vulnerability.create({
            data: data
        });
        res.status(201).json(vuln);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ message: 'Error creating vulnerability' });
    }
};
exports.createVulnerability = createVulnerability;
const getRisks = async (req, res) => {
    try {
        const risks = await index_1.prisma.riskAssessment.findMany({
            include: {
                asset: { select: { name: true, ipAddress: true } },
                vulnerability: { select: { cveId: true, severity: true, score: true } }
            }
        });
        res.json(risks);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching risks' });
    }
};
exports.getRisks = getRisks;
const updateRiskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const risk = await index_1.prisma.riskAssessment.update({
            where: { id },
            data: { status, notes }
        });
        res.json(risk);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating risk' });
    }
};
exports.updateRiskStatus = updateRiskStatus;
