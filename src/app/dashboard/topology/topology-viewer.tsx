"use client";

import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
    Server,
    Laptop,
    Database,
    Router,
    Globe,
    Cpu
} from 'lucide-react';

const getAssetIcon = (type: string) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('server')) return Server;
    if (lowerType.includes('laptop') || lowerType.includes('desktop') || lowerType.includes('pc')) return Laptop;
    if (lowerType.includes('database') || lowerType.includes('sql')) return Database;
    if (lowerType.includes('router') || lowerType.includes('switch') || lowerType.includes('modem')) return Router;
    if (lowerType.includes('web') || lowerType.includes('site') || lowerType.includes('service') || lowerType.includes('cloud')) return Globe;
    return Cpu;
};

const CustomNode = ({ data }: { data: any }) => {
    const Icon = getAssetIcon(data.type);
    return (
        <div className="px-4 py-3 shadow-lg rounded-xl bg-card border border-border min-w-[150px] text-center group hover:ring-2 hover:ring-primary transition-all flex flex-col items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon size={24} />
            </div>
            <div>
                <div className="font-bold text-sm text-foreground">{data.label}</div>
                <div className="text-xs text-muted-foreground">{data.ip}</div>
            </div>
        </div>
    );
};

const TextNode = ({ data }: { data: any }) => {
    return (
        <div className="px-4 py-2 border border-transparent hover:border-border rounded hover:bg-card/50 transition-colors min-w-[100px] text-center">
            <div className="font-bold text-lg text-foreground">{data.label}</div>
            <div className="text-sm text-muted-foreground">{data.subLabel}</div>
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
    text: TextNode,
};

export default function TopologyViewer({ initialAssets }: { initialAssets: any[] }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [edgeType, setEdgeType] = React.useState('default');

    useEffect(() => {
        if (initialAssets && initialAssets.length > 0) {
            const newNodes = initialAssets.map((asset, index) => ({
                id: asset.id,
                type: 'custom',
                position: { x: (index % 3) * 250 + 100, y: Math.floor(index / 3) * 200 + 100 },
                data: {
                    label: asset.name,
                    type: asset.type,
                    ip: asset.ipAddress
                },
            }));
            const seenIds = new Set(newNodes.map(n => n.id));
            // Filter out any nodes that might be in state but not in initialAssets if we wanted to sync strictly, 
            // but for now we just initialize.
            setNodes((prev) => {
                if (prev.length === 0) return newNodes;
                return prev;
            });

            // Auto connect to router if exists for demo
            const router = initialAssets.find(a => a.type.toLowerCase().includes('router'));
            if (router) {
                const newEdges = initialAssets
                    .filter(a => a.id !== router.id)
                    .map((asset) => ({
                        id: `e-${router.id}-${asset.id}`,
                        source: router.id,
                        target: asset.id,
                        animated: true,
                        style: { stroke: 'hsl(var(--muted-foreground))' },
                    }));
                setEdges((prev) => {
                    if (prev.length === 0) return newEdges;
                    return prev;
                });
            }
        }
    }, [initialAssets, setNodes, setEdges]); // Caution: careful with deps here to avoid reset

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, type: edgeType, animated: true }, eds)),
        [setEdges, edgeType],
    );

    const addNode = (type: string) => {
        const id = `new-${Math.random().toString(36).substr(2, 9)}`;
        const newNode: Node = {
            id,
            type: 'custom',
            position: { x: Math.random() * 500 + 50, y: Math.random() * 400 + 50 },
            data: { label: `New ${type}`, type: type, ip: '192.168.x.x' },
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const addTextNode = () => {
        const text = prompt("Enter text label:", "Port 80");
        if (!text) return;
        const id = `text-${Math.random().toString(36).substr(2, 9)}`;
        const newNode: Node = {
            id,
            type: 'text',
            position: { x: Math.random() * 500 + 50, y: Math.random() * 400 + 50 },
            data: { label: text },
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const [bgVariant, setBgVariant] = React.useState<BackgroundVariant>(BackgroundVariant.Dots);

    return (
        <div className="w-full h-[70vh] border border-border rounded-xl relative bg-background overflow-hidden shadow-sm">
            <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap items-center">
                <div className="bg-card/90 backdrop-blur p-2 rounded-lg border border-border shadow-sm flex gap-2">
                    <button onClick={() => addNode('Laptop')} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded text-xs font-medium transition-colors">
                        + Laptop
                    </button>
                    <button onClick={() => addNode('Server')} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded text-xs font-medium transition-colors">
                        + Server
                    </button>
                    <button onClick={() => addNode('Router')} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded text-xs font-medium transition-colors">
                        + Router
                    </button>
                    <div className="w-px h-6 bg-border mx-1"></div>
                    <button onClick={addTextNode} className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-xs font-medium transition-colors">
                        + Text
                    </button>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
                <div className="bg-card/90 backdrop-blur p-2 rounded-lg border border-border shadow-sm flex gap-2 items-center">
                    <span className="text-xs font-medium text-muted-foreground mr-1">Wiring:</span>
                    <select
                        className="bg-secondary text-secondary-foreground text-xs rounded px-2 py-1 border-none focus:ring-1 focus:ring-primary"
                        value={edgeType}
                        onChange={(e) => setEdgeType(e.target.value)}
                    >
                        <option value="default">Bezier (Default)</option>
                        <option value="straight">Straight</option>
                        <option value="step">Step</option>
                        <option value="smoothstep">Smooth Step</option>
                    </select>
                </div>
                <div className="bg-card/90 backdrop-blur p-2 rounded-lg border border-border shadow-sm flex gap-2 items-center">
                    <span className="text-xs font-medium text-muted-foreground mr-1">Background:</span>
                    <select
                        className="bg-secondary text-secondary-foreground text-xs rounded px-2 py-1 border-none focus:ring-1 focus:ring-primary"
                        value={bgVariant}
                        onChange={(e) => setBgVariant(e.target.value as BackgroundVariant)}
                    >
                        <option value={BackgroundVariant.Dots}>Dots</option>
                        <option value={BackgroundVariant.Lines}>Lines</option>
                        <option value={BackgroundVariant.Cross}>Cross</option>
                    </select>
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
            >
                <Controls className="bg-card border border-border text-foreground" />
                <MiniMap className="bg-card border border-border" maskColor="rgba(0,0,0,0.1)" />
                <Background variant={bgVariant} gap={12} size={1} />
            </ReactFlow>
        </div >
    );
}

