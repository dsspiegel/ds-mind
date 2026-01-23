"use client";

import styles from './SystemDiagram.module.css';

export default function SystemDiagram() {
    return (
        <div className={styles.diagram}>
            {/* Frontend Layer */}
            <div className={styles.layer}>
                <div className={styles.layerLabel}>Frontend (Next.js)</div>
                <div className={styles.boxes}>
                    <div className={styles.box}>
                        <span className={styles.icon}>📓</span>
                        <span className={styles.boxTitle}>"Colab"</span>
                        <span className={styles.boxDesc}>Python Notebook</span>
                    </div>
                    <div className={styles.box}>
                        <span className={styles.icon}>📊</span>
                        <span className={styles.boxTitle}>"Plx"</span>
                        <span className={styles.boxDesc}>SQL Workbench</span>
                    </div>
                    <div className={styles.box}>
                        <span className={styles.icon}>💬</span>
                        <span className={styles.boxTitle}>Chat</span>
                        <span className={styles.boxDesc}>Sidebar</span>
                    </div>
                </div>
            </div>

            <div className={styles.arrows}>↓ &nbsp; ↓ &nbsp; ↓</div>

            {/* Backend Layer */}
            <div className={styles.layer}>
                <div className={styles.layerLabel}>Backend (FastAPI)</div>
                <div className={styles.boxes}>
                    <div className={styles.box}>
                        <span className={styles.boxTitle}>REPL Service</span>
                        <span className={styles.boxDesc}>Python Execution</span>
                    </div>
                    <div className={styles.box}>
                        <span className={styles.boxTitle}>SQL Service</span>
                        <span className={styles.boxDesc}>BigQuery</span>
                    </div>
                    <div className={styles.box}>
                        <span className={styles.boxTitle}>Mind Service</span>
                        <span className={styles.boxDesc}>Knowledge Retrieval</span>
                    </div>
                </div>
            </div>

            <div className={styles.arrows}>↓ Extract Claims &nbsp;&nbsp;&nbsp; ↓ Retrieve</div>

            {/* Storage & AI Layer */}
            <div className={styles.bottomRow}>
                <div className={styles.layer} style={{ flex: 1 }}>
                    <div className={styles.layerLabel}>Storage</div>
                    <div className={styles.boxes}>
                        <div className={styles.box}>
                            <span className={styles.boxTitle}>Firestore</span>
                            <span className={styles.boxDesc}>Claims & Sessions</span>
                        </div>
                        <div className={styles.box}>
                            <span className={styles.boxTitle}>BigQuery</span>
                            <span className={styles.boxDesc}>Data Warehouse</span>
                        </div>
                    </div>
                </div>
                <div className={styles.layer} style={{ flex: 1 }}>
                    <div className={styles.layerLabel}>AI Layer</div>
                    <div className={styles.boxes}>
                        <div className={`${styles.box} ${styles.aiBox}`}>
                            <span className={styles.icon}>🤖</span>
                            <span className={styles.boxTitle}>Gemini</span>
                            <span className={styles.boxDesc}>Insight Extraction & Chat</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
