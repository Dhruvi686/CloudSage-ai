/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Heart,
  Leaf,
  Sparkles,
  Bot,
  AlertTriangle,
  History,
  Info,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  Zap,
  Play
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DashboardViewProps {
  onNavigateToTab: (tab: 'dashboard' | 'recommendations' | 'forecasting' | 'ai-assistant' | 'sustainability' | 'reports' | 'settings') => void;
}


export default function DashboardView({ onNavigateToTab }: DashboardViewProps) {
  const [scaleStatus, setScaleStatus] = useState<'idle' | 'scaling' | 'completed'>('idle');
  const [anomaliesResolved, setAnomaliesResolved] = useState<string[]>([]);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // ── Live backend data ─────────────────────────────────────────────────
  const [liveMetrics, setLiveMetrics] = useState<{
    monthly_cost: number;
    potential_savings: number;
    finops_score: number;
    finops_status: string;
    sustainability_score: number;
    sustainability_status: string;
    anomalies: number;
    cost_trend: { name: string; cost: number }[];
  } | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    fetch('/pyapi/api/dashboard')
      .then((r) => r.json())
      .then((data) => {
        setLiveMetrics(data);
        setMetricsLoading(false);
      })
      .catch(() => {
        // Backend offline — fall back to static display values
        setMetricsLoading(false);
      });
  }, []);

  const displayCostData = liveMetrics?.cost_trend || [];
  // ─────────────────────────────────────────────────────────────────────

  const handleAutoScale = () => {
    setScaleStatus('scaling');
    setTimeout(() => {
      setScaleStatus('completed');
      setShowNotification('Sage successfully scaled down 12 idle EC2 instances in us-east-1! Estimated savings: $1,450/month.');
      setTimeout(() => setScaleStatus('idle'), 4000);
    }, 2000);
  };

  const resolveAnomaly = (id: string, message: string) => {
    if (anomaliesResolved.includes(id)) return;
    setAnomaliesResolved([...anomaliesResolved, id]);
    setShowNotification(`Resolved anomaly: "${message}" successfully routed to DevOps queue.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed top-20 right-8 z-50 max-w-md bg-surface-container-high border border-tertiary/30 text-on-surface p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5 text-tertiary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-tertiary">Optimization Completed</p>
            <p className="text-xs mt-1 text-on-surface-variant leading-relaxed">{showNotification}</p>
          </div>
          <button 
            onClick={() => setShowNotification(null)}
            className="text-xs text-on-surface-variant hover:text-on-surface font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Monthly Cost */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-primary-container/10 rounded-lg text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-error text-xs font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              +4.2%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider font-mono">Monthly Cost</p>
            <h2 className="text-2xl font-bold text-on-surface mt-1">
              {metricsLoading ? '…' : `$${(liveMetrics?.monthly_cost ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            </h2>
          </div>
        </div>

        {/* Potential Savings */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between ai-gradient-border hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-tertiary-container/10 rounded-lg text-tertiary">
              <PiggyBank className="w-5 h-5" />
            </div>
            <span className="text-tertiary text-xs font-bold flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              -12%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider font-mono">Potential Savings</p>
            <h2 className="text-2xl font-bold text-tertiary mt-1">
              {metricsLoading ? '…' : `$${(liveMetrics?.potential_savings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            </h2>
          </div>
        </div>

        {/* FinOps Health */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-secondary-container/10 rounded-lg text-secondary">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-tertiary text-xs font-bold uppercase tracking-wider font-mono px-2 py-0.5 bg-tertiary/10 rounded-full">
              Optimal
            </span>
          </div>
          <div className="mt-4">
            <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider font-mono">FinOps Health Score</p>
            <h2 className="text-2xl font-bold text-on-surface mt-1">
              {metricsLoading ? '…' : (liveMetrics?.finops_score ?? 0)}<span className="text-xs text-on-surface-variant font-normal">/100</span>
            </h2>
          </div>
        </div>

        {/* Sustainability */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-tertiary-container/10 rounded-lg text-tertiary">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="text-tertiary text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Verified
            </span>
          </div>
          <div className="mt-4">
            <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider font-mono">Sustainability Score</p>
            <h2 className="text-2xl font-bold text-on-surface mt-1">
              {metricsLoading ? '…' : (liveMetrics?.sustainability_score ?? 0)}<span className="text-xs text-on-surface-variant font-normal">/100</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Middle Row: Main Data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cost Trend Chart */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl flex flex-col h-full min-h-[380px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-on-surface font-headline">Cloud Cost Trends</h3>
              <p className="text-xs text-on-surface-variant">Daily spend across all multi-cloud environments</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest rounded text-xs font-bold font-mono">1W</button>
              <button className="px-3 py-1 bg-primary text-on-primary rounded text-xs font-bold font-mono">1M</button>
              <button className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest rounded text-xs font-bold font-mono">3M</button>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayCostData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4d8eff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4d8eff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                  labelStyle={{ color: '#a1a1aa', fontSize: '11px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#3b82f6', fontSize: '13px', fontWeight: 'bold' }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spend']}
                />
                <Area type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" className="chart-glow" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: DNA Score Card */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl flex flex-col border-obsidian justify-between">
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center justify-between font-headline">
              Cloud DNA Score
              <Info className="w-4 h-4 text-primary" />
            </h3>
            <div className="flex flex-col items-center mb-6">
              <div className="w-40 h-40 rounded-full radial-progress-score flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(78,222,163,0.1)]">
                <span className="text-4xl font-extrabold text-on-surface leading-none">88</span>
                <span className="text-[10px] text-tertiary font-bold uppercase tracking-widest mt-1">Exceptional</span>
                {/* Visual flare */}
                <div className="absolute inset-0 rounded-full border border-primary/15 scale-110 pointer-events-none"></div>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-on-surface-variant">Cost Efficiency</span>
                <span className="text-on-surface font-mono">94%</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-on-surface-variant">Resource Utilization</span>
                <span className="text-on-surface font-mono">82%</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-on-surface-variant">Sustainability</span>
                <span className="text-on-surface font-mono">90%</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-tertiary rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-on-surface-variant">Security Compliance</span>
                <span className="text-on-surface font-mono">85%</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-error rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Service Split, AI optimize, anomalies, and logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Service Split & AI optimizer bento */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Service Distribution Pie Chart mockup */}
          <div className="glass-panel p-6 rounded-2xl flex items-center gap-6">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#2d3449" strokeWidth="4.5" />
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#4d8eff" strokeWidth="4.5" strokeDasharray="45 55" />
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#4edea3" strokeWidth="4.5" strokeDasharray="25 75" strokeDashoffset="-45" />
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#d0bcff" strokeWidth="4.5" strokeDasharray="30 70" strokeDashoffset="-70" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-on-surface">Cloud</span>
                <span className="text-[9px] text-on-surface-variant uppercase">Services</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">Service Split</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4d8eff]"></span>
                    Compute
                  </span>
                  <span className="font-bold font-mono">45%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d0bcff]"></span>
                    Database
                  </span>
                  <span className="font-bold font-mono">30%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]"></span>
                    Network
                  </span>
                  <span className="font-bold font-mono">25%</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Optimizer Card */}
          <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-surface-container-high to-surface-dim relative overflow-hidden group flex flex-col justify-between">
            <div className="absolute -right-3 -bottom-3 opacity-10 group-hover:scale-110 transition-transform text-primary">
              <Bot className="w-24 h-24" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                AI Optimization Ready
              </h4>
              <p className="text-sm text-on-surface font-medium leading-relaxed">
                Sage found 12 idle EC2 instances in us-east-1.
              </p>
            </div>
            <button
              onClick={handleAutoScale}
              disabled={scaleStatus === 'scaling'}
              className="mt-4 w-full py-2.5 bg-on-surface text-surface font-bold rounded-lg hover:bg-primary hover:text-on-primary-container transition-colors cursor-pointer text-xs disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {scaleStatus === 'idle' && (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Auto-Scale Now
                </>
              )}
              {scaleStatus === 'scaling' && (
                <>
                  <span className="animate-spin text-xs">⏳</span>
                  Scaling Resources...
                </>
              )}
              {scaleStatus === 'completed' && 'Scaling Completed!'}
            </button>
          </div>
        </div>

        {/* Anomalies List & Log Tracker */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-2xl border-l-4 border-error/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-error/15 flex items-center justify-center text-error">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-on-surface font-headline text-sm">{liveMetrics ? `${liveMetrics.anomalies} Anomalies Detected` : '3 Anomalies Detected'}</h4>
            </div>
            <ul className="space-y-3">
              <li 
                onClick={() => resolveAnomaly('s3', 'Unusual traffic spike in S3 Oregon region (+$4k/day)')}
                className={`flex gap-3 text-xs p-2.5 rounded-lg hover:bg-surface-variant/20 transition-all cursor-pointer items-start ${
                  anomaliesResolved.includes('s3') ? 'opacity-40 line-through' : ''
                }`}
              >
                <ChevronRight className="w-4 h-4 text-on-surface-variant flex-shrink-0 mt-0.5" />
                <span>
                  Unusual traffic spike in S3 Oregon region (+$4k/day)
                  {anomaliesResolved.includes('s3') && <span className="text-tertiary ml-2 font-bold">[RESOLVED]</span>}
                </span>
              </li>
              <li 
                onClick={() => resolveAnomaly('shadow-it', 'Shadow IT instances found in Sandbox VPC')}
                className={`flex gap-3 text-xs p-2.5 rounded-lg hover:bg-surface-variant/20 transition-all cursor-pointer items-start ${
                  anomaliesResolved.includes('shadow-it') ? 'opacity-40 line-through' : ''
                }`}
              >
                <ChevronRight className="w-4 h-4 text-on-surface-variant flex-shrink-0 mt-0.5" />
                <span>
                  Shadow IT instances found in Sandbox VPC
                  {anomaliesResolved.includes('shadow-it') && <span className="text-tertiary ml-2 font-bold">[RESOLVED]</span>}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Optimization History Logs row */}
      <div className="glass-panel p-6 rounded-2xl">
        <h4 className="font-bold text-on-surface mb-5 flex items-center gap-2 text-sm font-headline">
          <History className="w-4 h-4 text-primary" />
          Recent Optimization Logs
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-3 items-start">
            <div className="w-1.5 h-10 bg-tertiary rounded-full"></div>
            <div>
              <p className="text-xs font-bold text-on-surface">Reservation Applied</p>
              <p className="text-[11px] text-on-surface-variant mt-1 font-mono">12 hours ago • Savings: $4,500</p>
            </div>
          </div>
          <div className="flex gap-3 items-start opacity-75">
            <div className="w-1.5 h-10 bg-primary rounded-full"></div>
            <div>
              <p className="text-xs font-bold text-on-surface">Instance Rightsizing</p>
              <p className="text-[11px] text-on-surface-variant mt-1 font-mono">Yesterday • Efficiency: +12%</p>
            </div>
          </div>
          <div className="flex gap-3 items-start opacity-50">
            <div className="w-1.5 h-10 bg-primary rounded-full"></div>
            <div>
              <p className="text-xs font-bold text-on-surface">Bucket Cleanup</p>
              <p className="text-[11px] text-on-surface-variant mt-1 font-mono">2 days ago • Storage: -400GB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Assistant Copilot launcher badge */}
      <button 
        onClick={() => onNavigateToTab('ai-assistant')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary-container text-on-primary-container rounded-full shadow-2xl flex items-center justify-center group hover:scale-110 transition-all z-40 cursor-pointer border border-[#adc6ff]/20 active:scale-95"
      >
        <Bot className="w-7 h-7 group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-error text-on-error font-bold rounded-full border-2 border-surface flex items-center justify-center text-[9px] font-mono">
          2
        </div>
      </button>
    </div>
  );
}
