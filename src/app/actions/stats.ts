'use server'

import prisma from '@/lib/prisma';

export async function getDashboardStats() {
    try {
        // Get total assets
        const totalAssets = await prisma.asset.count();

        // Get all risk assessments with vulnerabilities
        const risks = await prisma.riskAssessment.findMany({
            include: {
                vulnerability: true,
                asset: true,
            },
        });

        // Count vulnerabilities by severity
        const severityCounts = {
            CRITICAL: risks.filter(r => r.vulnerability.severity === 'CRITICAL' && r.status === 'OPEN').length,
            HIGH: risks.filter(r => r.vulnerability.severity === 'HIGH' && r.status === 'OPEN').length,
            MEDIUM: risks.filter(r => r.vulnerability.severity === 'MEDIUM' && r.status === 'OPEN').length,
            LOW: risks.filter(r => r.vulnerability.severity === 'LOW' && r.status === 'OPEN').length,
        };

        // Get pending scans
        const pendingScans = await prisma.scan.count({
            where: { status: 'PENDING' },
        });

        // Get recent scans
        const recentScans = await prisma.scan.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                asset: true,
            },
        });

        // Calculate overall risk score (simplified)
        const totalOpenVulns = severityCounts.CRITICAL + severityCounts.HIGH + severityCounts.MEDIUM + severityCounts.LOW;
        let riskScore: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A+';

        if (severityCounts.CRITICAL > 0) {
            riskScore = 'F';
        } else if (severityCounts.HIGH > 5) {
            riskScore = 'D';
        } else if (severityCounts.HIGH > 0 || severityCounts.MEDIUM > 10) {
            riskScore = 'C';
        } else if (severityCounts.MEDIUM > 0) {
            riskScore = 'B';
        } else if (totalOpenVulns > 0) {
            riskScore = 'A';
        }

        // Get top vulnerable assets
        const assetVulnCounts = risks.reduce((acc: any, risk) => {
            if (risk.status !== 'OPEN') return acc;
            const assetId = risk.assetId;
            if (!acc[assetId]) {
                acc[assetId] = {
                    asset: risk.asset,
                    count: 0,
                    critical: 0,
                    high: 0,
                };
            }
            acc[assetId].count++;
            if (risk.vulnerability.severity === 'CRITICAL') acc[assetId].critical++;
            if (risk.vulnerability.severity === 'HIGH') acc[assetId].high++;
            return acc;
        }, {});

        const topVulnerableAssets = Object.values(assetVulnCounts)
            .sort((a: any, b: any) => {
                // Sort by critical first, then high, then total
                if (a.critical !== b.critical) return b.critical - a.critical;
                if (a.high !== b.high) return b.high - a.high;
                return b.count - a.count;
            })
            .slice(0, 5);

        return {
            success: true,
            data: {
                totalAssets,
                severityCounts,
                totalOpenVulnerabilities: totalOpenVulns,
                pendingScans,
                riskScore,
                recentScans,
                topVulnerableAssets,
            },
        };
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        return {
            success: false,
            error: 'Failed to fetch dashboard statistics',
        };
    }
}
