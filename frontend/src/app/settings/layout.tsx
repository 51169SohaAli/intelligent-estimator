// app/settings/layout.tsx
'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    // SocketProvider removed from here
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased overflow-x-hidden text-slate-800">
      <Sidebar isCollapsed={isSidebarCollapsed} />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}