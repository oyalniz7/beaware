import { getRiskAssessments } from '@/app/actions/risks';
import { getAssets } from '@/app/actions/assets';
import { RiskList } from '../components/RiskList';

export default async function RisksPage({
    searchParams,
}: {
    searchParams: Promise<{ assetId?: string }>;
}) {
    const params = await searchParams;
    const result = await getRiskAssessments(params.assetId);
    const risks = result.success && result.data ? result.data : [];

    // Get all assets for the asset filter
    const assetsResult = await getAssets();
    const assets = assetsResult.success && assetsResult.data ? assetsResult.data : [];

    // Get asset name if filtering by asset
    const assetName = risks.length > 0 && params.assetId ? risks[0].asset.name : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {assetName ? `Vulnerabilities - ${assetName}` : 'Risk Analysis'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {assetName
                            ? `Viewing vulnerabilities for ${assetName}`
                            : 'Identify and prioritize vulnerabilities affecting your assets'
                        }
                    </p>
                </div>
            </div>

            <RiskList
                initialRisks={risks}
                showAssetFilter={!params.assetId}
                assets={assets}
            />
        </div>
    );
}
