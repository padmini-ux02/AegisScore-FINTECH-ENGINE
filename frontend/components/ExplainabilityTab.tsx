'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, ShieldAlert, Sparkles, TrendingUp, AlertTriangle, Calculator, BookOpen, BarChart3, LineChart } from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';

interface FeatureContribution {
  feature: string;
  value: number;
  contribution: number;
  effect: 'positive' | 'negative';
}

interface ExplainabilityTabProps {
  result: any;
  onNavigate: (tab: string) => void;
}

export default function ExplainabilityTab({ result, onNavigate }: ExplainabilityTabProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!result) {
    return (
      <div className="glass-panel p-10 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md text-center max-w-md mx-auto space-y-4 my-10 animate-in fade-in duration-300">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <Cpu className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm tracking-tight uppercase">No profile assessed</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Explainable AI insights require active credit profiles. Please run an assessment first.
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

  const xai = result.explainable_ai;
  const waterfall: FeatureContribution[] = xai.shap_waterfall || [];
  
  // Sort waterfall features by absolute contribution magnitude
  const sortedWaterfall = [...waterfall].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const baseValue = xai.shap_base_value || 0.15;
  const predValue = xai.shap_prediction_value || result.default_probability;
  const scoreValue = result.credit_score || 600;

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

  // 1. Radar Chart Data representing 5 dimensions of client risk profile
  const radarData = [
    {
      subject: 'Payment History',
      value: Math.round(result.inputs.payment_history_ratio * 100),
    },
    {
      subject: 'Credit Headroom',
      value: Math.round(Math.max(0, (1 - result.inputs.credit_utilization_ratio) * 100)),
    },
    {
      subject: 'Debt Margin',
      value: Math.round(Math.max(0, (1 - result.inputs.debt_to_income_ratio) * 100)),
    },
    {
      subject: 'Reserves Index',
      value: Math.round(Math.min(100, (result.inputs.savings_amount / Math.max(1, result.inputs.existing_loans_balance)) * 100)),
    },
    {
      subject: 'Income capacity',
      value: Math.round(Math.min(100, (result.inputs.annual_income / 120000) * 100)),
    },
  ];

  // 2. Bar Chart Data representing SHAP contributions (percentage basis)
  const shapChartData = sortedWaterfall.map(f => ({
    name: f.feature.replace(/Ratio|Amount|Balance|Payments|Duration|Records/g, ''),
    contribution: Math.round(f.contribution * 1000) / 10,
    effect: f.effect,
  }));

  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/50 p-2.5 rounded-xl shadow-lg text-[10px] font-bold text-white">
          <p>{`${payload[0].name} : ${payload[0].value}/100`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/50 p-2.5 rounded-xl shadow-lg text-[10px] font-bold text-white">
          <p className="text-slate-350">{payload[0].payload.name}</p>
          <p className={val >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
            {val >= 0 ? `+${val}% Default Risk` : `${val}% Risk Reduction`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-xs">
      
      {/* 1. Reason Codes (Mitigating / Risk Factors) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positives */}
        <div className="glass-panel p-6 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md border-l-4 border-l-emerald-500 bg-white/30 dark:bg-slate-900/30">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-extrabold text-sm tracking-tight uppercase text-slate-800 dark:text-white">
              Mitigating Factors (Lowers Risk / Boosts Score)
            </h3>
          </div>
          {xai.approval_reasons && xai.approval_reasons.length > 0 ? (
            <ul className="space-y-2.5">
              {xai.approval_reasons.map((reason: string, idx: number) => (
                <li key={idx} className="text-xs font-medium text-slate-605 dark:text-slate-400 flex items-start gap-2.5 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 font-semibold italic">No significant positive attributes found.</p>
          )}
        </div>

        {/* Negatives */}
        <div className="glass-panel p-6 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md border-l-4 border-l-rose-500 bg-white/30 dark:bg-slate-900/30">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="font-extrabold text-sm tracking-tight uppercase text-slate-800 dark:text-white">
              Risk Factors (Increases Default Risk / Lowers Score)
            </h3>
          </div>
          {xai.rejection_reasons && xai.rejection_reasons.length > 0 ? (
            <ul className="space-y-2.5">
              {xai.rejection_reasons.map((reason: string, idx: number) => (
                <li key={idx} className="text-xs font-medium text-slate-650 flex items-start gap-2.5 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5"></span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 font-semibold italic">No warning risk indicators found.</p>
          )}
        </div>
      </div>

      {/* 2. Interactive Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart: Financial Risk Profile */}
        <div className="glass-panel p-6 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200/30 dark:border-slate-800/30 pb-3">
              <LineChart className="w-5 h-5 text-sky-500" />
              <h3 className="font-extrabold text-sm tracking-tight uppercase">
                Underwriting Risk Profile Index
              </h3>
            </div>
            {isMounted ? (
              <div className="h-[240px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="rgba(148, 163, 184, 0.15)" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: 'rgba(148, 163, 184, 0.8)', fontSize: 10, fontWeight: 700 }} 
                    />
                    <Radar
                      name="Profile Index"
                      dataKey="value"
                      stroke="#38bdf8"
                      fill="#38bdf8"
                      fillOpacity={0.25}
                    />
                    <Tooltip content={<CustomRadarTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-slate-400">Loading graphs...</div>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-semibold text-center border-t border-slate-200/10 pt-2.5">
            Radial chart details the customer's score index (0-100) across 5 core underwriting metrics.
          </p>
        </div>

        {/* Bar Chart: SHAP Feature Contributions */}
        <div className="glass-panel p-6 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200/30 dark:border-slate-800/30 pb-3">
              <BarChart3 className="w-5 h-5 text-sky-500" />
              <h3 className="font-extrabold text-sm tracking-tight uppercase">
                AI Attribution Feature Impact
              </h3>
            </div>
            {isMounted ? (
              <div className="h-[240px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shapChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 15, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.05)" />
                    <XAxis 
                      type="number" 
                      tick={{ fill: 'rgba(148, 163, 184, 0.6)', fontSize: 9 }} 
                      domain={['dataMin - 2', 'dataMax + 2']} 
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fill: 'rgba(148, 163, 184, 0.8)', fontSize: 9, fontWeight: 700 }} 
                      width={80} 
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <ReferenceLine x={0} stroke="rgba(148, 163, 184, 0.3)" strokeWidth={1} />
                    <Bar dataKey="contribution">
                      {shapChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.effect === 'negative' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(16, 185, 129, 0.45)'}
                          stroke={entry.effect === 'negative' ? '#ef4444' : '#10b981'}
                          strokeWidth={1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-slate-400">Loading graphs...</div>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-semibold text-center border-t border-slate-200/10 pt-2.5">
            Green bars indicate variables that reduce risk. Red bars indicate variables that increase risk.
          </p>
        </div>
      </div>

      {/* 3. SHAP Waterfall and LIME Local Explanation Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SHAP Waterfall Detail Chart */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 border-slate-200/50 dark:border-slate-800/40 shadow-md">
          <div className="flex items-center justify-between mb-6 border-b border-slate-200/30 dark:border-slate-800/30 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-500" />
              <h3 className="font-extrabold text-sm tracking-tight uppercase">
                SHAP Local Explanation Waterfall
              </h3>
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Target: Default Probability
            </div>
          </div>

          <div className="space-y-6 py-2 overflow-x-auto">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/20 pb-2">
              <span>Feature Variable [Actual Input Value]</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-rose-500">
                  <span className="w-2.5 h-2.5 bg-rose-500/25 border border-rose-500/20 rounded"></span> Pushes Risk Up
                </span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="w-2.5 h-2.5 bg-emerald-500/25 border border-emerald-500/20 rounded"></span> Pushes Risk Down
                </span>
              </div>
            </div>

            <div className="space-y-4 min-w-[500px]">
              <div className="flex justify-between items-center text-xs font-bold border-b border-dashed border-slate-200/20 dark:border-slate-800/20 pb-1.5">
                <span className="text-slate-400 uppercase tracking-widest text-[9px]">Average Model Expectation E[f(x)]</span>
                <span className="text-slate-400">{(baseValue * 100).toFixed(1)}%</span>
              </div>

              {sortedWaterfall.map((f, idx) => {
                const isBad = f.effect === 'negative';
                const magnitude = Math.abs(f.contribution);
                const widthPixels = Math.min(180, magnitude * 600);
                
                return (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="w-1/2 min-w-0">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block truncate">
                        {f.feature}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                        Value: {typeof f.value === 'number' && f.value < 1.0 && f.value > 0 ? `${(f.value*100).toFixed(0)}%` : f.value.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex-1 flex items-center justify-between gap-4">
                      <div className="flex-1 flex items-center h-5 relative">
                        {isBad ? (
                          <div className="w-1/2 border-l border-slate-300/30 dark:border-slate-700/30 h-full flex items-center pl-0.5">
                            <div 
                              className="bg-rose-500/20 border border-rose-500/30 h-3 rounded transition-all duration-500"
                              style={{ width: `${widthPixels}px` }}
                            ></div>
                          </div>
                        ) : (
                          <div className="w-1/2 border-r border-slate-300/30 dark:border-slate-700/30 h-full flex items-center justify-end pr-0.5">
                            <div 
                              className="bg-emerald-500/20 border border-emerald-500/30 h-3 rounded transition-all duration-500"
                              style={{ width: `${widthPixels}px` }}
                            ></div>
                          </div>
                        )}
                      </div>

                      <span className={`font-bold w-12 text-right shrink-0 ${isBad ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {isBad ? '+' : '-'}{(magnitude * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-between items-center text-xs font-black border-t border-slate-200/50 dark:border-slate-800/50 pt-3.5">
                <span className="uppercase tracking-widest text-[9px]">Final Predicted Default Probability f(x)</span>
                <span className={predValue > 0.35 ? 'text-rose-500' : 'text-sky-500'}>
                  {(predValue * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LIME Local surrogate detail */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-1 border-slate-200/50 dark:border-slate-800/40 shadow-md">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200/30 dark:border-slate-800/30 pb-3">
            <Cpu className="w-5 h-5 text-sky-500" />
            <h3 className="font-extrabold text-sm tracking-tight uppercase">
              LIME Surrogate Model
            </h3>
          </div>

          <div className="space-y-4">
            {xai.lime_explanations && xai.lime_explanations.length > 0 ? (
              xai.lime_explanations.slice(0, 5).map((l: any, idx: number) => {
                const isBad = l.effect === 'negative';
                return (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200/20 dark:border-slate-800/30 bg-slate-500/5 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="truncate">{l.feature}</span>
                      <span className={isBad ? 'text-rose-500' : 'text-emerald-500'}>
                        {isBad ? '+' : '-'}{(Math.abs(l.contribution) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                      {isBad 
                        ? `Input value of ${l.value.toLocaleString()} increases default risk parameter.` 
                        : `Input value of ${l.value.toLocaleString()} serves as a key risk mitigation factor.`
                      }
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 italic">No LIME calculations present.</p>
            )}
          </div>

          <div className="bg-sky-500/5 border border-sky-500/10 p-4 rounded-xl text-[10px] font-medium leading-relaxed flex items-start gap-2 text-sky-600 dark:text-sky-400 mt-6">
            <Sparkles className="w-4.5 h-4.5 shrink-0" />
            <span>LIME builds a local surrogate linear model around this instance, whereas SHAP measures global game-theoretic Shapley additions.</span>
          </div>
        </div>
      </div>

      {/* 4. Underwriting Scorecard Calculations Walkthrough */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Step-by-Step scorecard breakdown */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 border-slate-200/50 dark:border-slate-800/40 shadow-md space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200/30 dark:border-slate-800/30 pb-3">
            <Calculator className="w-5 h-5 text-sky-500" />
            <h3 className="font-extrabold text-sm tracking-tight uppercase">Credit Score Calculation Formula</h3>
          </div>

          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
            Your Credit Score (ranging from **300 to 850**) is calculated dynamically on our platform using a structured, additive credit scorecard. We start at a standard **baseline of 600**, and apply additions (bonuses) and subtractions (penalties) based on your demographic and financial metrics:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Additions & Bonuses
              </h4>
              <ul className="space-y-1.5 text-[11px] leading-relaxed font-medium">
                <li>• **On-Time Payments:** Up to **+130 points** for a payment history ratio close to 100%.</li>
                <li>• **Savings & Investments:** Robust reserves provide a positive adjustment.</li>
                <li>• **Demographic Stability:** Age and employment duration contribute up to **+40 points**.</li>
                <li>• **Annual Salary:** High income adds up to **+50 points**.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-2">
              <h4 className="font-bold text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Subtractions & Penalties
              </h4>
              <ul className="space-y-1.5 text-[11px] leading-relaxed font-medium">
                <li>• **Late/Missed Payments:** Subtracts **45 points** per missed payment.</li>
                <li>• **Card Utilization:** Subtracts up to **150 points** if credit limits are maxed out.</li>
                <li>• **DTI Ratio:** Subtracts up to **150 points** for excessive monthly debt loads.</li>
                <li>• **Active Loans:** Subtracts **15 points** for each active loan.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Live scorecard trace calculation */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-1 border-slate-200/50 dark:border-slate-800/40 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-200/30 dark:border-slate-800/30 pb-3">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <h3 className="font-extrabold text-sm tracking-tight uppercase">Live Scorecard Verification</h3>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-200/30 dark:border-slate-800/30 text-slate-400 uppercase">
                    <th className="pb-2">Factor Category</th>
                    <th className="pb-2 text-right">Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/10 dark:divide-slate-800/20 font-medium">
                  <tr>
                    <td className="py-2.5">Baseline Score</td>
                    <td className="py-2.5 text-right font-bold">600</td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Credit Utilization (CUR)</td>
                    <td className={`py-2.5 text-right font-bold ${result.inputs.credit_utilization_ratio > 0.3 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {result.inputs.credit_utilization_ratio > 0.3 ? `-${(result.inputs.credit_utilization_ratio * 150).toFixed(0)}` : `-${(result.inputs.credit_utilization_ratio * 100).toFixed(0)}`}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Debt-to-Income (DTI)</td>
                    <td className="py-2.5 text-right font-bold text-rose-500">
                      -{Math.round(result.inputs.debt_to_income_ratio * 150)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Missed Payments</td>
                    <td className={`py-2.5 text-right font-bold ${result.inputs.missed_payments > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      -{result.inputs.missed_payments * 45}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Payment History Ratio</td>
                    <td className="py-2.5 text-right font-bold text-emerald-500">
                      +{Math.round((result.inputs.payment_history_ratio - 0.85) * 130)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">Computed Score</td>
                    <td className={`py-2.5 text-right font-black text-sm ${getScoreColor(scoreValue)}`}>
                      {scoreValue}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
