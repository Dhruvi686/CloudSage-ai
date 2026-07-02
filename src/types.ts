/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppView =
  | 'login'
  | 'dashboard'
  | 'recommendations'
  | 'forecasting'
  | 'ai-assistant'
  | 'sustainability'
  | 'reports'
  | 'settings';

export interface UserSession {
  isLoggedIn: boolean;
  email: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Recommendation {
  id: string;
  title: string;
  service: string;
  resourceId: string;
  actionFrom: string;
  actionTo: string;
  priority: 'High' | 'Medium' | 'Low';
  monthlySavings: number;
  confidence: number;
  utilization: string;
  dataAge?: string;
  accessFrequency?: string;
  businessImpact?: string;
  saved: boolean;
  accepted: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  chartData?: { hour: string; value: number; isSpike?: boolean }[];
  actionLabel?: string;
  actionId?: string;
}

export interface ChatThread {
  id: string;
  title: string;
  iconType: 'query_stats' | 'airplane_ticket' | 'savings' | 'shield';
  timeAgo: string;
  messages: ChatMessage[];
}

export interface ForecastSimulation {
  reservedPercent: number;
  storageTierShift: number; // 0 = Conservative, 1 = Moderate, 2 = Aggressive
  idleCleanup: number;
}
