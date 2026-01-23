"use client";

import { usePathname } from "next/navigation";
import ChatSidebar from "./ChatSidebar";

export default function ChatSidebarWrapper() {
    const pathname = usePathname();

    // Determine context from current path
    const getContext = (): 'colab' | 'plx' | 'about' => {
        if (pathname?.startsWith('/plx')) return 'plx';
        if (pathname?.startsWith('/about')) return 'about';
        return 'colab'; // Default to colab for / and /colab
    };

    return <ChatSidebar context={getContext()} />;
}
