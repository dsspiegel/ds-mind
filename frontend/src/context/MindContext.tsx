"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '../lib/api';

interface Mind {
    id: string;
    name: string;
    [key: string]: any;
}

interface Claim {
    content: string;
    source: string;
    type: string;
    confidence: number;
}

interface MindContextType {
    minds: Mind[];
    currentMind: Mind | null;
    mindId: string;
    setMindId: (id: string) => void;
    deleteMind: (id: string) => void;
    autoLearn: boolean;
    setAutoLearn: (value: boolean) => void;
    pendingClaims: Claim[];
    addPendingClaims: (claims: Claim[]) => void;
    clearPendingClaims: () => void;
    refreshMinds: () => Promise<void>;
}

const MindContext = createContext<MindContextType | undefined>(undefined);

export function MindProvider({ children }: { children: ReactNode }) {
    const [minds, setMinds] = useState<Mind[]>([{ id: 'default_mind', name: 'Demo Mind' }]);
    const [mindId, setMindIdState] = useState("default_mind");
    const [autoLearn, setAutoLearn] = useState(true);
    const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);

    // Determine current mind object
    const currentMind = minds.find(m => m.id === mindId) || minds[0] || null;

    const refreshMinds = async () => {
        try {
            const res = await apiFetch('/mind/');
            if (!res.ok) {
                throw new Error(`Failed to fetch minds: ${res.status}`);
            }
            const data = await res.json();
            if (data && data.length > 0) {
                const filteredMinds = data.filter((mind: Mind) => {
                    const name = mind?.name ?? "";
                    return !/test mind/i.test(name);
                });
                setMinds(filteredMinds);
                // If current mindID doesn't exist in new list, reset to first
                if (
                    filteredMinds.length > 0 &&
                    !filteredMinds.find((m: Mind) => m.id === mindId)
                ) {
                    setMindIdState(filteredMinds[0].id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch minds", err);
        }
    };

    const setMindId = (id: string) => {
        setMindIdState(id);
        // Clear pending claims when switching minds context? 
        // Or keep them? User request implies session state persists so maybe keep?
        // Let's keep them for now, but maybe warn user if they try to save to a different mind.
    };

    const addPendingClaims = (claims: Claim[]) => {
        setPendingClaims(prev => [...prev, ...claims]);
    };

    const clearPendingClaims = () => {
        setPendingClaims([]);
    };

    const deleteMind = (id: string) => {
        const nextMinds = minds.filter(m => m.id !== id);
        setMinds(prev => {
            const filtered = prev.filter(m => m.id !== id);
            if (filtered.length === 0) {
                return [{ id: 'default_mind', name: 'Demo Mind' }];
            }
            return filtered;
        });
        setMindIdState(prevId => {
            if (prevId !== id) return prevId;
            return nextMinds[0]?.id ?? 'default_mind';
        });
    };

    // Initial load
    useEffect(() => {
        refreshMinds();
    }, []);

    return (
        <MindContext.Provider value={{
            minds,
            currentMind,
            mindId,
            setMindId,
            deleteMind,
            autoLearn,
            setAutoLearn,
            pendingClaims,
            addPendingClaims,
            clearPendingClaims,
            refreshMinds
        }}>
            {children}
        </MindContext.Provider>
    );
}

export function useMind() {
    const context = useContext(MindContext);
    if (context === undefined) {
        throw new Error('useMind must be used within a MindProvider');
    }
    return context;
}
