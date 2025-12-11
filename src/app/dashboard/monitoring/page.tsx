'use client'

import { useEffect, useState } from 'react';
import { getAllDevicesStatus } from '@/app/actions/snmp-monitoring';
import Link from 'next/link';

export default function MonitoringPage() {
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(30);

    const fetchDevices = async (silent = false) => {
        if (!silent) setLoading(true);
        else setIsRefreshing(true);

        try {
            const result = await getAllDevicesStatus();
            if (result.success && result.data) {
                setDevices(result.data);
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDevices(false);
    }, []);

    useEffect(() => {
        if (autoRefreshInterval > 0) {
            const interval = setInterval(() => {
                fetchDevices(true);
            }, autoRefreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [autoRefreshInterval]);

    const filteredDevices = devices.filter(d => {
        if (filter === 'online') return d.metrics?.online;
        if (filter === 'offline') return !d.metrics?.online;
        return true;
    });

    const stats = {
        total: devices.length,
        online: devices.filter(d => d.metrics?.online).length,
        offline: devices.filter(d => !d.metrics?.online).length,
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Live Device Monitoring</h2>
                    <p className="text-sm text-muted-foreground mt-1">Real-time SNMP monitoring of network devices</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-md">
                        <label className="text-xs font-medium text-muted-foreground px-2">
                            Auto-Refresh (s):
                        </label>
                        <input
                            type="number"
                            min="5"
                            max="3600"
                            value={autoRefreshInterval}
                            onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                            className="w-16 h-7 rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <button
                        onClick={() => fetchDevices(false)}
                        disabled={loading || isRefreshing}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 min-w-[100px]"
                    >
                        {loading || isRefreshing ? 'Refreshing...' : '🔄 Refresh'}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Devices</h3>
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                    </div>
                    <div className="text-3xl font-bold mt-2">{stats.total}</div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">Online</h3>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-3xl font-bold mt-2 text-green-500">{stats.online}</div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">Offline</h3>
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    </div>
                    <div className="text-3xl font-bold mt-2 text-red-500">{stats.offline}</div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                    All ({stats.total})
                </button>
                <button
                    onClick={() => setFilter('online')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'online' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                    Online ({stats.online})
                </button>
                <button
                    onClick={() => setFilter('offline')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'offline' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                    Offline ({stats.offline})
                </button>
            </div>

            {/* Device Grid */}
            {loading && devices.length === 0 ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-4">Loading devices...</p>
                </div>
            ) : filteredDevices.length === 0 ? (
                <div className="text-center py-12 border border-border rounded-xl bg-card">
                    <svg className="w-16 h-16 mx-auto text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    <p className="text-muted-foreground mt-4">No devices found</p>
                    <Link href="/dashboard/assets" className="text-sm text-blue-500 hover:underline mt-2 inline-block">
                        Configure SNMP on your assets →
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDevices.map((device) => (
                        <DeviceCard key={device.asset.id} device={device} />
                    ))}
                </div>
            )}
        </div>
    );
}

function DeviceCard({ device }: { device: any }) {
    const { asset, metrics } = device;
    const isOnline = metrics?.online || false;

    return (
        <div className={`rounded-xl border p-6 ${isOnline ? 'border-green-500/50 bg-green-950/10' : 'border-red-500/50 bg-red-950/10'}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="font-semibold text-lg">{asset.name}</h3>
                    <p className="text-xs text-muted-foreground">{asset.ipAddress}</p>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {isOnline ? 'Online' : 'Offline'}
                </div>
            </div>

            {/* Fortinet Specific Stats */}
            {metrics.fortinetStats && (
                <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs bg-muted/30 p-2 rounded">
                    <div>
                        <div className="text-muted-foreground">HA Mode</div>
                        <div className="font-medium text-blue-500">{metrics.fortinetStats.haMode}</div>
                    </div>
                    <div>
                        <div className="text-muted-foreground">Sess Rate</div>
                        <div className="font-medium">{metrics.fortinetStats.sessionRate}/s</div>
                    </div>
                    <div>
                        <div className="text-muted-foreground">AV Events</div>
                        <div className={`font-medium ${metrics.fortinetStats.avDetected > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {metrics.fortinetStats.avDetected}
                        </div>
                    </div>
                </div>
            )}

            {isOnline && metrics?.systemInfo ? (
                <>
                    {/* System Info */}
                    <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Hostname:</span>
                            <span className="font-medium">{metrics.systemInfo.hostname}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Uptime:</span>
                            <span className="font-medium">{metrics.systemInfo.uptime}</span>
                        </div>
                        {metrics.systemInfo.location && metrics.systemInfo.location !== 'Unknown' && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Location:</span>
                                <span className="font-medium text-xs">{metrics.systemInfo.location}</span>
                            </div>
                        )}
                    </div>

                    {/* Performance Metrics */}
                    {metrics.performance && (
                        <div className="space-y-3 pt-4 border-t border-border">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">CPU Usage</span>
                                    <span className={`font-bold ${metrics.performance.cpuUsage > asset.cpuThreshold ? 'text-red-500' : 'text-green-500'}`}>
                                        {metrics.performance.cpuUsage}%
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${metrics.performance.cpuUsage > asset.cpuThreshold ? 'bg-red-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(metrics.performance.cpuUsage, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">Memory Usage</span>
                                    <span className={`font-bold ${metrics.performance.memoryUsage > asset.memoryThreshold ? 'text-red-500' : 'text-green-500'}`}>
                                        {metrics.performance.memoryUsage}%
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${metrics.performance.memoryUsage > asset.memoryThreshold ? 'bg-red-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(metrics.performance.memoryUsage, 100)}%` }}
                                    ></div>
                                </div>
                                {metrics.performance.totalMemory > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {metrics.performance.freeMemory}MB free / {metrics.performance.totalMemory}MB total
                                    </p>
                                )}
                                {metrics.performance.storageUsage !== undefined && metrics.performance.storageUsage > 0 && (
                                    <div className="mt-2">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">Storage</span>
                                            <span className="font-bold">{metrics.performance.storageUsage}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full bg-blue-500"
                                                style={{ width: `${Math.min(metrics.performance.storageUsage, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                                {metrics.performance.sessionCount !== undefined && (
                                    <div className="flex justify-between text-sm mt-3 pt-2 border-t border-border border-dashed">
                                        <span className="text-muted-foreground">Active Sessions</span>
                                        <span className="font-bold">{metrics.performance.sessionCount}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Extended Details */}
                    <div className="mt-4 pt-3 border-t border-border">
                        <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                                System Details
                            </summary>
                            <div className="mt-2 space-y-1 text-muted-foreground bg-muted/50 p-2 rounded overflow-hidden">
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-medium">Contact:</span>
                                    <span className="truncate">{metrics.systemInfo?.contact || 'N/A'}</span>

                                    <span className="font-medium">Serial:</span>
                                    <span className="truncate">{metrics.systemInfo?.serialNumber || 'N/A'}</span>

                                    <span className="font-medium">OID:</span>
                                    <span className="truncate" title={metrics.systemInfo?.oid}>{metrics.systemInfo?.oid || 'N/A'}</span>

                                    <span className="font-medium">Desc:</span>
                                    <span className="truncate" title={metrics.systemInfo?.description}>{metrics.systemInfo?.description || 'N/A'}</span>

                                    <span className="font-medium">Location:</span>
                                    <span className="truncate">{metrics.systemInfo?.location || 'N/A'}</span>
                                </div>
                            </div>
                        </details>
                    </div>

                    {/* Watched Interfaces (Only show if list is populated) */}
                    {metrics.interfaces && metrics.interfaces.list && metrics.interfaces.list.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border">
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">Monitored Interfaces</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {metrics.interfaces.list.map((iface: any, i: number) => (
                                    <div key={i} className={`flex items-center justify-between p-2 rounded border ${iface.status === 'Up' ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/30 bg-red-500/10'}`}>
                                        <div className="flex flex-col truncate">
                                            <span className="font-medium text-xs truncate" title={iface.name}>{iface.name}</span>
                                            <span className="text-[10px] text-muted-foreground">{iface.speed !== '0' ? iface.speed : ''}</span>
                                        </div>
                                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${iface.status === 'Up' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                                            {iface.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">{device.error || 'Device not responding'}</p>
                </div>
            )}

            {/* Debug/Performance Error */}
            {isOnline && metrics?.performanceError && (
                <div className="mt-4 p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded border border-red-200 dark:border-red-800">
                    ⚠️ {metrics.performanceError}
                </div>
            )}
        </div>
    );
}
