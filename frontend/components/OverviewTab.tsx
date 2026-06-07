'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Percent, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { api } from '../lib/api';

interface OverviewTabProps {
  onNavigate: (tab: string) => void;
  onSelectRecord: (id: number) => void;
  triggerRefresh: boolean;
}

export default function OverviewTab({ 
  onNavigate, 
  onSelectRecord,
  triggerRefresh 
}: OverviewTabProps) {
  const [stats, setStats] = useState<any>({
    total_applications: 0,
    average_credit_score: 0,
    average_approval_rate: 0,
    average_default_rate: 0,
    risk_distribution: {
      Excellent: 0, Good: 0, Moderate: 0, 'High Risk': 0, 'Very High Risk': 0
    },
    recent_activity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      setIsLoading(true);
      try {
        const data = await api.get<any>('/analytics/overview');
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOverview();
  }, [triggerRefresh]);

  const cards = [
    { 
      name: 'Total Evaluations', 
      value: stats.total_applications, 
      desc: 'Cumulative profile checks', 
      icon: Users, 
      color: 'text-sky-500 bg-sky-500/10' 
    },
    { 
      name: 'Avg. Credit Score', 
      value: stats.average_credit_score, 
      desc: 'Standard score (300-850)', 
      icon: TrendingUp, 
      color: 'text-emerald-500 bg-emerald-500/10' 
    },
    { 
      name: 'Approval Probability', 
      value: `${(stats.average_approval_rate * 100).toFixed(1)}%`, 
      desc: 'Average model decision', 
      icon: Percent, 
      color: 'text-teal-500 bg-teal-500/10' 
    },
    { 
      name: 'Mean Default Risk', 
      value: `${(stats.average_default_rate * 100).toFixed(1)}%`, 
      desc: 'Mean probability score', 
      icon: AlertTriangle, 
      color: 'text-amber-500 bg-amber-500/10' 
    },
  ];

  const getRiskColor = (cat: string) => {
    switch (cat) {
      case 'Excellent': return 'bg-emerald-500 text-emerald-700 dark:text-emerald-300';
      case 'Good': return 'bg-green-400 text-green-700 dark:text-green-300';
      case 'Moderate': return 'bg-amber-400 text-amber-700 dark:text-amber-300';
      case 'High Risk': return 'bg-orange-500 text-orange-700 dark:text-orange-300';
      case 'Very High Risk': return 'bg-rose-500 text-rose-700 dark:text-rose-300';
      default: return 'bg-slate-400 text-slate-700';
    }
  };

  const getRiskBadgeColor = (cat: string) => {
    switch (cat) {
      case 'Excellent': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Good': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'Moderate': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'High Risk': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'Very High Risk': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Calculate percentage sizes for progress bars
  const totalRiskCount = Object.values(stats.risk_distribution).reduce((a: any, b: any) => a + b, 0) as number || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Premium Fintech Command Center Banner */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-700 dark:to-indigo-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent)]"></div>
        
        {/* Left Side: Headline & Call to Action */}
        <div className="space-y-4 relative z-10 text-left flex-1">
          <span className="bg-white/20 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full w-max inline-block">
            System Active
          </span>
          <div className="space-y-1.5">
            <h2 className="text-lg md:text-xl font-extrabold tracking-tight">
              AegisScore Underwriting Command Center
            </h2>
            <p className="text-xs text-sky-100 max-w-xl font-medium leading-relaxed">
              Analyze creditworthiness, evaluate default risk probabilities, and interpret machine learning decisions using explainable AI. Use the sliders in assessment mode to perform real-time what-if simulations.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('assessment')}
            className="bg-white hover:bg-sky-50 text-sky-600 dark:text-sky-950 font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 group cursor-pointer w-max"
          >
            <span>Run New Assessment</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Right Side: Generated Modern Fintech Banner Illustration */}
        <div className="relative z-10 w-44 h-28 hidden md:block shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/fintech_hero_banner.png" 
            alt="Fintech Assessment Platform" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* 4 Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-panel glass-panel-hover p-6 rounded-2xl flex items-center justify-between border-slate-200/50 dark:border-slate-800/40 shadow-md">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.name}</p>
                <h3 className="text-2xl font-black mt-2 tracking-tight">{card.value}</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{card.desc}</p>
              </div>
              <div className={`p-3.5 rounded-xl ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Category Distribution Widget */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-1 border-slate-200/50 dark:border-slate-800/40 shadow-md">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-sky-500" />
            <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">
              Portfolio Risk Distribution
            </h3>
          </div>

          <div className="space-y-4">
            {Object.keys(stats.risk_distribution).map((cat) => {
              const val = stats.risk_distribution[cat] || 0;
              const pct = (val / totalRiskCount) * 100;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">{cat}</span>
                    <span className="font-bold">{val} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getRiskColor(cat).split(' ')[0]}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/30 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Analyze detailed features</p>
            <button 
              onClick={() => onNavigate('analytics')} 
              className="text-xs font-bold text-sky-500 hover:text-sky-600 flex items-center gap-1 group transition-colors"
            >
              Analytics Tab 
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Recent Evaluations Table */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 border-slate-200/50 dark:border-slate-800/40 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <CalendarDays className="w-5 h-5 text-sky-500" />
              <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">
                Recent Risk Assessments
              </h3>
            </div>

            {stats.recent_activity && stats.recent_activity.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/30 dark:border-slate-800/30 text-slate-400 font-bold uppercase">
                      <th className="pb-3 font-semibold">Age</th>
                      <th className="pb-3 font-semibold">Annual Income</th>
                      <th className="pb-3 font-semibold">Credit Score</th>
                      <th className="pb-3 font-semibold">Risk Category</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/10 dark:divide-slate-800/20 font-medium">
                    {stats.recent_activity.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-500/5 transition-colors">
                        <td className="py-3.5">{r.age} yrs</td>
                        <td className="py-3.5 font-bold">${r.income.toLocaleString()}</td>
                        <td className="py-3.5 font-black text-sky-500">{r.credit_score}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadgeColor(r.risk_category)}`}>
                            {r.risk_category}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-500 dark:text-slate-400">{r.created_at}</td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => onSelectRecord(r.id)}
                            className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm shadow-sky-500/10"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
                <p>No credit assessments saved yet.</p>
                <button
                  onClick={() => onNavigate('assessment')}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md"
                >
                  Run First Assessment
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/30 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">View full archives</p>
            <button 
              onClick={() => onNavigate('history')} 
              className="text-xs font-bold text-sky-500 hover:text-sky-600 flex items-center gap-1 group transition-colors"
            >
              History Tab 
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
