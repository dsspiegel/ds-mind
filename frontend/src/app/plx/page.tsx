"use client";

import { useState, useEffect } from "react";
import CodeCell from "../../components/CodeCell";
import { v4 as uuidv4 } from "uuid";
import { useMind } from "../../context/MindContext";
import { apiFetch } from "../../lib/api";

export default function PlxPage() {
    const { mindId, autoLearn, addPendingClaims } = useMind();
    const [session, setSession] = useState<{ id: string, code: string, result: any, isRunning: boolean } | null>(null);

    useEffect(() => {
        // Initialize session
        setSession({
            id: uuidv4(),
            code: "SELECT * FROM demo_gemini.daily_metrics LIMIT 5;",
            result: null,
            isRunning: false
        });
    }, []);

    const handleRun = async () => {
        if (!session) return;

        setSession(prev => prev ? { ...prev, isRunning: true } : null);

        try {
            const response = await apiFetch("/plx/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: `plx_${session.id}`,
                    mind_id: mindId,
                    sql: session.code,
                    auto_learn: autoLearn
                })
            });

            const data = await response.json();

            let resultObj: any = {};
            if (data.success) {
                const headers = data.sample_rows.length > 0 ? Object.keys(data.sample_rows[0]) : [];
                const rows = data.sample_rows.map((r: any) => Object.values(r).join("\t"));
                const tableText = [headers.join("\t"), ...rows].join("\n");

                resultObj.stdout = `Query returned ${data.row_count} rows:\n\n${tableText}`;

                // Handle claims (either saved or ephemeral)
                if (data.claim_generated) {
                    if (autoLearn) {
                        resultObj.claim = data.claim_generated;
                    } else {
                        // If auto-learn is off, add to pending claims
                        // The backend might return it as 'claim_generated' but we treat it as pending
                        // Actually, we need to ensure backend behaves correctly.
                        // For now let's assume if it returns a claim, we add to pending if !autoLearn
                        addPendingClaims([{
                            content: data.claim_generated,
                            type: 'observation',
                            confidence: 1.0,
                            source: 'plx_query'
                        }]);
                        resultObj.claim = `${data.claim_generated} (Pending Save)`;
                    }
                }
            } else {
                resultObj.error = data.error;
            }

            setSession(prev => prev ? { ...prev, result: resultObj, isRunning: false } : null);

        } catch (error) {
            setSession(prev => prev ? { ...prev, result: { error: "Network Error" }, isRunning: false } : null);
        }
    };

    if (!session) return null;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 700 }}>
                📊 "Plx"
                <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 400, marginLeft: '1rem', display: 'block', marginTop: '0.5rem' }}>
                    SQL Workbench for BigQuery
                </span>
            </h1>

            <CodeCell
                id={session.id}
                cellNumber={1}
                code={session.code}
                language="sql"
                result={session.result}
                onChange={(val) => setSession(prev => prev ? { ...prev, code: val } : null)}
                onRun={handleRun}
                onRunAndAdd={handleRun}
                isRunning={session.isRunning}
            />
        </div>
    );
}
