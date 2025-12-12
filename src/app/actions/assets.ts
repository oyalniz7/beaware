'use server'

import prisma from '@/lib/prisma';
import { AssetSchema, AssetFormData } from '@/lib/schemas';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';

export async function getAssets() {
    noStore(); // Force dynamic data fetch
    try {
        const assets = await prisma.asset.findMany({
            include: {
                risks: {
                    select: { id: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: assets };
    } catch (error) {
        console.error("Failed to fetch assets:", error);
        return { success: false, error: "Failed to fetch assets" };
    }
}

export async function createAsset(data: AssetFormData) {
    const parsed = AssetSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten() };
    }

    try {
        const asset = await prisma.asset.create({
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
        console.error("Failed to create asset:", error);
        return { success: false, error: error.message || "Database error" };
    }
}

export async function deleteAsset(id: string) {
    try {
        await prisma.asset.delete({
            where: { id }
        });
        revalidatePath('/dashboard/assets');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete asset:", error);
        return { success: false, error: "Failed to delete" };
    }
}
