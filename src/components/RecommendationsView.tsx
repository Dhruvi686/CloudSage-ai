/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Download,
  Bolt,
  Check,
  Cpu,
  Database,
  HardDrive,
  Info,
  TrendingUp,
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Recommendation } from '../types';

interface RecommendationsViewProps {
  onNavigateToTab: (tab: 'dashboard' | 'recommendations' | 'forecasting' | 'ai-assistant' | 'sustainability' | 'reports' | 'settings') => void;
}



export default function RecommendationsView({ onNavigateToTab }: RecommendationsViewProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [accountFilter, setAccountFilter] = useState('Production (3042)');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [backendLoaded, setBackendLoaded] = useState(false);

  // ── Fetch live recommendations from FastAPI backend ──────────────────
  useEffect(() => {
    fetch('/pyapi/api/recommendations')
      .then((r) => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) {
          setRecommendations([]);
          return;
        }
        // Map backend response fields → frontend Recommendation type
        const mapped: Recommendation[] = data.map((item, idx) => ({
          id: `rec-live-${idx}`,
          title: item.recommendation ?? 'Optimization Recommendation',
          service:
            item.service === 'EC2' ? 'EC2 Instances'
            : item.service === 'S3' ? 'S3 Buckets'
            : item.service === 'RDS' ? 'RDS Databases'
            : 'Lambda Functions',
          resourceId: item.resource_id ?? '',
          actionFrom: item.current_value ?? '',
          actionTo: item.recommendation ?? '',
          priority: (item.priority as 'High' | 'Medium' | 'Low') ?? 'Low',
          monthlySavings: item.monthly_savings ?? 0,
          confidence: item.confidence ?? 80,
          utilization: item.current_value ?? '',
          businessImpact: item.business_impact,
          saved: false,
          accepted: false,
        }));
        setRecommendations(mapped);
        setBackendLoaded(true);
      })
      .catch(() => {
        setRecommendations([]);
      });
  }, []);
  // ─────────────────────────────────────────────────────────────────────

  const handleAccept = (id: string, title: string) => {
    setRecommendations(recs =>
      recs.map(r => r.id === id ? { ...r, accepted: true } : r)
    );
    setToastMessage(`Accepted recommendation: "${title}" is being applied to your cloud account.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveLater = (id: string, title: string) => {
    setRecommendations(recs =>
      recs.map(r => r.id === id ? { ...r, saved: !r.saved } : r)
    );
    const isSaved = !recommendations.find(r => r.id === id)?.saved;
    setToastMessage(isSaved ? `Saved "${title}" for later review.` : `Removed "${title}" from saved list.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyAllHighPriority = () => {
    setRecommendations(recs =>
      recs.map(r => r.priority === 'High' ? { ...r, accepted: true } : r)
    );
    setToastMessage('Successfully applying all High Priority recommendations.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter recommendations
  const filteredRecs = recommendations.filter(r => {
    if (serviceFilter !== 'All Services' && r.service !== serviceFilter) return false;
    if (priorityFilter !== 'All Priorities' && r.priority !== priorityFilter) return false;
    return true;
  });

  // Calculate annual savings for remaining active recommendations
  const totalAnnualSavings = recommendations
    .filter(r => !r.accepted)
    .reduce((acc, r) => acc + (r.monthlySavings * 12), 0);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-surface-container-high border border-primary/20 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <Check className="w-5 h-5 text-tertiary" />
          <p className="text-xs text-on-surface-variant font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Page Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            <span>FinOps</span>
            <span className="text-gray-500">/</span>
            <span className="text-primary font-medium">Recommendations</span>
          </nav>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            Resource Optimization Hub
          </h2>
          <p className="text-on-surface-variant max-w-2xl mt-1 text-sm leading-relaxed">
            AI-driven actionable insights to reduce cloud waste and maximize your infrastructure value across all accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-semibold hover:bg-surface-variant/30 transition-all flex items-center gap-2 cursor-pointer text-xs">
            <Download className="w-4 h-4 text-on-surface-variant" />
            <span>Export PDF</span>
          </button>
          <button 
            onClick={handleApplyAllHighPriority}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer text-xs"
          >
            <Bolt className="w-4 h-4" />
            <span>Apply All High-Priority</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">Service:</span>
          <select 
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="bg-transparent border-none text-xs focus:ring-0 cursor-pointer text-on-surface font-medium outline-none"
          >
            <option value="All Services" className="bg-[#171f33]">All Services</option>
            <option value="EC2 Instances" className="bg-[#171f33]">EC2 Instances</option>
            <option value="S3 Buckets" className="bg-[#171f33]">S3 Buckets</option>
            <option value="RDS Databases" className="bg-[#171f33]">RDS Databases</option>
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">Account:</span>
          <select 
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="bg-transparent border-none text-xs focus:ring-0 cursor-pointer text-on-surface font-medium outline-none"
          >
            <option value="Production (3042)" className="bg-[#171f33]">Production (3042)</option>
            <option value="Staging (9921)" className="bg-[#171f33]">Staging (9921)</option>
            <option value="Dev (1120)" className="bg-[#171f33]">Dev (1120)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">Priority:</span>
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-transparent border-none text-xs focus:ring-0 cursor-pointer text-on-surface font-medium outline-none"
          >
            <option value="All Priorities" className="bg-[#171f33]">All Priorities</option>
            <option value="High" className="bg-[#171f33]">High Priority</option>
            <option value="Medium" className="bg-[#171f33]">Medium Priority</option>
            <option value="Low" className="bg-[#171f33]">Low Priority</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="h-8 w-px bg-outline-variant/30 hidden md:block"></div>
          <span className="text-xs text-on-surface-variant">
            Showing <strong className="text-on-surface">{filteredRecs.length}</strong> insights
          </span>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {filteredRecs.map((rec) => {
          const isEC2 = rec.service === 'EC2 Instances';
          const isS3 = rec.service === 'S3 Buckets';

          return (
            <div 
              key={rec.id} 
              className={`rounded-2xl border transition-all ${
                rec.priority === 'High' 
                  ? 'ai-gradient-border' 
                  : 'glass-panel border-outline-variant/20 hover:border-primary/30'
              } ${rec.accepted ? 'opacity-55 scale-[0.98]' : ''}`}
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  {/* Service Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    isEC2 ? 'bg-primary/10 text-primary' : isS3 ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary/10 text-secondary'
                  }`}>
                    {isEC2 && <Cpu className="w-5 h-5" />}
                    {isS3 && <HardDrive className="w-5 h-5" />}
                    {!isEC2 && !isS3 && <Database className="w-5 h-5" />}
                  </div>

                  <div className="flex flex-col items-end">
                    {/* Priority Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                      rec.priority === 'High' 
                        ? 'bg-error/10 text-error border-error/20' 
                        : rec.priority === 'Medium'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-on-surface-variant/10 text-on-surface-variant border-outline-variant/30'
                    }`}>
                      {rec.priority} Priority
                    </span>
                    {/* Savings Display */}
                    <span className={`mt-2 font-bold text-xl tracking-tight ${
                      isEC2 ? 'text-primary' : isS3 ? 'text-tertiary' : 'text-on-surface'
                    }`}>
                      ${rec.monthlySavings}
                      <span className="text-xs font-normal text-on-surface-variant">/mo</span>
                    </span>
                  </div>
                </div>

                <h3 className="font-headline text-lg font-bold text-on-surface mb-1">
                  {rec.title}
                </h3>
                
                {/* Custom Action Description */}
                <p className="text-on-surface-variant text-xs mb-6 leading-relaxed">
                  {isEC2 && (
                    <>
                      Resize instance <code className="bg-surface-container-highest px-1.5 py-0.5 rounded text-primary text-[10px] font-mono">{rec.resourceId}</code> from <span className="line-through opacity-50">{rec.actionFrom}</span> to <span className="text-tertiary font-semibold">{rec.actionTo}</span>.
                    </>
                  )}
                  {isS3 && (
                    <>
                      Move bucket <code className="bg-surface-container-highest px-1.5 py-0.5 rounded text-primary text-[10px] font-mono">{rec.resourceId}</code> to Glacier Instant Retrieval.
                    </>
                  )}
                  {!isEC2 && !isS3 && (
                    <>
                      Stop unused instance <code className="bg-surface-container-highest px-1.5 py-0.5 rounded text-primary text-[10px] font-mono">{rec.resourceId}</code> identified as non-critical.
                    </>
                  )}
                </p>

                {/* Sub data blocks */}
                {isEC2 && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10">
                      <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-mono mb-1">Confidence</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-on-surface font-mono">{rec.confidence}%</span>
                        <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-tertiary rounded-full" style={{ width: `${rec.confidence}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10">
                      <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-mono mb-1">Utilization</p>
                      <span className="text-xs font-bold text-on-surface font-mono">{rec.utilization}</span>
                    </div>
                  </div>
                )}

                {isS3 && (
                  <div className="space-y-3 mb-6 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">Data Age</span>
                      <span className="font-semibold text-on-surface font-mono">{rec.dataAge}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">Access Frequency</span>
                      <span className="font-semibold text-on-surface font-mono">{rec.accessFrequency}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                )}

                {rec.businessImpact && (
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-primary">Business Impact</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {rec.businessImpact}
                    </p>
                  </div>
                )}

                {/* Actions bottom alignment */}
                <div className="mt-auto space-y-3">
                  <button 
                    disabled={rec.accepted}
                    onClick={() => handleAccept(rec.id, rec.title)}
                    className={`w-full py-3 rounded-xl font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-2 ${
                      rec.accepted 
                        ? 'bg-tertiary/10 text-tertiary border border-tertiary/20' 
                        : 'bg-primary text-on-primary hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.01]'
                    }`}
                  >
                    {rec.accepted ? (
                      <>
                        <Check className="w-4 h-4" />
                        Recommendation Applied
                      </>
                    ) : (
                      'Accept Recommendation'
                    )}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleSaveLater(rec.id, rec.title)}
                      className="py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20 text-on-surface-variant font-semibold hover:text-on-surface transition-colors text-xs cursor-pointer"
                    >
                      {rec.saved ? 'Unsave' : 'Save for Later'}
                    </button>
                    <button 
                      onClick={() => onNavigateToTab('forecasting')}
                      className="py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20 text-on-surface-variant font-semibold hover:text-on-surface transition-colors text-xs cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dashboard Summary Widgets (Asymmetric Layout) */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 glass-panel p-8 rounded-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-24 h-24 text-primary" />
          </div>
          <div className="relative z-10">
            <h4 className="font-headline text-xl font-bold mb-2">Potential Annual Savings</h4>
            <p className="text-on-surface-variant mb-6 text-sm">Based on current active recommendations across all 12 cloud accounts.</p>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-extrabold text-primary font-mono">${totalAnnualSavings.toLocaleString()}</span>
              {totalAnnualSavings > 0 && (
                <span className="text-tertiary font-bold flex items-center gap-1 text-xs">
                  <TrendingUp className="w-4 h-4" />
                  +12% from last month
                </span>
              )}
            </div>
          </div>
          <div className="mt-8 grid grid-cols-4 gap-4">
            <div className="h-2 bg-primary rounded-full"></div>
            <div className="h-2 bg-tertiary rounded-full"></div>
            <div className="h-2 bg-secondary rounded-full"></div>
            <div className="h-2 bg-surface-container-highest rounded-full"></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-6 text-xs font-mono text-on-surface-variant">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Compute (45%)</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span> Storage (30%)</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-secondary"></span> Database (15%)</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span> Other (10%)</div>
          </div>
        </div>

        <div className="md:col-span-4 bg-primary text-on-primary-container p-8 rounded-2xl flex flex-col justify-between hover:scale-[1.01] transition-transform">
          <div>
            <Sparkles className="w-8 h-8 mb-4 text-on-primary-container" />
            <h4 className="font-headline text-lg font-bold leading-tight">AI Assistant is ready.</h4>
            <p className="mt-2 text-on-primary-container/80 text-xs font-medium leading-relaxed">
              &quot;I noticed your Lambda execution costs surged by 24% in us-east-1. Would you like me to analyze for cold start optimization?&quot;
            </p>
          </div>
          <button 
            onClick={() => onNavigateToTab('ai-assistant')}
            className="mt-6 bg-on-primary-container text-primary font-bold py-3 px-6 rounded-xl w-full flex items-center justify-center gap-2 hover:opacity-95 transition-opacity cursor-pointer text-xs"
          >
            Chat with Sage
          </button>
        </div>
      </div>
    </div>
  );
}
