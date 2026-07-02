/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  LineChart,
  Bot,
  Leaf,
  FileText,
  Settings,
  LogOut,
  Bell,
  Search,
  CheckCircle,
  AlertTriangle,
  Brain,
  Menu,
  X
} from 'lucide-react';
import { AppView, UserSession } from './types';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import RecommendationsView from './components/RecommendationsView';
import ForecastingView from './components/ForecastingView';
import AiAssistantView from './components/AiAssistantView';
import SustainabilityView from './components/SustainabilityView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';

export default function App() {
  const [session, setSession] = useState<UserSession>({
    isLoggedIn: false,
    email: '',
    name: '',
    role: '',
    avatar: '',
  });

  const [currentView, setCurrentView] = useState<AppView>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifications = [
    { id: 1, type: 'alert', text: 'Billing anomaly detected: S3 Oregon daily cost surged +$4k', time: '10m ago' },
    { id: 2, type: 'success', text: 'Sage automatically scaled down 12 idle EC2 nodes', time: '1h ago' },
    { id: 3, type: 'info', text: 'Carbon savings certificate issued for ap-southeast-1', time: '1d ago' },
  ];

  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
    setCurrentView('dashboard');
  };

  const handleSignOut = () => {
    setSession({
      isLoggedIn: false,
      email: '',
      name: '',
      role: '',
      avatar: '',
    });
    setCurrentView('login');
    setMobileMenuOpen(false);
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  if (!session.isLoggedIn || currentView === 'login') {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Navigation Items list
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'recommendations', label: 'Recommendations', icon: Sparkles },
    { id: 'forecasting', label: 'Predictive Forecasting', icon: LineChart },
    { id: 'ai-assistant', label: 'Sage AI Advisor', icon: Bot },
    { id: 'sustainability', label: 'Carbon Intelligence', icon: Leaf },
    { id: 'reports', label: 'Executive Reports', icon: FileText },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ] as const;

  return (
    <div className="relative bg-[#09090b] text-[#fafafa] min-h-screen flex font-sans overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/3 rounded-full blur-[100px]"></div>
      </div>

      {/* LEFT SIDEBAR - Desktop view */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#09090b] border-r border-[#27272a] p-6 relative z-35 flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-gradient-to-br from-[#3b82f6] to-[#a855f7] text-[#fafafa] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Brain className="w-5 h-5" />
          </div>
          <span className="font-headline font-bold text-lg tracking-tight text-[#fafafa]">
            CloudSage AI
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full py-3 px-4 rounded-xl flex items-center gap-3 text-xs font-medium transition-all border text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#18181b] border-[#27272a] text-primary font-bold shadow-[0_2px_10px_rgba(0,0,0,0.2)]'
                    : 'bg-transparent border-transparent text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b]/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-[#a1a1aa]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Log Out Footer */}
        <div className="pt-6 border-t border-[#27272a] mt-6 space-y-4">
          <div className="flex items-center gap-3.5">
            <img
              referrerPolicy="no-referrer"
              src={session.avatar}
              alt={session.name}
              className="w-10 h-10 rounded-full border border-[#27272a] object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">{session.name}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">{session.role}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-3 px-4 bg-error-container/10 text-error hover:bg-error-container/20 border border-error/20 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#09090b] border-b border-[#27272a] z-45 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <span className="font-headline font-bold text-base text-on-surface">CloudSage AI</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-on-surface hover:bg-surface-container rounded-lg cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-[#09090b] z-40 p-6 flex flex-col justify-between">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full py-3 px-4 rounded-xl flex items-center gap-3.5 text-xs font-semibold border text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#18181b] border-[#27272a] text-primary'
                      : 'bg-transparent border-transparent text-on-surface-variant'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-[#27272a] mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <img
                referrerPolicy="no-referrer"
                src={session.avatar}
                alt={session.name}
                className="w-9 h-9 rounded-full border border-primary/25 object-cover"
              />
              <div>
                <p className="text-xs font-bold text-on-surface">{session.name}</p>
                <p className="text-[10px] text-on-surface-variant">{session.role}</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-3 px-4 bg-error-container/20 text-error rounded-xl flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 lg:pt-0 pt-16 relative z-10">
        {/* TOP NAVBAR */}
        <header className="h-20 border-b border-[#27272a] px-6 md:px-10 flex items-center justify-between flex-shrink-0 bg-[#09090b]/80 backdrop-blur-md relative z-30">
          {/* Search bar mockup */}
          <div className="relative w-full max-w-md hidden md:block group">
            <Search className="absolute left-4 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search resource tags, services, or budget models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary text-xs text-on-surface placeholder:text-outline/60"
            />
          </div>

          <div className="flex items-center gap-4 ml-auto relative">
            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] rounded-xl text-on-surface-variant hover:text-on-surface cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full animate-pulse"></span>
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl p-4 space-y-3 z-50">
                  <div className="flex justify-between items-center border-b border-[#27272a] pb-2">
                    <span className="text-xs font-bold text-on-surface">Recent Alerts</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-[10px] text-primary hover:underline font-bold font-mono"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2.5 bg-[#27272a]/40 rounded-xl flex items-start gap-2.5 text-[11px] leading-normal hover:bg-[#27272a]/80 transition-all">
                        {n.type === 'alert' && <AlertTriangle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />}
                        {n.type === 'success' && <CheckCircle className="w-4 h-4 text-tertiary mt-0.5 flex-shrink-0" />}
                        {n.type === 'info' && <Bot className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />}
                        <div className="flex-1">
                          <p className="text-on-surface font-medium">{n.text}</p>
                          <p className="text-[9px] text-on-surface-variant font-mono mt-1">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Summary Badge */}
            <div 
              onClick={() => handleNavigate('settings')}
              className="flex items-center gap-3 px-3 py-1.5 bg-[#18181b] rounded-xl border border-[#27272a] hover:border-primary/25 cursor-pointer transition-colors"
            >
              <img
                referrerPolicy="no-referrer"
                src={session.avatar}
                alt={session.name}
                className="w-7 h-7 rounded-full object-cover border border-[#27272a]"
              />
              <div className="hidden sm:block">
                <p className="text-[11px] font-bold text-on-surface">{session.name}</p>
                <p className="text-[9px] text-[#a1a1aa] font-mono font-medium">{session.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT FIELD */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 z-10">
          {currentView === 'dashboard' && <DashboardView onNavigateToTab={handleNavigate} />}
          {currentView === 'recommendations' && <RecommendationsView onNavigateToTab={handleNavigate} />}
          {currentView === 'forecasting' && <ForecastingView onNavigateToTab={handleNavigate} />}
          {currentView === 'ai-assistant' && <AiAssistantView onNavigateToTab={handleNavigate} />}
          {currentView === 'sustainability' && <SustainabilityView />}
          {currentView === 'reports' && <ReportsView />}
          {currentView === 'settings' && (
            <SettingsView session={session} onUpdateSession={(updated) => setSession(updated)} />
          )}
        </main>
      </div>
    </div>
  );
}
