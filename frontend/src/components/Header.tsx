'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext'; // 🔑 Import Auth Context

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenCreateModal?: () => void;
}

export default function Header({ onToggleSidebar, onOpenCreateModal }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout } = useAuth(); // 🔑 Consume authentication data

  // Dynamic initials helper (e.g., "Soha Ali" -> "SA")
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
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between w-full shadow-sm relative">
      
      {/* Left Area: Hamburger + App Meta Text */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <span className="text-xl block leading-none">☰</span>
        </button>

        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-800">Intelligent Agile Dashboard</h1>
          <p className="text-[10px] text-slate-500 font-medium">Real-time AI task forecasting engine</p>
        </div>
      </div>
      
      {/* Right Actions Area */}
      <div className="flex items-center gap-4 sm:gap-6">
        
        {/* Connection status */}
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg tracking-wide hidden lg:inline-block">
            Live Connection Sync
          </span>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all transform active:scale-95 border border-indigo-900/40 cursor-pointer"
        >
          <span>➕</span>
          <span>Create Task</span>
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* User Account Profile */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-600 border border-purple-400/30 flex items-center justify-center text-xs font-semibold shadow-inner text-white transition-transform group-hover:scale-105">
              {userInitials}
            </div>
            <div className="hidden sm:block text-left">
              <h4 className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors flex items-center gap-1.5">
                {user?.name || 'Loading...'}
                <span className={`text-[10px] text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </h4>
              <p className="text-[9px] text-slate-400 font-medium tracking-wide">
                {user?.role ? `${user.role} Account` : 'User Account'}
              </p>
            </div>
          </button>

          {/* Floating Dropdown Card */}
          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-slate-700">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Signed in as</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{user?.email || 'N/A'}</p>
                </div>
                <a href="#" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors" onClick={() => setIsDropdownOpen(false)}>
                  👤 My Profile
                </a>
                <a href="#" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors" onClick={() => setIsDropdownOpen(false)}>
                  ⚙️ Account Settings
                </a>
                <div className="h-px bg-slate-100 my-1" />
                <button 
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout(); // 🔑 Triggers dynamic logout
                  }}
                >
                  🚪 Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}