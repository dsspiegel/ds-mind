import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import ChatSidebarWrapper from "../components/ChatSidebarWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "your-ds-agent",
  description: "Expert Knowledge Persistence System",
};

import { MindProvider } from "../context/MindContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <MindProvider>
          <Navbar />
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
              {children}
            </main>
            <ChatSidebarWrapper />
          </div>
        </MindProvider>
      </body>
    </html>
  );
}
