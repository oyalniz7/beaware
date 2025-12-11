import { getAssets } from '@/app/actions/assets';
import AssetList from '@/components/assets/AssetList';
import { Suspense } from 'react';

export default async function AssetsPage() {
    const result = await getAssets();
    const assets = result.success && result.data ? result.data : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Assets</h2>
            </div>

            <Suspense fallback={<div>Loading assets...</div>}>
                <AssetList initialAssets={assets} />
            </Suspense>
        </div>
    );
}
