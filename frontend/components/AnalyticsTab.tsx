'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, LineChart, Table2, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';

export default function AnalyticsTab() {
  const [modelData, setModelData] = useState<any>(null);
  const [importance, setImportance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('CatBoost');
  const [activeChart, setActiveChart] = useState<'roc' | 'pr' | 'confusion'>('roc');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const comp = await api.get<any>('/analytics/model-comparison');
        const imp = await api.get<any[]>('/analytics/feature-importance');
        setModelData(comp);
        setImportance(imp);
        if (comp && comp.best_model) {
          setSelectedModel(comp.best_model);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading || !modelData) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const { metrics, curves } = modelData;
  const currentCurve = curves[selectedModel] || curves['CatBoost'];
  
  // Custom SVG path generator for ROC/PR curves
  const generateSvgPath = (points: { x: number[]; y: number[] }) => {
    if (!points || !points.x || points.x.length === 0) return '';
    const width = 300;
    const height = 300;
    
    return points.x.map((xVal, idx) => {
      const yVal = points.y[idx];
      // map standard 0.0-1.0 coordinate system to 300x300 SVG coordinate system
      // SVG (0,0) is top-left, so Y needs to be inverted: SVG Y = height - (yVal * height)
      const svgX = xVal * width;
      const svgY = height - (yVal * height);
      return `${idx === 0 ? 'M' : 'L'} ${svgX} ${svgY}`;
    }).join(' ');
  };

  const rocPath = currentCurve ? generateSvgPath({ x: currentCurve.roc.fpr, y: currentCurve.roc.tpr }) : '';
  const prPath = currentCurve ? generateSvgPath({ x: currentCurve.pr.recall, y: currentCurve.pr.precision }) : '';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Model Comparison Metrics Table */}
      <div className="glass-panel p-6 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Table2 className="w-5 h-5 text-sky-500" />
          <h3 className="font-extrabold text-sm tracking-tight uppercase">ML Algorithms Performance Benchmarking</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/30 dark:border-slate-800/30 text-slate-400 font-bold uppercase">
                <th className="pb-3 font-semibold">Model Name</th>
                <th className="pb-3 font-semibold">Accuracy</th>
                <th className="pb-3 font-semibold">Precision</th>
                <th className="pb-3 font-semibold">Recall</th>
                <th className="pb-3 font-semibold">F1-Score</th>
                <th className="pb-3 font-semibold">ROC-AUC</th>
                <th className="pb-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/10 dark:divide-slate-800/20 font-medium">
              {Object.keys(metrics).map((m) => {
                const isBest = m === modelData.best_model;
                return (
                  <tr key={m} className={`hover:bg-slate-500/5 transition-colors ${isBest ? 'bg-sky-500/5 text-sky-500' : ''}`}>
                    <td className="py-3.5 font-bold flex items-center gap-1.5">
                      {m}
                      {isBest && (
                        <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md">
                          Best Model
                        </span>
                      )}
                    </td>
                    <td className="py-3.5">{(metrics[m].Accuracy * 100).toFixed(1)}%</td>
                    <td className="py-3.5">{(metrics[m].Precision * 100).toFixed(1)}%</td>
                    <td className="py-3.5">{(metrics[m].Recall * 100).toFixed(1)}%</td>
                    <td className="py-3.5">{(metrics[m].F1_Score || metrics[m]['F1-Score'] * 100).toFixed(1)}%</td>
                    <td className="py-3.5 font-black">{metrics[m]['ROC-AUC'].toFixed(3)}</td>
                    <td className="py-3.5 text-right">
                      <button 
                        onClick={() => setSelectedModel(m)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors border ${
                          selectedModel === m 
                            ? 'bg-sky-500 text-white border-sky-500' 
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        Select Graph
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 2. Visualizations Panel (ROC, PR, Confusion Matrix) */}
        <div className="glass-panel p-6 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-sky-500" />
                <h3 className="font-extrabold text-sm tracking-tight uppercase">
                  Model Visualizations ({selectedModel})
                </h3>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-xl gap-1 text-[10px] font-bold border border-slate-200/20 dark:border-slate-800/20">
                {(['roc', 'pr', 'confusion'] as const).map((chart) => (
                  <button
                    key={chart}
                    onClick={() => setActiveChart(chart)}
                    className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors ${
                      activeChart === chart
                        ? 'bg-white dark:bg-slate-800 text-sky-500 shadow-sm'
                        : 'text-slate-400 hover:text-slate-650'
                    }`}
                  >
                    {chart === 'roc' ? 'ROC Curve' : chart === 'pr' ? 'PR Curve' : 'Confusion Matrix'}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom SVG Line Chart */}
            {(activeChart === 'roc' || activeChart === 'pr') && (
              <div className="flex flex-col items-center py-4">
                <div className="relative w-[320px] h-[320px] bg-slate-500/5 rounded-xl border border-slate-200/10 p-2 flex items-center justify-center">
                  {/* Axis titles */}
                  <span className="absolute bottom-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    {activeChart === 'roc' ? 'False Positive Rate (FPR)' : 'Recall'}
                  </span>
                  <span className="absolute left-1 top-1/2 -rotate-90 origin-left -translate-y-1/2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    {activeChart === 'roc' ? 'True Positive Rate (TPR)' : 'Precision'}
                  </span>
                  
                  {/* SVG Canvas */}
                  <svg className="w-[300px] h-[300px] overflow-visible">
                    {/* diagonal baseline reference */}
                    {activeChart === 'roc' && (
                      <line x1="0" y1="300" x2="300" y2="0" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" strokeDasharray="4,4" />
                    )}
                    
                    {/* Grid ticks */}
                    <line x1="0" y1="75" x2="300" y2="75" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" />
                    <line x1="0" y1="150" x2="300" y2="150" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" />
                    <line x1="0" y1="225" x2="300" y2="225" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" />
                    <line x1="75" y1="0" x2="75" y2="300" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" />
                    <line x1="150" y1="0" x2="150" y2="300" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" />
                    <line x1="225" y1="0" x2="225" y2="300" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" />

                    {/* Chart Path */}
                    <path
                      d={activeChart === 'roc' ? rocPath : prPath}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex gap-4 mt-3 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-sky-500 inline-block"></span> Model Curve
                  </span>
                  {activeChart === 'roc' && (
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400 inline-block"></span> Baseline Random
                    </span>
                  )}
                  <span className="text-sky-600 dark:text-sky-400">
                    AUC = {metrics[selectedModel]['ROC-AUC'].toFixed(3)}
                  </span>
                </div>
              </div>
            )}

            {/* Confusion Matrix Heatmap */}
            {activeChart === 'confusion' && (
              <div className="flex flex-col items-center py-4">
                <div className="grid grid-cols-2 gap-2.5 w-[260px]">
                  {/* True Negatives */}
                  <div className="bg-sky-500/10 dark:bg-sky-500/5 border border-sky-500/20 p-5 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">True Negatives (TN)</span>
                    <h4 className="text-xl font-black text-sky-500">{currentCurve.confusion_matrix[0][0]}</h4>
                    <span className="text-[8px] font-bold uppercase text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Correct</span>
                  </div>
                  {/* False Positives */}
                  <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">False Positives (FP)</span>
                    <h4 className="text-xl font-black text-rose-500">{currentCurve.confusion_matrix[0][1]}</h4>
                    <span className="text-[8px] font-bold uppercase text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">Error</span>
                  </div>
                  {/* False Negatives */}
                  <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">False Negatives (FN)</span>
                    <h4 className="text-xl font-black text-rose-500">{currentCurve.confusion_matrix[1][0]}</h4>
                    <span className="text-[8px] font-bold uppercase text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">Error</span>
                  </div>
                  {/* True Positives */}
                  <div className="bg-sky-500/10 dark:bg-sky-500/5 border border-sky-500/20 p-5 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">True Positives (TP)</span>
                    <h4 className="text-xl font-black text-sky-500">{currentCurve.confusion_matrix[1][1]}</h4>
                    <span className="text-[8px] font-bold uppercase text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Correct</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-center font-semibold mt-4">
                  Matrix depicts predictions versus actual ground truths of loan defaults.
                </div>
              </div>
            )}
          </div>
          <div className="bg-sky-500/5 border border-sky-500/10 p-4 rounded-xl text-[10px] font-medium leading-relaxed flex items-start gap-2 text-sky-600 dark:text-sky-400">
            <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
            <span>Under production environment, CatBoost and LightGBM provide the highest ensemble classification precision, whereas random forest handles credit score regression coefficients.</span>
          </div>
        </div>

        {/* 3. Global Feature Importance */}
        <div className="glass-panel p-6 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-sky-500" />
            <h3 className="font-extrabold text-sm tracking-tight uppercase">
              Global Feature Importance
            </h3>
          </div>

          <div className="space-y-4">
            {importance.map(([feat, imp]) => {
              const pct = imp * 100;
              return (
                <div key={feat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400 font-bold">{feat}</span>
                    <span className="font-bold text-sky-500">{(imp * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct * 3}%` }} // Scale factor for visual clarity
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
