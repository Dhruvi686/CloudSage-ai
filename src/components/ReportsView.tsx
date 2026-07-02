/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Download,
  FileText,
  TrendingDown,
  Activity,
  Award,
  CheckSquare,
  ShieldCheck,
  Send,
  Sparkles,
  BarChart,
  Calendar
} from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const quarterlyData = [
  { name: 'Q3 2025', spend: 3200000, optimized: 2800000 },
  { name: 'Q4 2025', spend: 3500000, optimized: 2900000 },
  { name: 'Q1 2026', spend: 3100000, optimized: 2450000 },
  { name: 'Q2 2026', spend: 3800000, optimized: 2500000 },
];

export default function ReportsView() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            <span>FinOps</span>
            <span className="text-gray-500">/</span>
            <span className="text-primary font-medium">Executive Reports</span>
          </nav>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            Executive Performance Summary
          </h2>
          <p className="text-on-surface-variant max-w-2xl mt-1 text-sm leading-relaxed">
            Consolidated financial reports, compliance audits, and return on investment (ROI) trackers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer text-xs">
            <Download className="w-4 h-4" />
            <span>Generate Full QBR</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Bar chart and audit stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cost Savings Bar Chart */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl flex flex-col justify-between h-full min-h-[400px]">
          <div>
            <h3 className="text-lg font-bold font-headline">Quarterly Efficiency Breakdown</h3>
            <p className="text-xs text-on-surface-variant mb-6">Actual gross spend vs. optimized simulation models</p>
          </div>

          <div className="flex-1 w-full min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={quarterlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#2d3449" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#8c909f" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8c909f" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000000}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171f33', borderColor: 'rgba(173, 198, 255, 0.2)', borderRadius: '8px' }}
                  labelStyle={{ color: '#8c909f', fontSize: '11px', fontFamily: 'monospace' }}
                  itemStyle={{ fontSize: '13px' }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`]}
                />
                <Bar dataKey="spend" name="Actual Spend" fill="#2d3449" radius={[4, 4, 0, 0]} />
                <Bar dataKey="optimized" name="Optimized Spend" fill="#adc6ff" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit metrics and compliance checklist */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-full bg-gradient-to-b from-surface-container-high/40 to-surface-dim/40">
            <div>
              <h3 className="text-sm font-bold mb-5 flex items-center gap-2 font-headline uppercase tracking-wider text-on-surface-variant font-mono">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Compliance Scorecard
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-tertiary/15 flex items-center justify-center text-tertiary">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">ISO 27001 Certified</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Continuous verification</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">SOC2 Type II Audit</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Compliant without deviations</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">GHG Protocol Scope 3</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Fully certified ledger reporting</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant/15">
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">Investment Return ROI</p>
                <h4 className="text-2xl font-bold text-primary font-mono mt-1">4.2x ROI</h4>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
                  For every dollar allocated to CloudSage optimizer platforms, your group saves $4.20 in operational waste.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Summary */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="font-headline text-base font-bold text-on-surface mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Executive Narrative & Highlights
        </h3>
        <p className="text-xs text-on-surface-variant leading-relaxed space-y-4">
          Through integrated automation routines and continuous rightsizing, the group saw a gross cost decrease of $145,200 this quarter. Regional Carbon Mapping successfully lower environmental Scope 3 emission footprints by 12.4 MT of CO2e.
        </p>
      </div>
    </div>
  );
}
