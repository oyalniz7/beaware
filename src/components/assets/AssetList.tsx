'use client';

import { useState } from 'react';
import { createAsset, deleteAsset } from '@/app/actions/assets';
import { AssetTypeEnum } from '@/lib/schemas';
import { ScanButton } from '@/app/dashboard/components/ScanButton';
import { EditAssetForm } from '@/app/dashboard/components/EditAssetForm';
import { COMMON_VENDORS, getModelsForVendor } from '@/lib/vendor-data';
import Link from 'next/link';

export default function AssetList({ initialAssets }: { initialAssets: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingAsset, setEditingAsset] = useState<any | null>(null);

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
                >
                    {isAdding ? 'Cancel' : 'Add New Asset'}
                </button>
            </div>

            {isAdding && (
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <AddAssetForm onSuccess={() => setIsAdding(false)} />
                </div>
            )}

            {editingAsset && (
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Edit Asset</h3>
                    <EditAssetForm
                        asset={editingAsset}
                        onSuccess={() => setEditingAsset(null)}
                        onCancel={() => setEditingAsset(null)}
                    />
                </div>
            )}

            <div className="rounded-md border border-border bg-card">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/50">
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Vendor</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Model</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Version</th>
                            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialAssets.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                    No assets found. Add one to get started.
                                </td>
                            </tr>
                        ) : (
                            initialAssets.map((asset) => (
                                <tr key={asset.id} className="border-b border-border transition-colors hover:bg-muted/50 last:border-0">
                                    <td className="p-4 font-medium">{asset.name}</td>
                                    <td className="p-4">{asset.type}</td>
                                    <td className="p-4">{asset.vendor || '-'}</td>
                                    <td className="p-4">{asset.model || '-'}</td>
                                    <td className="p-4">{asset.version || '-'}</td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-3">
                                            {asset.snmpEnabled && (
                                                <Link href="/dashboard/monitoring" className="flex items-center text-xs text-green-500 hover:underline">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                                                    Live
                                                </Link>
                                            )}
                                            <a
                                                href={`/dashboard/risks?assetId=${asset.id}`}
                                                className="text-purple-500 hover:underline text-xs"
                                            >
                                                View {asset.risks?.length || 0} Vulns
                                            </a>
                                            <ScanButton assetId={asset.id} assetName={asset.name} />
                                            <button
                                                onClick={() => setEditingAsset(asset)}
                                                className="text-blue-500 hover:underline text-xs"
                                            >
                                                Edit
                                            </button>
                                            <form action={async () => {
                                                if (confirm('Are you sure?')) await deleteAsset(asset.id);
                                            }}>
                                                <button type="submit" className="text-destructive hover:underline text-xs">Delete</button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AddAssetForm({ onSuccess }: { onSuccess: () => void }) {
    const [error, setError] = useState<string | null>(null);
    // Controlled inputs state
    const [formData, setFormData] = useState({
        name: '',
        type: 'Hardware',
        model: '',
        version: '',
        vendor: '',
        cpe: '',
        location: '',
        ipAddress: '',
        snmpEnabled: false,
        snmpCommunity: '',
        snmpPort: 161,
        snmpVersion: 'v2c',
        cpuThreshold: 80,
        memoryThreshold: 90
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                (name === 'snmpPort' || name.includes('Threshold')) ? parseInt(value) : value
        }));
    };


    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault(); // Prevent default browser submission
        setError(null);

        const result = await createAsset(formData as any);

        if (result.success) {
            onSuccess();
            // Optional: Form reset is handled by parent unmounting this component,
            // but if we wanted to stay open we would reset state here.
        } else {
            setError(JSON.stringify(result.error));
            // State remains intact, so user can edit and retry
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-900/20 text-red-500 text-xs rounded-md border border-red-900/50">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Asset Name *</label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="e.g. Core Switch"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Type *</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&>option]:text-foreground [&>option]:bg-card"
                    >
                        {AssetTypeEnum.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Vendor *</label>
                    <select
                        name="vendor"
                        value={formData.vendor}
                        onChange={(e) => {
                            handleInputChange(e);
                            // Reset model when vendor changes
                            if (e.target.value !== formData.vendor) {
                                setFormData(prev => ({ ...prev, model: '' }));
                            }
                        }}
                        required
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&>option]:text-foreground [&>option]:bg-card"
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
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&>option]:text-foreground [&>option]:bg-card disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">Select Model...</option>
                        {formData.vendor && getModelsForVendor(formData.vendor).map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                    {formData.vendor && !formData.model && (
                        <p className="text-xs text-muted-foreground">
                            Select a model for {formData.vendor}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Version</label>
                    <input
                        name="version"
                        value={formData.version}
                        onChange={handleInputChange}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="e.g. 17.9.4"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <input
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                        id="add-snmpEnabled"
                        name="snmpEnabled"
                        checked={formData.snmpEnabled}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="add-snmpEnabled" className="text-sm font-medium">
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
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90">
                    Save Asset
                </button>
            </div>
        </form>
    )
}
