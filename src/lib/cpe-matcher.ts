/**
 * CPE (Common Platform Enumeration) Matching Utilities
 * CPE 2.3 format: cpe:2.3:part:vendor:product:version:update:edition:language:sw_edition:target_sw:target_hw:other
 */

export interface CPEComponents {
    part: 'a' | 'h' | 'o'; // application, hardware, operating system
    vendor: string;
    product: string;
    version: string;
    update?: string;
    edition?: string;
}

/**
 * Vendor name normalization - maps common names to official CPE vendor names
 */
const VENDOR_MAPPINGS: Record<string, string> = {
    'fortinet': 'fortinet',
    'fortigate': 'fortinet',
    'cisco': 'cisco',
    'juniper': 'juniper',
    'palo alto': 'paloaltonetworks',
    'paloalto': 'paloaltonetworks',
    'checkpoint': 'checkpoint',
    'f5': 'f5',
    'apache': 'apache',
    'microsoft': 'microsoft',
    'google': 'google',
    'oracle': 'oracle',
    'ibm': 'ibm',
    'dell': 'dell',
    'hp': 'hp',
    'hewlett packard': 'hp',
};

/**
 * Product name normalization
 */
const PRODUCT_MAPPINGS: Record<string, string> = {
    'fortigate': 'fortigate',
    'fortios': 'fortios',
    'catalyst': 'ios',
    'nexus': 'nx-os',
    'asa': 'adaptive_security_appliance_software',
};

/**
 * Normalize vendor name to CPE standard
 */
function normalizeVendor(vendor: string): string {
    if (!vendor) return '';
    const lower = vendor.toLowerCase().trim();
    return VENDOR_MAPPINGS[lower] || lower.replace(/\s+/g, '_');
}

/**
 * Normalize product name
 */
function normalizeProduct(product: string, vendor: string): string {
    if (!product) return '';
    const lower = product.toLowerCase().trim();

    // Check if there's  a specific mapping
    if (PRODUCT_MAPPINGS[lower]) {
        return PRODUCT_MAPPINGS[lower];
    }

    return lower.replace(/\s+/g, '_');
}

/**
 * Generate CPE 2.3 string from asset components
 */
export function generateCPE(components: CPEComponents): string {
    const {
        part = 'a',
        vendor = '*',
        product = '*',
        version = '*',
        update = '*',
        edition = '*'
    } = components;

    // Normalize vendor and product
    const normVendor = vendor !== '*' ? normalizeVendor(vendor) : '*';
    const normProduct = product !== '*' ? normalizeProduct(product, vendor) : '*';

    // Ensure version keeps its dots and doesn't get mangled
    const normVersion = version !== '*' ? version.replace(/\s+/g, '') : '*';

    return `cpe:2.3:${part}:${normVendor}:${normProduct}:${normVersion}:${update}:${edition}:*:*:*:*:*`;
}

/**
 * Parse CPE string into components
 */
export function parseCPE(cpeString: string): CPEComponents | null {
    if (!cpeString.startsWith('cpe:2.3:')) {
        return null;
    }

    const parts = cpeString.split(':');
    if (parts.length < 6) {
        return null;
    }

    return {
        part: parts[2] as 'a' | 'h' | 'o',
        vendor: parts[3] === '*' ? '' : parts[3],
        product: parts[4] === '*' ? '' : parts[4],
        version: parts[5] === '*' ? '' : parts[5],
        update: parts[6] !== '*' ? parts[6] : undefined,
        edition: parts[7] !== '*' ? parts[7] : undefined,
    };
}

/**
 * Determine CPE part type from asset type
 */
export function getPartFromAssetType(assetType: string): 'a' | 'h' | 'o' {
    const type = assetType.toLowerCase();

    if (type === 'software') return 'a'; // application
    if (type === 'hardware') return 'h'; // hardware
    if (type === 'firmware') return 'o'; // operating system

    return 'a'; // default to application
}

/**
 * Generate CPE from asset data
 */
export function assetToCPE(asset: {
    type: string;
    vendor?: string;
    model?: string;
    version?: string;
    name?: string;
}): string {
    const part = getPartFromAssetType(asset.type);

    // Use vendor name for vendor field
    const vendor = asset.vendor || '*';

    // For product, prefer model, fallback to name
    // For network devices, the model often IS the product
    let product = asset.model || asset.name || '*';

    // Clean up the product name - remove model numbers that are too specific
    product = product.replace(/\d{2,}[a-z]*/gi, '').trim() || product;

    return generateCPE({
        part,
        vendor,
        product,
        version: asset.version || '*',
    });
}

/**
 * Validate CPE string format
 */
export function isValidCPE(cpeString: string): boolean {
    if (!cpeString) return false;

    // Check if it starts with cpe:2.3:
    if (!cpeString.startsWith('cpe:2.3:')) return false;

    // Check if it has enough parts
    const parts = cpeString.split(':');
    return parts.length >= 6;
}

/**
 * Create search keywords from asset for fallback searching
 * Keywords are ordered from most specific to most general
 */
export function getSearchKeywords(asset: {
    vendor?: string;
    model?: string;
    name?: string;
    version?: string;
}): string[] {
    const keywords: string[] = [];

    // For network devices like FortiGate, we need to search for the OS (FortiOS) not the hardware model
    // CVEs are typically written for software/firmware, not specific hardware models

    const vendor = asset.vendor?.toLowerCase() || '';
    const model = asset.model?.toLowerCase() || '';

    // Special handling for common vendors
    if (vendor === 'fortinet' || vendor.includes('forti')) {
        // FortiGate devices run FortiOS - search with version for better targeting
        if (asset.version) {
            keywords.push(`fortios ${asset.version}`);
        }
        keywords.push('fortios');
    } else if (vendor === 'cisco') {
        // Cisco devices - search for IOS, NX-OS, ASA, etc.
        if (model.includes('catalyst') || model.includes('nexus')) {
            if (asset.version) {
                keywords.push(`cisco ios ${asset.version}`);
            }
            keywords.push('cisco ios');
        } else if (model.includes('asa')) {
            if (asset.version) {
                keywords.push(`cisco asa ${asset.version}`);
            }
            keywords.push('cisco asa');
        } else {
            if (asset.version) {
                keywords.push(`cisco ${asset.version}`);
            }
            keywords.push('cisco ios');
        }
    } else if (vendor === 'juniper') {
        // Juniper devices run Junos OS
        // Juniper uses different version formats, try multiple variations
        if (asset.version) {
            keywords.push(`junos ${asset.version}`);

            // Try alternative formats if version looks like X.Y.Z
            const versionParts = asset.version.split('.');
            if (versionParts.length >= 2) {
                // Try X.YRZ format (e.g., 24.1R2 for 24.1.2)
                keywords.push(`junos ${versionParts[0]}.${versionParts[1]}R${versionParts[2] || '1'}`);
                // Try X.Y format
                keywords.push(`junos ${versionParts[0]}.${versionParts[1]}`);
            }
        }
        // Only fall back to generic if we have no version
        if (!asset.version) {
            keywords.push('junos');
        }
    } else if (vendor === 'palo alto networks' || vendor.includes('palo')) {
        // Palo Alto runs PAN-OS
        if (asset.version) {
            keywords.push(`pan-os ${asset.version}`);
        }
        keywords.push('pan-os');
    } else {
        // Generic vendor handling
        if (asset.vendor && asset.version) {
            keywords.push(`${asset.vendor} ${asset.version}`);
        }
        if (asset.vendor) {
            keywords.push(asset.vendor);
        }
    }

    // Remove duplicates and empty strings
    return keywords.filter((k, i, arr) => k && arr.indexOf(k) === i);
}
