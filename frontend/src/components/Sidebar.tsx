'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext'; // 🔑 Import Auth Context

interface SidebarProps {
  isCollapsed?: boolean;
}

export default function Sidebar({ isCollapsed = false }: SidebarProps) {
  const { user } = useAuth(); // 🔑 Consume authentication data

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = user?.name ? getInitials(user.name) : '??';

  return (
    <aside 
      className={`bg-indigo-950 border-r border-indigo-900/50 p-4 flex flex-col justify-between hidden md:flex shrink-0 fixed left-0 top-0 h-screen text-slate-100 shadow-xl transition-all duration-300 z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Area */}
        <div className={`flex items-center mb-10 px-2 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0">
            ✨
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in duration-200">
              <h2 className="font-bold tracking-tight text-white text-sm whitespace-nowrap">AuraEstimator</h2>
              <p className="text-[10px] text-purple-300 font-semibold tracking-wider uppercase">
                {user?.workspace || 'Agile Suite'}
              </p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="space-y-3">
          <a 
            href="#" 
            className={`flex items-center rounded-xl bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all shadow-sm relative group ${
              isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
            }`}
          >
            <span className="text-base">📊</span>
            {!isCollapsed && <span className="animate-in fade-in duration-200">Dashboard</span>}

            {isCollapsed && (
              <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700/50 text-white text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap shadow-2xl invisible opacity-0 -translate-x-2 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50 pointer-events-none">
                Dashboard
                <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700/50 rotate-45" />
              </span>
            )}
          </a>
          
          <a 
            href="#" 
            className={`flex items-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 font-medium text-sm transition-all relative group ${
              isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
            }`}
          >
            <span className="text-base">⚙️</span>
            {!isCollapsed && <span className="animate-in fade-in duration-200">Settings</span>}

            {isCollapsed && (
              <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700/50 text-white text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap shadow-2xl invisible opacity-0 -translate-x-2 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50 pointer-events-none">
                Settings
                <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700/50 rotate-45" />
              </span>
            )}
          </a>
        </nav>
      </div>

      {/* User Account Profile */}
      <div className={`flex items-center bg-white/5 border border-white/10 rounded-2xl transition-all relative group ${
        isCollapsed ? 'justify-center p-2' : 'gap-3 p-2.5'
      }`}
      >
        <div className="w-9 h-9 rounded-xl bg-purple-600 border border-purple-400/30 flex items-center justify-center text-sm font-semibold shadow-inner text-white shrink-0">
          {userInitials}
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden animate-in fade-in duration-200">
            <h4 className="text-xs font-bold text-white truncate">{user?.name || 'Loading...'}</h4>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.role ? `${user.role} Account` : 'User Account'}
            </p>
          </div>
        )}

        {/* Profile Hover Tooltip */}
        {isCollapsed && (
          <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700/50 text-white text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap shadow-2xl invisible opacity-0 -translate-x-2 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50 pointer-events-none">
            {user?.name || 'User'} ({user?.role || 'Account'})
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700/50 rotate-45" />
          </span>
        )}
      </div>
    </aside>
  );
}