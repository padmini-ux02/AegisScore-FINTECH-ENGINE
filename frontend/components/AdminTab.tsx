'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Server, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

export default function AdminTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'logs' | 'metrics'>('metrics');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeSubTab === 'users') {
        const u = await api.get<any[]>('/admin/users');
        setUsers(u);
      } else if (activeSubTab === 'logs') {
        const l = await api.get<any[]>('/admin/audit-logs');
        setAuditLogs(l);
      } else if (activeSubTab === 'metrics') {
        const m = await api.get<any>('/admin/metrics');
        setMetrics(m);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.put(`/admin/users/${userId}/role?role=${nextRole}`, {});
      fetchData(); // reload list
    } catch (err) {
      alert(`Role change failed: ${err}`);
    }
  };

  if (isLoading && !metrics && users.length === 0 && auditLogs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border-slate-200/50 dark:border-slate-800/40 shadow-md space-y-6 animate-in fade-in duration-300">
      
      {/* Admin Subheader and Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/30 dark:border-slate-800/30 pb-4 gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <h3 className="font-extrabold text-sm tracking-tight uppercase">Control Dashboard</h3>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-xl gap-1 text-[10px] font-bold border border-slate-200/20 dark:border-slate-800/20">
          {(['metrics', 'users', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider transition-colors ${
                activeSubTab === tab
                  ? 'bg-white dark:bg-slate-800 text-sky-500 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'metrics' ? 'Server Metrics' : tab === 'users' ? 'User Control' : 'Audit Logs'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          
          {/* --- SERVER HEALTH METRICS VIEW --- */}
          {activeSubTab === 'metrics' && metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* CPU & Memory gauges */}
              <div className="glass-panel p-5 rounded-2xl border-slate-200/20 dark:border-slate-850/50 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-4">
                  <Server className="w-4.5 h-4.5 text-sky-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Resource Statistics</span>
                </div>
                <div className="space-y-4 font-semibold text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">CPU Usage</span>
                      <span>{metrics.cpu_usage_pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${metrics.cpu_usage_pct}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Allocated Memory</span>
                      <span>{metrics.memory_usage_mb} MB</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-400 rounded-full" style={{ width: `${(metrics.memory_usage_mb/512)*100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Statistics */}
              <div className="glass-panel p-5 rounded-2xl border-slate-200/20 dark:border-slate-850/50 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4.5 h-4.5 text-sky-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">API Gateway logs</span>
                </div>
                <div className="space-y-3 font-semibold text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/10">
                    <span className="text-slate-500">Total System Users</span>
                    <span>{metrics.total_users}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/10">
                    <span className="text-slate-500">Total Evaluations</span>
                    <span>{metrics.total_predictions}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">API Hits (24h)</span>
                    <span className="text-sky-500 font-bold">{metrics.api_hits_last_24h} hits</span>
                  </div>
                </div>
              </div>

              {/* Node Health status */}
              <div className="glass-panel p-5 rounded-2xl border-slate-200/20 dark:border-slate-850/50 flex flex-col justify-between bg-emerald-500/5 border-emerald-500/10 dark:border-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-2 mb-4">
                  <Server className="w-4.5 h-4.5" />
                  <span className="text-xs font-black uppercase tracking-wider">Node Integrity</span>
                </div>
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm capitalize">Engine Cluster: Healthy</h4>
                  <p className="text-[10px] leading-relaxed">Model inference nodes are synchronized on SQLite/PostgreSQL schemas. Rate limits set to 60 req/min per IP.</p>
                </div>
              </div>
            </div>
          )}

          {/* --- USERS CONTROL VIEW --- */}
          {activeSubTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/30 dark:border-slate-800/30 text-slate-400 font-bold uppercase">
                    <th className="pb-3 font-semibold">User Email</th>
                    <th className="pb-3 font-semibold">Full Name</th>
                    <th className="pb-3 font-semibold">System Role</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Registered Date</th>
                    <th className="pb-3 text-right font-semibold">Role Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/10 dark:divide-slate-800/20 font-medium">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="py-3.5 font-bold">{u.email}</td>
                      <td className="py-3.5">{u.full_name || 'N/A'}</td>
                      <td className="py-3.5 capitalize">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                          u.role === 'admin' 
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 text-emerald-500 font-semibold uppercase text-[9px]">Active</td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleToggleRole(u.id, u.role)}
                          className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold px-3 py-1.5 rounded-xl transition-all"
                        >
                          Make {u.role === 'admin' ? 'User' : 'Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* --- AUDIT LOGS VIEW --- */}
          {activeSubTab === 'logs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/30 dark:border-slate-800/30 text-slate-400 font-bold uppercase">
                    <th className="pb-3 font-semibold">Event ID</th>
                    <th className="pb-3 font-semibold">Subject User</th>
                    <th className="pb-3 font-semibold">Action Trigger</th>
                    <th className="pb-3 font-semibold">Details / Payload</th>
                    <th className="pb-3 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/10 dark:divide-slate-800/20 font-medium">
                  {auditLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="py-3.5 text-slate-400">#LOG-{l.id}</td>
                      <td className="py-3.5 font-bold">User {l.user_id || 'System'}</td>
                      <td className="py-3.5">
                        <span className="bg-sky-500/10 text-sky-600 dark:text-sky-450 text-[9px] font-black px-2 py-0.5 rounded border border-sky-500/10">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-350 leading-relaxed font-semibold max-w-sm truncate" title={l.details}>
                        {l.details}
                      </td>
                      <td className="py-3.5 text-slate-400">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
        </div>
      )}

    </div>
  );
}
