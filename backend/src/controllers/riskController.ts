import { Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

const vulnerabilitySchema = z.object({
    cveId: z.string(),
    description: z.string(),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']),
    score: z.number().optional(),
    publishedAt: z.string().transform((str) => new Date(str)),
});

const riskSchema = z.object({
    assetId: z.string(),
    vulnerabilityId: z.string(),
    status: z.enum(['OPEN', 'MITIGATED', 'ACCEPTED', 'FALSE_POSITIVE']),
    notes: z.string().optional(),
});

export const getVulnerabilities = async (req: Request, res: Response) => {
    try {
        const vulns = await prisma.vulnerability.findMany({
            orderBy: { publishedAt: 'desc' },
            take: 100
        });
        res.json(vulns);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching vulnerabilities' });
    }
};

export const createVulnerability = async (req: Request, res: Response) => {
    try {
        const data = vulnerabilitySchema.parse(req.body);
        const vuln = await prisma.vulnerability.create({
            data: data
        });
        res.status(201).json(vuln);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        res.status(500).json({ message: 'Error creating vulnerability' });
    }
};

export const getRisks = async (req: Request, res: Response) => {
    try {
        const risks = await prisma.riskAssessment.findMany({
            include: {
                asset: { select: { name: true, ipAddress: true } },
                vulnerability: { select: { cveId: true, severity: true, score: true } }
            }
        });
        res.json(risks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching risks' });
    }
};

export const updateRiskStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const risk = await prisma.riskAssessment.update({
            where: { id },
            data: { status, notes }
        });
        res.json(risk);
    } catch (error) {
        res.status(500).json({ message: 'Error updating risk' });
    }
};
