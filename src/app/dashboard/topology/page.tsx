import prisma from "@/lib/prisma";
import TopologyViewer from "./topology-viewer";

export default async function TopologyPage() {
    const assets = await prisma.asset.findMany();

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Network Topology</h2>
            <p className="text-muted-foreground">Visualize your network infrastructure. Drag nodes to rearrange. Use the controls to zoom and pan.</p>

            <TopologyViewer initialAssets={assets} />
        </div>
    );
}
