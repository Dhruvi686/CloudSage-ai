/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Settings,
  Calendar,
  Sparkles,
  Info,
  DollarSign,
  AlertTriangle,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { ForecastSimulation } from '../types';

interface ForecastingViewProps {
  onNavigateToTab: (tab: 'dashboard' | 'recommendations' | 'forecasting' | 'ai-assistant' | 'sustainability' | 'reports' | 'settings') => void;
}

export default function ForecastingView({ onNavigateToTab }: ForecastingViewProps) {
  const [simulation, setSimulation] = useState<ForecastSimulation>({
    reservedPercent: 40,
    storageTierShift: 1, // 0 = Conservative, 1 = Moderate, 2 = Aggressive
    idleCleanup: 35, // 0 to 100%
  });

  const [activeSegment, setActiveSegment] = useState<'3m' | '6m' | '12m'>('6m');

  // ── Live forecast from FastAPI backend ────────────────────────────
  const [liveForecast, setLiveForecast] = useState<{
    next_month_prediction: number;
    confidence: number;
    trend: string;
    trend_pct: number;
    projection?: any[];
    history?: any[];
  } | null>(null);

  useEffect(() => {
    fetch('/pyapi/api/forecast')
      .then((r) => r.json())
      .then((data) => setLiveForecast(data))
      .catch(() => {
        // Backend offline — sliders work client-side regardless
      });
  }, []);
  // ──────────────────────────────────────────────────────────────────

  // Calculate dynamic savings factor
  const calculateSavings = () => {
    // Reserved Instances savings: up to 30% reduction if 100% reserved
    const riSavings = (simulation.reservedPercent / 100) * 0.3;
    // Storage tier savings: up to 15% reduction if aggressive
    const storageSavings = (simulation.storageTierShift / 2) * 0.15;
    // Idle cleanup savings: up to 10% reduction if 100% cleaned
    const idleSavings = (simulation.idleCleanup / 100) * 0.1;

    return {
      riSavings,
      storageSavings,
      idleSavings,
      totalFactor: 1 - (riSavings + storageSavings + idleSavings),
    };
  };

  const savingsDetails = calculateSavings();

  const getChartData = () => {
    if (!liveForecast) return [];

    const baseSpends = [
      ...(liveForecast.history || []).map((h: any) => ({
        month: h.month_label || String(h.month_index),
        base: h.total_cost
      })),
      ...(liveForecast.projection || []).map((p: any) => ({
        month: `M${p.month_index}`,
        base: p.cost
      }))
    ];

    return baseSpends.map(item => {
      const optimized = Math.round(item.base * savingsDetails.totalFactor);
      return {
        ...item,
        optimized,
        savings: item.base - optimized,
      };
    });
  };

  const chartData = getChartData();
  const currentMonthBase = chartData.length > 0 ? chartData[chartData.length - 1].base : 0;
  const currentMonthOptimized = chartData.length > 0 ? chartData[chartData.length - 1].optimized : 0;
  const totalPeriodSavings = chartData.reduce((acc, item) => acc + item.savings, 0);

  return (
    <div className="space-y-6">
      {/* Navigation and Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            <span>FinOps</span>
            <span className="text-gray-500">/</span>
            <span className="text-primary font-medium">Predictive Forecasting</span>
          </nav>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            Predictive Spend Modeler
          </h2>
          <p className="text-on-surface-variant max-w-2xl mt-1 text-sm leading-relaxed">
            AI-powered forecasting with confidence intervals and real-time &quot;What-if&quot; simulation variables.
          </p>
        </div>
        <div className="flex bg-surface-container-high rounded-xl p-1 border border-outline-variant/20">
          {(['3m', '6m', '12m'] as const).map(seg => (
            <button
              key={seg}
              onClick={() => setActiveSegment(seg)}
              className={`px-4 py-2 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer ${
                activeSegment === seg 
                  ? 'bg-primary text-on-primary shadow-md' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {seg.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Graph and Sim Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Graph Area */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl flex flex-col justify-between h-full min-h-[460px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold font-headline">Spend Projections</h3>
              <p className="text-xs text-on-surface-variant">Baseline spend compared with simulated optimization models</p>
            </div>
            <div className="flex gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-outline"></span>
                <span className="text-on-surface-variant">Baseline Forecast</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span className="text-primary font-bold">Optimized Model</span>
              </div>
            </div>
          </div>

          {/* Recharts Forecast Graph */}
          <div className="flex-1 w-full min-h-[300px] relative">
            {chartData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant z-10">
                <AlertTriangle className="w-10 h-10 mb-4 opacity-50" />
                <p className="text-sm font-medium">Insufficient Historical Data</p>
                <p className="text-xs mt-1">Upload cost history to generate predictions.</p>
              </div>
            ) : null}
            <ResponsiveContainer width="100%" height="100%" className={chartData.length === 0 ? "opacity-10" : ""}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8c909f" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#8c909f" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4d8eff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4d8eff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000000}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                  labelStyle={{ color: '#a1a1aa', fontSize: '11px', fontFamily: 'monospace' }}
                  itemStyle={{ fontSize: '13px' }}
                  formatter={(value, name) => [
                    `$${Number(value).toLocaleString()}`, 
                    name === 'base' ? 'Baseline Forecast' : 'Optimized Model'
                  ]}
                />
                <ReferenceLine y={1500000} stroke="#991b1b" strokeDasharray="5 5" label={{ value: 'Budget Threshold ($1.5M)', fill: '#f87171', fontSize: 10, position: 'top', fontFamily: 'monospace' }} />
                <Area type="monotone" dataKey="base" stroke="#3f3f46" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorBase)" />
                <Area type="monotone" dataKey="optimized" stroke="#3b82f6" strokeWidth={3.5} fillOpacity={1} fill="url(#colorOpt)" className="chart-glow" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center justify-between text-xs text-on-surface-variant font-mono">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-primary" />
              95% Confidence Interval applies across all generated spend projections
            </span>
            <span>Last calculated: Just now</span>
          </div>
        </div>

        {/* Sidebar: What-if Simulator Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Simulator Panel */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-full bg-gradient-to-b from-surface-container-high/40 to-surface-dim/40">
            <div>
              <h3 className="text-base font-bold mb-5 flex items-center gap-2 font-headline">
                <Sliders className="w-4 h-4 text-primary" />
                What-if Simulator
              </h3>

              <div className="space-y-6">
                {/* Sliders: RI Coverage */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant font-semibold">Reserved Instance Coverage</span>
                    <span className="text-primary font-bold font-mono">{simulation.reservedPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simulation.reservedPercent}
                    onChange={(e) => setSimulation({ ...simulation, reservedPercent: Number(e.target.value) })}
                    className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>On-Demand</span>
                    <span>100% Reserved</span>
                  </div>
                </div>

                {/* Sliders: Storage Tier Shift */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant font-semibold">Storage Tier Aggression</span>
                    <span className="text-tertiary font-bold uppercase tracking-wider font-mono text-[10px]">
                      {simulation.storageTierShift === 0 ? 'Conservative' : simulation.storageTierShift === 1 ? 'Moderate' : 'Aggressive'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    value={simulation.storageTierShift}
                    onChange={(e) => setSimulation({ ...simulation, storageTierShift: Number(e.target.value) })}
                    className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-tertiary focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>Standard</span>
                    <span>Glacier Deep</span>
                  </div>
                </div>

                {/* Sliders: Idle Resource Cleanup */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant font-semibold">Idle Cleanup Percent</span>
                    <span className="text-secondary font-bold font-mono">{simulation.idleCleanup}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simulation.idleCleanup}
                    onChange={(e) => setSimulation({ ...simulation, idleCleanup: Number(e.target.value) })}
                    className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-secondary focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>0% Clean</span>
                    <span>100% Cleansed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings projection card inside simulator */}
            <div className="mt-8 pt-6 border-t border-outline-variant/20 space-y-4">
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">Simulated Monthly Savings</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h4 className="text-2xl font-bold text-primary font-mono">
                    ${Math.round(currentMonthBase - currentMonthOptimized).toLocaleString()}
                  </h4>
                  <span className="text-xs text-tertiary font-bold font-mono">
                    (-{Math.round((1 - savingsDetails.totalFactor) * 100)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-on-surface-variant leading-relaxed">
                <CheckCircle2 className="w-5 h-5 text-tertiary flex-shrink-0" />
                <span>By applying these parameters, you will save approximately <strong className="text-on-surface font-mono">${Math.round(totalPeriodSavings).toLocaleString()}</strong> over 6 months.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analytics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl">
          <p className="text-xs font-mono uppercase text-on-surface-variant tracking-wider">ML Next Month Prediction</p>
          <h4 className="text-xl font-bold text-on-surface mt-1 font-mono">
            {liveForecast ? `$${liveForecast.next_month_prediction.toLocaleString()}` : `$${currentMonthBase.toLocaleString()}`}
          </h4>
          <p className="text-xs text-on-surface-variant mt-1">
            {liveForecast ? `Trend: ${liveForecast.trend} (${liveForecast.trend_pct > 0 ? '+' : ''}${liveForecast.trend_pct}%/mo)` : 'Unoptimized standard trajectory'}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl ai-gradient-border">
          <p className="text-xs font-mono uppercase text-primary tracking-wider">Optimized Spend Model</p>
          <h4 className="text-xl font-bold text-primary mt-1 font-mono">${currentMonthOptimized.toLocaleString()}</h4>
          <p className="text-xs text-tertiary mt-1 font-semibold">Simulated target spend model</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <p className="text-xs font-mono uppercase text-on-surface-variant tracking-wider">Model Confidence</p>
          <h4 className="text-xl font-bold text-on-surface mt-1 font-mono">
            {liveForecast ? `${(liveForecast.confidence * 100).toFixed(0)}% R²` : '4.2x Cost-to-Value'}
          </h4>
          <p className="text-xs text-on-surface-variant mt-1">LinearRegression fit on 12-month history</p>
        </div>
      </div>
    </div>
  );
}
