'use client'

import { useState, useEffect } from 'react';
import { saveApiKey, deleteApiKey, hasApiKey } from '@/app/actions/settings';
import { getNotificationSettings, updateNotificationSettings, getScheduledScanSettings, updateScheduledScanSettings, testEmailConfig } from '@/app/actions/notifications';

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showKey, setShowKey] = useState(false);

    // Email notification states
    const [emailSettings, setEmailSettings] = useState({
        email: '',
        smtpUsername: '',
        smtpPassword: '',
        enabled: false,
        severityThreshold: 'HIGH',
    });
    const [showSmtpPassword, setShowSmtpPassword] = useState(false);
    const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [testingEmail, setTestingEmail] = useState(false);

    // Scheduled scan states
    const [scheduledScan, setScheduledScan] = useState({
        enabled: false,
        frequency: 'daily',
    });
    const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);

        // Load API key status
        const configured = await hasApiKey();
        setIsConfigured(configured);

        // Load email settings
        const emailResult = await getNotificationSettings();
        if (emailResult.success && emailResult.data) {
            setEmailSettings({
                email: emailResult.data.email || '',
                smtpUsername: emailResult.data.smtpUsername || '',
                smtpPassword: '', // Don't show password
                enabled: emailResult.data.enabled || false,
                severityThreshold: emailResult.data.severityThreshold || 'HIGH',
            });
        }

        // Load scheduled scan settings
        const scanResult = await getScheduledScanSettings();
        if (scanResult.success && scanResult.data) {
            setScheduledScan({
                enabled: scanResult.data.enabled || false,
                frequency: scanResult.data.frequency || 'daily',
            });
        }

        setIsLoading(false);
    };

    const handleSaveApiKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const result = await saveApiKey(apiKey);

        if (result.success) {
            setMessage({ type: 'success', text: 'API key saved successfully!' });
            setApiKey('');
            setIsConfigured(true);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to save API key' });
        }
    };

    const handleDeleteApiKey = async () => {
        if (!confirm('Are you sure you want to remove your API key?')) return;

        const result = await deleteApiKey();

        if (result.success) {
            setMessage({ type: 'success', text: 'API key removed successfully' });
            setIsConfigured(false);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to remove API key' });
        }
    };

    const handleSaveEmailSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailMessage(null);

        const result = await updateNotificationSettings(emailSettings);

        if (result.success) {
            setEmailMessage({ type: 'success', text: 'Email settings saved successfully!' });
        } else {
            setEmailMessage({ type: 'error', text: result.error || 'Failed to save settings' });
        }
    };

    const handleTestEmail = async () => {
        setTestingEmail(true);
        setEmailMessage(null);

        const result = await testEmailConfig();

        if (result.success) {
            setEmailMessage({ type: 'success', text: 'Test email sent successfully! Check your inbox.' });
        } else {
            setEmailMessage({ type: 'error', text: result.error || 'Failed to send test email' });
        }

        setTestingEmail(false);
    };

    const handleSaveScheduledScan = async (e: React.FormEvent) => {
        e.preventDefault();
        setScanMessage(null);

        const result = await updateScheduledScanSettings(scheduledScan);

        if (result.success) {
            setScanMessage({ type: 'success', text: 'Scheduled scan settings saved successfully!' });
        } else {
            setScanMessage({ type: 'error', text: result.error || 'Failed to save settings' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            </div>

            <div className="max-w-2xl space-y-6">
                {/* API Key Section */}
                <div className="rounded-lg border border-border bg-card p-6">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold">NVD API Key</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Configure your National Vulnerability Database API key for enhanced rate limits.
                            </p>
                        </div>

                        {isLoading ? (
                            <div className="text-sm text-muted-foreground">Loading...</div>
                        ) : (
                            <>
                                {isConfigured && (
                                    <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-900/50 rounded-md">
                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-sm text-green-500">API key is configured</span>
                                    </div>
                                )}

                                <form onSubmit={handleSaveApiKey} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">API Key</label>
                                        <div className="relative">
                                            <input
                                                type={showKey ? 'text' : 'password'}
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                placeholder="Enter your NVD API key"
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowKey(!showKey)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showKey ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Get your free API key from{' '}
                                            <a
                                                href="https://nvd.nist.gov/developers/request-an-api-key"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:underline"
                                            >
                                                NIST NVD
                                            </a>
                                        </p>
                                    </div>

                                    {message && (
                                        <div className={`p-3 rounded-md text-sm ${message.type === 'success'
                                            ? 'bg-green-900/20 text-green-500 border border-green-900/50'
                                            : 'bg-red-900/20 text-red-500 border border-red-900/50'
                                            }`}>
                                            {message.text}
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
                                        >
                                            Save API Key
                                        </button>
                                        {isConfigured && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteApiKey}
                                                className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
                                            >
                                                Remove Key
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>

                {/* Email Notifications Section */}
                <div className="rounded-lg border border-border bg-card p-6">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold">📧 Email Notifications</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Receive email alerts when vulnerability scans find issues (via Outlook/Office365).
                            </p>
                        </div>

                        <form onSubmit={handleSaveEmailSettings} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <input
                                    type="email"
                                    value={emailSettings.email}
                                    onChange={(e) => setEmailSettings({ ...emailSettings, email: e.target.value })}
                                    placeholder="your.email@company.com"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Outlook Email (SMTP Username)</label>
                                <input
                                    type="email"
                                    value={emailSettings.smtpUsername}
                                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })}
                                    placeholder="your.outlook@outlook.com"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Outlook Password</label>
                                <div className="relative">
                                    <input
                                        type={showSmtpPassword ? 'text' : 'password'}
                                        value={emailSettings.smtpPassword}
                                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                                        placeholder="Your Outlook password or app password"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showSmtpPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Use an app-specific password if you have 2FA  enabled
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Notification Threshold</label>
                                <select
                                    value={emailSettings.severityThreshold}
                                    onChange={(e) => setEmailSettings({ ...emailSettings, severityThreshold: e.target.value })}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="CRITICAL">Critical Only</option>
                                    <option value="HIGH">High & Above</option>
                                    <option value="MEDIUM">Medium & Above</option>
                                    <option value="LOW">All Severities</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="emailEnabled"
                                    checked={emailSettings.enabled}
                                    onChange={(e) => setEmailSettings({ ...emailSettings, enabled: e.target.checked })}
                                    className="w-4 h-4 rounded border-input"
                                />
                                <label htmlFor="emailEnabled" className="text-sm font-medium">
                                    Enable email notifications
                                </label>
                            </div>

                            {emailMessage && (
                                <div className={`p-3 rounded-md text-sm ${emailMessage.type === 'success'
                                    ? 'bg-green-900/20 text-green-500 border border-green-900/50'
                                    : 'bg-red-900/20 text-red-500 border border-red-900/50'
                                    }`}>
                                    {emailMessage.text}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90"
                                >
                                    Save Email Settings
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTestEmail}
                                    disabled={testingEmail}
                                    className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 disabled:opacity-50"
                                >
                                    {testingEmail ? 'Sending...' : 'Send Test Email'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Scheduled Scans Section */}
                <div className="rounded-lg border border-border bg-card p-6">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold">⏰ Scheduled Scans</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Automatically scan all assets on a schedule. Notifications will be sent when new vulnerabilities are found.
                            </p>
                        </div>

                        <form onSubmit={handleSaveScheduledScan} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="scanEnabled"
                                    checked={scheduledScan.enabled}
                                    onChange={(e) => setScheduledScan({ ...scheduledScan, enabled: e.target.checked })}
                                    className="w-4 h-4 rounded border-input"
                                />
                                <label htmlFor="scanEnabled" className="text-sm font-medium">
                                    Enable scheduled scans
                                </label>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Scan Frequency</label>
                                <select
                                    value={scheduledScan.frequency}
                                    onChange={(e) => setScheduledScan({ ...scheduledScan, frequency: e.target.value })}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    disabled={!scheduledScan.enabled}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>

                            {scanMessage && (
                                <div className={`p-3 rounded-md text-sm ${scanMessage.type === 'success'
                                    ? 'bg-green-900/20 text-green-500 border border-green-900/50'
                                    : 'bg-red-900/20 text-red-500 border border-red-900/50'
                                    }`}>
                                    {scanMessage.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90"
                            >
                                Save Scan Schedule
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
