/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Paperclip,
  Mic,
  TrendingUp,
  Sliders,
  Database,
  Shield,
  Loader2,
  Bookmark,
  Plus
} from 'lucide-react';
import { ChatThread, ChatMessage } from '../types';

interface AiAssistantViewProps {
  onNavigateToTab: (tab: 'dashboard' | 'recommendations' | 'forecasting' | 'ai-assistant' | 'sustainability' | 'reports' | 'settings') => void;
}

const initialThreads: ChatThread[] = [
  {
    id: 'thread-1',
    title: 'EC2 Compute Spikes Analysis',
    iconType: 'query_stats',
    timeAgo: '2 hours ago',
    messages: [
      {
        id: 'msg-1',
        sender: 'assistant',
        content: `Hi, I am Sage. I noticed that your Lambda execution costs and EC2 instances surged by 24% in us-east-1 yesterday. 

Would you like me to analyze for cold starts or rightsizing opportunities? Here is a breakdown of the daily hourly cost pattern:`,
        timestamp: '10:30 AM',
        chartData: [
          { hour: '08:00', value: 120 },
          { hour: '10:00', value: 140 },
          { hour: '12:00', value: 310, isSpike: true },
          { hour: '14:00', value: 290 },
          { hour: '16:00', value: 150 },
        ],
        actionLabel: 'Resize Instances',
        actionId: 'rec-1'
      }
    ]
  },
  {
    id: 'thread-2',
    title: 'S3 Cold Storage Plan',
    iconType: 'savings',
    timeAgo: 'Yesterday',
    messages: [
      {
        id: 'msg-2',
        sender: 'assistant',
        content: 'Our audits indicate you can shift 42TB of inactive log files from `bucket-prod-logs` to Glacier Instant Retrieval, reducing S3 spend from $1,600 to $400 monthly.',
        timestamp: 'Yesterday'
      }
    ]
  },
  {
    id: 'thread-3',
    title: 'VPC Flow Log Optimization',
    iconType: 'shield',
    timeAgo: '3 days ago',
    messages: [
      {
        id: 'msg-3',
        sender: 'assistant',
        content: 'VPC flow logs are generating 14GB of raw telemetry daily. I recommend compressing log outputs or filtering out accepted internal port 80/443 connection traces.',
        timestamp: '3 days ago'
      }
    ]
  }
];

export default function AiAssistantView({ onNavigateToTab }: AiAssistantViewProps) {
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-1');
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) setInputText('');

    // Append user message
    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedThreads = threads.map(t => {
      if (t.id === activeThreadId) {
        return { ...t, messages: [...t.messages, userMessage] };
      }
      return t;
    });
    setThreads(updatedThreads);

    // Call API /api/chat
    setIsTyping(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: activeThread.messages
        })
      });

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: `msg-sage-${Date.now()}`,
        sender: 'assistant',
        content: data.text || 'I was unable to retrieve a response. Please verify the connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          return { ...t, messages: [...t.messages, assistantMessage] };
        }
        return t;
      }));
    } catch (error) {
      console.error('Error talking to Sage:', error);
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        content: 'Connection timed out. Using secure local fallback. I recommend looking into rightsizing options for your EC2 nodes.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          return { ...t, messages: [...t.messages, errorMessage] };
        }
        return t;
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleCreateNewThread = () => {
    const newId = `thread-${Date.now()}`;
    const newThread: ChatThread = {
      id: newId,
      title: `Analysis Thread #${threads.length + 1}`,
      iconType: 'query_stats',
      timeAgo: 'Just now',
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          sender: 'assistant',
          content: 'Hello! I am Sage, your Cloud Copilot. How can I assist with your infrastructure costs or environmental footprint today?',
          timestamp: 'Just now'
        }
      ]
    };
    setThreads([newThread, ...threads]);
    setActiveThreadId(newId);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[500px]">
      {/* Left Sidebar: Threads list */}
      <div className="lg:col-span-4 glass-panel rounded-2xl flex flex-col overflow-hidden h-full">
        <div className="p-4 border-b border-outline-variant/15 flex justify-between items-center bg-surface-container/30">
          <h3 className="font-headline font-bold text-sm text-on-surface">Active Inquiries</h3>
          <button 
            onClick={handleCreateNewThread}
            className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors cursor-pointer"
            title="Start new thread"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {threads.map(thread => {
            const isActive = thread.id === activeThreadId;
            return (
              <button
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className={`w-full p-3.5 rounded-xl text-left transition-all border flex items-start gap-3.5 cursor-pointer ${
                  isActive 
                    ? 'bg-surface-variant/40 border-primary/30 active-nav-glow' 
                    : 'bg-transparent border-transparent hover:bg-surface-container-low/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-primary/15 text-primary' : 'bg-surface-container-highest text-on-surface-variant'
                }`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                    {thread.title}
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-1 font-mono">{thread.timeAgo}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Side: Conversation Area */}
      <div className="lg:col-span-8 glass-panel rounded-2xl flex flex-col overflow-hidden h-full relative bg-[#0b1326]/40">
        {/* Header bar */}
        <div className="p-4 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-1.5">
                Sage Copilot
                <span className="text-[9px] font-mono font-normal uppercase px-1.5 py-0.5 bg-tertiary/10 text-tertiary rounded">Active</span>
              </h3>
              <p className="text-[10px] text-on-surface-variant">Continuous Carbon & Carbon Spend Advisor</p>
            </div>
          </div>
          <button className="text-xs text-primary font-bold hover:underline font-mono flex items-center gap-1 bg-primary/5 px-2.5 py-1 rounded-lg">
            <Bookmark className="w-3.5 h-3.5" />
            Save Log
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeThread.messages.map(msg => {
            const isSage = msg.sender === 'assistant';
            return (
              <div 
                key={msg.id} 
                className={`flex gap-4 ${isSage ? '' : 'flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isSage ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-on-surface'
                }`}>
                  {isSage ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble Container */}
                <div className="space-y-2 max-w-[80%]">
                  <div className={`rounded-2xl p-4 leading-relaxed text-xs shadow-md border ${
                    isSage 
                      ? 'bg-surface-container border-outline-variant/10 text-on-surface' 
                      : 'bg-primary-container text-on-primary-container border-primary-container'
                  }`}>
                    {/* Render text with manual newlines / lists */}
                    <div className="space-y-2 whitespace-pre-wrap">
                      {msg.content}
                    </div>

                    {/* Chart overlay if message has it */}
                    {msg.chartData && (
                      <div className="mt-4 p-3 bg-surface-container-lowest/80 rounded-xl border border-outline-variant/20">
                        <p className="text-[10px] uppercase font-mono tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-primary" />
                          Traffic Pattern Spikes
                        </p>
                        <div className="flex justify-between items-end h-24 px-2">
                          {msg.chartData.map((d, i) => (
                            <div key={i} className="flex flex-col items-center flex-1 gap-1">
                              <span className="text-[9px] font-mono text-on-surface-variant">${d.value}</span>
                              <div 
                                className={`w-6 rounded-t transition-all ${
                                  d.isSpike 
                                    ? 'bg-error shadow-[0_0_10px_rgba(255,180,171,0.5)]' 
                                    : 'bg-primary/30'
                                }`}
                                style={{ height: `${(d.value / 350) * 100}%`, minHeight: '6px' }}
                              ></div>
                              <span className="text-[9px] font-mono text-gray-500 mt-1">{d.hour}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Suggestion actions */}
                  {msg.actionLabel && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onNavigateToTab('recommendations')}
                        className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Sliders className="w-3 h-3" />
                        {msg.actionLabel}
                      </button>
                    </div>
                  )}

                  <p className="text-[9px] text-on-surface-variant font-mono">{msg.timestamp}</p>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-surface-container border border-outline-variant/10 rounded-2xl px-4 py-3 text-xs text-on-surface-variant">
                Sage is cross-referencing multi-cloud billing indexes...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-outline-variant/15 bg-surface-container/20">
          <div className="relative flex items-center bg-surface-container-high rounded-xl border border-outline-variant/30 px-3.5 py-2.5">
            <button className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer">
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              placeholder="Query cost optimizations, carbon emissions, or instance policies..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent border-none focus:outline-none text-xs px-3 text-on-surface placeholder:text-outline-variant"
            />
            <div className="flex items-center gap-2">
              <button className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer">
                <Mic className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleSend()}
                className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {/* Quick recommendations pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button 
              onClick={() => handleSend('Explain S3 storage lifecycle options')}
              className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-variant/30 text-[10px] text-on-surface-variant hover:text-on-surface font-mono transition-colors cursor-pointer"
            >
              #S3-Optimizations
            </button>
            <button 
              onClick={() => handleSend('Analyze us-east-1 compute spike')}
              className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-variant/30 text-[10px] text-on-surface-variant hover:text-on-surface font-mono transition-colors cursor-pointer"
            >
              #EC2-Spikes
            </button>
            <button 
              onClick={() => handleSend('How can I reduce carbon emissions in production?')}
              className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-variant/30 text-[10px] text-on-surface-variant hover:text-on-surface font-mono transition-colors cursor-pointer"
            >
              #Green-Cloud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
