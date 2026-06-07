'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  HelpCircle, 
  Sparkles, 
  Calculator, 
  CheckCircle2, 
  XCircle,
  FileText,
  Sliders,
  TrendingDown
} from 'lucide-react';
import { api } from '../lib/api';

interface AssessmentTabProps {
  onAssessmentCompleted: (result: any) => void;
  onNavigate: (tab: string) => void;
  lastResult: any;
}

export default function AssessmentTab({ 
  onAssessmentCompleted, 
  onNavigate,
  lastResult 
}: AssessmentTabProps) {
  // 1. Initial State Definition
  const initialForm = {
    age: 30,
    gender: 'Male',
    marital_status: 'Single',
    employment_type: 'Salaried',
    employment_duration: 3.5,
    education_level: 'Bachelor',
    annual_income: 65000.0,
    monthly_income: 5416.0,
    existing_loans_balance: 10000.0,
    debt_to_income_ratio: 0.28,
    credit_utilization_ratio: 0.22,
    savings_amount: 8000.0,
    investments: 12000.0,
    number_of_active_loans: 1,
    previous_loan_records: 2,
    missed_payments: 0,
    payment_history_ratio: 1.0
  };

  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<any>(lastResult);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'demographics' | 'financials' | 'credit'>('demographics');

  // 2. Form Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert to number if appropriate
    let parsedValue: any = value;
    if (e.target.type === 'number' || name === 'employment_duration' || name === 'debt_to_income_ratio' || name === 'credit_utilization_ratio' || name === 'payment_history_ratio') {
      parsedValue = parseFloat(value);
      if (isNaN(parsedValue)) parsedValue = '';
    }

    setForm(prev => {
      const updated = { ...prev, [name]: parsedValue };
      // Keep annual & monthly income roughly in sync if one changes
      if (name === 'annual_income' && parsedValue) {
        updated.monthly_income = Math.round((parsedValue / 12) * 100) / 100;
      } else if (name === 'monthly_income' && parsedValue) {
        updated.annual_income = Math.round(parsedValue * 12 * 100) / 100;
      }
      return updated;
    });
  };

  // 3. Score Prediction Trigger
  const runPrediction = async (currentFormState = form, silence = false) => {
    if (!silence) setIsLoading(true);
    try {
      // Validate inputs
      const payload = { ...currentFormState };
      // Fallback defaults for empty values
      payload.age = payload.age || 18;
      payload.employment_duration = payload.employment_duration || 0;
      payload.annual_income = payload.annual_income || 0;
      payload.monthly_income = payload.monthly_income || 0;
      payload.existing_loans_balance = payload.existing_loans_balance || 0;
      payload.debt_to_income_ratio = payload.debt_to_income_ratio || 0;
      payload.credit_utilization_ratio = payload.credit_utilization_ratio || 0;
      payload.savings_amount = payload.savings_amount || 0;
      payload.investments = payload.investments || 0;
      payload.number_of_active_loans = payload.number_of_active_loans || 0;
      payload.previous_loan_records = payload.previous_loan_records || 0;
      payload.missed_payments = payload.missed_payments || 0;
      payload.payment_history_ratio = payload.payment_history_ratio || 1.0;

      const res = await api.post<any>('/predict', payload);
      setResult(res);
      onAssessmentCompleted(res);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silence) setIsLoading(false);
    }
  };

  // 4. Debounced Simulator updates (What-if analysis)
  const [debouncedFormState, setDebouncedFormState] = useState(form);
  
  useEffect(() => {
    if (!isSimulatorActive) return;
    const timer = setTimeout(() => {
      runPrediction(form, true);
    }, 180);
    return () => clearTimeout(timer);
  }, [form, isSimulatorActive]);

  // Handle manual simulator slider changes
  const handleSliderChange = (name: string, value: number) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

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

  // Radial progress calculations
  const calculateStrokeDash = (score: number) => {
    const min = 300;
    const max = 850;
    const pct = (score - min) / (max - min);
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    return {
      strokeDasharray: circumference,
      strokeDashoffset: circumference - (pct * circumference)
    };
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
      
      {/* LEFT 2 COLUMNS: Profile Input Form & Simulator Mode */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Simulator mode switch toggle */}
        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-slate-200/50 dark:border-slate-800/40 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isSimulatorActive ? 'bg-sky-500 text-white' : 'bg-slate-100/80 dark:bg-slate-800 text-slate-500'}`}>
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-tight">Loan Approval Simulator</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Toggle what-if interactive mode to dynamically updates scores as you drag sliders.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsSimulatorActive(!isSimulatorActive);
              if (!isSimulatorActive) {
                runPrediction(form, true); // trigger initial prediction
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isSimulatorActive 
                ? 'bg-sky-500 text-white shadow-sky-500/25' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {isSimulatorActive ? 'Simulator Active' : 'Activate Simulator'}
          </button>
        </div>

        {isSimulatorActive ? (
          /* --- INTERACTIVE SIMULATOR SLIDERS --- */
          <div className="glass-panel p-6 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-sky-500 animate-pulse" />
              <h3 className="font-extrabold text-sm tracking-tight uppercase">What-if Simulator Controls</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slider 1: Monthly Income */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Monthly Income</span>
                  <span className="text-sky-500">${form.monthly_income.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="40000"
                  step="250"
                  value={form.monthly_income}
                  onChange={(e) => handleSliderChange('monthly_income', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 h-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 cursor-pointer"
                />
                <span className="text-[9px] text-slate-400 block font-semibold">Base range: $1k to $40k per month</span>
              </div>

              {/* Slider 2: Credit Utilization (CUR) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Credit Card Utilization</span>
                  <span className={form.credit_utilization_ratio > 0.4 ? 'text-rose-500' : 'text-sky-500'}>
                    {(form.credit_utilization_ratio * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.02"
                  value={form.credit_utilization_ratio}
                  onChange={(e) => handleSliderChange('credit_utilization_ratio', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 h-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 cursor-pointer"
                />
                <span className="text-[9px] text-slate-400 block font-semibold">Lower utilization boosts credit score</span>
              </div>

              {/* Slider 3: Debt-to-Income (DTI) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Debt-to-Income (DTI)</span>
                  <span className={form.debt_to_income_ratio > 0.36 ? 'text-rose-500' : 'text-sky-500'}>
                    {(form.debt_to_income_ratio * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.2"
                  step="0.02"
                  value={form.debt_to_income_ratio}
                  onChange={(e) => handleSliderChange('debt_to_income_ratio', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 h-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 cursor-pointer"
                />
                <span className="text-[9px] text-slate-400 block font-semibold">Ratio of monthly loan obligations to income</span>
              </div>

              {/* Slider 4: Savings Amount */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Savings Amount</span>
                  <span className="text-sky-500">${form.savings_amount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="1000"
                  value={form.savings_amount}
                  onChange={(e) => handleSliderChange('savings_amount', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 h-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 cursor-pointer"
                />
                <span className="text-[9px] text-slate-400 block font-semibold">Cash buffer impacts approval rating</span>
              </div>

              {/* Slider 5: Missed Payments */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Missed Payments</span>
                  <span className={form.missed_payments > 0 ? 'text-rose-500 font-extrabold' : 'text-sky-500'}>
                    {form.missed_payments} times
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="1"
                  value={form.missed_payments}
                  onChange={(e) => handleSliderChange('missed_payments', parseInt(e.target.value))}
                  className="w-full accent-sky-500 h-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 cursor-pointer"
                />
                <span className="text-[9px] text-slate-400 block font-semibold">Late payments have high risk penalty</span>
              </div>

              {/* Slider 6: Payment History Ratio */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Payment History Ratio</span>
                  <span className="text-sky-500">{(form.payment_history_ratio * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.01"
                  value={form.payment_history_ratio}
                  onChange={(e) => handleSliderChange('payment_history_ratio', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 h-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 cursor-pointer"
                />
                <span className="text-[9px] text-slate-400 block font-semibold">Ratio of prompt on-time account settlements</span>
              </div>
            </div>
            
            <div className="bg-sky-500/5 dark:bg-sky-500/5 p-4 rounded-xl border border-sky-500/10 text-[10px] font-semibold text-sky-600 dark:text-sky-400 text-center flex items-center justify-center gap-2">
              <Sparkles className="w-4.5 h-4.5 shrink-0" />
              <span>Model predictions recalculating dynamically. Change sliders to see direct creditworthiness feedback.</span>
            </div>
          </div>
        ) : (
          /* --- FULL ASSESSMENT INPUT FORM --- */
          <div className="glass-panel rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md overflow-hidden">
            {/* Form Visual Banner */}
            <div className="relative h-28 w-full bg-slate-950 overflow-hidden flex items-end p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/credit_form_header.png" alt="Secure Verification" className="absolute inset-0 w-full h-full object-cover opacity-45" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
              <div className="relative z-10 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <h4 className="text-white text-xs font-black uppercase tracking-widest text-left">Underwriting Verification Portal</h4>
              </div>
            </div>
            <div className="p-6">
              {/* Tabs inside Form for Demographics, Financials, Credit History */}
              <div className="flex border-b border-slate-200/30 dark:border-slate-800/30 mb-6 gap-2">
              {(['demographics', 'financials', 'credit'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFormTab(tab)}
                  className={`pb-3.5 px-4 text-xs font-bold capitalize transition-all border-b-2 -mb-[1px] ${
                    activeFormTab === tab 
                      ? 'border-sky-500 text-sky-500' 
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-white'
                  }`}
                >
                  {tab === 'credit' ? 'Credit History' : tab}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); runPrediction(); }} className="space-y-6">
              
              {activeFormTab === 'demographics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Customer Age</label>
                    <input
                      type="number"
                      name="age"
                      value={form.age}
                      onChange={handleInputChange}
                      min="18" max="100"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Gender</label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleInputChange}
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Marital Status</label>
                    <select
                      name="marital_status"
                      value={form.marital_status}
                      onChange={handleInputChange}
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Employment Type</label>
                    <select
                      name="employment_type"
                      value={form.employment_type}
                      onChange={handleInputChange}
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20"
                    >
                      <option value="Salaried">Salaried</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Unemployed">Unemployed</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Employment Duration (Years)</label>
                    <input
                      type="number"
                      name="employment_duration"
                      value={form.employment_duration}
                      onChange={handleInputChange}
                      min="0" step="0.5"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Education Level</label>
                    <select
                      name="education_level"
                      value={form.education_level}
                      onChange={handleInputChange}
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20"
                    >
                      <option value="High School">High School</option>
                      <option value="Bachelor">Bachelor</option>
                      <option value="Master">Master</option>
                      <option value="PhD">PhD</option>
                    </select>
                  </div>
                </div>
              )}

              {activeFormTab === 'financials' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Annual Income ($)</label>
                    <input
                      type="number"
                      name="annual_income"
                      value={form.annual_income}
                      onChange={handleInputChange}
                      min="0" step="1000"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Monthly Income ($)</label>
                    <input
                      type="number"
                      name="monthly_income"
                      value={form.monthly_income}
                      onChange={handleInputChange}
                      min="0" step="100"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Existing Loans Balance ($)</label>
                    <input
                      type="number"
                      name="existing_loans_balance"
                      value={form.existing_loans_balance}
                      onChange={handleInputChange}
                      min="0" step="500"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Savings Amount ($)</label>
                    <input
                      type="number"
                      name="savings_amount"
                      value={form.savings_amount}
                      onChange={handleInputChange}
                      min="0" step="500"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Investments ($)</label>
                    <input
                      type="number"
                      name="investments"
                      value={form.investments}
                      onChange={handleInputChange}
                      min="0" step="500"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Debt-to-Income (DTI) Ratio</label>
                    <input
                      type="number"
                      name="debt_to_income_ratio"
                      value={form.debt_to_income_ratio}
                      onChange={handleInputChange}
                      min="0" max="10" step="0.01"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Credit Utilization Ratio (CUR)</label>
                    <input
                      type="number"
                      name="credit_utilization_ratio"
                      value={form.credit_utilization_ratio}
                      onChange={handleInputChange}
                      min="0" max="1" step="0.01"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              {activeFormTab === 'credit' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Number of Active Loans</label>
                    <input
                      type="number"
                      name="number_of_active_loans"
                      value={form.number_of_active_loans}
                      onChange={handleInputChange}
                      min="0" max="100"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Previous Loan Records</label>
                    <input
                      type="number"
                      name="previous_loan_records"
                      value={form.previous_loan_records}
                      onChange={handleInputChange}
                      min="0" max="100"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Missed Payments (Last 2 Yrs)</label>
                    <input
                      type="number"
                      name="missed_payments"
                      value={form.missed_payments}
                      onChange={handleInputChange}
                      min="0" max="100"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Payment History Ratio</label>
                    <input
                      type="number"
                      name="payment_history_ratio"
                      value={form.payment_history_ratio}
                      onChange={handleInputChange}
                      min="0" max="1" step="0.01"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200/30 dark:border-slate-800/30 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setForm(initialForm)}
                  className="px-5 py-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-sky-500/10 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Evaluate Profile
                    </>
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Real-Time Results Output Panel */}
      <div className="xl:col-span-1">
        <div className="glass-panel p-6 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md h-full flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm tracking-tight uppercase">Assessment Result</h3>
              {result && (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider ${
                  result.risk_category === 'Excellent' || result.risk_category === 'Good'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : result.risk_category === 'Moderate'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}>
                  {result.risk_category}
                </span>
              )}
            </div>

            {result ? (
              /* --- RESULTS CONTENT --- */
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Radial Credit Score Gauge */}
                <div className="flex flex-col items-center py-4">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-36 h-36 transform -rotate-90">
                      {/* background circle */}
                      <circle
                        cx="72"
                        cy="72"
                        r="50"
                        stroke="rgba(var(--text-secondary), 0.1)"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      {/* value circle */}
                      <circle
                        cx="72"
                        cy="72"
                        r="50"
                        stroke={getScoreStrokeColor(result.credit_score)}
                        strokeWidth="10"
                        fill="transparent"
                        className="transition-all duration-500"
                        strokeDasharray={calculateStrokeDash(result.credit_score).strokeDasharray}
                        strokeDashoffset={calculateStrokeDash(result.credit_score).strokeDashoffset}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-3xl font-black ${getScoreColor(result.credit_score)}`}>
                        {result.credit_score}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Credit Score</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold mt-2">Scale: 300 to 850</span>
                </div>

                {/* Score indicators progress bars */}
                <div className="space-y-4">
                  {/* Approval Probability */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Approval Probability</span>
                      <span className="text-sky-500">{(result.approval_probability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-500 rounded-full transition-all duration-500"
                        style={{ width: `${result.approval_probability * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Default Probability */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Default Probability</span>
                      <span className={result.default_probability > 0.35 ? 'text-rose-500' : 'text-sky-500'}>
                        {(result.default_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${result.default_probability > 0.35 ? 'bg-rose-500' : 'bg-amber-500'}`}
                        style={{ width: `${result.default_probability * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Financial Health Index */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Financial Health Index</span>
                      <span className="text-sky-500">{result.financial_health_score.toFixed(1)}/100</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${result.financial_health_score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Quick decision status */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  result.approval_probability >= 0.5
                    ? 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/10'
                    : 'bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/10'
                }`}>
                  {result.approval_probability >= 0.5 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black">Pre-Approved status</h4>
                        <p className="text-[10px] leading-relaxed mt-1">Profile meets automated underwriting standard thresholds. Risk exposure index is low.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black">Declined status</h4>
                        <p className="text-[10px] leading-relaxed mt-1">Profile triggers warning rules. High default indicators require manual credit underwriting review.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* --- EMPTY RESULTS STATE --- */
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate-400 space-y-3">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
                  <Calculator className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold">Awaiting evaluation</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px]">Fill out details and submit, or activate the What-if Simulator controls.</p>
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-200/30 dark:border-slate-800/30">
              <button
                onClick={() => onNavigate('explainability')}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Sliders className="w-4 h-4" />
                XAI Explain
              </button>
              <button
                onClick={() => onNavigate('reports')}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/10"
              >
                <FileText className="w-4 h-4" />
                Get Report
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
