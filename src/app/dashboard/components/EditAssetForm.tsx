'use client'

import { useState } from 'react';
import { updateAsset } from '@/app/actions/asset-management';
import { AssetFormData, AssetTypeEnum } from '@/lib/schemas';
import { COMMON_VENDORS, getModelsForVendor } from '@/lib/vendor-data';
import { testSnmpConnection, getAvailableInterfaces, detectAssetDetails } from '@/app/actions/snmp-monitoring';

interface EditAssetFormProps {
    asset: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export function EditAssetForm({ asset, onSuccess, onCancel }: EditAssetFormProps) {
    const [error, setError] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [testing, setTesting] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [discovering, setDiscovering] = useState(false);
    const [discoveryError, setDiscoveryError] = useState<string | null>(null);
    const [discoveredInterfaces, setDiscoveredInterfaces] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: asset.name || '',
        type: asset.type || 'Hardware',
        model: asset.model || '',
        version: asset.version || '',
        vendor: asset.vendor || '',
        cpe: asset.cpe || '',
        location: asset.location || '',
        ipAddress: asset.ipAddress || '',
        snmpEnabled: asset.snmpEnabled || false,
        snmpCommunity: asset.snmpCommunity || '',
        snmpVersion: asset.snmpVersion || 'v2c',
        snmpPort: asset.snmpPort || 161,
        cpuThreshold: asset.cpuThreshold || 80,
        memoryThreshold: asset.memoryThreshold || 90,
        storageThreshold: asset.storageThreshold || 90,
        alertRules: asset.alertRules || '',
        snmpMetrics: asset.snmpMetrics || 'cpu,memory',
        watchedInterfaces: asset.watchedInterfaces || '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                (name === 'snmpPort' || name.includes('Threshold')) ? parseInt(value) : value
        }));
    };

    const handleTestConnection = async () => {
        if (!formData.ipAddress || !formData.snmpCommunity) return;
        setTesting(true);
        setTestResult(null);
        try {
            const result = await testSnmpConnection(formData.ipAddress, formData.snmpCommunity, formData.snmpPort);
            setTestResult(result);
        } catch (err: any) {
            setTestResult({ success: false, message: err.message });
        } finally {
            setTesting(false);
        }
    };

    const handleAutoDetect = async () => {
        if (!formData.ipAddress || !formData.snmpCommunity) return;
        setDetecting(true);
        try {
            const result = await detectAssetDetails(
                formData.ipAddress,
                formData.snmpCommunity,
                formData.snmpPort
            );
            if (result.success && result.details) {
                setFormData(prev => ({
                    ...prev,
                    vendor: result.details.vendor || prev.vendor,
                    model: result.details.model || prev.model,
                    version: result.details.version || prev.version,
                }));
                alert(`Detected: ${result.details.vendor} ${result.details.model} ${result.details.version}`);
            } else {
                alert(`Detection failed: ${result.error || 'Unknown error'}`);
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setDetecting(false);
        }
    };

    const handleDiscoverInterfaces = async () => {
        if (!formData.ipAddress || !formData.snmpCommunity) return;
        setDiscovering(true);
        setDiscoveryError(null);
        setDiscoveredInterfaces([]);
        try {
            const result = await getAvailableInterfaces(
                formData.ipAddress,
                formData.snmpCommunity,
                formData.snmpPort
            );
            if (result.success && result.interfaces) {
                setDiscoveredInterfaces(result.interfaces);
            } else {
                setDiscoveryError(result.error || 'Failed to discover interfaces');
            }
        } catch (err: any) {
            setDiscoveryError(err.message);
        } finally {
            setDiscovering(false);
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const result = await updateAsset(asset.id, formData as any);

        if (result.success) {
            onSuccess();
        } else {
            setError(JSON.stringify(result.error));
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-900/20 text-red-500 text-xs rounded-md border border-red-900/50">{error}</div>}

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Asset Name *</label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Type *</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&>option]:text-foreground [&>option]:bg-card"
                    >
                        {AssetTypeEnum.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Vendor *</label>
                        <button
                            type="button"
                            onClick={handleAutoDetect}
                            disabled={detecting || !formData.ipAddress || !formData.snmpCommunity}
                            className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200 hover:bg-blue-200 disabled:opacity-50"
                            title="Auto-fill Vendor, Model, and Version from SNMP"
                        >
                            {detecting ? '...' : 'Auto-Detect'}
                        </button>
                    </div>
                    <select
                        name="vendor"
                        value={formData.vendor}
                        onChange={(e) => {
                            handleInputChange(e);
                            if (e.target.value !== formData.vendor) {
                                setFormData(prev => ({ ...prev, model: '' }));
                            }
                        }}
                        required
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&>option]:text-foreground [&>option]:bg-card"
                    >
                        <option value="">Select Vendor...</option>
                        {COMMON_VENDORS.map(vendor => (
                            <option key={vendor} value={vendor}>{vendor}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Model *</label>
                    <select
                        name="model"
                        value={formData.model}
                        onChange={handleInputChange}
                        required
                        disabled={!formData.vendor}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&>option]:text-foreground [&>option]:bg-card disabled:opacity-50"
                    >
                        <option value="">Select Model...</option>
                        {formData.vendor && getModelsForVendor(formData.vendor).map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Version</label>
                    <input
                        name="version"
                        value={formData.version}
                        onChange={handleInputChange}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <input
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">IP Address</label>
                    <input
                        name="ipAddress"
                        value={formData.ipAddress}
                        onChange={handleInputChange}
                        placeholder="192.168.1.1"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                </div>
            </div>

            {/* SNMP Configuration */}
            <div className="border border-border rounded-md p-4 bg-secondary/10 space-y-4">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="snmpEnabled"
                        name="snmpEnabled"
                        checked={formData.snmpEnabled}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="snmpEnabled" className="text-sm font-medium">
                        Enable SNMP Monitoring
                    </label>
                </div>

                {formData.snmpEnabled && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Community String</label>
                            <input
                                name="snmpCommunity"
                                type="password"
                                value={formData.snmpCommunity}
                                onChange={handleInputChange}
                                placeholder="public"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Port</label>
                            <input
                                name="snmpPort"
                                type="number"
                                value={formData.snmpPort}
                                onChange={handleInputChange}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>

                        {/* Thresholds */}
                        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-border pt-4 mt-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">CPU Alert Threshold (%)</label>
                                <input
                                    name="cpuThreshold"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={formData.cpuThreshold}
                                    onChange={handleInputChange}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Memory Alert Threshold (%)</label>
                                <input
                                    name="memoryThreshold"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={formData.memoryThreshold}
                                    onChange={handleInputChange}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Storage Alert Threshold (%)</label>
                                <input
                                    name="storageThreshold"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={formData.storageThreshold}
                                    onChange={handleInputChange}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                        </div>

                        {/* Notification Rules */}
                        <div className="col-span-2 space-y-2 pt-2 border-t border-border mt-2">
                            <label className="text-sm font-medium block">Alert Notifications</label>
                            <p className="text-[10px] text-muted-foreground mb-2">Select which events trigger an alert notification.</p>
                            <div className="grid grid-cols-3 gap-2">
                                {['cpu', 'memory', 'storage', 'interface', 'ha'].map((rule) => (
                                    <div key={rule} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`alert-${rule}`}
                                            checked={formData.alertRules?.includes(rule) ?? false}
                                            onChange={(e) => {
                                                const current = formData.alertRules ? formData.alertRules.split(',') : [];
                                                let updated = [...current];
                                                if (e.target.checked) {
                                                    if (!updated.includes(rule)) updated.push(rule);
                                                } else {
                                                    updated = updated.filter(r => r !== rule);
                                                }
                                                setFormData(prev => ({ ...prev, alertRules: updated.join(',') }));
                                            }}
                                            className="h-3.5 w-3.5 rounded border-gray-300"
                                        />
                                        <label htmlFor={`alert-${rule}`} className="text-xs capitalize text-muted-foreground mb-0">{rule === 'ha' ? 'HA Status' : rule === 'interface' ? 'Interface Down' : `${rule} Threshold`}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interface Watchlist */}
                        <div className="col-span-2 space-y-2 pt-2 border-t border-border mt-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Interface Watchlist</label>
                                <button
                                    type="button"
                                    onClick={handleDiscoverInterfaces}
                                    disabled={discovering || !formData.ipAddress || !formData.snmpCommunity}
                                    className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded border hover:text-foreground hover:border-foreground transition-colors disabled:opacity-50"
                                >
                                    {discovering ? 'Scanning...' : 'Scan Interfaces'}
                                </button>
                            </div>

                            {discoveryError && <p className="text-xs text-red-500 font-medium my-1">{discoveryError}</p>}

                            {!discovering && !discoveryError && discoveredInterfaces.length > 0 && (
                                <p className="text-xs text-green-600 italic my-1">
                                    Found {discoveredInterfaces.length} interfaces.
                                </p>
                            )}

                            {!discovering && !discoveryError && discoveredInterfaces.length === 0 && !formData.watchedInterfaces && (
                                <p className="text-xs text-muted-foreground italic my-1">No interfaces found. Click Scan to discover.</p>
                            )}

                            {(discoveredInterfaces.length > 0 || formData.watchedInterfaces) && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2 bg-muted/20 rounded border border-border max-h-32 overflow-y-auto">
                                    {(discoveredInterfaces.length > 0 ? discoveredInterfaces : (formData.watchedInterfaces?.split(',') || []).filter((s: string) => s.trim() !== '')).map((iface: string) => (
                                        iface && <div key={iface} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`iface-${iface}`}
                                                checked={formData.watchedInterfaces?.split(',').includes(iface) || false}
                                                onChange={(e) => {
                                                    const current = formData.watchedInterfaces ? formData.watchedInterfaces.split(',') : [];
                                                    let updated = [...current];
                                                    if (e.target.checked) {
                                                        if (!updated.includes(iface)) updated.push(iface);
                                                    } else {
                                                        updated = updated.filter(i => i !== iface);
                                                    }
                                                    setFormData(prev => ({ ...prev, watchedInterfaces: updated.join(',') }));
                                                }}
                                                className="h-3.5 w-3.5 rounded border-gray-300"
                                            />
                                            <label htmlFor={`iface-${iface}`} className="text-xs truncate w-full" title={iface}>{iface}</label>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-[10px] text-muted-foreground">Select specific interfaces to monitor status and detailed traffic stats.</p>
                        </div>

                        {/* Metrics Selection */}
                        <div className="col-span-2 space-y-2 pt-2 border-t border-border mt-2">
                            <label className="text-sm font-medium block">Metrics to Monitor (Dashboard)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['cpu', 'memory', 'sessions', 'storage'].map((metric) => (
                                    <div key={metric} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`metric-${metric}`}
                                            checked={formData.snmpMetrics?.includes(metric) ?? (metric === 'cpu' || metric === 'memory')}
                                            onChange={(e) => {
                                                const current = formData.snmpMetrics ? formData.snmpMetrics.split(',') : ['cpu', 'memory'];
                                                let updated = [...current];
                                                if (e.target.checked) {
                                                    if (!updated.includes(metric)) updated.push(metric);
                                                } else {
                                                    updated = updated.filter(m => m !== metric);
                                                }
                                                setFormData(prev => ({ ...prev, snmpMetrics: updated.join(',') }));
                                            }}
                                            className="h-3.5 w-3.5 rounded border-gray-300"
                                        />
                                        <label htmlFor={`metric-${metric}`} className="text-xs capitalize text-muted-foreground">{metric}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-2 flex items-center gap-4 mt-2">
                            <button
                                type="button"
                                onClick={handleTestConnection}
                                disabled={testing || !formData.ipAddress || !formData.snmpCommunity}
                                className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded border border-border hover:bg-secondary/80 disabled:opacity-50"
                            >
                                {testing ? 'Testing...' : 'Test Connection'}
                            </button>
                            {testResult && (
                                <span className={`text-xs ${testResult.success ? 'text-green-500' : 'text-red-500'}`}>
                                    {testResult.message}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 rounded-md text-sm border border-input hover:bg-accent transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90"
                >
                    Update Asset
                </button>
            </div>
        </form>
    );
}
