"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useRef, useEffect } from "react";
import { Play } from "lucide-react";
import styles from './CodeCell.module.css';

interface CodeCellProps {
    id: string;
    cellNumber: number | null;
    code: string;
    language?: string; // Optional language prop
    result: any;
    onChange: (value: string) => void;
    onRun: () => void;
    onRunAndAdd: () => void;
    isRunning: boolean;
}

const CodeCell = ({ id, cellNumber, code, language = 'python', result, onChange, onRun, onRunAndAdd, isRunning }: CodeCellProps) => {
    const editorRef = useRef<any>(null);

    // Keep refs to callbacks so event handlers always use current versions
    const onRunRef = useRef(onRun);
    const onRunAndAddRef = useRef(onRunAndAdd);

    useEffect(() => {
        onRunRef.current = onRun;
        onRunAndAddRef.current = onRunAndAdd;
    }, [onRun, onRunAndAdd]);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;

        // Use onKeyDown instead of addCommand for more reliable per-editor handling
        editor.onKeyDown((e: any) => {
            // Cmd+Enter (Mac) or Ctrl+Enter (Windows) to Run
            if ((e.metaKey || e.ctrlKey) && e.keyCode === monaco.KeyCode.Enter && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                onRunRef.current();
            }
            // Shift+Enter to Run + Add
            if (e.shiftKey && e.keyCode === monaco.KeyCode.Enter && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                onRunAndAddRef.current();
            }
        });

        // Force layout after mount
        requestAnimationFrame(() => {
            editor.layout();
        });

        const updateHeight = () => {
            const contentHeight = editor.getContentHeight();
            const layoutInfo = editor.getLayoutInfo();
            const height = Math.max(100, contentHeight);
            editor.layout({ width: layoutInfo.width, height: height });
        };

        editor.onDidContentSizeChange(updateHeight);
    };

    return (
        <div className={styles.cellContainer}>
            <div className={styles.cellNumber}>
                {cellNumber !== null ? `[${cellNumber}]` : '[ ]'}
            </div>
            <div className={styles.cellContent}>
                <div className={styles.inputRow}>
                    <div className={styles.editorContainer}>
                        <Editor
                            height="120px"
                            value={code}
                            defaultLanguage={language}
                            theme="vs-dark"
                            onChange={(val) => onChange(val || "")}
                            onMount={handleEditorDidMount}
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 14,
                                fontFamily: "'Fira Code', monospace",
                                padding: { top: 16, bottom: 16 },
                                lineNumbers: "on",
                                glyphMargin: false,
                                folding: false,
                                lineDecorationsWidth: 10,
                                lineNumbersMinChars: 4,
                            }}
                        />
                    </div>
                    <button
                        className={styles.runButton}
                        onClick={onRun}
                        disabled={isRunning}
                        title="Run (Cmd+Enter)"
                    >
                        <Play size={16} fill="currentColor" />
                    </button>
                </div>

                {result && (
                    <div className={styles.outputArea}>
                        {result.error && (
                            <div className={styles.error}>{result.error}</div>
                        )}
                        {result.output && (
                            <pre className={styles.stdout}>{result.output}</pre>
                        )}
                        {result.stderr && (
                            <pre className={styles.stderr}>{result.stderr}</pre>
                        )}
                        {result.display_data && result.display_data.text && (
                            <div className={styles.resultText}>{result.display_data.text}</div>
                        )}
                        {result.claim_generated && (
                            <div className={styles.claimBox}>
                                <div className={styles.claimHeader}>💡 Claim Generated</div>
                                <div>{result.claim_generated.content}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeCell;
