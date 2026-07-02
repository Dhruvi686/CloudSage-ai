/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, Brain, ArrowRight, TrendingDown, Zap, Shield } from 'lucide-react';
import { UserSession } from '../types';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('alex.rivera@enterprise.io');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        isLoggedIn: true,
        email,
        name: 'Alex Rivera',
        role: 'FinOps Manager',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAA9asp6yMnsTPebMhILsB1_puvgDM3YJ2dbHnhK6mP-puThks_XZg9oYfmBXC2UBpueMjssjOnt2FytzfNmr4maZFiIaiZmGQQyN_r-wimO-AnroHXPV-rtS6sI5feTrg5DESgz03uklL3bkL0IoftTjNEkCYoOajKKsdsit_NxlTULpmToAirPzOMAWtUJFWVe5PLoTXENkX_uXAyaDgc_oq9jhpeyeio4JIiZzjwg3GstUr8iVNocw0oVLSGwXkkb6I0xfR-GfI',
      });
      setIsLoading(false);
    }, 800);
  };

  const handleSSOLogin = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        isLoggedIn: true,
        email: provider === 'google' ? 'alex.rivera@gmail.com' : 'alex.rivera@aws.enterprise.io',
        name: 'Alex Rivera',
        role: provider === 'google' ? 'FinOps Director' : 'Infrastructure Lead',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAA9asp6yMnsTPebMhILsB1_puvgDM3YJ2dbHnhK6mP-puThks_XZg9oYfmBXC2UBpueMjssjOnt2FytzfNmr4maZFiIaiZmGQQyN_r-wimO-AnroHXPV-rtS6sI5feTrg5DESgz03uklL3bkL0IoftTjNEkCYoOajKKsdsit_NxlTULpmToAirPzOMAWtUJFWVe5PLoTXENkX_uXAyaDgc_oq9jhpeyeio4JIiZzjwg3GstUr8iVNocw0oVLSGwXkkb6I0xfR-GfI',
      });
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="relative bg-[#09090b] text-[#fafafa] min-h-screen flex items-center justify-center font-sans overflow-hidden selection:bg-primary-container selection:text-on-primary-container w-full">
      {/* Ambient Background Blur Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-secondary/3 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-[1200px] grid lg:grid-cols-2 gap-12 px-6 md:px-10 items-center">
        {/* Left Side: Login Card */}
        <div className="flex justify-center lg:justify-start">
          <div className="glass-panel w-full max-w-md p-8 md:p-10 rounded-[24px] border border-[#27272a] bg-[#18181b] shadow-2xl transition-all duration-500 hover:border-[#3b82f6]/30">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#3b82f6] to-[#a855f7] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] text-[#fafafa]">
                <Brain className="w-6 h-6" />
              </div>
              <h1 className="font-headline text-2xl tracking-tight font-extrabold text-[#fafafa]">
                CloudSage AI
              </h1>
            </div>
            <p className="text-[#a1a1aa] text-sm mb-8 leading-relaxed">
              Transform Cloud Spend into Strategic Advantage
            </p>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="font-mono text-xs uppercase tracking-wider text-[#a1a1aa]" htmlFor="email">
                  Corporate Email
                </label>
                <div className="relative group neon-focus flex items-center bg-[#09090b] rounded-xl border border-[#27272a] transition-all">
                  <span className="absolute left-4 text-[#a1a1aa]">@</span>
                  <input
                    className="w-full bg-transparent border-none py-4 pl-12 pr-4 focus:outline-none text-[#fafafa] placeholder:text-outline/60 text-sm"
                    id="email"
                    placeholder="name@company.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-mono text-xs uppercase tracking-wider text-[#a1a1aa]" htmlFor="password">
                    Password
                  </label>
                  <a className="text-xs text-primary hover:underline transition-all font-medium" href="#forgot">
                    Forgot?
                  </a>
                </div>
                <div className="relative group neon-focus flex items-center bg-[#09090b] rounded-xl border border-[#27272a] transition-all">
                  <Lock className="absolute left-4 w-4 h-4 text-[#a1a1aa]" />
                  <input
                    className="w-full bg-transparent border-none py-4 pl-12 pr-4 focus:outline-none text-[#fafafa] placeholder:text-outline/60 text-sm"
                    id="password"
                    placeholder="••••••••"
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                disabled={isLoading}
                className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:bg-primary-container hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                type="submit"
              >
                {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
              </button>
            </form>

            {/* SSO Section */}
            <div className="mt-8">
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-outline-variant/20"></div>
                <span className="flex-shrink mx-4 font-mono text-[10px] text-outline uppercase tracking-widest">
                  Enterprise SSO
                </span>
                <div className="flex-grow border-t border-outline-variant/20"></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => handleSSOLogin('google')}
                  className="flex items-center justify-center gap-3 py-3 px-4 glass-panel rounded-xl hover:bg-surface-variant/30 transition-all active:scale-[0.95] cursor-pointer"
                >
                  <img
                    className="w-5 h-5 rounded-full object-contain"
                    referrerPolicy="no-referrer"
                    alt="Google login"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeKY3pb3Cl5WRZmwKgTeG_EPwFBMep_ZfM3AEahKDCLGXjNVzPXjYcJBPihT7pZOqLBOmFTtk96bOwc7KOV0qQXND9GTZnMB0I7p5Vh_VT_3X697GxqO0t9M81ciNNns0jpKwSUSJAYFfhwLolIGWlo5u8kanqud9XG3TULomOlpkR3M8P75GptIb-NKlTS3WTD-B3c4Wdq_CKDR7x8SRs7mFxNQBbTKDrRk1xNCj6NDm_S_tX0qAl-UqKZ640Ehnvc2zT7gjvWMw"
                  />
                  <span className="text-sm font-medium">Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSSOLogin('aws')}
                  className="flex items-center justify-center gap-3 py-3 px-4 glass-panel rounded-xl hover:bg-surface-variant/30 transition-all active:scale-[0.95] cursor-pointer"
                >
                  <img
                    className="w-5 h-5 object-contain"
                    referrerPolicy="no-referrer"
                    alt="AWS login"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHIGxxajeZLzRdwjvt0mwoj8fVMKZ0J0gcU_8J1WEfDFsdr2iTMp_du0Xl49jfvwkHQRL4Tr2EIVlol2Mx3mqKP70b_GUt6hHaQao6XRSWpBuINNU-Ol3TOhdzW8iPa2rBz6Qf5idVpiEoSXoUSSV17kTONcpWDADczfXwCp3erHzPEeyBQsQBfvuaVhc9lomHEGQmuOtHKiV67YYMrlwBom6Lr_gi_wFTgTwRDy8sQyGDlQrWfvB_eVQ6sUJwy6Vf-szZ5LF_kYQ"
                  />
                  <span className="text-sm font-medium">AWS</span>
                </button>
              </div>
            </div>

            {/* Footer Links */}
            <div className="mt-10 pt-8 border-t border-outline-variant/10 flex justify-between items-center">
              <p className="text-xs text-on-surface-variant">New to CloudSage?</p>
              <a className="text-xs font-bold text-tertiary hover:text-tertiary-fixed transition-colors flex items-center gap-1 group" href="#request">
                Request Access
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: Visualization & Messaging */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-12">
          <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
            {/* Floating 3D Cloud Brain Sculpture */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <div className="animate-float w-72 h-72 relative">
                <div
                  className="w-full h-full bg-contain bg-no-repeat bg-center drop-shadow-[0_0_40px_rgba(173,198,255,0.4)]"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB8AzzHSds5Z4KfhP6jdvz2cLqoYjhBpsbNkclxr5-HXvo0dTw7OHClGhsT_MYX7bwEhuEY_ZL2g5Wfhyg7RZpY9YwVQXw8mylLh6sATNPvnPg6BEyn0TM3NCV0gpLuMvuy2vcC_bdmPxZD8HBCu3wizJd6ahMMzA-P1CzmZ06EX_PsrJHbYtxSAECyk0dS7Uh7a37DK4ixgwLE0xRmVaWdnJqKMR6ZR3R2CczUcHixRiQoaZWCRRfGXT3_O135dG27tG4HShvXWsg')`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="text-center space-y-6">
            <h2 className="font-headline text-4xl leading-tight font-bold">
              Cost Efficiency <br />
              <span className="brand-gradient-text">Meets Intelligence</span>
            </h2>
            <div className="flex justify-center gap-8">
              <div className="flex flex-col items-center">
                <TrendingDown className="w-5 h-5 text-tertiary mb-2" />
                <span className="font-mono text-[11px] uppercase text-outline">32% Savings</span>
              </div>
              <div className="w-[1px] h-10 bg-outline-variant/30"></div>
              <div className="flex flex-col items-center">
                <Zap className="w-5 h-5 text-primary mb-2" />
                <span className="font-mono text-[11px] uppercase text-outline">Real-time Ops</span>
              </div>
              <div className="w-[1px] h-10 bg-outline-variant/30"></div>
              <div className="flex flex-col items-center">
                <Shield className="w-5 h-5 text-on-secondary-container mb-2" />
                <span className="font-mono text-[11px] uppercase text-outline">ISO 27001</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
