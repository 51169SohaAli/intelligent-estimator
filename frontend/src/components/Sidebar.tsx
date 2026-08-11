'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // 👈 Active link detection
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isCollapsed?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  isCollapsed = false,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname(); // 👈 Current route pathname

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = user?.name ? getInitials(user.name) : '??';

  const isDashboardActive = pathname === '/';
  const isSettingsActive = pathname === '/settings/workspace';
  const isProfileActive = pathname === '/profile';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`bg-indigo-950 border-r border-indigo-900/50 p-4 flex flex-col justify-between fixed left-0 top-0 h-screen text-slate-100 shadow-xl transition-all duration-300 z-50 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
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
                <h2 className="font-bold tracking-tight text-white text-sm whitespace-nowrap">SprintFlow</h2>
                <p className="text-[10px] text-purple-300 font-semibold tracking-wider uppercase">
                  {user?.workspace || 'Agile Suite'}
                </p>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="space-y-3">
            <Link 
  href="/" 
  onClick={() => {
    if (onClose) onClose();
  }}
  className={`flex items-center rounded-xl font-semibold text-sm transition-all shadow-sm relative group ${
    isDashboardActive 
      ? 'bg-white/10 border border-white/10 text-white' 
      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
  } ${
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
</Link>
            
            {/* Settings Link */}
            <Link 
              href="/settings/workspace" 
              onClick={onClose}
              className={`flex items-center rounded-xl font-medium text-sm transition-all relative group ${
                isSettingsActive 
                  ? 'bg-white/10 border border-white/10 text-white font-semibold' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              } ${
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
            </Link>
          </nav>
        </div>

        {/* User Account Profile Link */}
        <Link 
          href="/profile"
          onClick={onClose}
          className={`flex items-center rounded-2xl transition-all relative group cursor-pointer ${
            isProfileActive 
              ? 'bg-white/15 border border-white/20' 
              : 'bg-white/5 border border-white/10 hover:bg-white/10'
          } ${
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
        </Link>
      </aside>
    </>
  );
}