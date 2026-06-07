'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileDown, 
  FileText, 
  Table, 
  FileSpreadsheet, 
  ShieldCheck, 
  Download, 
  Activity,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip 
} from 'recharts';

interface ReportsTabProps {
  result: any;
  onNavigate: (tab: string) => void;
  user?: any;
}

export default function ReportsTab({ result, onNavigate, user }: ReportsTabProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!result) {
    return (
      <div className="glass-panel p-10 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md text-center max-w-md mx-auto space-y-4 my-10 animate-in fade-in duration-300">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <FileDown className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm tracking-tight uppercase">No report ready</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Report downloads are linked to assessment instances. Please complete an evaluation first.
          </p>
        </div>
        <button
          onClick={() => onNavigate('assessment')}
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md"
        >
          Go to Assessment Form
        </button>
      </div>
    );
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const recordId = result.id || 1;

  const score = result.credit_score || 600;
  const approvalPercent = Math.round((result.approval_probability || 0.5) * 100);
  const defaultPercent = Math.round((result.default_probability || 0.5) * 100);



  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-emerald-500';
    if (score >= 740) return 'text-green-500';
    if (score >= 670) return 'text-amber-500';
    if (score >= 580) return 'text-orange-500';
    return 'text-rose-500';
  };

  const getScoreStrokeColor = (score: number) => {
    if (score >= 800) return '#10b981'; // emerald
    if (score >= 740) return '#22c55e'; // green
    if (score >= 670) return '#f59e0b'; // amber
    if (score >= 580) return '#f97316'; // orange
    return '#ef4444'; // rose
  };

  const getScoreText = (score: number) => {
    if (score >= 800) return 'Exceptional';
    if (score >= 740) return 'Very Good';
    if (score >= 670) return 'Good';
    if (score >= 580) return 'Fair';
    return 'Poor';
  };

  const gaugeData = [
    { name: 'Score', value: score - 300 },
    { name: 'Remaining', value: 850 - score }
  ];

  const probData = [
    { name: 'Approval Probability', value: approvalPercent, fill: '#10b981' },
    { name: 'Default Probability', value: defaultPercent, fill: '#ef4444' }
  ];

  const CustomDonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value, fill } = payload[0];
      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/50 p-2.5 rounded-xl shadow-lg text-[10px] font-bold text-white">
          <p style={{ color: fill }} className="capitalize font-extrabold">{name}</p>
          <p className="text-slate-200 mt-0.5">{value}% probability</p>
        </div>
      );
    }
    return null;
  };

  const formats = [
    {
      name: 'PDF Assessment Summary',
      desc: 'Publication-quality document containing score graphics, demographics, credit history, reason codes, and personalized advisor recommendations.',
      ext: '.pdf',
      mime: 'PDF Document',
      icon: FileText,
      color: 'border-rose-500/10 text-rose-500 hover:bg-rose-500/5',
      downloadUrl: `${API_BASE_URL}/reports/download/pdf/${recordId}`
    },
    {
      name: 'Excel Risk Audit Sheet',
      desc: 'Tabular layout of demographics, financial ratios (DTI, CUR), savings balances, and scoring targets formatted with color themes and auto-fit grids.',
      ext: '.xlsx',
      mime: 'Excel Sheet',
      icon: FileSpreadsheet,
      color: 'border-emerald-500/10 text-emerald-500 hover:bg-emerald-500/5',
      downloadUrl: `${API_BASE_URL}/reports/download/excel/${recordId}`
    },
    {
      name: 'Standard CSV Ledger Row',
      desc: 'Flat raw comma-separated log containing all profile metrics and output probabilities suitable for ingestion into database warehouses.',
      ext: '.csv',
      mime: 'Comma Separated Text',
      icon: Table,
      color: 'border-sky-500/10 text-sky-500 hover:bg-sky-500/5',
      downloadUrl: `${API_BASE_URL}/reports/download/csv/${recordId}`
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      
      {/* Download Action Cards (2 Columns) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-6">
          {formats.map((format, idx) => {
            const Icon = format.icon;
            return (
              <div 
                key={idx} 
                className={`glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between border gap-4 transition-all duration-300 hover:shadow-md ${format.color.split(' ')[0]} ${format.color.split(' ')[2]}`}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 dark:bg-slate-800/80 p-3.5 rounded-xl text-slate-700 dark:text-slate-200 shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                      {format.name}
                      <span className="text-[9px] uppercase font-black text-slate-400 border border-slate-200/50 dark:border-slate-800/50 px-1.5 py-0.5 rounded">
                        {format.ext}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-lg font-medium">
                      {format.desc}
                    </p>
                  </div>
                </div>
                <a
                  href={format.downloadUrl}
                  download
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 self-start md:self-auto"
                >
                  <Download className="w-4.5 h-4.5" />
                  Download
                </a>
              </div>
            );
          })}
        </div>

        {/* Visual Analytics Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-md space-y-5 bg-white/30 dark:bg-slate-900/30">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-200/30 dark:border-slate-800/30 pb-3">
            <Activity className="w-5 h-5 text-sky-500" />
            <h3 className="font-extrabold text-sm tracking-tight uppercase">
              Estimated Assessment Visual Analytics
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gauge Chart */}
            <div className="flex flex-col items-center justify-center relative bg-slate-500/5 p-4 rounded-xl border border-slate-200/10 min-h-[220px]">
              <h4 className="text-xs font-black uppercase text-slate-450 mb-2">Estimated Score Dial</h4>
              {isMounted ? (
                <div className="relative h-[160px] w-full flex items-center justify-center">
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={gaugeData}
                          cx="50%"
                          cy="90%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={0}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell key="cell-0" fill={getScoreStrokeColor(score)} />
                          <Cell key="cell-1" fill="rgba(148, 163, 184, 0.1)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute bottom-2 text-center">
                    <div className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
                      {score}
                    </div>
                    <div className={`text-[10px] uppercase font-black tracking-wider ${getScoreColor(score)}`}>
                      {getScoreText(score)}
                    </div>
                    <div className="text-[9px] text-slate-400 font-semibold mt-0.5">
                      Scale: 300 - 850
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-slate-400">Loading dial...</div>
              )}
            </div>

            {/* Donut Chart */}
            <div className="flex flex-col items-center justify-center relative bg-slate-500/5 p-4 rounded-xl border border-slate-200/10 min-h-[220px]">
              <h4 className="text-xs font-black uppercase text-slate-450 mb-2">Risk vs Approval Balance</h4>
              {isMounted ? (
                <div className="relative h-[160px] w-full flex items-center justify-center">
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={probData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell key="cell-0" fill="#10b981" />
                          <Cell key="cell-1" fill="#ef4444" />
                        </Pie>
                        <Tooltip content={<CustomDonutTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute text-center">
                    <div className="text-2xl font-black tracking-tight text-emerald-500">
                      {approvalPercent}%
                    </div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                      Approval Rating
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-slate-400">Loading chart...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Summary Details Card (1 Column) */}
      <div className="lg:col-span-1">
        <div className="glass-panel p-6 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-sky-500" />
            <h3 className="font-extrabold text-sm tracking-tight uppercase">Document Metadata</h3>
          </div>

          <div className="space-y-3.5 text-xs font-semibold">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/20">
              <span className="text-slate-500">Record Reference ID</span>
              <span className="font-bold">#CG-{recordId}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/20">
              <span className="text-slate-500">Subject Credit Score</span>
              <span className="font-black text-sky-500">{result.credit_score}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/20">
              <span className="text-slate-500">Assigned Risk Band</span>
              <span className="font-bold capitalize">{result.risk_category}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/20">
              <span className="text-slate-500">Assessment Time</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {new Date(result.created_at).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Status</span>
              <span className="text-emerald-500 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                Certified Secure
              </span>
            </div>
          </div>

          <div className="bg-sky-500/5 border border-sky-500/10 p-4 rounded-xl text-[9px] leading-relaxed font-semibold text-sky-600 dark:text-sky-400">
            <strong>Security Notice:</strong> AegisScore reports employ SHA-256 integrity hash verification and SQLite encryption logs to protect customer financial data vectors.
          </div>
        </div>


      </div>

    </div>
  );
}
