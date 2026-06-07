'use client';

import React, { useState } from 'react';
import { UserCheck, Mail, Lock, User, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

interface AuthTabProps {
  onLoginSuccess: (user: any) => void;
}

export default function AuthTab({ onLoginSuccess }: AuthTabProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user'); // default role choice
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const data = await api.post<{ access_token: string; user: any }>('/auth/login', {
          email,
          password
        });
        
        // Save token to localStorage
        localStorage.setItem('creditguard_token', data.access_token);
        onLoginSuccess(data.user);
      } else {
        await api.post('/auth/register', {
          email,
          password,
          full_name: fullName,
          role
        });
        
        // Auto sign-in or switch
        setMode('login');
        setErrorMsg('Registration successful! Please sign in.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-10 glass-panel rounded-3xl overflow-hidden border-slate-200/50 dark:border-slate-800/40 shadow-xl grid grid-cols-1 md:grid-cols-2 animate-in fade-in duration-300">
      
      {/* Left Column: Visual Brand Illustration (hidden on mobile) */}
      <div className="relative h-full min-h-[480px] bg-slate-950 text-white flex flex-col justify-end p-8 hidden md:flex overflow-hidden">
        {/* Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/banking_abstract_bg.png" 
          alt="Secure Network" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 transition-transform duration-10000 hover:scale-105"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
        
        {/* Overlay Content */}
        <div className="relative z-10 space-y-3">
          <span className="bg-sky-500/20 text-sky-400 border border-sky-500/20 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full w-max inline-block">
            Secure Connection
          </span>
          <h2 className="text-xl font-extrabold tracking-tight leading-tight">
            Enterprise Credit Risk Intelligence
          </h2>
          <p className="text-[11px] text-slate-350 leading-relaxed font-semibold">
            Our automated ML underwriting engine evaluates multi-factor portfolios using high-performance classifiers. Gain deep transparency using Explainable AI (SHAP & LIME) reasons.
          </p>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="p-8 space-y-6 flex flex-col justify-center bg-white/40 dark:bg-slate-900/40">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="bg-sky-500/10 p-3 rounded-full text-sky-500 w-12 h-12 flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-extrabold text-sm tracking-tight uppercase text-slate-800 dark:text-white">
            {mode === 'login' ? 'Sign In to Dashboard' : 'Create Bank Profile'}
          </h3>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            Access secure history archiving and printable PDF certifications.
          </p>
        </div>

        {errorMsg && (
          <div className={`p-4 rounded-xl text-xs font-semibold border text-center ${
            errorMsg.includes('successful')
              ? 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/10'
              : 'bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/10'
          }`}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-4 h-4" /> Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Mail className="w-4 h-4" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@creditguard.ai"
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
              required
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">System Role Request</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs focus:ring-sky-500/20"
              >
                <option value="user">Standard User</option>
                <option value="admin">Administrator (Mock Access)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-sky-500/10 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Sparkles className="w-4.5 h-4.5" />
                {mode === 'login' ? 'Authenticate' : 'Submit Registration'}
              </>
            )}
          </button>
        </form>

        {/* Form Toggle Switch */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setErrorMsg('');
            }}
            className="text-xs font-bold text-sky-500 hover:text-sky-600 transition-colors"
          >
            {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>

    </div>
  );
}
