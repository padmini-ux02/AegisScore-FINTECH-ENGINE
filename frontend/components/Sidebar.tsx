'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  UserCheck, 
  BarChart3, 
  Cpu, 
  FileDown, 
  History, 
  ShieldAlert, 
  LogOut, 
  Sun, 
  Moon,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
  theme: string;
  toggleTheme: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  theme,
  toggleTheme
}: SidebarProps) {
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'assessment', name: 'Credit Assessment', icon: UserCheck },
    { id: 'analytics', name: 'Financial Analytics', icon: BarChart3 },
    { id: 'explainability', name: 'Explainable AI Insights', icon: Cpu },
    { id: 'reports', name: 'Reports', icon: FileDown },
    { id: 'history', name: 'Prediction History', icon: History },
  ];

  // Only show Admin Panel if user is an admin
  const isAdmin = user && user.role === 'admin';

  return (
    <aside className="w-64 glass-panel flex flex-col h-[calc(100vh-2rem)] m-4 rounded-2xl overflow-hidden shadow-xl border-slate-200/50 dark:border-slate-800/50">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-200/30 dark:border-slate-800/30 flex items-center gap-3">
        <div className="bg-sky-500/10 p-2 rounded-lg text-sky-500 dark:text-sky-400">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
            AegisScore
          </h1>
          <span className="text-[10px] uppercase font-bold text-sky-500 tracking-widest">Fintech Engine</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 dark:shadow-sky-500/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </button>
          );
        })}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'admin'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 dark:shadow-rose-500/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            Admin Panel
          </button>
        )}
      </nav>

      {/* Theme Toggle & User Info Footer */}
      <div className="p-4 border-t border-slate-200/30 dark:border-slate-800/30 space-y-4">
        {/* Theme switcher */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-sky-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
          <span className="text-[10px] uppercase bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md">Switch</span>
        </button>

        {user ? (
          <div className="flex items-center justify-between gap-3 bg-slate-100/30 dark:bg-slate-800/20 p-2 rounded-xl border border-slate-200/20 dark:border-slate-800/20">
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{user.full_name || user.email}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize truncate">{user.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/5 dark:hover:bg-rose-500/5 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('auth')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors shadow-sm"
          >
            Sign In / Register
          </button>
        )}
      </div>
    </aside>
  );
}
