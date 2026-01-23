"use client";

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with mermaid
const MermaidDiagram = dynamic(() => import('../../components/MermaidDiagram'), {
    ssr: false,
    loading: () => <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading diagram...</div>
});

const systemDiagram = `
flowchart LR
    subgraph Frontend["FRONTEND"]
        Colab["📓 Colab<br/>Python Notebook"]
        Plx["📊 Plx<br/>SQL Workbench"]
        Chat["💬 Chat"]
    end

    subgraph Backend["BACKEND"]
        REPL["REPL<br/>Python Exec"]
        SQL["SQL<br/>BigQuery"]
        Mind["Mind<br/>Retrieval"]
    end

    subgraph AI["AI"]
        Gemini["Gemini"]
    end

    subgraph Storage["STORAGE"]
        Firestore[("Firestore")]
        BQ[("BigQuery")]
    end

    Colab -->|code| REPL
    Plx -->|query| SQL
    Chat -->|question| Mind
    
    REPL -->|output| Gemini
    SQL -->|results| Gemini
    SQL -->|execute| BQ
    Mind -->|claims| Gemini
    
    REPL -.->|save claim| Firestore
    SQL -.->|save claim| Firestore
    Mind -.->|fetch| Firestore
    Gemini -->|answer| Chat
`;

export default function AboutPage() {
    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '1rem', fontSize: '2rem', fontWeight: 700 }}>About</h1>

            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    your-ds-agent: Expert Knowledge Persistence System
                </h2>
                <p style={{ marginBottom: '1rem', color: '#ccc' }}>
                    <strong>Problem:</strong> Acquired knowledge evaporates when sessions end.
                </p>
                <p style={{ marginBottom: '1rem', color: '#ccc' }}>
                    <strong>Solution:</strong> A "Mind" layer that persists derived knowledge (Claims) from your work.
                </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Architecture</h3>
                <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#ccc', lineHeight: '1.6' }}>
                    <li><strong>"Colab"</strong>: Extracts claims from Python analysis</li>
                    <li><strong>"Plx"</strong>: Extracts claims from SQL results</li>
                    <li><strong>Firestore</strong>: Stores the "Mind" (knowledge graph)</li>
                    <li><strong>Gemini</strong>: Answers questions using the persistent Mind</li>
                </ul>
            </div>

            <div style={{ marginBottom: '400px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>System Diagram</h3>
                <MermaidDiagram chart={systemDiagram} />
            </div>
        </div>
    );
}
