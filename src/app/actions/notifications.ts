'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Get notification settings
 */
export async function getNotificationSettings() {
    try {
        const settings = await prisma.notificationSettings.findFirst();
        return { success: true, data: settings };
    } catch (error) {
        console.error('Failed to fetch notification settings:', error);
        return { success: false, error: 'Failed to fetch notification settings' };
    }
}

export async function updateNotificationSettings(data: {
    email: string;
    smtpUsername: string;
    smtpPassword?: string;
    enabled: boolean;
    severityThreshold: string;
}) {
    try {
        const existing = await prisma.notificationSettings.findFirst();

        if (existing) {
            // Only update password if provided
            const updateData: any = {
                email: data.email,
                smtpUsername: data.smtpUsername,
                enabled: data.enabled,
                severityThreshold: data.severityThreshold,
            };

            if (data.smtpPassword) {
                updateData.smtpPassword = data.smtpPassword;
            }

            const updated = await prisma.notificationSettings.update({
                where: { id: existing.id },
                data: updateData,
            });
            return { success: true, data: updated };
        } else {
            // For new settings, password is required
            if (!data.smtpPassword) {
                return { success: false, error: 'Password is required for initial setup' };
            }

            const created = await prisma.notificationSettings.create({
                data: {
                    email: data.email,
                    smtpHost: 'smtp.office365.com',
                    smtpPort: 587,
                    smtpUsername: data.smtpUsername,
                    smtpPassword: data.smtpPassword,
                    enabled: data.enabled,
                    severityThreshold: data.severityThreshold,
                },
            });
            return { success: true, data: created };
        }
    } catch (error) {
        console.error('Failed to update notification settings:', error);
        return { success: false, error: 'Failed to update notification settings' };
    }
}

/**
 * Get scheduled scan settings
 */
export async function getScheduledScanSettings() {
    try {
        const settings = await prisma.scheduledScan.findFirst();
        return { success: true, data: settings };
    } catch (error) {
        console.error('Failed to fetch scheduled scan settings:', error);
        return { success: false, error: 'Failed to fetch scheduled scan settings' };
    }
}

/**
 * Update or create scheduled scan settings
 */
export async function updateScheduledScanSettings(data: {
    enabled: boolean;
    frequency: string;
}) {
    try {
        const existing = await prisma.scheduledScan.findFirst();

        // Calculate next run time
        const now = new Date();
        const nextRun = calculateNextRun(now, data.frequency);

        if (existing) {
            const updated = await prisma.scheduledScan.update({
                where: { id: existing.id },
                data: {
                    enabled: data.enabled,
                    frequency: data.frequency,
                    nextRunAt: data.enabled ? nextRun : null,
                },
            });
            return { success: true, data: updated };
        } else {
            const created = await prisma.scheduledScan.create({
                data: {
                    enabled: data.enabled,
                    frequency: data.frequency,
                    nextRunAt: data.enabled ? nextRun : null,
                    scanAllAssets: true,
                },
            });
            return { success: true, data: created };
        }
    } catch (error) {
        console.error('Failed to update scheduled scan settings:', error);
        return { success: false, error: 'Failed to update scheduled scan settings' };
    }
}

function calculateNextRun(from: Date, frequency: string): Date {
    const next = new Date(from);

    switch (frequency) {
        case 'daily':
            next.setDate(next.getDate() + 1);
            break;
        case 'weekly':
            next.setDate(next.getDate() + 7);
            break;
        case 'monthly':
            next.setMonth(next.getMonth() + 1);
            break;
    }

    return next;
}

/**
 * Test email configuration
 */
export async function testEmailConfig() {
    try {
        const { testEmailConfiguration } = await import('@/lib/email-sender');
        const result = await testEmailConfiguration();
        revalidatePath('/dashboard/settings');
        return result;
    } catch (error: any) {
        console.error('Failed to test email:', error);
        return { success: false, error: error.message };
    }
}
