/**
 * Risk Score Calculation
 * Calculates risk scores based on vulnerability CVSS scores and severity
 */

export interface RiskFactors {
    cvssScore: number;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    isMitigated: boolean;
}

/**
 * Calculate risk score for a single vulnerability
 */
export function calculateVulnerabilityRisk(factors: RiskFactors): number {
    const { cvssScore, severity, isMitigated } = factors;

    // Severity weights
    const severityWeight = {
        'CRITICAL': 1.5,
        'HIGH': 1.2,
        'MEDIUM': 1.0,
        'LOW': 0.7,
        'NONE': 0.0,
    }[severity];

    // Mitigation factor
    const mitigationFactor = isMitigated ? 0.3 : 1.0;

    return cvssScore * severityWeight * mitigationFactor;
}

/**
 * Calculate overall risk score for an asset
 */
export function calculateAssetRisk(vulnerabilities: RiskFactors[]): number {
    if (vulnerabilities.length === 0) return 0;

    const totalRisk = vulnerabilities.reduce((sum, vuln) => {
        return sum + calculateVulnerabilityRisk(vuln);
    }, 0);

    // Average risk, capped at 10
    return Math.min(totalRisk / vulnerabilities.length, 10);
}

/**
 * Calculate organization-wide risk score
 */
export function calculateOverallRisk(assetRisks: number[]): number {
    if (assetRisks.length === 0) return 0;

    const totalRisk = assetRisks.reduce((sum, risk) => sum + risk, 0);
    return totalRisk / assetRisks.length;
}

/**
 * Convert numeric risk score to letter grade
 */
export function riskScoreToGrade(score: number): string {
    if (score <= 1.0) return 'A+';
    if (score <= 3.0) return 'A';
    if (score <= 5.0) return 'B';
    if (score <= 7.0) return 'C';
    if (score <= 9.0) return 'D';
    return 'F';
}

/**
 * Get risk level description
 */
export function getRiskLevel(score: number): 'MINIMAL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
    if (score <= 1.0) return 'MINIMAL';
    if (score <= 3.0) return 'LOW';
    if (score <= 5.0) return 'MODERATE';
    if (score <= 7.0) return 'HIGH';
    return 'CRITICAL';
}
