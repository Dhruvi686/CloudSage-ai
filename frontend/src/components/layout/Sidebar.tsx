import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Lightbulb,
  Server,
  TrendingUp,
  FileText,
  Cloud,
  Upload,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/recommendations', label: 'Recommendations', icon: Lightbulb },
  { to: '/resources', label: 'Resources', icon: Server },
  { to: '/forecast', label: 'Forecast', icon: TrendingUp },
  { to: '/reports', label: 'Reports', icon: FileText },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Cloud className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-semibold text-zinc-100">CloudSight</span>
          <span className="ml-1 text-sm font-light text-blue-400">AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-zinc-100 bg-zinc-800/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-zinc-800/80"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
              <item.icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Upload CTA */}
      <div className="border-t border-zinc-800 p-4">
        <NavLink
          to="/"
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          <Upload className="h-4 w-4" />
          Upload Data
        </NavLink>
      </div>
    </aside>
  );
}
