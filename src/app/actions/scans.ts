'use server'

import prisma from '@/lib/prisma';
import { nvdClient } from '@/lib/nvd-api';
import { getSearchKeywords } from '@/lib/cpe-matcher';
import { filterVulnerabilitiesByVersion } from '@/lib/version-filter';
import { revalidatePath } from 'next/cache';

/**
 * Scan a single asset for vulnerabilities
 */
export async function scanAsset(assetId: string) {
    try {
        // Get asset details
        const asset = await prisma.asset.findUnique({
            where: { id: assetId }
        });

        if (!asset) {
            return { success: false, error: 'Asset not found' };
        }

        // Get user's API key from settings
        const { getApiKey } = await import('./settings');
        const userApiKey = await getApiKey();
        if (userApiKey) {
            nvdClient.setApiKey(userApiKey);
        }

        // Create scan record
        const scan = await prisma.scan.create({
            data: {
                assetId,
                status: 'RUNNING',
                startedAt: new Date(),
            }
        });

        try {
            let vulnerabilities: any[] = [];

            // STRATEGY: Use keyword search as primary method
            console.log(`[Scan ${scan.id}] Asset: ${asset.name}`);
            console.log(`[Scan ${scan.id}] Type: ${asset.type}, Vendor: ${asset.vendor}, Model: ${asset.model}, Version: ${asset.version}`);

            // PRIMARY: Keyword search
            const keywords = getSearchKeywords({
                vendor: asset.vendor || undefined,
                model: asset.model || undefined,
                name: asset.name,
                version: asset.version || undefined,
            });

            console.log(`[Scan ${scan.id}] Keyword search with:`, keywords);

            for (const keyword of keywords.slice(0, 5)) { // Try up to 5 keywords
                console.log(`[Scan ${scan.id}] Searching: "${keyword}"`);
                try {
                    const results = await nvdClient.searchByKeyword(keyword, 100);
                    console.log(`[Scan ${scan.id}] Keyword "${keyword}" returned ${results.length} results`);

                    if (results.length > 0) {
                        vulnerabilities.push(...results);
                        break; // Stop after first successful search
                    }
                } catch (error: any) {
                    console.error(`[Scan ${scan.id}] Keyword search for "${keyword}" failed:`, error.message);
                }
            }

            console.log(`[Scan ${scan.id}] Raw vulnerabilities found: ${vulnerabilities.length}`);

            // VERSION FILTERING DISABLED - showing all results
            // The version filtering logic was causing incorrect results (newer versions showing more CVEs than older)
            // Users can review CVE descriptions to determine applicability
            console.log(`[Scan ${scan.id}] Version filtering: DISABLED (showing all results)`);

            // Get PREVIOUS vulnerability IDs before deleting old risk assessments
            const previousRisks = await prisma.riskAssessment.findMany({
                where: { assetId },
                select: { vulnerabilityId: true },
            });
            const previousVulnIds = previousRisks.map(r => r.vulnerabilityId);

            // CLEANUP: Delete existing risk assessments for this asset
            // This ensures we replace old scan results with new ones
            const deletedCount = await prisma.riskAssessment.deleteMany({
                where: { assetId }
            });
            console.log(`[Scan ${scan.id}] Deleted ${deletedCount.count} old risk assessments`);

            // Store vulnerabilities and create risk assessments
            const processedVulnerabilities: any[] = [];
            let newVulnCount = 0;

            for (const vulnData of vulnerabilities) {
                // Upsert vulnerability
                const vulnerability = await prisma.vulnerability.upsert({
                    where: { cveId: vulnData.cveId },
                    update: {
                        description: vulnData.description,
                        severity: vulnData.severity,
                        score: vulnData.score,
                        cvssVector: vulnData.cvssVector,
                        references: vulnData.references,
                        lastModified: vulnData.lastModified,
                    },
                    create: {
                        cveId: vulnData.cveId,
                        description: vulnData.description,
                        severity: vulnData.severity,
                        score: vulnData.score,
                        cvssVector: vulnData.cvssVector,
                        references: vulnData.references,
                        publishedAt: vulnData.publishedAt,
                        lastModified: vulnData.lastModified,
                    }
                });

                processedVulnerabilities.push(vulnerability);

                // Create risk assessment
                await prisma.riskAssessment.create({
                    data: {
                        assetId,
                        vulnerabilityId: vulnerability.id,
                        status: 'OPEN',
                    },
                });

                // Count if this is a NEW vulnerability
                if (!previousVulnIds.includes(vulnerability.id)) {
                    newVulnCount++;
                }
            }

            // Update scan record
            await prisma.scan.update({
                where: { id: scan.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    vulnerabilitiesFound: vulnerabilities.length,
                }
            });

            // Send email notification ONLY for NEW vulnerabilities
            if (newVulnCount > 0) {
                try {
                    const { sendVulnerabilityAlert } = await import('@/lib/email-sender');

                    // Filter to only NEW vulnerabilities
                    const newVulnerabilities = processedVulnerabilities.filter((v: any) =>
                        !previousVulnIds.includes(v.id)
                    );

                    // Count by severity (only new ones)
                    const counts = {
                        critical: newVulnerabilities.filter((v: any) => v.severity === 'CRITICAL').length,
                        high: newVulnerabilities.filter((v: any) => v.severity === 'HIGH').length,
                        medium: newVulnerabilities.filter((v: any) => v.severity === 'MEDIUM').length,
                        low: newVulnerabilities.filter((v: any) => v.severity === 'LOW').length,
                    };

                    console.log(`[Scan ${scan.id}] Sending notification for ${newVulnCount} NEW vulnerabilities`);

                    await sendVulnerabilityAlert({
                        assetName: asset.name,
                        vendor: asset.vendor || undefined,
                        model: asset.model || undefined,
                        version: asset.version || undefined,
                        criticalCount: counts.critical,
                        highCount: counts.high,
                        mediumCount: counts.medium,
                        lowCount: counts.low,
                        totalCount: newVulnCount,
                        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/risks?assetId=${assetId}`,
                    });
                } catch (emailError) {
                    console.error('[Scan] Failed to send email notification:', emailError);
                    // Don't fail the scan if email fails
                }
            } else {
                console.log(`[Scan ${scan.id}] No new vulnerabilities found, skipping notification`);
            }

            revalidatePath('/dashboard');
            revalidatePath('/dashboard/assets');
            revalidatePath('/dashboard/risks');

            return {
                success: true,
                data: {
                    scanId: scan.id,
                    vulnerabilitiesFound: newVulnCount,
                    totalVulnerabilities: vulnerabilities.length,
                }
            };
        } catch (error: any) {
            // Update scan record with error
            await prisma.scan.update({
                where: { id: scan.id },
                data: {
                    status: 'FAILED',
                    completedAt: new Date(),
                    errorMessage: error.message,
                }
            });

            throw error;
        }
    } catch (error: any) {
        console.error(`Failed to scan asset ${assetId}:`, error);
        return {
            success: false,
            error: error.message || 'Failed to scan asset'
        };
    }
}

/**
 * Get scan history for an asset
 */
export async function getScanHistory(assetId?: string) {
    try {
        const scans = await prisma.scan.findMany({
            where: assetId ? { assetId } : undefined,
            include: {
                asset: {
                    select: { name: true, type: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return { success: true, data: scans };
    } catch (error) {
        console.error('Failed to fetch scan history:', error);
        return { success: false, error: 'Failed to fetch scan history' };
    }
}

/**
 * Get pending scans count
 */
export async function getPendingScansCount() {
    try {
        const count = await prisma.scan.count({
            where: {
                status: { in: ['PENDING', 'RUNNING'] }
            }
        });
        return { success: true, data: count };
    } catch (error) {
        return { success: false, error: 'Failed to count pending scans' };
    }
}
