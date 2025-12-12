/**
 * SNMP Client for querying network devices
 * Supports SNMPv2c for live device monitoring
 */

import snmp from 'net-snmp';

export interface DeviceMetrics {
    online: boolean;
    systemInfo?: {
        hostname: string;
        description: string;
        uptime: string; // Human readable
        uptimeSeconds: number;
        location: string;
        contact?: string;
        serialNumber?: string;
        oid?: string;
    };
    performance?: {
        cpuUsage: number; // Percentage
        memoryUsage: number; // Percentage
        totalMemory: number; // MB
        freeMemory: number; // MB
        sessionCount?: number;
        storageUsage?: number;
    };
    interfaces?: {
        count: number;
        list: Array<{
            index: number;
            description: string;
            status: 'up' | 'down' | 'testing' | 'unknown';
        }>;
    };
    error?: string;
    performanceError?: string;
    fortinetStats?: {
        haMode: string;
        sessionRate: number;
        avDetected: number;
    };
}

// Standard SNMP OIDs
const OIDs = {
    // System Information
    sysDescr: '1.3.6.1.2.1.1.1.0',
    sysObjectID: '1.3.6.1.2.1.1.2.0',
    sysUpTime: '1.3.6.1.2.1.1.3.0',
    sysName: '1.3.6.1.2.1.1.5.0',
    sysLocation: '1.3.6.1.2.1.1.6.0',

    // Interface Count
    ifNumber: '1.3.6.1.2.1.2.1.0',

    // Vendor Specific
    // Linux / Net-SNMP
    linux: {
        cpuUser: '1.3.6.1.4.1.2021.11.9.0',
        cpuSystem: '1.3.6.1.4.1.2021.11.10.0',
        memTotal: '1.3.6.1.4.1.2021.4.5.0',
        memAvail: '1.3.6.1.4.1.2021.4.6.0',
    },
    // Fortinet
    fortinet: {
        cpu: '1.3.6.1.4.1.12356.101.4.1.3.0', // fnSysCpuUsage (0-100)
        mem: '1.3.6.1.4.1.12356.101.4.1.4.0', // fnSysMemUsage (0-100)
    },
    // Cisco (Old IOS / Standard)
    cisco: {
        cpu: '1.3.6.1.4.1.9.2.1.58.0', // 5 min average
        memUsed: '1.3.6.1.4.1.9.9.48.1.1.1.5.1', // Pool 1 Used
        memFree: '1.3.6.1.4.1.9.9.48.1.1.1.6.1', // Pool 1 Free
    }
};

/**
 * Query device via SNMP and get live metrics
 */
export async function queryDevice(
    ipAddress: string,
    community: string = 'public',
    port: number = 161,
    metricsToFetch: string[] = ['cpu', 'memory']
): Promise<DeviceMetrics> {
    return new Promise((resolve) => {
        const session = snmp.createSession(ipAddress, community, {
            port,
            retries: 1,
            timeout: 5000,
            version: snmp.Version2c,
        });

        const metrics: DeviceMetrics = {
            online: false,
        };

        // Phase 1: Get System Info to detect vendor
        const sysOids = [
            OIDs.sysDescr,
            OIDs.sysUpTime,
            OIDs.sysName,
            OIDs.sysLocation,
            OIDs.ifNumber,
            OIDs.sysObjectID,
            '1.3.6.1.2.1.1.4.0' // sysContact
        ];

        session.get(sysOids, (error: any, varbinds: any) => {
            if (error) {
                metrics.error = error.message;
                session.close();
                resolve(metrics);
                return;
            }

            try {
                metrics.online = true;

                const sysDescr = varbinds[0].value?.toString() || 'Unknown';
                const uptimeVal = parseInt(varbinds[1].value?.toString() || '0');

                metrics.systemInfo = {
                    description: sysDescr,
                    uptimeSeconds: uptimeVal / 100,
                    uptime: formatUptime(uptimeVal / 100),
                    hostname: varbinds[2].value?.toString() || 'Unknown',
                    location: varbinds[3].value?.toString() || 'Unknown',
                    contact: varbinds[6]?.value?.toString() || 'Unknown',
                    oid: varbinds[5]?.value?.toString() || 'Unknown'
                };

                const ifCount = parseInt(varbinds[4]?.value?.toString() || '0');
                if (ifCount > 0) {
                    metrics.interfaces = { count: ifCount, list: [] };
                }

                const sysObjectId = varbinds[5]?.value?.toString() || '';

                // Detect Vendor and Select Performance OIDs
                const lowerDescr = sysDescr.toLowerCase();
                let perfOids: string[] = [];
                let type: 'linux' | 'fortinet' | 'cisco' | 'unknown' = 'unknown';

                console.log(`[SNMP] Device ${ipAddress} connected. Descr: ${sysDescr}, OID: ${sysObjectId}`);

                if (lowerDescr.includes('forti') || sysObjectId.includes('1.3.6.1.4.1.12356')) {
                    type = 'fortinet';
                    // Base metrics
                    if (metricsToFetch.includes('cpu')) perfOids.push(OIDs.fortinet.cpu);
                    if (metricsToFetch.includes('memory')) perfOids.push(OIDs.fortinet.mem);
                    if (metricsToFetch.includes('sessions')) perfOids.push('1.3.6.1.4.1.12356.101.4.1.8.0');
                    if (metricsToFetch.includes('storage')) perfOids.push('1.3.6.1.4.1.12356.101.4.1.6.0'); // fnSysDiskUsage
                    // Always try to fetch Serial for Fortinet
                    perfOids.push('1.3.6.1.4.1.12356.100.1.1.1.0');
                    // Firmware Version
                    perfOids.push('1.3.6.1.4.1.12356.101.4.1.1.0');

                    // --- Fortinet Deep Dive ---
                    // HA Mode
                    perfOids.push('1.3.6.1.4.1.12356.101.13.1.1.0');
                    // Session Rate (1 min)
                    perfOids.push('1.3.6.1.4.1.12356.101.4.1.11.0');
                    // AV Detected (Root VDOM - index 1)
                    perfOids.push('1.3.6.1.4.1.12356.101.8.2.1.1.1.1');

                } else if (lowerDescr.includes('cisco') || sysObjectId.includes('1.3.6.1.4.1.9')) {
                    type = 'cisco';
                    if (metricsToFetch.includes('cpu')) perfOids.push(OIDs.cisco.cpu);
                    if (metricsToFetch.includes('memory')) {
                        perfOids.push(OIDs.cisco.memUsed);
                        perfOids.push(OIDs.cisco.memFree);
                    }
                    // Try Entity MIB for Serial
                    perfOids.push('1.3.6.1.2.1.47.1.1.1.1.11.1');
                } else {
                    // Default to Linux/Net-SNMP
                    type = 'linux';
                    if (metricsToFetch.includes('cpu')) {
                        perfOids.push(OIDs.linux.cpuUser);
                        perfOids.push(OIDs.linux.cpuSystem);
                    }
                    if (metricsToFetch.includes('memory')) {
                        perfOids.push(OIDs.linux.memTotal);
                        perfOids.push(OIDs.linux.memAvail);
                    }
                    if (metricsToFetch.includes('storage')) {
                        perfOids.push('1.3.6.1.4.1.2021.9.1.9.1'); // dskPercent.1
                    }
                }

                // Fetch Interfaces Table (1.3.6.1.2.1.2.2) 
                // We fetch columns: 2 (descr), 5 (speed), 6 (mac), 8 (operStatus), 10 (in), 16 (out)
                const fetchInterfaces = new Promise<void>((resolveIf) => {
                    const ifTableOid = '1.3.6.1.2.1.2.2.1'; // Use ifEntry
                    console.log(`[SNMP] Fetching interfaces table for ${ipAddress} (OID: ${ifTableOid})...`);
                    session.table(ifTableOid, 20, (error: any, table: any) => {
                        if (error) {
                            console.error(`[SNMP] Interface table fetch error for ${ipAddress}:`, error);
                        } else if (table) {
                            const detailedList: any[] = [];
                            let count = 0;
                            for (const index in table) {
                                const entry = table[index];
                                // entry[2] is ifDescr. Even if empty, we might want to list it?
                                // Some devices have empty description but have traffic.
                                // We'll check if entry exists at all.
                                if (entry) {
                                    count++;
                                    // Format MAC
                                    let mac = '';
                                    if (entry[6] && Buffer.isBuffer(entry[6])) {
                                        mac = entry[6].toString('hex').match(/.{1,2}/g)?.join(':') || '';
                                    }

                                    // Speed
                                    let speed = '0';
                                    if (entry[5]) {
                                        const s = parseInt(entry[5].toString() || '0');
                                        if (s >= 1000000000) speed = (s / 1000000000).toFixed(1) + 'G';
                                        else if (s >= 1000000) speed = (s / 1000000).toFixed(0) + 'M';
                                        else speed = (s / 1000).toFixed(0) + 'K';
                                    }

                                    let name = entry[2]?.toString();
                                    if (!name || name.trim() === '') {
                                        name = `Port ${index}`;
                                    }

                                    detailedList.push({
                                        id: index,
                                        name: name,
                                        mac: mac,
                                        speed: speed,
                                        status: entry[8] === 1 ? 'Up' : 'Down',
                                        inOctets: parseInt(entry[10]?.toString() || '0'),
                                        outOctets: parseInt(entry[16]?.toString() || '0')
                                    });
                                }
                            }
                            console.log(`[SNMP] Found ${detailedList.length} interfaces for ${ipAddress}`);
                            if (metrics.interfaces) {
                                metrics.interfaces.list = detailedList.slice(0, 48); // Limit to 48
                            } else {
                                metrics.interfaces = { count: detailedList.length, list: detailedList.slice(0, 48) };
                            }
                        } else {
                            console.log(`[SNMP] No interface table returned for ${ipAddress}`);
                        }
                        resolveIf();
                    });
                });

                // Phase 2: Get Performance Metrics
                Promise.all([fetchInterfaces]).then(() => {
                    if (perfOids.length === 0) {
                        session.close();
                        resolve(metrics);
                        return;
                    }

                    session.get(perfOids, (perfError: any, perfVarbinds: any) => {
                        if (!perfError && perfVarbinds) {
                            metrics.performance = {
                                cpuUsage: 0,
                                memoryUsage: 0,
                                totalMemory: 0,
                                freeMemory: 0
                            };

                            let index = 0;

                            if (type === 'fortinet') {
                                if (metricsToFetch.includes('cpu')) {
                                    metrics.performance.cpuUsage = parseInt(perfVarbinds[index++]?.value?.toString() || '0') || 0;
                                }
                                if (metricsToFetch.includes('memory')) {
                                    metrics.performance.memoryUsage = parseInt(perfVarbinds[index++]?.value?.toString() || '0') || 0;
                                }
                                if (metricsToFetch.includes('sessions')) {
                                    metrics.performance.sessionCount = parseInt(perfVarbinds[index++]?.value?.toString() || '0') || 0;
                                }
                                if (metricsToFetch.includes('storage')) {
                                    metrics.performance.storageUsage = parseInt(perfVarbinds[index++]?.value?.toString() || '0') || 0;
                                }
                                // Serial
                                metrics.systemInfo!.serialNumber = perfVarbinds[index++]?.value?.toString();
                                // Firmware
                                const fw = perfVarbinds[index++]?.value?.toString();
                                if (fw) metrics.systemInfo!.description = `${fw} (${metrics.systemInfo!.description})`;

                                // Fortinet Specifics
                                const haModeMap: Record<string, string> = { '1': 'Standalone', '2': 'Active-Active', '3': 'Active-Passive', '4': 'Mixed' };
                                const haVal = perfVarbinds[index++]?.value?.toString();
                                const sessRate = parseInt(perfVarbinds[index++]?.value?.toString() || '0');
                                const avDet = parseInt(perfVarbinds[index++]?.value?.toString() || '0');

                                metrics.fortinetStats = {
                                    haMode: haModeMap[haVal || ''] || 'Unknown',
                                    sessionRate: sessRate,
                                    avDetected: avDet
                                };

                            } else if (type === 'cisco') {
                                if (metricsToFetch.includes('cpu')) {
                                    metrics.performance.cpuUsage = parseInt(perfVarbinds[index++]?.value?.toString() || '0') || 0;
                                }
                                if (metricsToFetch.includes('memory')) {
                                    const used = parseInt(perfVarbinds[index++]?.value?.toString() || '0');
                                    const free = parseInt(perfVarbinds[index++]?.value?.toString() || '0');
                                    const total = used + free;
                                    metrics.performance.memoryUsage = total > 0 ? Math.round((used / total) * 100) : 0;
                                    metrics.performance.totalMemory = Math.round(total / 1024 / 1024);
                                    metrics.performance.freeMemory = Math.round(free / 1024 / 1024);
                                }
                                metrics.systemInfo!.serialNumber = perfVarbinds[index]?.value?.toString();
                            } else {
                                // Linux
                                let cpuUser = 0, cpuSys = 0;
                                if (metricsToFetch.includes('cpu')) {
                                    cpuUser = parseInt(perfVarbinds[index++]?.value?.toString() || '0');
                                    cpuSys = parseInt(perfVarbinds[index++]?.value?.toString() || '0');
                                    metrics.performance.cpuUsage = Math.min(cpuUser + cpuSys, 100);
                                }
                                if (metricsToFetch.includes('memory')) {
                                    const memTotal = parseInt(perfVarbinds[index++]?.value?.toString() || '0');
                                    const memAvail = parseInt(perfVarbinds[index++]?.value?.toString() || '0');
                                    if (memTotal > 0) {
                                        metrics.performance.memoryUsage = Math.round(((memTotal - memAvail) / memTotal) * 100);
                                        metrics.performance.totalMemory = Math.round(memTotal / 1024);
                                        metrics.performance.freeMemory = Math.round(memAvail / 1024);
                                    }
                                }
                                if (metricsToFetch.includes('storage')) {
                                    metrics.performance.storageUsage = parseInt(perfVarbinds[index++]?.value?.toString() || '0') || 0;
                                }
                            }
                        } else if (perfError) {
                            console.error(`[SNMP] Device ${ipAddress} performance fetch failed:`, perfError.message);
                            metrics.performanceError = `Failed to fetch metrics: ${perfError.message}`;
                        }

                        session.close();
                        resolve(metrics);
                    });
                });

            } catch (parseError: any) {
                metrics.error = `Parse error: ${parseError.message}`;
                session.close();
                resolve(metrics);
            }
        });

        session.on('error', (err: any) => {
            metrics.online = false;
            metrics.error = err.message;
            resolve(metrics);
        });
    });
}


/**
 * Test SNMP connection to device
 */
export async function testConnection(
    ipAddress: string,
    community: string,
    port: number = 161
): Promise<{ success: boolean; message: string }> {
    try {
        const result = await queryDevice(ipAddress, community, port);

        if (result.online && result.systemInfo) {
            return {
                success: true,
                message: `Connected to ${result.systemInfo.hostname}`,
            };
        } else {
            return {
                success: false,
                message: result.error || 'Device not responding',
            };
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message,
        };
    }
}

/**
 * Format uptime from seconds to human-readable string
 */
function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.length > 0 ? parts.join(' ') : '< 1m';
}

/**
 * Check if metrics exceed thresholds
 */
export function checkThresholds(
    metrics: DeviceMetrics,
    cpuThreshold: number,
    memoryThreshold: number,
    storageThreshold: number = 90,
    alertRules: string = 'cpu,memory'
): { exceeded: boolean; alerts: string[] } {
    const alerts: string[] = [];
    const rules = (alertRules || '').split(',').map(r => r.trim());

    if (metrics.performance) {
        if (rules.includes('cpu') && metrics.performance.cpuUsage > cpuThreshold) {
            alerts.push(`CPU usage at ${metrics.performance.cpuUsage}% (threshold: ${cpuThreshold}%)`);
        }
        if (rules.includes('memory') && metrics.performance.memoryUsage > memoryThreshold) {
            alerts.push(`Memory usage at ${metrics.performance.memoryUsage}% (threshold: ${memoryThreshold}%)`);
        }
        if (rules.includes('storage') && metrics.performance.storageUsage !== undefined && metrics.performance.storageUsage > storageThreshold) {
            alerts.push(`Storage usage at ${metrics.performance.storageUsage}% (threshold: ${storageThreshold}%)`);
        }
    }

    // Check interfaces (Alert if ANY watched interface is Down)
    // Note: The metrics object passed here should have its interfaces list already filtered to watched interfaces
    if (rules.includes('interface') && metrics.interfaces && metrics.interfaces.list) {
        metrics.interfaces.list.forEach((iface: any) => {
            if (iface.status === 'Down') {
                alerts.push(`Interface ${iface.name} is DOWN`);
            }
        });
    }

    // HA Alert (Fortinet Specific)
    if (rules.includes('ha') && metrics.fortinetStats) {
        // Simple check: fail if Sync is not successful (need specific OID for sync status, checking mode for now is insufficient)
        // For now, we only alert if we can detect an issue, but we don't have health status OID yet.
        // Placeholder for future logic.
    }

    return {
        exceeded: alerts.length > 0,
        alerts,
    };
}

/**
 * Get list of available interfaces (Lightweight)
 */
export async function getInterfaceList(
    ipAddress: string,
    community: string,
    port: number = 161
): Promise<string[]> {
    return new Promise((resolve) => {
        const session = snmp.createSession(ipAddress, community, {
            port,
            retries: 1,
            timeout: 5000,
            version: snmp.Version2c,
        });

        const results: string[] = [];
        const oid = '1.3.6.1.2.1.2.2.1.2'; // ifDescr

        session.subtree(oid, 20, (varbinds: any[]) => {
            for (const vb of varbinds) {
                if (!snmp.isVarbindError(vb)) {
                    const index = vb.oid.split('.').pop();
                    const name = vb.value?.toString() || `Port ${index}`;
                    results.push(name);
                }
            }
        }, (error: any) => {
            session.close();
            if (error) {
                console.error(`[SNMP] Subtree error for ${ipAddress}:`, error);
                resolve([]);
            } else {
                console.log(`[SNMP] Subtree found ${results.length} interfaces for ${ipAddress}`);
                resolve(results);
            }
        });
    });
}
