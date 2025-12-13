
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for validation
const ingestSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    ip: z.string().optional(),
    mac: z.string().optional(),
    os: z.string().optional(),
    kernel: z.string().optional(),
    cpu: z.string().optional(),
    memory: z.string().optional(),
    type: z.string().default('Unknown'),
    location: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = ingestSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid payload', details: result.error.format() },
                { status: 400 }
            );
        }

        const data = result.data;

        // Logic to find and update, or create
        // Priority for matching: 
        // 1. ID (if provided and exists)
        // 2. MAC Address (unique hardware ID)
        // 3. Name (hostname) - less reliable but common fallback

        let asset;

        if (data.id) {
            asset = await prisma.asset.findUnique({ where: { id: data.id } });
        }

        if (!asset && data.mac) {
            // Find by MAC if we store it (we added macAddress to schema)
            // Note: Prisma schema update added macAddress, need to ensure we use it.
            // Since macAddress is not @unique in schema yet (it was just added as optional),
            // findFirst is safer.
            asset = await prisma.asset.findFirst({
                where: { macAddress: data.mac }
            });
        }

        if (!asset && data.name) {
            asset = await prisma.asset.findFirst({
                where: { name: data.name }
            });
        }

        const payload = {
            name: data.name,
            type: data.type,
            ipAddress: data.ip,
            macAddress: data.mac,
            os: data.os,
            kernel: data.kernel,
            cpu: data.cpu,
            memory: data.memory,
            location: data.location,
            lastSeen: new Date(),
        };

        if (asset) {
            // Update
            asset = await prisma.asset.update({
                where: { id: asset.id },
                data: payload
            });
        } else {
            // Create
            asset = await prisma.asset.create({
                data: payload
            });
        }

        return NextResponse.json({ success: true, assetId: asset.id });

    } catch (error) {
        console.error('Ingest error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
