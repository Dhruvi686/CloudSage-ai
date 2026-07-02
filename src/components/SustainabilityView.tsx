/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Leaf,
  Globe,
  Gauge,
  Activity,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  Info,
  Server,
  Zap,
  MapPin,
  Check
} from 'lucide-react';

interface CloudRegionNode {
  id: string;
  name: string;
  provider: string;
  intensity: number; // gCO2/kWh
  status: 'High' | 'Medium' | 'Low';
  top: string; // positioning percent
  left: string; // positioning percent
  footprint: string;
}

const initialRegions: CloudRegionNode[] = [
  {
    id: 'us-east-1',
    name: 'us-east-1 (N. Virginia)',
    provider: 'AWS',
    intensity: 415,
    status: 'High',
    top: '32%',
    left: '26%',
    footprint: '8.2 MT CO2e / mo',
  },
  {
    id: 'eu-west-1',
    name: 'eu-west-1 (Ireland)',
    provider: 'AWS',
    intensity: 54,
    status: 'Low',
    top: '26%',
    left: '48%',
    footprint: '1.4 MT CO2e / mo',
  },
  {
    id: 'ap-southeast-1',
    name: 'ap-southeast-1 (Singapore)',
    provider: 'AWS',
    intensity: 388,
    status: 'Medium',
    top: '58%',
    left: '78%',
    footprint: '2.8 MT CO2e / mo',
  }
];

export default function SustainabilityView() {
  const [regions, setRegions] = useState<CloudRegionNode[]>(initialRegions);
  const [selectedNode, setSelectedNode] = useState<CloudRegionNode | null>(regions[0]);
  const [jobsShifted, setJobsShifted] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

  const handleShiftWorkload = () => {
    setJobsShifted(true);
    setShowToast(true);
    // Update local us-east-1 state to show reduced footprint!
    setRegions(prev => prev.map(r => {
      if (r.id === 'us-east-1') {
        return { ...r, footprint: '4.8 MT CO2e / mo (Down 40%)' };
      }
      if (r.id === 'eu-west-1') {
        return { ...r, footprint: '2.4 MT CO2e / mo (+1.0 MT)' };
      }
      return r;
    }));
    setTimeout(() => setShowToast(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Carbon Toast Alert */}
      {showToast && (
        <div className="fixed top-20 right-8 z-50 bg-surface-container-high border border-tertiary/30 text-on-surface p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5 text-tertiary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-tertiary">Workload Successfully Shifted</p>
            <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
              Successfully migrated 12 staging cluster cron tasks to eu-west-1 (Ireland). Carbon emissions lowered by 3.4 MT CO2e!
            </p>
          </div>
        </div>
      )}

      {/* Nav & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            <span>FinOps</span>
            <span className="text-gray-500">/</span>
            <span className="text-primary font-medium">Carbon Intelligence</span>
          </nav>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            Sustainability & ESG Dashboard
          </h2>
          <p className="text-on-surface-variant max-w-2xl mt-1 text-sm leading-relaxed">
            Quantify and optimize the environmental footprint of your multi-cloud architecture through grid-carbon intensity routing.
          </p>
        </div>
      </div>

      {/* ESG Indicators cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-tertiary/10 text-tertiary rounded-xl flex items-center justify-center">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <p className="text-on-surface-variant text-[11px] uppercase tracking-wider font-mono">CO2 Reduction</p>
            <h3 className="text-xl font-bold text-on-surface mt-1">12.4 MT</h3>
            <p className="text-[10px] text-tertiary mt-0.5 font-semibold font-mono">-18% compared to last Q</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <p className="text-on-surface-variant text-[11px] uppercase tracking-wider font-mono">Energy Efficiency</p>
            <h3 className="text-xl font-bold text-on-surface mt-1">92%</h3>
            <p className="text-[10px] text-primary mt-0.5 font-semibold font-mono">PUE Factor: 1.12 (Optimal)</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-on-surface-variant text-[11px] uppercase tracking-wider font-mono">Green Cloud Score</p>
            <h3 className="text-xl font-bold text-on-surface mt-1">90/100</h3>
            <p className="text-[10px] text-tertiary mt-0.5 font-semibold font-mono">A-Rating (CDP compliant)</p>
          </div>
        </div>
      </div>

      {/* Regional Carbon Intensity map block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map panel */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden min-h-[460px]">
          <div>
            <h3 className="text-lg font-bold font-headline">Carbon-Aware Node Mapping</h3>
            <p className="text-xs text-on-surface-variant">Click on active pins to inspect regional carbon emission densities.</p>
          </div>

          {/* Grayscale map with absolute pin coordinates */}
          <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border border-outline-variant/10 my-6 bg-surface-container-lowest/50 flex items-center justify-center">
            <img 
              referrerPolicy="no-referrer"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnskgj1QnQJSbEtJ3pSAgE74HFA3ZCa-jj0O-V6n4ekNmf8B4CIftSzb0UeSXf_spOjOWHkqRbCKlICzRLzPJ0uelF129iu84TSKPW6NThGJc4AZL4W-_2K9p1bVe5IRWmX1sVA_5Sv33BRy8ABk2jtCA32LQOlCLrhuJL5Cra07yFCxfr2q2JJU956YSdqRwQmVvQNMK_c1rk3gLKMhnVwqFukd2Y9dzRm0ci1W3A3FbVMFq71Zih-m3E-9u61kKbDbqvPQ1PxRI" 
              alt="World carbon map" 
              className="w-full h-full object-cover opacity-20 filter grayscale contrast-125"
            />

            {/* Pins overlay */}
            {regions.map(r => {
              const isSelected = selectedNode?.id === r.id;
              const isHigh = r.status === 'High';
              const isLow = r.status === 'Low';
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedNode(r)}
                  style={{ top: r.top, left: r.left }}
                  className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all cursor-pointer group ${
                    isSelected ? 'scale-125 z-20' : 'scale-100 z-10'
                  }`}
                >
                  <span className={`absolute inset-0 rounded-full animate-ping opacity-45 ${
                    isHigh ? 'bg-error' : isLow ? 'bg-tertiary' : 'bg-primary'
                  }`}></span>
                  <span className={`w-3.5 h-3.5 rounded-full border border-surface flex items-center justify-center shadow-lg ${
                    isHigh ? 'bg-error' : isLow ? 'bg-tertiary' : 'bg-primary'
                  }`}>
                    {isSelected && <MapPin className="w-2.5 h-2.5 text-[#0b1326] fill-current" />}
                  </span>

                  {/* Hover visual tag */}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-[#171f33] text-[9px] font-mono border border-outline-variant/30 text-on-surface px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                    {r.name}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error"></span> High Density (&gt;350g/kWh)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary"></span> Medium Density (150-350g/kWh)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span> Low Density (&lt;150g/kWh)
            </span>
          </div>
        </div>

        {/* Node detail and optimization panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Details */}
          {selectedNode && (
            <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1.5">
                  <Server className="w-4 h-4" />
                  Region Profile
                </span>
                <h3 className="font-headline text-lg font-bold text-on-surface mt-2">{selectedNode.name}</h3>
                
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant">Cloud Provider</span>
                    <span className="font-semibold text-on-surface font-mono">{selectedNode.provider}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant">Grid Carbon Intensity</span>
                    <span className={`font-bold font-mono px-2 py-0.5 rounded ${
                      selectedNode.status === 'High' ? 'text-error bg-error/10' : selectedNode.status === 'Low' ? 'text-tertiary bg-tertiary/10' : 'text-primary bg-primary/10'
                    }`}>
                      {selectedNode.intensity} gCO2/kWh
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant">Monthly Carbon Footprint</span>
                    <span className="font-bold text-on-surface font-mono">{selectedNode.footprint}</span>
                  </div>
                </div>
              </div>

              {selectedNode.id === 'us-east-1' && (
                <div className="mt-8 pt-6 border-t border-outline-variant/15 space-y-4">
                  <div className="bg-[#93000a]/10 border border-[#93000a]/30 rounded-xl p-4 flex gap-3 items-start">
                    <Info className="w-5 h-5 text-error flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-error">Carbon Efficiency Warning</p>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">
                        Staging nodes in us-east-1 run during peak dirty-grid hours. Shifting computations will save 40% in emissions.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleShiftWorkload}
                    disabled={jobsShifted}
                    className="w-full py-3 bg-tertiary text-[#003824] font-bold rounded-xl shadow-lg hover:shadow-tertiary/25 hover:scale-[1.01] transition-all cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {jobsShifted ? 'Workloads Migrated' : 'Shift Non-Critical Staging Tasks'}
                  </button>
                </div>
              )}

              {selectedNode.id === 'eu-west-1' && (
                <div className="mt-8 pt-6 border-t border-outline-variant/15">
                  <div className="bg-tertiary/10 border border-tertiary/30 rounded-xl p-4 flex gap-3 items-start">
                    <CheckCircle className="w-5 h-5 text-tertiary flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-tertiary">Verified Hydro/Wind Source</p>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">
                        Ireland region is backed by 90% zero-carbon energy. Workloads hosted here exhibit exceptional ESG ratings.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Carbon mitigation table / actions summary */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="font-bold text-sm text-on-surface font-headline mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          ESG Actions & Mitigations
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 text-on-surface-variant font-mono font-medium">
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Workload Scope</th>
                <th className="py-3 px-4 text-right">Potential Reduction</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              <tr>
                <td className="py-3 px-4 font-medium">Shift non-critical batch runs</td>
                <td className="py-3 px-4 font-mono text-on-surface-variant">Production (us-east-1)</td>
                <td className="py-3 px-4 text-right text-tertiary font-bold font-mono">3.4 MT CO2e</td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    jobsShifted ? 'bg-tertiary/15 text-tertiary' : 'bg-primary/10 text-primary'
                  }`}>
                    {jobsShifted ? 'MIGRATED' : 'READY TO MIGRATE'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Autoscaling cleanup policies</td>
                <td className="py-3 px-4 font-mono text-on-surface-variant">Staging (ap-southeast-1)</td>
                <td className="py-3 px-4 text-right text-tertiary font-bold font-mono">1.2 MT CO2e</td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary text-[10px] font-bold">
                    COMPLETED
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
