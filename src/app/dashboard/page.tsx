import { getDashboardStats } from '../actions/stats';
import Link from 'next/link';
import {
    Server,
    Laptop,
    Database,
    Globe,
    Router,
    Box,
    ShieldAlert,
    Activity
} from 'lucide-react';

export default async function DashboardPage() {
    const statsResult = await getDashboardStats();
    const stats = statsResult.success && statsResult.data ? statsResult.data : null;

    if (!stats) {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                <div className="text-muted-foreground">Failed to load dashboard statistics</div>
            </div>
        );
    }

    const riskScoreColors = {
        'A+': 'text-green-500',
        'A': 'text-green-600',
        'B': 'text-yellow-500',
        'C': 'text-orange-500',
        'D': 'text-red-500',
        'F': 'text-red-600',
    };

    const getAssetIcon = (type: string) => {
        const lowerType = type?.toLowerCase() || '';
        if (lowerType.includes('server')) return <Server className="w-6 h-6" />;
        if (lowerType.includes('laptop') || lowerType.includes('desktop')) return <Laptop className="w-6 h-6" />;
        if (lowerType.includes('database') || lowerType.includes('sql')) return <Database className="w-6 h-6" />;
        if (lowerType.includes('router') || lowerType.includes('switch') || lowerType.includes('modem')) return <Router className="w-6 h-6" />;
        if (lowerType.includes('web') || lowerType.includes('site') || lowerType.includes('service')) return <Globe className="w-6 h-6" />;
        return <Box className="w-6 h-6" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Security Overview</h2>
                <div className="text-sm text-muted-foreground">
                    Last updated: {new Date().toLocaleString()}
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Assets</h3>
                        <Box className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-3xl font-bold mt-2">{stats.totalAssets}</div>
                    <Link href="/dashboard/assets" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
                        View all assets →
                    </Link>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">Open Vulnerabilities</h3>
                        <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-3xl font-bold mt-2">{stats.totalOpenVulnerabilities}</div>
                    <Link href="/dashboard/risks" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
                        View all risks →
                    </Link>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">Pending Scans</h3>
                        <Activity className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-3xl font-bold mt-2">{stats.pendingScans}</div>
                    <div className="text-xs text-muted-foreground mt-2">Scans in progress</div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">Risk Score</h3>
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className={`text-3xl font-bold mt-2 ${riskScoreColors[stats.riskScore]}`}>
                        {stats.riskScore}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        {stats.riskScore === 'A+' && 'Excellent security posture'}
                        {stats.riskScore === 'A' && 'Good security posture'}
                        {stats.riskScore === 'B' && 'Moderate risk'}
                        {stats.riskScore === 'C' && 'Elevated risk'}
                        {stats.riskScore === 'D' && 'High risk'}
                        {stats.riskScore === 'F' && 'Critical risk - immediate action required'}
                    </div>
                </div>
            </div>

            {/* Vulnerability Breakdown */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Severity Breakdown */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Vulnerability Breakdown</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-sm">Critical</span>
                            </div>
                            <span className="font-bold text-red-500">{stats.severityCounts.CRITICAL}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                <span className="text-sm">High</span>
                            </div>
                            <span className="font-bold text-orange-500">{stats.severityCounts.HIGH}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <span className="text-sm">Medium</span>
                            </div>
                            <span className="font-bold text-yellow-500">{stats.severityCounts.MEDIUM}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-sm">Low</span>
                            </div>
                            <span className="font-bold text-blue-500">{stats.severityCounts.LOW}</span>
                        </div>
                    </div>
                    {stats.totalOpenVulnerabilities === 0 && (
                        <div className="mt-4 p-4 bg-green-900/20 border border-green-900/50 rounded-md text-center">
                            <ShieldAlert className="w-12 h-12 mx-auto text-green-500 mb-2" />
                            <p className="text-sm text-green-500 font-medium">No open vulnerabilities!</p>
                        </div>
                    )}
                </div>

                {/* Top Vulnerable Assets */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Most Vulnerable Assets</h3>
                    {stats.topVulnerableAssets.length > 0 ? (
                        <div className="space-y-3">
                            {stats.topVulnerableAssets.map((item: any, index: number) => (
                                <Link
                                    key={item.asset.id}
                                    href={`/dashboard/risks?assetId=${item.asset.id}`}
                                    className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border group"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="flex-shrink-0 p-2 bg-muted rounded-md group-hover:bg-background transition-colors">
                                            {getAssetIcon(item.asset.type)}
                                        </div>
                                        <div>
                                            <div className="font-medium">{item.asset.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {item.asset.vendor} {item.asset.model}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        {item.critical > 0 && (
                                            <span className="px-2 py-1 bg-red-900/20 text-red-500 rounded text-xs font-semibold">
                                                {item.critical} Critical
                                            </span>
                                        )}
                                        {item.high > 0 && (
                                            <span className="px-2 py-1 bg-orange-900/20 text-orange-500 rounded text-xs font-semibold">
                                                {item.high} High
                                            </span>
                                        )}
                                        <span className="text-sm font-bold ml-2">{item.count} total</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            <ShieldAlert className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No vulnerable assets</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Scans */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Recent Scan Activity</h3>
                {stats.recentScans.length > 0 ? (
                    <div className="space-y-2">
                        {stats.recentScans.map((scan: any) => (
                            <div
                                key={scan.id}
                                className="flex items-center justify-between p-3 rounded-md border border-border"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${scan.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' :
                                            scan.status === 'FAILED' ? 'bg-red-100 dark:bg-red-900/20 text-red-600' :
                                                'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600'
                                        }`}>
                                        {getAssetIcon(scan.asset.type)}
                                    </div>
                                    <div>
                                        <div className="font-medium">{scan.asset.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(scan.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {scan.status === 'COMPLETED' && scan.vulnerabilitiesFound !== null && (
                                        <span className="text-sm">
                                            <span className="font-bold">{scan.vulnerabilitiesFound}</span> vulnerabilities
                                        </span>
                                    )}
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${scan.status === 'COMPLETED' ? 'bg-green-900/20 text-green-500' :
                                        scan.status === 'FAILED' ? 'bg-red-900/20 text-red-500' :
                                            'bg-yellow-900/20 text-yellow-500'
                                        }`}>
                                        {scan.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No scans performed yet</p>
                        <Link href="/dashboard/assets" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
                            Go to assets to start scanning →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
