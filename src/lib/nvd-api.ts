/**
 * NVD API 2.0 Client
 * Fetches vulnerability data from the National Vulnerability Database
 */

const NVD_BASE_URL = 'https://services.nvd.nist.gov/rest/json';
const RATE_LIMIT_DELAY = 6000; // 6 seconds between requests (conservative for no API key)

interface NVDVulnerability {
    cve: {
        id: string;
        descriptions: Array<{ lang: string; value: string }>;
        published: string;
        lastModified: string;
        metrics?: {
            cvssMetricV31?: Array<{
                cvssData: {
                    baseScore: number;
                    baseSeverity: string;
                    vectorString: string;
                };
            }>;
        };
        references?: Array<{
            url: string;
            source: string;
        }>;
    };
}

interface NVDResponse {
    vulnerabilities: NVDVulnerability[];
    totalResults: number;
}

export interface VulnerabilityData {
    cveId: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    score: number;
    cvssVector: string | null;
    publishedAt: Date;
    lastModified: Date;
    references: string;
    // Version range data for filtering
    configurations?: {
        versionStartIncluding?: string;
        versionEndIncluding?: string;
        versionStartExcluding?: string;
        versionEndExcluding?: string;
    }[];
}

class NVDAPIClient {
    private apiKey: string | undefined;
    private lastRequestTime = 0;

    constructor() {
        this.apiKey = process.env.NVD_API_KEY;
        if (!this.apiKey) {
            console.warn('NVD_API_KEY not set. Rate limited to 5 requests per 30 seconds.');
        }
    }

    /**
     * Set API key dynamically (from user settings)
     */
    setApiKey(key: string | undefined) {
        this.apiKey = key;
    }

    /**
     * Get current API key
     */
    getApiKey(): string | undefined {
        return this.apiKey;
    }

    /**
     * Rate limiting to respect NVD API limits
     */
    private async rateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        // With API key: 50 req/30s = 600ms between requests
        // Without key: 5 req/30s = 6000ms between requests
        const minDelay = this.apiKey ? 600 : RATE_LIMIT_DELAY;

        if (timeSinceLastRequest < minDelay) {
            await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * Make authenticated request to NVD API
     */
    private async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
        await this.rateLimit();

        const url = new URL(`${NVD_BASE_URL}${endpoint}`);
        Object.entries(params).forEach(([key, value]) => {
            if (value) url.searchParams.append(key, value);
        });

        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };

        if (this.apiKey) {
            headers['apiKey'] = this.apiKey;
        }

        const response = await fetch(url.toString(), { headers });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait before trying again.');
            }
            throw new Error(`NVD API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get CVE by ID
     */
    async getCVE(cveId: string): Promise<VulnerabilityData | null> {
        try {
            const data: NVDResponse = await this.makeRequest('/cves/2.0', {
                cveId: cveId.toUpperCase(),
            });

            if (data.vulnerabilities.length === 0) {
                return null;
            }

            return this.parseVulnerability(data.vulnerabilities[0]);
        } catch (error) {
            console.error(`Failed to fetch CVE ${cveId}:`, error);
            throw error;
        }
    }

    /**
     * Search vulnerabilities by CPE
     */
    async searchByCPE(cpeString: string, limit = 100): Promise<VulnerabilityData[]> {
        try {
            const data: NVDResponse = await this.makeRequest('/cves/2.0', {
                cpeName: cpeString,
                resultsPerPage: limit.toString(),
            });

            return data.vulnerabilities.map(v => this.parseVulnerability(v));
        } catch (error) {
            console.error(`Failed to search by CPE ${cpeString}:`, error);
            throw error;
        }
    }

    /**
     * Search vulnerabilities by keyword (product name, vendor)
     */
    async searchByKeyword(keyword: string, limit = 50): Promise<VulnerabilityData[]> {
        try {
            const data: NVDResponse = await this.makeRequest('/cves/2.0', {
                keywordSearch: keyword,
                resultsPerPage: limit.toString(),
            });

            return data.vulnerabilities.map(v => this.parseVulnerability(v));
        } catch (error) {
            console.error(`Failed to search by keyword ${keyword}:`, error);
            throw error;
        }
    }

    /**
     * Parse NVD vulnerability data into our format
     */
    private parseVulnerability(nvdVuln: NVDVulnerability): VulnerabilityData {
        const cve = nvdVuln.cve;

        // Get English description
        const description = cve.descriptions.find(d => d.lang === 'en')?.value ||
            cve.descriptions[0]?.value ||
            'No description available';

        // Extract CVSS data
        const cvssData = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
        const score = cvssData?.baseScore ?? 0;
        const severity = this.normalizeSeverity(cvssData?.baseSeverity ?? 'NONE');
        const cvssVector = cvssData?.vectorString ?? null;

        // Format references as JSON
        const references = JSON.stringify(
            cve.references?.map(ref => ({ url: ref.url, source: ref.source })) ?? []
        );

        // Extract version range configurations
        const configurations: any[] = [];
        try {
            // NVD API v2.0 structure: cve.configurations is an array of nodes
            const nvdConfigs = (nvdVuln as any).cve?.configurations;
            if (nvdConfigs && Array.isArray(nvdConfigs)) {
                for (const config of nvdConfigs) {
                    if (config.nodes && Array.isArray(config.nodes)) {
                        for (const node of config.nodes) {
                            if (node.cpeMatch && Array.isArray(node.cpeMatch)) {
                                for (const match of node.cpeMatch) {
                                    if (match.vulnerable) {
                                        configurations.push({
                                            versionStartIncluding: match.versionStartIncluding,
                                            versionEndIncluding: match.versionEndIncluding,
                                            versionStartExcluding: match.versionStartExcluding,
                                            versionEndExcluding: match.versionEndExcluding,
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            // If parsing fails, we'll just not have version data (will include CVE by default)
            console.warn(`Failed to parse configurations for ${cve.id}:`, err);
        }

        return {
            cveId: cve.id,
            description: description.substring(0, 1000), // Limit length
            severity,
            score,
            cvssVector,
            publishedAt: new Date(cve.published),
            lastModified: new Date(cve.lastModified),
            references,
            configurations: configurations.length > 0 ? configurations : undefined,
        };
    }

    /**
     * Normalize severity to our enum
     */
    private normalizeSeverity(severity: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' {
        const upper = severity.toUpperCase();
        if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'].includes(upper)) {
            return upper as any;
        }
        return 'NONE';
    }
}

// Singleton instance
export const nvdClient = new NVDAPIClient();
