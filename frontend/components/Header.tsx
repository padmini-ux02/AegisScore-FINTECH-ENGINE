'use client';

import React from 'react';
import { ShieldCheck, CloudLightning, Calendar } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  user: any;
  isConnected: boolean;
}

export default function Header({ activeTab, user, isConnected }: HeaderProps) {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'overview': return 'Overview Dashboard';
      case 'assessment': return 'Credit Assessment Engine';
      case 'analytics': return 'Financial Risk Analytics';
      case 'explainability': return 'Explainable AI Insights (SHAP & LIME)';
      case 'reports': return 'Report Generation Center';
      case 'history': return 'Assessment Archive & Logs';
      case 'admin': return 'Platform Administration';
      case 'auth': return 'Authentication Portal';
      default: return 'AegisScore';
    }
  };

  const getTabSubtitle = (tab: string) => {
    switch (tab) {
      case 'overview': return 'Real-time monitoring of credit applications, risk profiles, and system health.';
      case 'assessment': return 'Input financial traits and simulate creditworthiness using deep models.';
      case 'analytics': return 'Explore validation curves, correlations, and feature distributions.';
      case 'explainability': return 'Interpret model decisions and inspect raw SHAP/LIME contribution vectors.';
      case 'reports': return 'Compile and download publication-ready credit summaries in PDF, Excel, and CSV formats.';
      case 'history': return 'Browse, inspect, and clone previous assessment entries.';
      case 'admin': return 'Manage user roles, configure rate limits, view security audit trials, and inspect server metrics.';
      case 'auth': return 'Sign in or register to unlock historical recording and report downloads.';
      default: return 'Enterprise Financial Risk Assessment Platform';
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="glass-panel flex items-center justify-between px-8 py-5 rounded-2xl shadow-lg border-slate-200/50 dark:border-slate-800/50 mb-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white capitalize tracking-tight">
          {getTabTitle(activeTab)}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {getTabSubtitle(activeTab)}
        </p>
      </div>

      <div className="flex items-center gap-5">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/30 px-3.5 py-2 rounded-xl border border-slate-200/20 dark:border-slate-800/20">
          <Calendar className="w-4 h-4 text-sky-500" />
          <span>{formattedDate}</span>
        </div>

        {/* API Connection Indicator */}
        <div className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border ${
          isConnected 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        }`}>
          {isConnected ? (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Engine Connected</span>
            </>
          ) : (
            <>
              <CloudLightning className="w-4 h-4" />
              <span>Simulation Mode</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
