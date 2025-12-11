'use server'

import prisma from '@/lib/prisma';
import { queryDevice, testConnection, checkThresholds, getInterfaceList } from '@/lib/snmp-client';
import { sendVulnerabilityAlert } from '@/lib/email-sender';

/**
 * Get live status for a device via SNMP
 */
export async function getDeviceLiveStatus(assetId: string) {
    try {
        const asset = await prisma.asset.findUnique({
            where: { id: assetId },
        });

        if (!asset) {
            return { success: false, error: 'Asset not found' };
        }

        if (!asset.snmpEnabled || !asset.ipAddress || !asset.snmpCommunity) {
            return { success: false, error: 'SNMP not configured for this asset' };
        }

        const metrics = await queryDevice(
            asset.ipAddress,
            asset.snmpCommunity,
            asset.snmpPort,
            asset.snmpMetrics?.split(',') || ['cpu', 'memory']
        );

        // Filter interfaces if watchedInterfaces is set
        if (asset.watchedInterfaces && metrics.interfaces && metrics.interfaces.list) {
            const watched = asset.watchedInterfaces.split(',');
            metrics.interfaces.list = metrics.interfaces.list.filter((iface: any) =>
                watched.includes(iface.name)
            );
            // We keep the total count as is, or maybe irrelevant. 
            // User wants to focus on these.
        }
        // If NO watched interfaces are defined, and user said "delete the interface info" (the large table),
        // we might defaults to EMPTY list or just show nothing?
        // But for backward compatibility with "View All" (if user didn't request deletion totally), 
        // I will default to showing NONE if the field is null? 
        // User said: "delete the interface info i just want... option for selected".
        // So if watchedInterfaces is null/empty, we should probably output empty list.
        else {
            if (metrics.interfaces) metrics.interfaces.list = [];
        }

        // Check thresholds and send alert if exceeded
        if (metrics.online && metrics.performance) {
            const thresholdCheck = checkThresholds(
                metrics,
                asset.cpuThreshold,
                asset.memoryThreshold,
                asset.storageThreshold || 90,
                asset.alertRules || ''
            );

            if (thresholdCheck.exceeded) {
                // Send email alert
                try {
                    await sendPerformanceAlert(asset, metrics, thresholdCheck.alerts);
                } catch (emailError) {
                    console.error('[SNMP] Failed to send alert email:', emailError);
                }
            }
        }

        return { success: true, data: metrics };
    } catch (error: any) {
        console.error('[SNMP] Error querying device:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get live status for all SNMP-enabled devices
 */
export async function getAllDevicesStatus() {
    try {
        const assets = await prisma.asset.findMany({
            where: {
                snmpEnabled: true,
                ipAddress: { not: null },
                snmpCommunity: { not: null },
            },
        });

        const results = await Promise.all(
            assets.map(async (asset) => {
                const statusResult = await getDeviceLiveStatus(asset.id);
                return {
                    asset,
                    metrics: statusResult.success ? statusResult.data : null,
                    error: statusResult.error,
                };
            })
        );

        return { success: true, data: results };
    } catch (error: any) {
        console.error('[SNMP] Error querying all devices:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update SNMP settings for an asset
 */
export async function updateSnmpSettings(assetId: string, data: {
    snmpEnabled: boolean;
    snmpCommunity?: string;
    snmpPort?: number;
    cpuThreshold?: number;
    memoryThreshold?: number;
    storageThreshold?: number;
    alertRules?: string;
    watchedInterfaces?: string;
}) {
    try {
        const updated = await prisma.asset.update({
            where: { id: assetId },
            data: {
                snmpEnabled: data.snmpEnabled,
                snmpCommunity: data.snmpCommunity,
                snmpPort: data.snmpPort || 161,
                cpuThreshold: data.cpuThreshold || 80,
                memoryThreshold: data.memoryThreshold || 90,
                storageThreshold: data.storageThreshold || 90,
                alertRules: data.alertRules,
                watchedInterfaces: data.watchedInterfaces,
            },
        });

        return { success: true, data: updated };
    } catch (error: any) {
        console.error('[SNMP] Failed to update settings:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get available interfaces for an asset (Discovery)
 */
export async function getAvailableInterfaces(
    ipAddress: string,
    community: string,
    port: number = 161
) {
    try {
        const list = await getInterfaceList(ipAddress, community, port);
        console.log(`[SNMP] getAvailableInterfaces returning ${list.length} names.`);

        if (list.length === 0) {
            return { success: false, error: 'No interfaces found' };
        }

        return {
            success: true,
            interfaces: list
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Detect asset details via SNMP (Vendor, Model, Version)
 */
export async function detectAssetDetails(
    ipAddress: string,
    community: string,
    port: number = 161
) {
    try {
        const metrics = await queryDevice(ipAddress, community, port, []);

        if (!metrics.online || !metrics.systemInfo) {
            return { success: false, error: metrics.error || 'Device unreachable for identification' };
        }

        const desc = metrics.systemInfo.description || '';
        const oid = metrics.systemInfo.oid || '';
        let vendor = '';
        let model = '';
        let version = '';

        // Simple Heuristics
        const lowerDesc = desc.toLowerCase();

        if (lowerDesc.includes('fortinet') || lowerDesc.includes('fortigate')) {
            vendor = 'Fortinet';
            // Example: FortiGate-60F v7.0.5,...
            // Or: Fortigate-VM64-AWS v7.0....
            // Extract Model: First word often? or split by space
            const parts = desc.split(' '); // [Fortigate-60F, v7.0.5, ...]
            if (parts.length > 0) model = parts[0].replace(',', '');

            // Extract Version
            const vPart = parts.find(p => p.startsWith('v') && p.includes('.'));
            if (vPart) version = vPart.split(',')[0];
        } else if (lowerDesc.includes('cisco')) {
            vendor = 'Cisco';
            // Cisco IOS Software, C2960 Software...
        } else if (lowerDesc.includes('linux')) {
            vendor = 'Linux';
            model = 'Generic Linux';
            // Linux node 5.10...
            const parts = desc.split(' ');
            if (parts.length > 2) version = parts[2];
        }

        return {
            success: true,
            details: {
                vendor,
                model,
                version,
                description: desc
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Test SNMP connection
 */
export async function testSnmpConnection(
    ipAddress: string,
    community: string,
    port: number = 161
) {
    try {
        const result = await testConnection(ipAddress, community, port);
        return result;
    } catch (error: any) {
        return {
            success: false,
            message: error.message,
        };
    }
}

/**
 * Send performance alert email
 */
async function sendPerformanceAlert(asset: any, metrics: any, alerts: string[]) {
    try {
        const { sendVulnerabilityAlert } = await import('@/lib/email-sender');

        // Check if notifications are enabled
        const settings = await prisma.notificationSettings.findFirst();
        if (!settings || !settings.enabled) {
            return;
        }

        // Prepare email content (reusing vulnerability alert structure)
        await sendVulnerabilityAlert({
            assetName: `⚠️ Performance Alert: ${asset.name}`,
            vendor: asset.vendor,
            model: asset.model,
            version: asset.version,
            criticalCount: 0,
            highCount: alerts.length,
            mediumCount: 0,
            lowCount: 0,
            totalCount: alerts.length,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/monitoring`,
        });

        console.log(`[SNMP] Performance alert sent for ${asset.name}`);
    } catch (error) {
        console.error('[SNMP] Failed to send performance alert:', error);
    }
}
