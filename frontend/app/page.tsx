'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ChatbotWidget from '../components/ChatbotWidget';

// Tabs
import OverviewTab from '../components/OverviewTab';
import AssessmentTab from '../components/AssessmentTab';
import AnalyticsTab from '../components/AnalyticsTab';
import ExplainabilityTab from '../components/ExplainabilityTab';
import ReportsTab from '../components/ReportsTab';
import HistoryTab from '../components/HistoryTab';
import AdminTab from '../components/AdminTab';
import AuthTab from '../components/AuthTab';

import { api } from '../lib/api';

export default function DashboardHome() {
  const [activeTab, setActiveTab] = useState('auth'); // Start on login page
  const [user, setUser] = useState<any>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const [triggerRefresh, setTriggerRefresh] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isConnected, setIsConnected] = useState(false);

  // 1. Check server connection
  useEffect(() => {
    async function checkConnection() {
      try {
        const data = await api.get<{ status: string }>('/');
        if (data && data.status === 'online') {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch {
        setIsConnected(false);
      }
    }
    checkConnection();
    // Poll connection status every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. Load User session — if token exists, restore and go to overview
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('creditguard_token');
      if (token) {
        try {
          const profile = await api.get<any>('/auth/me');
          setUser(profile);
          setActiveTab('overview'); // returning user → skip login screen
        } catch {
          localStorage.removeItem('creditguard_token');
          localStorage.removeItem('aegisscore_mock_user');
          setUser(null);
          setActiveTab('auth');
        }
      } else {
        setActiveTab('auth'); // no session → show login
      }
    }
    loadUser();
  }, []);

  // 3. Sync Light / Dark Theme Mode
  useEffect(() => {
    const root = window.document.documentElement;
    const localTheme = localStorage.getItem('creditguard_theme');
    const initialTheme = localTheme || 'dark';
    
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    
    setTheme(nextTheme);
    localStorage.setItem('creditguard_theme', nextTheme);
    if (nextTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const handleLoginSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
    setActiveTab('overview');
    setTriggerRefresh(prev => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('creditguard_token');
    localStorage.removeItem('aegisscore_mock_user');
    setUser(null);
    setActiveTab('auth'); // go back to login after logout
    setTriggerRefresh(prev => !prev);
  };

  const handleAssessmentCompleted = (resultData: any) => {
    setLastResult(resultData);
    setTriggerRefresh(prev => !prev);
  };

  // Inspect history record utility
  const handleSelectRecord = (record: any) => {
    setLastResult(record);
    setActiveTab('explainability');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300 relative overflow-hidden">
      {/* Background radial glow orbs for premium aesthetics */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none -z-10 dark:bg-sky-500/5"></div>
      <div className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10 dark:bg-indigo-500/5"></div>
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Dashboard Area */}
      <main className="flex-1 flex flex-col p-4 overflow-y-auto">
        <Header 
          activeTab={activeTab} 
          user={user} 
          isConnected={isConnected} 
        />

        <div className="flex-1">
          {activeTab === 'overview' && (
            <OverviewTab 
              onNavigate={setActiveTab} 
              onSelectRecord={(id) => handleSelectRecord({ id })}
              triggerRefresh={triggerRefresh}
            />
          )}
          {activeTab === 'assessment' && (
            <AssessmentTab 
              onAssessmentCompleted={handleAssessmentCompleted} 
              onNavigate={setActiveTab}
              lastResult={lastResult}
            />
          )}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'explainability' && (
            <ExplainabilityTab 
              result={lastResult} 
              onNavigate={setActiveTab} 
            />
          )}
          {activeTab === 'reports' && (
            <ReportsTab 
              result={lastResult} 
              onNavigate={setActiveTab} 
            />
          )}
          {activeTab === 'history' && (
            <HistoryTab 
              user={user} 
              onSelectRecord={handleSelectRecord} 
              onNavigate={setActiveTab}
              triggerRefresh={triggerRefresh}
            />
          )}
          {activeTab === 'admin' && <AdminTab />}
          {activeTab === 'auth' && <AuthTab onLoginSuccess={handleLoginSuccess} />}
        </div>
      </main>

      {/* Floating Chatbot Advisor */}
      <ChatbotWidget />
      
    </div>
  );
}
