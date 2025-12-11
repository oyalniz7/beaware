'use client'

import { scanAsset } from '@/app/actions/scans';
import { useState } from 'react';

export function ScanButton({ assetId, assetName }: { assetId: string; assetName: string }) {
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleScan = async () => {
        setIsScanning(true);
        setResult(null);

        try {
            const response = await scanAsset(assetId);

            if (response.success && response.data) {
                setResult(`Found ${response.data.vulnerabilitiesFound} new vulnerabilities`);
            } else {
                setResult(`Error: ${response.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setResult(`Error: ${error.message}`);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                onClick={handleScan}
                disabled={isScanning}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isScanning ? 'Scanning...' : 'Scan'}
            </button>
            {result && (
                <span className={`text-xs ${result.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
                    {result}
                </span>
            )}
        </div>
    );
}
