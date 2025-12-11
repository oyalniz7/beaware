'use server'

import prisma from '@/lib/prisma';
import { calculateAssetRisk, calculateOverallRisk, riskScoreToGrade } from '@/lib/risk-calculator';

/**
 * Get all risk assessments with vulnerability and asset details
 */
export async function getRiskAssessments(assetId?: string) {
    try {
        const risks = await prisma.riskAssessment.findMany({
            where: assetId ? { assetId } : undefined,
            include: {
                vulnerability: true,
                asset: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        version: true,
                        vendor: true,
                        model: true,
                    }
                }
            },
            orderBy: [
                { vulnerability: { severity: 'desc' } },
                { createdAt: 'desc' }
            ]
        });

        return { success: true, data: risks };
    } catch (error) {
        console.error('Failed to fetch risk assessments:', error);
        return { success: false, error: 'Failed to fetch risk assessments' };
    }
}

/**
 * Update risk assessment status
 */
export async function updateRiskStatus(riskId: string, status: string, notes?: string) {
    try {
        const updated = await prisma.riskAssessment.update({
            where: { id: riskId },
            data: {
                status,
                notes: notes || undefined,
            }
        });

        return { success: true, data: updated };
    } catch (error) {
        console.error('Failed to update risk status:', error);
        return { success: false, error: 'Failed to update risk status' };
    }
}

/**
 * Calculate risk score for an asset
 */
export async function calculateAssetRiskScore(assetId: string) {
    try {
        const risks = await prisma.riskAssessment.findMany({
            where: { assetId },
            include: {
                vulnerability: {
                    select: {
                        severity: true,
                        score: true,
                    }
                }
            }
        });

        const riskFactors = risks.map(r => ({
            cvssScore: r.vulnerability.score || 0,
            severity: r.vulnerability.severity as any,
            isMitigated: r.status === 'MITIGATED' || r.status === 'ACCEPTED',
        }));

        const score = calculateAssetRisk(riskFactors);
        const grade = riskScoreToGrade(score);

        return {
            success: true,
            data: { score, grade, vulnerabilityCount: risks.length }
        };
    } catch (error) {
        console.error('Failed to calculate risk score:', error);
        return { success: false, error: 'Failed to calculate risk score' };
    }
}

/**
 * Calculate overall organization risk score
 */
export async function calculateOrganizationRisk() {
    try {
        const assets = await prisma.asset.findMany({
            include: {
                risks: {
                    include: {
                        vulnerability: {
                            select: {
                                severity: true,
                                score: true,
                            }
                        }
                    }
                }
            }
        });

        const assetRisks = assets.map(asset => {
            const riskFactors = asset.risks.map(r => ({
                cvssScore: r.vulnerability.score || 0,
                severity: r.vulnerability.severity as any,
                isMitigated: r.status === 'MITIGATED' || r.status === 'ACCEPTED',
            }));
            return calculateAssetRisk(riskFactors);
        });

        const overallScore = calculateOverallRisk(assetRisks);
        const grade = riskScoreToGrade(overallScore);

        return { success: true, data: { score: overallScore, grade } };
    } catch (error) {
        console.error('Failed to calculate organization risk:', error);
        return { success: false, error: 'Failed to calculate organization risk' };
    }
}
