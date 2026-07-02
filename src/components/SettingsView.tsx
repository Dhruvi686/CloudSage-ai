/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  User,
  Bell,
  Cpu,
  Key,
  ShieldAlert,
  Save,
  CheckCircle2,
  Lock,
  Globe,
  UploadCloud,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  HardDrive,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { UserSession } from '../types';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface DatasetUploadState {
  status: UploadStatus;
  message: string;
  rows?: number;
  dataset?: string;
}

interface SettingsViewProps {
  session: UserSession;
  onUpdateSession: (session: UserSession) => void;
}

export default function SettingsView({ session, onUpdateSession }: SettingsViewProps) {
  const [name, setName] = useState(session.name);
  const [role, setRole] = useState(session.role);
  const [alertThreshold, setAlertThreshold] = useState('15000');
  const [enableAutoScale, setEnableAutoScale] = useState(true);
  const [showToast, setShowToast] = useState(false);

  // ── Dataset Upload State ───────────────────────────────────────────────
  const [uploads, setUploads] = useState<Record<string, DatasetUploadState>>({
    ec2:    { status: 'idle', message: 'ec2.csv — resource_id, instance_type, cpu_usage, memory_usage, monthly_cost, region' },
    s3:     { status: 'idle', message: 's3.csv — bucket_name, size_gb, last_access_days, monthly_cost' },
    rds:    { status: 'idle', message: 'rds.csv — db_name, instance_type, connections, cpu_usage, monthly_cost' },
    lambda: { status: 'idle', message: 'lambda.csv — function_name, memory_allocated_mb, memory_used_mb, monthly_cost' },
  });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploads(prev => ({
        ...prev,
        _error: { status: 'error', message: `"${file.name}" is not a CSV file.` },
      }));
      return;
    }

    // Optimistically mark as uploading
    const tempKey = `uploading_${Date.now()}`;
    setUploads(prev => ({ ...prev, [tempKey]: { status: 'uploading', message: `Uploading ${file.name}...` } }));

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/pyapi/api/upload', { method: 'POST', body: form });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        const ds: string = data.dataset;
        setUploads(prev => {
          const next = { ...prev };
          delete next[tempKey];
          next[ds] = {
            status: 'success',
            message: `${file.name} uploaded successfully`,
            rows: data.rows_inserted,
            dataset: ds.toUpperCase(),
          };
          return next;
        });
      } else {
        setUploads(prev => {
          const next = { ...prev };
          delete next[tempKey];
          next[`err_${Date.now()}`] = {
            status: 'error',
            message: data.detail || `Upload failed: ${file.name}`,
          };
          return next;
        });
      }
    } catch {
      setUploads(prev => {
        const next = { ...prev };
        delete next[tempKey];
        next[`err_${Date.now()}`] = {
          status: 'error',
          message: 'Cannot reach backend. Make sure the FastAPI server is running on port 8000.',
        };
        return next;
      });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(uploadFile);
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(uploadFile);
    e.target.value = '';
  }, [uploadFile]);

  const resetDataset = (key: string) => {
    const defaults: Record<string, string> = {
      ec2:    'ec2.csv — resource_id, instance_type, cpu_usage, memory_usage, monthly_cost, region',
      s3:     's3.csv — bucket_name, size_gb, last_access_days, monthly_cost',
      rds:    'rds.csv — db_name, instance_type, connections, cpu_usage, monthly_cost',
      lambda: 'lambda.csv — function_name, memory_allocated_mb, memory_used_mb, monthly_cost',
    };
    setUploads(prev => ({
      ...prev,
      [key]: { status: 'idle', message: defaults[key] || '' },
    }));
  };
  // ─────────────────────────────────────────────────────────────────────────

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSession({ ...session, name, role });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed top-20 right-8 z-50 bg-surface-container-high border border-tertiary/30 text-on-surface p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-tertiary" />
          <p className="text-xs font-bold text-tertiary">Settings Saved Successfully</p>
        </div>
      )}

      {/* Nav Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
          <span>FinOps</span>
          <span className="text-gray-500">/</span>
          <span className="text-primary font-medium">Platform Settings</span>
        </nav>
        <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
          Configuration & Credentials
        </h2>
        <p className="text-on-surface-variant max-w-2xl mt-1 text-sm leading-relaxed">
          Manage your cloud account integrations, profile parameters, and automated optimizer rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings options */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl">
          <form onSubmit={handleSave} className="space-y-6">
            <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
              <User className="w-5 h-5 text-primary" />
              UserProfile Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-mono text-xs uppercase tracking-wider text-on-surface-variant" htmlFor="username">
                  Your Full Name
                </label>
                <input
                  id="username"
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-xs text-on-surface"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs uppercase tracking-wider text-on-surface-variant" htmlFor="userrole">
                  Organizational Role
                </label>
                <input
                  id="userrole"
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-xs text-on-surface"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>

            <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3 pt-4">
              <Bell className="w-5 h-5 text-primary" />
              Budget Threshold Alerts
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-mono text-xs uppercase tracking-wider text-on-surface-variant" htmlFor="budgetlimit">
                  Daily Spend Alert Trigger ($)
                </label>
                <input
                  id="budgetlimit"
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-xs text-on-surface font-mono"
                  type="number"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 md:pt-8">
                <input
                  id="autoscale"
                  type="checkbox"
                  checked={enableAutoScale}
                  onChange={(e) => setEnableAutoScale(e.target.checked)}
                  className="w-4 h-4 bg-surface-container-high border-outline-variant/30 text-primary rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="autoscale" className="text-xs text-on-surface-variant font-medium cursor-pointer">
                  Enable automatic right-sizing via Sage optimizer triggers
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-primary text-on-primary font-bold rounded-xl flex items-center gap-2 hover:scale-[1.01] transition-transform cursor-pointer text-xs"
            >
              <Save className="w-4 h-4" />
              Save Configuration Changes
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant font-mono flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                API Secrets Guidance
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-4">
                CloudSage AI automatically leverages the <code className="bg-surface-container-highest px-1 py-0.5 rounded text-primary">GEMINI_API_KEY</code> injected by AI Studio. You can configure it inside the <strong className="text-on-surface">Settings &gt; Secrets</strong> panel of the AI Studio workspace interface.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant/15 space-y-4">
              <div className="flex items-center gap-3 text-xs">
                <Lock className="w-4 h-4 text-tertiary flex-shrink-0" />
                <span className="text-on-surface-variant">All keys are secured end-to-end</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Globe className="w-4 h-4 text-tertiary flex-shrink-0" />
                <span className="text-on-surface-variant">SOC2 audit logs active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── CSV Data Ingestion Section ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="mb-2">
          <h3 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            Dataset Ingestion
          </h3>
          <p className="text-on-surface-variant text-xs mt-1 leading-relaxed">
            Upload your own CSV datasets to replace the mock data. The backend auto-detects the dataset type
            from the column names — no manual selection required.
          </p>
        </div>

        {/* Drag-and-drop zone */}
        <div
          id="csv-drop-zone"
          role="button"
          tabIndex={0}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          className={`glass-panel rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
            flex flex-col items-center justify-center gap-3 py-10 px-6 text-center select-none
            ${dragOver
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : 'border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-high/40'
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors
            ${dragOver ? 'bg-primary/20' : 'bg-surface-container-high'}`}>
            <UploadCloud className={`w-7 h-7 transition-colors ${dragOver ? 'text-primary' : 'text-on-surface-variant'}`} />
          </div>
          <div>
            <p className="font-bold text-on-surface text-sm">
              {dragOver ? 'Drop CSV files here' : 'Drag & drop CSV files here'}
            </p>
            <p className="text-on-surface-variant text-xs mt-1">
              or <span className="text-primary font-semibold underline">click to browse</span> — multiple files supported
            </p>
          </div>
          <p className="text-on-surface-variant/60 text-xs font-mono">
            Supported: ec2.csv · s3.csv · rds.csv · lambda.csv
          </p>
        </div>

        {/* Per-dataset status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { key: 'ec2',    label: 'EC2 Instances',    Icon: Cpu,       color: 'text-blue-400' },
            { key: 's3',     label: 'S3 Buckets',       Icon: HardDrive, color: 'text-amber-400' },
            { key: 'rds',    label: 'RDS Databases',    Icon: Database,  color: 'text-purple-400' },
            { key: 'lambda', label: 'Lambda Functions', Icon: Zap,       color: 'text-green-400' },
          ].map(({ key, label, Icon, color }) => {
            const up = uploads[key];
            return (
              <div
                key={key}
                className={`glass-panel rounded-xl p-4 border transition-all duration-300
                  ${up.status === 'success' ? 'border-tertiary/40 bg-tertiary/5'
                  : up.status === 'error'   ? 'border-error/40 bg-error/5'
                  : up.status === 'uploading' ? 'border-primary/40 bg-primary/5'
                  : 'border-outline-variant/20'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-xs font-bold text-on-surface">{label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {up.status === 'idle'      && <FileText className="w-3.5 h-3.5 text-on-surface-variant/40" />}
                    {up.status === 'uploading' && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
                    {up.status === 'success'   && <CheckCircle className="w-3.5 h-3.5 text-tertiary" />}
                    {up.status === 'error'     && <XCircle className="w-3.5 h-3.5 text-error" />}
                  </div>
                </div>

                {up.status === 'success' ? (
                  <div className="space-y-1">
                    <p className="text-tertiary text-xs font-semibold">
                      {up.rows} rows ingested
                    </p>
                    <p className="text-on-surface-variant/70 text-xs truncate">{up.message}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); resetDataset(key); }}
                      className="mt-2 flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset status
                    </button>
                  </div>
                ) : up.status === 'error' ? (
                  <div className="space-y-1">
                    <p className="text-error text-xs font-semibold">Upload failed</p>
                    <p className="text-on-surface-variant/70 text-xs leading-relaxed">{up.message}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); resetDataset(key); }}
                      className="mt-2 flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Try again
                    </button>
                  </div>
                ) : up.status === 'uploading' ? (
                  <p className="text-primary text-xs">Processing...</p>
                ) : (
                  <p className="text-on-surface-variant/50 text-xs font-mono leading-relaxed">{up.message}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Schema quick-reference */}
        <div className="glass-panel rounded-xl p-4 border border-outline-variant/20">
          <p className="text-xs font-bold text-on-surface mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Required CSV Column Reference
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-on-surface-variant/70">
            <div><span className="text-primary font-semibold">ec2.csv: </span>resource_id, instance_type, cpu_usage, memory_usage, monthly_cost, region</div>
            <div><span className="text-amber-400 font-semibold">s3.csv: </span>bucket_name, size_gb, last_access_days, monthly_cost</div>
            <div><span className="text-purple-400 font-semibold">rds.csv: </span>db_name, instance_type, connections, cpu_usage, monthly_cost</div>
            <div><span className="text-green-400 font-semibold">lambda.csv: </span>function_name, memory_allocated_mb, memory_used_mb, monthly_cost</div>
          </div>
          <p className="text-on-surface-variant/40 text-xs mt-3">
            Optional columns: region, environment, hours_running, storage_gb, invocations, avg_duration_ms, object_count, storage_class
          </p>
        </div>
      </div>
      {/* ──────────────────────────────────────────────────────────────── */}
    </div>
  );
}
