"use client";

import { useState, useRef, useEffect } from "react";
import Markdown from 'react-markdown';
import { Send, User, Bot, MessageSquare, ChevronDown, ToggleLeft, ToggleRight, Save, Copy, Edit2, X, Code } from 'lucide-react';
import styles from './ChatSidebar.module.css';
import { useMind } from '../context/MindContext';
import { apiFetch } from '../lib/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    claimsUsed?: any[];
}

interface ChatSidebarProps {
    context: 'colab' | 'plx' | 'about';
}

// Store messages at module level so they persist across route changes
let globalMessages: Message[] = [];

const MODELS = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Preview)' },
];

export default function ChatSidebar({ context }: ChatSidebarProps) {
    const { minds, currentMind, mindId, setMindId, deleteMind, autoLearn, setAutoLearn, pendingClaims, clearPendingClaims, refreshMinds, insertCode } = useMind();

    const [messages, setMessages] = useState<Message[]>(globalMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [model, setModel] = useState("gemini-3-flash-preview");
    const [showMindMenu, setShowMindMenu] = useState(false);
    const [showModelMenu, setShowModelMenu] = useState(false);

    // Create Mind State
    const [showCreateMind, setShowCreateMind] = useState(false);
    const [newMindName, setNewMindName] = useState("");
    const [distillFile, setDistillFile] = useState<File | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isContextMode, setIsContextMode] = useState(false);
    const [contextText, setContextText] = useState("");

    // Save Session State
    const [showSaveSessionModal, setShowSaveSessionModal] = useState(false);
    const [saveSessionOption, setSaveSessionOption] = useState<'update' | 'new'>('update');

    const scrollRef = useRef<HTMLDivElement>(null);

    const currentModel = MODELS.find(m => m.id === model) || MODELS[0];

    // Sync with global messages
    useEffect(() => {
        globalMessages = messages;
    }, [messages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const getContextLabel = () => {
        switch (context) {
            case 'colab': return 'Python';
            case 'plx': return 'SQL';
            case 'about': return 'About';
            default: return '';
        }
    };

    const getEmptyStateText = () => {
        switch (context) {
            case 'colab':
                return "Ask questions about your Python analysis, or get help with pandas, numpy, and data exploration.";
            case 'plx':
                return "Ask questions about your SQL queries, or get help writing BigQuery syntax.";
            case 'about':
                return "Ask about how this application works, its architecture, or the knowledge persistence system.";
            default:
                return `Ask ${currentMind?.name || 'Mind'} a question...`;
        }
    };

    const handleCreateMind = async () => {
        if (!newMindName.trim()) return;
        setIsCreating(true);

        try {
            const formData = new FormData();
            formData.append('name', newMindName);

            if (isContextMode) {
                if (distillFile) {
                    formData.append('file', distillFile);
                }
                if (contextText) {
                    formData.append('text_content', contextText);
                }
            }

            const res = await apiFetch('/mind/', {
                method: 'POST',
                body: formData
            });

            await refreshMinds();
            const newMind = await res.json();
            setMindId(newMind.id);

            setShowCreateMind(false);
            setNewMindName("");
            setDistillFile(null);
            setIsContextMode(false);
            setContextText("");
        } catch (error) {
            console.error("Failed to create mind", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSaveSession = async () => {
        if (saveSessionOption === 'update') {
            try {
                await apiFetch(`/mind/${mindId}/claims`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingClaims)
                });
                clearPendingClaims();
                setShowSaveSessionModal(false);
            } catch (e) {
                console.error("Failed to update mind", e);
            }
        } else {
            if (!newMindName.trim()) return;
            try {
                const formData = new FormData();
                formData.append('name', newMindName);
                formData.append('claims_json', JSON.stringify(pendingClaims));

                const res = await apiFetch('/mind/', {
                    method: 'POST',
                    body: formData
                });
                const newMind = await res.json();
                await refreshMinds();
                setMindId(newMind.id);
                clearPendingClaims();
                setShowSaveSessionModal(false);
                setNewMindName("");
            } catch (e) {
                console.error("Failed to create mind with claims", e);
            }
        }
    };

    const handleForkMind = async () => {
        const name = prompt("Name for forked mind:", `Copy of ${currentMind?.name}`);
        if (!name) return;

        try {
            const formData = new FormData();
            formData.append('new_name', name);
            await apiFetch(`/mind/${mindId}/fork`, {
                method: 'POST',
                body: formData
            });
            await refreshMinds();
            setShowMindMenu(false);
        } catch (e) {
            console.error("Fork failed", e);
        }
    };

    const handleDeleteMind = async (id: string, name: string) => {
        const confirmed = confirm(`Delete "${name}"? This cannot be undone.`);
        if (!confirmed) return;

        try {
            const res = await apiFetch(`/mind/${id}`, { method: "DELETE" });
            if (!res.ok) {
                throw new Error(`Delete failed: ${res.status}`);
            }
            deleteMind(id);
            await refreshMinds();
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await apiFetch("/mind/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mind_id: mindId,
                    question: input,
                    model: model,
                    context: context
                })
            });

            const data = await response.json();

            const assistantMsg: Message = {
                role: 'assistant',
                content: data.answer || "Sorry, I couldn't get an answer.",
                claimsUsed: data.claims_used
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Error communicating with backend."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.chatSidebar}>
            {/* Header with Mind name */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <MessageSquare size={16} />
                    <span className={styles.mindName}>{currentMind?.name || 'Mind'}</span>
                    <span className={styles.contextBadge}>{getContextLabel()}</span>
                </div>
                {/* Auto Learn Toggle */}
                <div className={styles.autoLearnControl}>
                    <span className={styles.autoLearnLabel}>Auto-learn</span>
                    <button
                        className={styles.toggleBtn}
                        onClick={() => setAutoLearn(!autoLearn)}
                        title={autoLearn ? "Claims are saved automatically" : "Claims are ephemeral"}
                    >
                        {autoLearn ? <ToggleRight size={20} color="#4b9fff" /> : <ToggleLeft size={20} color="#666" />}
                    </button>
                </div>
            </div>

            {/* Mind/Model Selectors */}
            <div className={styles.selectors}>
                <div className={styles.selectorGroup}>
                    <label className={styles.selectorLabel}>Mind</label>
                    <div className={styles.dropdown}>
                        <button
                            className={styles.dropdownButton}
                            onClick={() => {
                                setShowMindMenu(!showMindMenu);
                                setShowModelMenu(false);
                            }}
                        >
                            {currentMind?.name || 'Select Mind'}
                            <ChevronDown size={14} />
                        </button>
                        {showMindMenu && (
                            <div className={styles.dropdownMenu}>
                                {minds.map(m => (
                                    <div key={m.id} className={styles.dropdownItemRow}>
                                        <button
                                            className={styles.dropdownItem}
                                            onClick={() => {
                                                setMindId(m.id);
                                                setShowMindMenu(false);
                                                setShowModelMenu(false);
                                            }}
                                        >
                                            {m.name}
                                        </button>
                                        <button
                                            className={styles.dropdownDelete}
                                            title={`Delete ${m.name}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowModelMenu(false);
                                                handleDeleteMind(m.id, m.name);
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                <div className={styles.dropdownDivider} />
                                <button
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                        setShowModelMenu(false);
                                        handleForkMind();
                                    }}
                                >
                                    <Copy size={14} style={{ marginRight: '8px' }} /> Fork Mind
                                </button>
                                <button
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                        setShowModelMenu(false);
                                        alert("Edit not implemented yet");
                                    }}
                                >
                                    <Edit2 size={14} style={{ marginRight: '8px' }} /> Edit Mind
                                </button>
                                <div className={styles.dropdownDivider} />
                                <button
                                    className={`${styles.dropdownItem} ${styles.createOption}`}
                                    onClick={() => {
                                        setShowCreateMind(true);
                                        setShowMindMenu(false);
                                        setShowModelMenu(false);
                                    }}
                                    style={{ color: '#4b9fff', fontWeight: 500 }}
                                >
                                    + Create New Mind
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.selectorGroup}>
                    <label className={styles.selectorLabel}>Model</label>
                    <div className={styles.dropdown}>
                        <button
                            className={styles.dropdownButton}
                            onClick={() => {
                                setShowModelMenu(!showModelMenu);
                                setShowMindMenu(false);
                            }}
                        >
                            {currentModel.name}
                            <ChevronDown size={14} />
                        </button>
                        {showModelMenu && (
                            <div className={styles.dropdownMenu}>
                                {MODELS.map(m => (
                                    <button
                                        key={m.id}
                                        className={styles.dropdownItem}
                                        onClick={() => {
                                            setModel(m.id);
                                            setShowModelMenu(false);
                                            setShowMindMenu(false);
                                        }}
                                    >
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pending Claims Banner */}
            {!autoLearn && pendingClaims.length > 0 && (
                <div className={styles.pendingBanner}>
                    <div className={styles.pendingInfo}>
                        <span>{pendingClaims.length} unsaved claims</span>
                    </div>
                    <button className={styles.saveSessionBtn} onClick={() => setShowSaveSessionModal(true)}>
                        <Save size={14} />
                        Remember Session
                    </button>
                </div>
            )}

            {/* Save Session Modal */}
            {showSaveSessionModal && (
                <div className={styles.overlay}>
                    <div className={styles.createModal}>
                        <h3>Save Session Claims</h3>
                        <div className={styles.mindTypeSelector}>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="saveOption"
                                    checked={saveSessionOption === 'update'}
                                    onChange={() => setSaveSessionOption('update')}
                                />
                                Update "{currentMind?.name}"
                            </label>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="saveOption"
                                    checked={saveSessionOption === 'new'}
                                    onChange={() => setSaveSessionOption('new')}
                                />
                                Save as New Mind
                            </label>
                        </div>

                        {saveSessionOption === 'new' && (
                            <input
                                type="text"
                                placeholder="New Mind Name"
                                value={newMindName}
                                onChange={e => setNewMindName(e.target.value)}
                                className={styles.modalInput}
                            />
                        )}

                        <div className={styles.modalActions}>
                            <button onClick={() => setShowSaveSessionModal(false)} className={styles.cancelBtn}>Cancel</button>
                            <button onClick={handleSaveSession} className={styles.createBtn}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Mind Modal / Overlay */}
            {showCreateMind && (
                <div className={styles.overlay}>
                    <div className={styles.createModal}>
                        <h3>Create New Mind</h3>

                        <div className={styles.mindTypeSelector}>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="mindType"
                                    checked={!isContextMode}
                                    onChange={() => setIsContextMode(false)}
                                />
                                Tabula Rasa (Blank)
                            </label>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="mindType"
                                    checked={isContextMode}
                                    onChange={() => setIsContextMode(true)}
                                />
                                Mind with Context
                            </label>
                        </div>

                        <input
                            type="text"
                            placeholder="Mind Name (e.g. Finance Ops)"
                            value={newMindName}
                            onChange={e => setNewMindName(e.target.value)}
                            className={styles.modalInput}
                        />

                        {isContextMode && (
                            <div className={styles.contextSection}>
                                <div className={styles.inputGroup}>
                                    <label>Overall Context (System Prompt)</label>
                                    <textarea
                                        className={styles.contextTextarea}
                                        placeholder="Describe the role and knowledge base of this mind..."
                                        value={contextText}
                                        onChange={e => setContextText(e.target.value)}
                                        rows={4}
                                    />
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>Add Source (Distill PDF)</label>
                                    <div className={styles.fileInputWrapper}>
                                        <input
                                            type="file"
                                            accept=".pdf,.txt,.md"
                                            onChange={e => setDistillFile(e.target.files ? e.target.files[0] : null)}
                                        />
                                    </div>
                                    {distillFile && <div className={styles.fileName}>{distillFile.name}</div>}
                                </div>
                            </div>
                        )}

                        <div className={styles.modalActions}>
                            <button
                                onClick={() => setShowCreateMind(false)}
                                className={styles.cancelBtn}
                                disabled={isCreating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateMind}
                                className={styles.createBtn}
                                disabled={!newMindName || isCreating}
                            >
                                {isCreating ? 'Creating...' : 'Create Mind'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div ref={scrollRef} className={styles.messages}>
                {messages.length === 0 && (
                    <div className={styles.emptyState}>
                        {getEmptyStateText()}
                    </div>
                )}

                {messages.map((m, i) => (
                    <div key={i} className={`${styles.message} ${m.role === 'user' ? styles.messageUser : ''}`}>
                        <div className={`${styles.avatar} ${m.role === 'user' ? styles.avatarUser : styles.avatarBot}`}>
                            {m.role === 'user' ? <User size={14} color="white" /> : <Bot size={14} color="white" />}
                        </div>
                        <div className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleBot}`}>
                            {m.role === 'assistant' ? (
                                <>
                                    <Markdown
                                        components={{
                                            pre: ({ node, children, ...props }) => {
                                                // Extract code from the pre block for the insert button
                                                const codeContent = String(children).replace(/\n$/, '');
                                                return (
                                                    <div style={{ position: 'relative' }}>
                                                        <pre {...props}>{children}</pre>
                                                        {context === 'colab' && codeContent.length > 10 && (
                                                            <button
                                                                onClick={() => insertCode(codeContent)}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '4px',
                                                                    right: '4px',
                                                                    padding: '4px 8px',
                                                                    fontSize: '11px',
                                                                    background: '#4b9fff',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px'
                                                                }}
                                                                title="Insert into notebook"
                                                            >
                                                                <Code size={12} /> Insert
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            },
                                            code: ({ node, ...props }) => <code {...props} />
                                        }}
                                    >
                                        {m.content}
                                    </Markdown>
                                    {m.claimsUsed && m.claimsUsed.length > 0 && (
                                        <div className={styles.sources}>
                                            <div className={styles.sourcesHeader}>Sources:</div>
                                            {m.claimsUsed.map((c: any, j: number) => (
                                                <div key={j}>• {c.source}</div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <span>{m.content}</span>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className={styles.message}>
                        <div className={`${styles.avatar} ${styles.avatarBot}`}>
                            <Bot size={14} color="white" />
                        </div>
                        <div className={`${styles.bubble} ${styles.bubbleBot} ${styles.thinking}`}>
                            Thinking...
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.inputArea}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={`Ask ${currentMind?.name || 'Mind'}...`}
                    className={styles.input}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className={styles.sendButton}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
