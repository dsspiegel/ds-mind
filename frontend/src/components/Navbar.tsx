"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Database, Info, Book } from 'lucide-react';
import styles from './Navbar.module.css';

const Navbar = () => {
    const pathname = usePathname();

    const isActive = (path: string) => pathname?.startsWith(path);

    return (
        <nav className={styles.navbar}>
            <div className={styles.title}>
                <Bot size={24} />
                your-ds-agent
            </div>

            <div className={styles.nav}>
                <Link
                    href="/colab"
                    className={`${styles.link} ${isActive('/colab') ? styles.active : ''}`}
                >
                    <Book size={18} />
                    "Colab"
                </Link>
                <Link
                    href="/plx"
                    className={`${styles.link} ${isActive('/plx') ? styles.active : ''}`}
                >
                    <Database size={18} />
                    Plx (SQL)
                </Link>
                <Link
                    href="/about"
                    className={`${styles.link} ${isActive('/about') ? styles.active : ''}`}
                >
                    <Info size={18} />
                    About
                </Link>
            </div>

        </nav>
    );
};

export default Navbar;
