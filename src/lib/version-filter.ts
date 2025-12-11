/**
 * Compare two semantic versions
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split(/[.\-r]/i).map(p => parseInt(p) || 0);
    const parts2 = v2.split(/[.\-r]/i).map(p => parseInt(p) || 0);

    const maxLen = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLen; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;

        if (p1 < p2) return -1;
        if (p1 > p2) return 1;
    }

    return 0;
}

/**
 * Check if a version is explicitly EXCLUDED by the vulnerability's version range
 * Returns true if the asset version is OUTSIDE the vulnerable range (i.e., should be excluded)
 */
export function isVersionExcluded(
    assetVersion: string,
    versionStartIncluding?: string,
    versionEndIncluding?: string,
    versionStartExcluding?: string,
    versionEndExcluding?: string
): boolean {
    if (!assetVersion) return false; // No version = can't exclude

    // Clean version strings
    const cleanVersion = (v: string) => v?.replace(/^v/i, '').trim() || '';
    const asset = cleanVersion(assetVersion);

    // If asset version is BEFORE the vulnerable range start, exclude it
    if (versionStartIncluding) {
        const start = cleanVersion(versionStartIncluding);
        if (compareVersions(asset, start) < 0) {
            return true; // Asset is too old to be affected
        }
    }

    if (versionStartExcluding) {
        const start = cleanVersion(versionStartExcluding);
        if (compareVersions(asset, start) <= 0) {
            return true;
        }
    }

    // If asset version is AFTER the vulnerable range end, exclude it
    if (versionEndIncluding) {
        const end = cleanVersion(versionEndIncluding);
        if (compareVersions(asset, end) > 0) {
            return true; // Asset is too new, vulnerability was patched
        }
    }

    if (versionEndExcluding) {
        const end = cleanVersion(versionEndExcluding);
        if (compareVersions(asset, end) >= 0) {
            return true;
        }
    }

    // Asset version is within or overlaps the range - include it
    return false;
}

/**
 * Filter vulnerabilities by version
 * SIMPLE LOGIC: Trust NVD search results, only exclude if version is explicitly outside range
 */
export function filterVulnerabilitiesByVersion(
    vulnerabilities: any[],
    assetVersion: string
): any[] {
    if (!assetVersion) {
        return vulnerabilities;
    }

    return vulnerabilities.filter((vuln, index) => {
        // If no configuration data, INCLUDE it (trust the search results)
        if (!vuln.configurations || vuln.configurations.length === 0) {
            if (index < 3) {
                console.log(`[Filter] ${vuln.cveId}: No config - INCLUDING (trusting search)`);
            }
            return true;
        }

        // Check if ANY configuration includes this version
        const isIncluded = vuln.configurations.some((config: any) => {
            const excluded = isVersionExcluded(
                assetVersion,
                config.versionStartIncluding,
                config.versionEndIncluding,
                config.versionStartExcluding,
                config.versionEndExcluding
            );

            if (index < 3) {
                const start = config.versionStartIncluding || config.versionStartExcluding || '?';
                const end = config.versionEndIncluding || config.versionEndExcluding || '?';
                console.log(`[Filter] ${vuln.cveId}: v${assetVersion} vs range [${start}-${end}] = ${excluded ? 'EXCLUDE' : 'INCLUDE'}`);
            }

            return !excluded; // Include if NOT excluded
        });

        return isIncluded;
    });
}
