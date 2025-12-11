'use client'

import { useState } from 'react';
import { updateRiskStatus } from '@/app/actions/risks';

interface RiskListProps {
    initialRisks: any[];
    showAssetFilter?: boolean;
    assets?: any[];
}

export function RiskList({ initialRisks, showAssetFilter = true, assets = [] }: RiskListProps) {
    const [risks, setRisks] = useState(initialRisks);
    const [filter, setFilter] = useState({ severity: 'ALL', status: 'ALL', assetId: 'ALL' });
    const [sortBy, setSortBy] = useState<'risk' | 'score' | 'asset' | 'cve'>('risk');

    // Severity order for sorting
    const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3, 'NONE': 4 };

    const filteredRisks = risks
        .filter(risk => {
            if (filter.severity !== 'ALL' && risk.vulnerability.severity !== filter.severity) return false;
            if (filter.status !== 'ALL' && risk.status !== filter.status) return false;
            if (filter.assetId !== 'ALL' && risk.assetId !== filter.assetId) return false;
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'risk':
                    // Highest risk first: Severity, then CVSS score
                    const severityDiff = severityOrder[a.vulnerability.severity as keyof typeof severityOrder] -
                        severityOrder[b.vulnerability.severity as keyof typeof severityOrder];
                    if (severityDiff !== 0) return severityDiff;
                    return (b.vulnerability.score || 0) - (a.vulnerability.score || 0);

                case 'score':
                    // Highest CVSS score first
                    return (b.vulnerability.score || 0) - (a.vulnerability.score || 0);

                case 'asset':
                    // Alphabetical by asset name
                    return a.asset.name.localeCompare(b.asset.name);

                case 'cve':
                    // Reverse chronological by CVE ID (newer CVEs first)
                    return b.vulnerability.cveId.localeCompare(a.vulnerability.cveId);

                default:
                    return 0;
            }
        });

    const handleStatusChange = async (riskId: string, newStatus: string) => {
        const result = await updateRiskStatus(riskId, newStatus);
        if (result.success) {
            setRisks(risks.map(r => r.id === riskId ? { ...r, status: newStatus } : r));
        }
    };

    // Calculate risk statistics
    const stats = {
        critical: filteredRisks.filter(r => r.vulnerability.severity === 'CRITICAL').length,
        high: filteredRisks.filter(r => r.vulnerability.severity === 'HIGH').length,
        medium: filteredRisks.filter(r => r.vulnerability.severity === 'MEDIUM').length,
        low: filteredRisks.filter(r => r.vulnerability.severity === 'LOW').length,
        open: filteredRisks.filter(r => r.status === 'OPEN').length,
    };

    const severityColors = {
        'CRITICAL': 'text-red-500 bg-red-900/20 border-red-900/50',
        'HIGH': 'text-orange-500 bg-orange-900/20 border-orange-900/50',
        'MEDIUM': 'text-yellow-500 bg-yellow-900/20 border-yellow-900/50',
        'LOW': 'text-blue-500 bg-blue-900/20 border-blue-900/50',
        'NONE': 'text-gray-500 bg-gray-900/20 border-gray-900/50',
    };

    const statusColors = {
        'OPEN': 'bg-red-900/20 text-red-500',
        'MITIGATED': 'bg-green-900/20 text-green-500',
        'ACCEPTED': 'bg-blue-900/20 text-blue-500',
        'FALSE_POSITIVE': 'bg-gray-900/20 text-gray-500',
    };

    return (
        <div className="space-y-6">
            {/* Risk Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="text-sm text-muted-foreground">Total Risks</div>
                    <div className="text-2xl font-bold mt-1">{filteredRisks.length}</div>
                </div>
                <div className="rounded-lg border border-red-900/50 bg-red-900/10 p-4">
                    <div className="text-sm text-red-500">Critical</div>
                    <div className="text-2xl font-bold text-red-500 mt-1">{stats.critical}</div>
                </div>
                <div className="rounded-lg border border-orange-900/50 bg-orange-900/10 p-4">
                    <div className="text-sm text-orange-500">High</div>
                    <div className="text-2xl font-bold text-orange-500 mt-1">{stats.high}</div>
                </div>
                <div className="rounded-lg border border-yellow-900/50 bg-yellow-900/10 p-4">
                    <div className="text-sm text-yellow-500">Medium</div>
                    <div className="text-2xl font-bold text-yellow-500 mt-1">{stats.medium}</div>
                </div>
                <div className="rounded-lg border border-blue-900/50 bg-blue-900/10 p-4">
                    <div className="text-sm text-blue-500">Low</div>
                    <div className="text-2xl font-bold text-blue-500 mt-1">{stats.low}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap gap-4 items-center">
                    {showAssetFilter && assets.length > 0 && (
                        <div className="flex gap-2 items-center">
                            <label className="text-sm font-medium">Asset:</label>
                            <select
                                value={filter.assetId}
                                onChange={(e) => setFilter({ ...filter, assetId: e.target.value })}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[180px]"
                            >
                                <option value="ALL">All Assets</option>
                                {assets.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.name} ({asset.vendor || 'Unknown'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex gap-2 items-center">
                        <label className="text-sm font-medium">Severity:</label>
                        <select
                            value={filter.severity}
                            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="ALL">All</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>

                    <div className="flex gap-2 items-center">
                        <label className="text-sm font-medium">Status:</label>
                        <select
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="ALL">All</option>
                            <option value="OPEN">Open</option>
                            <option value="MITIGATED">Mitigated</option>
                            <option value="ACCEPTED">Accepted</option>
                            <option value="FALSE_POSITIVE">False Positive</option>
                        </select>
                    </div>

                    <div className="flex gap-2 items-center">
                        <label className="text-sm font-medium">Sort by:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'risk' | 'score' | 'asset' | 'cve')}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="risk">Risk (Severity + Score)</option>
                            <option value="score">CVSS Score</option>
                            <option value="asset">Asset Name</option>
                            <option value="cve">CVE ID (Newest)</option>
                        </select>
                    </div>

                    <div className="ml-auto text-sm font-medium">
                        <span className="text-red-500">{stats.open} Open</span>
                        <span className="text-muted-foreground mx-2">·</span>
                        <span className="text-muted-foreground">{filteredRisks.length} Total</span>
                    </div>
                </div>
            </div>

            {/* Risk List */}
            {filteredRisks.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-12 text-center">
                    <div className="text-muted-foreground">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium">No vulnerabilities found</p>
                        <p className="text-sm mt-1">Scan your assets to discover potential risks</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredRisks.map((risk) => (
                        <div
                            key={risk.id}
                            className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${severityColors[risk.vulnerability.severity as keyof typeof severityColors]}`}>
                                            {risk.vulnerability.severity}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            CVSS {risk.vulnerability.score || 'N/A'}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded text-xs font-medium ${statusColors[risk.status as keyof typeof statusColors]}`}>
                                            {risk.status}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-lg">
                                            <a
                                                href={`https://nvd.nist.gov/vuln/detail/${risk.vulnerability.cveId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:text-blue-500 hover:underline"
                                            >
                                                {risk.vulnerability.cveId}
                                            </a>
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {risk.vulnerability.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>Asset: <span className="text-foreground font-medium">{risk.asset.name}</span></span>
                                        <span>Type: {risk.asset.type}</span>
                                        {risk.asset.version && <span>Version: {risk.asset.version}</span>}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <select
                                        value={risk.status}
                                        onChange={(e) => handleStatusChange(risk.id, e.target.value)}
                                        className="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium"
                                    >
                                        <option value="OPEN">Open</option>
                                        <option value="MITIGATED">Mitigated</option>
                                        <option value="ACCEPTED">Accepted</option>
                                        <option value="FALSE_POSITIVE">False Positive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
