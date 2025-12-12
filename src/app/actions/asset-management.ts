'use server'

import prisma from '@/lib/prisma';
import { AssetFormData, AssetSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

/**
 * Update an existing asset
 */
export async function updateAsset(id: string, data: AssetFormData) {
    const parsed = AssetSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten() };
    }

    try {
        const asset = await prisma.asset.update({
            where: { id },
            data: {
                name: parsed.data.name,
                type: parsed.data.type,
                model: parsed.data.model ?? null,
                version: parsed.data.version ?? null,
                vendor: parsed.data.vendor ?? null,
                cpe: parsed.data.cpe ?? null,
                location: parsed.data.location ?? null,
                ipAddress: parsed.data.ipAddress ?? null,
                snmpEnabled: parsed.data.snmpEnabled ?? false,
                snmpCommunity: parsed.data.snmpCommunity ?? null,
                snmpVersion: parsed.data.snmpVersion ?? "v2c",
                snmpPort: parsed.data.snmpPort ?? 161,
                cpuThreshold: parsed.data.cpuThreshold ?? 80,
                memoryThreshold: parsed.data.memoryThreshold ?? 90,
                storageThreshold: parsed.data.storageThreshold ?? 90,
                snmpMetrics: parsed.data.snmpMetrics ?? null,
                alertRules: parsed.data.alertRules ?? null,
                watchedInterfaces: parsed.data.watchedInterfaces ?? null,
            }
        });
        revalidatePath('/dashboard/assets');
        revalidatePath('/dashboard');
        return { success: true, data: asset };
    } catch (error: any) {
        console.error("Failed to update asset:", error);
        return { success: false, error: error.message || "Database error" };
    }
}

/**
 * Get single asset by ID
 */
export async function getAsset(id: string) {
    try {
        const asset = await prisma.asset.findUnique({
            where: { id },
            include: {
                risks: {
                    include: {
                        vulnerability: true
                    }
                },
                scans: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });
        return { success: true, data: asset };
    } catch (error) {
        console.error("Failed to fetch asset:", error);
        return { success: false, error: "Failed to fetch asset" };
    }
}
