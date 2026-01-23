"use client";

import styles from './page.module.css';

export default function ColabPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>📓 Colab</h1>
                <p className={styles.subtitle}>
                    Powered by JupyterLite — runs entirely in your browser
                </p>
            </div>
            <div className={styles.jupyterContainer}>
                <iframe
                    src="https://jupyterlite.github.io/demo/retro/notebooks/?kernel=python"
                    className={styles.jupyterFrame}
                    title="JupyterLite"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                />
            </div>
        </div>
    );
}
