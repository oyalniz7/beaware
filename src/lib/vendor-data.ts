/**
 * Common vendors and their popular models for asset management
 */

export const COMMON_VENDORS = [
    'Fortinet',
    'Cisco',
    'Juniper',
    'Palo Alto Networks',
    'Check Point',
    'F5 Networks',
    'Aruba',
    'HP',
    'Dell',
    'IBM',
    'Microsoft',
    'Apache',
    'Google',
    'Oracle',
    'VMware',
    'Arista',
    'Ubiquiti',
    'Other'
] as const;

export const VENDOR_MODELS: Record<string, string[]> = {
    'Fortinet': [
        // Virtual Appliances
        "FortiGate-VM64", "FortiGate-VM", "FortiGate-VM-AWS", "FortiGate-VM-Azure", "FortiGate-VM-GCP",
        "FortiManager-VM", "FortiAnalyzer-VM",
        // Entry Level
        "FortiGate-40F", "FortiGate-60F", "FortiGate-70F", "FortiGate-80F", "FortiGate-90G",
        // Mid Range
        "FortiGate-100F", "FortiGate-200F", "FortiGate-400F", "FortiGate-600F",
        // High End
        "FortiGate-1000F", "FortiGate-1800F", "FortiGate-2600F", "FortiGate-3000F",
        "FortiGate-4200F", "FortiGate-4400F", "FortiGate-7000 Series",
        "Other"
    ],
    'Cisco': [
        // Virtual
        "CSR 1000v", "Catalyst 8000V", "ASAv", "Next-Generation IPSv", "vEdge Cloud", "XRv 9000",
        // Catalyst Switches
        "Catalyst 9200", "Catalyst 9300", "Catalyst 9400", "Catalyst 9500", "Catalyst 9600",
        "Catalyst 2960-X", "Catalyst 3650", "Catalyst 3850",
        // Routers
        "ISR 1000", "ISR 4000", "ASR 1000", "ASR 9000",
        // Firewalls
        "Firepower 1000", "Firepower 2100", "Firepower 4100", "Firepower 9300",
        "Secure Firewall 3100",
        "Other"
    ],
    'Palo Alto Networks': [
        // VM-Series
        "VM-50", "VM-100", "VM-200", "VM-300", "VM-500", "VM-700", "VM-1000-HV",
        // Hardware
        "PA-220", "PA-400 Series", "PA-800 Series",
        "PA-3200 Series", "PA-3400 Series", "PA-5200 Series", "PA-5400 Series",
        "PA-7000 Series",
        "Other"
    ],
    'Juniper': [
        // Virtual
        "vSRX", "vMX", "vQFX", "cSRX",
        // EX Series Switches
        "EX2300", "EX3400", "EX4300", "EX4400", "EX4600", "EX9200",
        // SRX Firewalls
        "SRX300", "SRX320", "SRX340", "SRX345", "SRX380",
        "SRX1500", "SRX4000", "SRX5000",
        // MX Routers
        "MX204", "MX480", "MX960",
        "Other"
    ],
    'Ubiquiti': [
        "UniFi Dream Machine", "UniFi Dream Machine Pro", "UniFi Dream Machine SE",
        "UniFi Security Gateway", "UniFi Security Gateway Pro",
        "EdgeRouter X", "EdgeRouter 4", "EdgeRouter 6P", "EdgeRouter 12",
        "UniFi Switch 8", "UniFi Switch 16", "UniFi Switch 24", "UniFi Switch 48",
        "UniFi Switch Pro 24", "UniFi Switch Pro 48",
        "Other"
    ],
    'Arista': [
        // Virtual
        "vEOS-lab", "cEOS-lab",
        // Switches
        "7050X3", "7060X5", "7280R3", "7500R3", "7800R3",
        "Other"
    ],
    'Check Point': [
        '1500', '1600', '3100', '3200', '5100', '5200', '5400',
        '5600', '5800', '6500', '6700', '15000', '16000', '23000', 'Other'
    ],
    'F5 Networks': [
        'BIG-IP 1600', 'BIG-IP 2000', 'BIG-IP 4000', 'BIG-IP 5000',
        'BIG-IP 7000', 'BIG-IP 10000', 'BIG-IP i2000', 'BIG-IP i4000',
        'BIG-IP i5000', 'BIG-IP i7000', 'BIG-IP i10000', 'Other'
    ],
    'Aruba': [
        '2530', '2540', '2930', '3810', '5400', '8320', '8325', '8400',
        'CX 6000 Series', 'CX 8000 Series', 'Other'
    ],
    'Dell': [
        'PowerEdge R-Series', 'PowerSwitch N-Series', 'PowerSwitch S-Series', 'Other'
    ],
    'VMware': [
        'ESXi', 'vCentre', 'Workstation', 'Fusion', 'Other'
    ],
    'Microsoft': [
        'Windows Server', 'Hyper-V', 'SQL Server', 'Other'
    ],
    'Other': ['Other']
};

/**
 * Get models for a specific vendor
 */
export function getModelsForVendor(vendor: string): string[] {
    return VENDOR_MODELS[vendor] || ['Other'];
}
