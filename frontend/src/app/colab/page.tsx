"use client";

import { useState, useEffect, useRef } from "react";
import CodeCell from "../../components/CodeCell";
import { Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useMind } from "../../context/MindContext";
import { apiFetch } from "../../lib/api";

interface Cell {
    id: string;
    code: string;
    result: any;
    isRunning: boolean;
    executionCount: number | null;
}

export default function ColabPage() {
    const { mindId, autoLearn, addPendingClaims, setInsertCodeCallback } = useMind();
    const [cells, setCells] = useState<Cell[]>([]);
    const [sessionId, setSessionId] = useState<string>("");
    const [executionCounter, setExecutionCounter] = useState(0);

    useEffect(() => {
        setSessionId(`sess_${uuidv4().substring(0, 8)}`);
        setCells([{ id: uuidv4(), code: "# Write Python code here\n", result: null, isRunning: false, executionCount: null }]);
    }, []);

    // Register the addCell function with the context so ChatSidebar can use it
    useEffect(() => {
        setInsertCodeCallback((code: string) => {
            const newCell: Cell = { id: uuidv4(), code, result: null, isRunning: false, executionCount: null };
            setCells(prev => [...prev, newCell]);
        });
    }, [setInsertCodeCallback]);

    const cellsRef = useRef(cells);
    const executionCounterRef = useRef(executionCounter);
    useEffect(() => { cellsRef.current = cells; }, [cells]);
    useEffect(() => { executionCounterRef.current = executionCounter; }, [executionCounter]);

    const updateCellCode = (id: string, code: string) => {
        setCells(prev => prev.map(c => c.id === id ? { ...c, code } : c));
    };

    const addCell = (afterId?: string, code: string = "") => {
        const newCell: Cell = { id: uuidv4(), code, result: null, isRunning: false, executionCount: null };
        setCells(prev => {
            if (afterId) {
                const index = prev.findIndex(c => c.id === afterId);
                const newCells = [...prev];
                newCells.splice(index + 1, 0, newCell);
                return newCells;
            } else {
                return [...prev, newCell];
            }
        });
        return newCell.id;
    };

    const executeCell = async (id: string, code: string) => {
        const newCount = executionCounterRef.current + 1;
        setExecutionCounter(newCount);
        executionCounterRef.current = newCount;

        setCells(prev => prev.map(c => c.id === id ? { ...c, isRunning: true, executionCount: newCount } : c));

        const index = cellsRef.current.findIndex(c => c.id === id);

        try {
            const response = await apiFetch("/execute/python", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    cell_id: id,
                    code: code,
                    cell_order: index,
                    mind_id: mindId,
                    auto_learn: autoLearn
                })
            });

            const data = await response.json();

            if (!autoLearn && data.generated_claims && data.generated_claims.length > 0) {
                addPendingClaims(data.generated_claims);
            }

            setCells(prev => prev.map(c => c.id === id ? {
                ...c,
                result: data,
                isRunning: false
            } : c));

            return true;
        } catch (error) {
            console.error("Execution failed", error);
            setCells(prev => prev.map(c => c.id === id ? {
                ...c,
                result: { error: "Network/Execution Error" },
                isRunning: false
            } : c));
            return false;
        }
    };

    const handleRun = (id: string) => {
        const cell = cellsRef.current.find(c => c.id === id);
        if (cell) executeCell(id, cell.code);
    };

    const handleRunAndAdd = async (id: string) => {
        const cell = cellsRef.current.find(c => c.id === id);
        if (!cell) return;

        await executeCell(id, cell.code);

        const currentCells = cellsRef.current;
        const index = currentCells.findIndex(c => c.id === id);
        if (index === currentCells.length - 1) {
            addCell();
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '0.5rem', fontSize: '1.75rem', fontWeight: 700 }}>
                📓 Colab
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1.5rem' }}>
                <b>Cmd+Enter</b> to run · <b>Shift+Enter</b> to run and add cell
            </p>

            {cells.map((cell) => (
                <CodeCell
                    key={cell.id}
                    id={cell.id}
                    cellNumber={cell.executionCount}
                    code={cell.code}
                    language="python"
                    result={cell.result}
                    onChange={(val) => updateCellCode(cell.id, val)}
                    onRun={() => handleRun(cell.id)}
                    onRunAndAdd={() => handleRunAndAdd(cell.id)}
                    isRunning={cell.isRunning}
                />
            ))}

            <button
                onClick={() => addCell()}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#262730',
                    border: '1px solid #31333F',
                    color: 'white',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    marginTop: '1rem'
                }}
            >
                <Plus size={16} />
                Add Cell
            </button>
        </div>
    );
}
