'use client';

import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Cpu, ArrowRight, Lock } from 'lucide-react';
import { api } from '../lib/api';

interface HistoryTabProps {
  user: any;
  onSelectRecord: (record: any) => void;
  onNavigate: (tab: string) => void;
  triggerRefresh: boolean;
}

export default function HistoryTab({ 
  user, 
  onSelectRecord, 
  onNavigate,
  triggerRefresh
}: HistoryTabProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function fetchHistory() {
      setIsLoading(true);
      try {
        const data = await api.get<any[]>('/predict/history');
        const historyList = Array.isArray(data) ? data : [];
        setHistory(historyList);
        setFilteredHistory(historyList);
      } catch (err) {
        console.error(err);
        setHistory([]);
        setFilteredHistory([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, [user, triggerRefresh]);

  // Apply filters
  useEffect(() => {
    let result = Array.isArray(history) ? [...history] : [];

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(r => 
        r?.credit_score?.toString().includes(query) ||
        r?.inputs?.annual_income?.toString().includes(query) ||
        r?.risk_category?.toLowerCase().includes(query)
      );
    }

    if (riskFilter !== 'All') {
      result = result.filter(r => r?.risk_category === riskFilter);
    }

    setFilteredHistory(result);
  }, [search, riskFilter, history]);

  const getRiskBadgeColor = (cat: string) => {
    switch (cat) {
      case 'Excellent': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Good': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'Moderate': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'High Risk': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'Very High Risk': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-655 border-slate-500/20';
    }
  };

  // 1. Not Logged In State
  if (!user) {
    return (
      <div className="glass-panel p-10 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md text-center max-w-md mx-auto space-y-4 my-10 animate-in fade-in duration-300">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm tracking-tight uppercase">History Locked</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Prediction logs tracking and archiving require authentication. Please sign in to view your archive.
          </p>
        </div>
        <button
          onClick={() => onNavigate('auth')}
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md"
        >
          Sign In
        </button>
      </div>
    );
  }

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md animate-in fade-in duration-300">
      
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/30 dark:border-slate-800/30">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-sky-500" />
          <h3 className="font-extrabold text-sm tracking-tight uppercase">Evaluation Log Archive</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by score or income..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input pl-9 pr-3.5 py-2 rounded-xl text-xs"
            />
          </div>

          {/* Filter dropdown */}
          <div className="relative flex items-center">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full sm:w-44 glass-input pl-9 pr-3.5 py-2 rounded-xl text-xs appearance-none focus:ring-sky-500/20"
            >
              <option value="All">All Risk Levels</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Moderate">Moderate</option>
              <option value="High Risk">High Risk</option>
              <option value="Very High Risk">Very High Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table grid */}
      {filteredHistory.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/30 dark:border-slate-800/30 text-slate-400 font-bold uppercase">
                <th className="pb-3 font-semibold">ID</th>
                <th className="pb-3 font-semibold">Age</th>
                <th className="pb-3 font-semibold">Annual Income</th>
                <th className="pb-3 font-semibold">DTI Ratio</th>
                <th className="pb-3 font-semibold">Card Util (CUR)</th>
                <th className="pb-3 font-semibold">Credit Score</th>
                <th className="pb-3 font-semibold">Risk Category</th>
                <th className="pb-3 font-semibold">Date Assessed</th>
                <th className="pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/10 dark:divide-slate-800/20 font-medium">
              {filteredHistory.map((r) => (
                <tr key={r.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="py-3.5 text-slate-400 font-bold">#CG-{r.id}</td>
                  <td className="py-3.5">{r.inputs.age} yrs</td>
                  <td className="py-3.5 font-bold">${r.inputs.annual_income.toLocaleString()}</td>
                  <td className="py-3.5 font-bold">{(r.inputs.debt_to_income_ratio * 100).toFixed(0)}%</td>
                  <td className="py-3.5 font-bold">{(r.inputs.credit_utilization_ratio * 100).toFixed(0)}%</td>
                  <td className="py-3.5 font-black text-sky-500">{r.credit_score}</td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadgeColor(r.risk_category)}`}>
                      {r.risk_category}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => onSelectRecord(r)}
                      className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm shadow-sky-500/10 inline-flex items-center gap-1"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      Inspect XAI
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
          <p>No historical records matching filters found.</p>
          <button
            onClick={() => onNavigate('assessment')}
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
          >
            Assess New Profile
          </button>
        </div>
      )}

    </div>
  );
}
