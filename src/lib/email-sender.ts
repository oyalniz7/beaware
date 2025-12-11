/**
 * Email sender utility using Nodemailer
 * Configured for Outlook/Office365 SMTP
 */

import nodemailer from 'nodemailer';
import prisma from './prisma';

interface VulnerabilityAlert {
    assetName: string;
    vendor?: string;
    model?: string;
    version?: string;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    totalCount: number;
    dashboardUrl: string;
}

export async function sendVulnerabilityAlert(alert: VulnerabilityAlert): Promise<boolean> {
    try {
        // Get notification settings
        const settings = await prisma.notificationSettings.findFirst();

        if (!settings || !settings.enabled) {
            console.log('[Email] Notifications disabled or not configured');
            return false;
        }

        // Check severity threshold
        const thresholdMet = checkSeverityThreshold(
            settings.severityThreshold,
            alert.criticalCount,
            alert.highCount,
            alert.mediumCount
        );

        if (!thresholdMet) {
            console.log('[Email] Severity threshold not met, skipping notification');
            return false;
        }

        // Create transporter for Outlook
        const transporter = nodemailer.createTransport({
            host: settings.smtpHost,
            port: settings.smtpPort,
            secure: false, // Use TLS
            auth: {
                user: settings.smtpUsername,
                pass: settings.smtpPassword,
            },
        });

        // Create email HTML
        const html = generateAlertEmail(alert);

        // Send email
        await transporter.sendMail({
            from: settings.smtpUsername,
            to: settings.email,
            subject: `🚨 Security Alert: ${alert.totalCount} Vulnerabilities Found on ${alert.assetName}`,
            html,
        });

        console.log(`[Email] Vulnerability alert sent to ${settings.email}`);
        return true;
    } catch (error) {
        console.error('[Email] Failed to send vulnerability alert:', error);
        return false;
    }
}

function checkSeverityThreshold(
    threshold: string,
    critical: number,
    high: number,
    medium: number
): boolean {
    switch (threshold) {
        case 'CRITICAL':
            return critical > 0;
        case 'HIGH':
            return critical > 0 || high > 0;
        case 'MEDIUM':
            return critical > 0 || high > 0 || medium > 0;
        case 'LOW':
            return true;
        default:
            return false;
    }
}

function generateAlertEmail(alert: VulnerabilityAlert): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .asset-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .severity-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 20px 0; }
        .severity-card { padding: 15px; border-radius: 6px; text-align: center; }
        .critical { background: #fef2f2; border: 2px solid #dc2626; }
        .high { background: #fff7ed; border: 2px solid #ea580c; }
        .medium { background: #fefce8; border: 2px solid #ca8a04; }
        .low { background: #eff6ff; border: 2px solid #2563eb; }
        .severity-count { font-size: 32px; font-weight: bold; margin: 5px 0; }
        .severity-label { font-size: 12px; text-transform: uppercase; font-weight: 600; }
        .cta { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Vulnerability Scan Alert</h1>
        </div>
        <div class="content">
            <p><strong>${alert.totalCount} vulnerabilities</strong> were found during the scheduled scan of <strong>${alert.assetName}</strong>.</p>
            
            <div class="asset-info">
                <h3 style="margin-top: 0;">Asset Details</h3>
                <p><strong>Name:</strong> ${alert.assetName}</p>
                ${alert.vendor ? `<p><strong>Vendor:</strong> ${alert.vendor}</p>` : ''}
                ${alert.model ? `<p><strong>Model:</strong> ${alert.model}</p>` : ''}
                ${alert.version ? `<p><strong>Version:</strong> ${alert.version}</p>` : ''}
            </div>

            <h3>Vulnerability Breakdown</h3>
            <div class="severity-grid">
                <div class="severity-card critical">
                    <div class="severity-count" style="color: #dc2626;">${alert.criticalCount}</div>
                    <div class="severity-label" style="color: #dc2626;">Critical</div>
                </div>
                <div class="severity-card high">
                    <div class="severity-count" style="color: #ea580c;">${alert.highCount}</div>
                    <div class="severity-label" style="color: #ea580c;">High</div>
                </div>
                <div class="severity-card medium">
                    <div class="severity-count" style="color: #ca8a04;">${alert.mediumCount}</div>
                    <div class="severity-label" style="color: #ca8a04;">Medium</div>
                </div>
                <div class="severity-card low">
                    <div class="severity-count" style="color: #2563eb;">${alert.lowCount}</div>
                    <div class="severity-label" style="color: #2563eb;">Low</div>
                </div>
            </div>

            <p style="text-align: center;">
                <a href="${alert.dashboardUrl}" class="cta">View Details in Dashboard</a>
            </p>

            <p style="color: #6b7280; font-size: 14px;">
                These vulnerabilities were discovered during an automated scan. Please review and take appropriate action.
            </p>
        </div>
        <div class="footer">
            <p>This is an automated security alert from your Vulnerability Analyzer</p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

export async function testEmailConfiguration(): Promise<{ success: boolean; error?: string }> {
    try {
        const settings = await prisma.notificationSettings.findFirst();

        if (!settings) {
            return { success: false, error: 'No notification settings configured' };
        }

        const transporter = nodemailer.createTransport({
            host: settings.smtpHost,
            port: settings.smtpPort,
            secure: false,
            auth: {
                user: settings.smtpUsername,
                pass: settings.smtpPassword,
            },
        });

        await transporter.sendMail({
            from: settings.smtpUsername,
            to: settings.email,
            subject: '✅ Test Email - Vulnerability Analyzer',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #16a34a;">✅ Email Configuration Successful</h2>
                    <p>Your email notification settings are working correctly!</p>
                    <p>You will receive alerts when vulnerability scans find issues that meet your configured severity threshold.</p>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        Sent from Vulnerability Analyzer
                    </p>
                </div>
            `,
        });

        return { success: true };
    } catch (error: any) {
        console.error('[Email] Test failed:', error);
        return { success: false, error: error.message };
    }
}
