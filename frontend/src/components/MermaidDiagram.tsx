"use client";

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface MermaidDiagramProps {
    chart: string;
}

// Node descriptions for tooltips
const nodeDescriptions: Record<string, string> = {
    'Colab': 'Python notebook for data analysis. Run code, see results, generate insights.',
    'Plx': 'SQL workbench for querying BigQuery. Write and execute SQL, visualize results.',
    'Chat': 'AI chat sidebar. Ask questions and get answers based on your analyses.',
    'REPL': 'Python execution engine. Runs your notebook code in a sandboxed environment.',
    'SQL': 'SQL execution service. Connects to BigQuery and runs your queries.',
    'Mind': 'Knowledge retrieval. Finds relevant claims to answer your questions.',
    'Gemini': 'Google AI. Extracts insights from your work and answers questions.',
    'Firestore': 'Cloud database. Stores claims, sessions, and the "Mind" knowledge graph.',
    'BQ': 'Google BigQuery. Your data warehouse for large-scale SQL analytics.',
};

// Map nodes to their parent cluster IDs
const nodeToCluster: Record<string, string> = {
    'Colab': 'Frontend',
    'Plx': 'Frontend',
    'Chat': 'Frontend',
    'REPL': 'Backend',
    'SQL': 'Backend',
    'Mind': 'Backend',
    'Gemini': 'AI',
    'Firestore': 'Storage',
    'BQ': 'Storage',
};

// Initialize mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    flowchart: {
        nodeSpacing: 40,
        rankSpacing: 50,
        curve: 'basis',
        padding: 20,
        useMaxWidth: false,
    },
    themeVariables: {
        fontSize: '16px',
        primaryColor: '#ff4b4b',
        primaryTextColor: '#fff',
        primaryBorderColor: '#ff4b4b',
        lineColor: '#666',
        secondaryColor: '#262730',
        tertiaryColor: '#1e1e1e',
        background: '#1e1e1e',
        mainBkg: '#262730',
        nodeBorder: '#444',
        clusterBkg: '#1e1e1e',
        clusterBorder: '#31333F',
        titleColor: '#fff',
        edgeLabelBackground: '#1e1e1e',
    }
});

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        const renderDiagram = async () => {
            try {
                const { svg: renderedSvg } = await mermaid.render('mermaid-diagram', chart);

                let processedSvg = renderedSvg;
                Object.entries(nodeDescriptions).forEach(([key, description]) => {
                    const nodePattern = new RegExp(`(<g[^>]*class="[^"]*node[^"]*"[^>]*id="[^"]*${key}[^"]*"[^>]*>)`, 'gi');
                    processedSvg = processedSvg.replace(nodePattern, `$1<title>${description}</title>`);
                });

                setSvg(processedSvg);
            } catch (error) {
                console.error('Mermaid render error:', error);
            }
        };

        renderDiagram();
    }, [chart]);

    // Event delegation for robust cluster highlighting
    useEffect(() => {
        if (!svgContainerRef.current) return;
        const container = svgContainerRef.current;

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Find closest element that is a node (could be rect, path, label inside the group)
            // Mermaid nodes usually have class "node" on the group <g>
            const nodeEl = target.closest('.node');

            // Cleanup: Remove existing highlights
            // We want to remove highlights unless we are re-highlighting the same cluster
            // But simplify: clear all, then add back if needed.
            const activeClusters = container.querySelectorAll('.cluster-active');
            activeClusters.forEach(el => el.classList.remove('cluster-active'));

            if (nodeEl) {
                const nodeId = nodeEl.id || '';

                // Match node ID to cluster
                let clusterId: string | null = null;
                Object.entries(nodeToCluster).forEach(([nId, cId]) => {
                    if (nodeId.toLowerCase().includes(nId.toLowerCase())) {
                        clusterId = cId;
                    }
                });

                if (clusterId) {
                    // Find cluster that matches
                    const clusters = container.querySelectorAll('.cluster');
                    clusters.forEach(c => {
                        if (c.id && c.id.toLowerCase().includes(clusterId!.toLowerCase())) {
                            c.classList.add('cluster-active');
                        }
                    });
                }
            }
        };

        const handleMouseOut = (e: MouseEvent) => {
            const relatedTarget = e.relatedTarget as Node | null;
            // Only clear if we leave the container completely
            if (relatedTarget && !container.contains(relatedTarget)) {
                const activeClusters = container.querySelectorAll('.cluster-active');
                activeClusters.forEach(el => el.classList.remove('cluster-active'));
            }
        };

        container.addEventListener('mouseover', handleMouseOver);
        container.addEventListener('mouseout', handleMouseOut);

        return () => {
            container.removeEventListener('mouseover', handleMouseOver);
            container.removeEventListener('mouseout', handleMouseOut);
        };
    }, [svg]);

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));

    return (
        <>
            <style jsx global>{`
                .mermaid-container {
                    font-size: 16px;
                }
                
                /* Node hover - red glow */
                .mermaid-container .node rect,
                .mermaid-container .node circle,
                .mermaid-container .node polygon,
                .mermaid-container .node path {
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                
                .mermaid-container .node:hover rect,
                .mermaid-container .node:hover circle,
                .mermaid-container .node:hover polygon,
                .mermaid-container .node:hover path {
                    filter: brightness(1.4) drop-shadow(0 0 8px rgba(255, 75, 75, 0.6));
                    stroke: #ff4b4b !important;
                    stroke-width: 2px !important;
                }
                
                .mermaid-container .node:hover .nodeLabel {
                    font-weight: bold;
                }
                
                /* Cluster/subgraph hover - blue glow */
                .mermaid-container .cluster rect {
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                
                .mermaid-container .cluster:hover > rect {
                    stroke: #4b9fff !important;
                    stroke-width: 2px !important;
                    filter: drop-shadow(0 0 6px rgba(75, 159, 255, 0.4));
                }
                
                /* When node is hovered, parent cluster gets blue highlight */
                .mermaid-container .cluster-active > rect {
                    stroke: #4b9fff !important;
                    stroke-width: 2px !important;
                    filter: drop-shadow(0 0 10px rgba(75, 159, 255, 0.5));
                }
                
                .mermaid-container .edgePath path {
                    transition: stroke 0.2s ease, stroke-width 0.2s ease;
                }
                
                .mermaid-container .edgeLabel {
                    font-size: 14px !important;
                }
                
                /* Cluster titles - keep smaller to avoid clipping */
                .mermaid-container .cluster-label .nodeLabel {
                    font-size: 14px !important;
                    font-weight: 700 !important;
                    letter-spacing: 0.05em;
                }
                
                /* Resizable container */
                .diagram-outer {
                    resize: both;
                    overflow: auto;
                    min-height: 300px;
                    min-width: 400px;
                }
                
                .diagram-outer::-webkit-resizer {
                    background: linear-gradient(135deg, transparent 50%, #666 50%);
                }
            `}</style>
            <div style={{ position: 'relative' }} ref={containerRef}>
                {/* Zoom controls */}
                <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    display: 'flex',
                    gap: '0.25rem',
                    zIndex: 10,
                }}>
                    <button
                        onClick={handleZoomIn}
                        style={{
                            padding: '0.5rem',
                            background: '#262730',
                            border: '1px solid #31333F',
                            borderRadius: '0.25rem',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        title="Zoom In"
                    >
                        <ZoomIn size={16} />
                    </button>
                    <button
                        onClick={handleZoomOut}
                        style={{
                            padding: '0.5rem',
                            background: '#262730',
                            border: '1px solid #31333F',
                            borderRadius: '0.25rem',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        title="Zoom Out"
                    >
                        <ZoomOut size={16} />
                    </button>
                </div>

                {/* Fixed-size resizable container */}
                <div
                    className="diagram-outer"
                    style={{
                        backgroundColor: '#1e1e1e',
                        borderRadius: '0.5rem',
                        border: '1px solid #31333F',
                        marginTop: '1rem',
                        height: '500px',
                    }}
                >
                    <div
                        ref={svgContainerRef}
                        className="mermaid-container"
                        style={{
                            padding: '1.5rem',
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                            transition: 'transform 0.2s ease',
                            width: 'fit-content',
                        }}
                        dangerouslySetInnerHTML={{ __html: svg }}
                    />
                </div>
            </div>
        </>
    );
}
