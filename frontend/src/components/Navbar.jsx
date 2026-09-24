import React from 'react';
import {
  LayoutDashboard,
  GitFork,
  AlertOctagon,
  Sparkles,
  Users,
  FileText,
  PlayCircle,
  RefreshCw,
  Database,
  Moon,
  Sun,
  Activity
} from 'lucide-react';
import { Button, Badge } from './ui';

export function Navbar({
  activeTab,
  onTabChange,
  darkMode,
  onToggleDarkMode,
  onSeedData,
  isSeeding
}) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'graph', label: 'Workflow Graph', icon: GitFork },
    { id: 'bottlenecks', label: 'Bottlenecks', icon: AlertOctagon },
    { id: 'predictions', label: 'Predictions', icon: Sparkles },
    { id: 'sessions', label: 'Sessions', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'simulator', label: 'Simulator', icon: PlayCircle, highlight: true }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-teal-400 text-white shadow-md shadow-blue-500/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  FlowTwin AI
                </span>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-md">
                  v1.0 GWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
                Predictive Digital Workflow Optimization
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold shadow-xs'
                      : item.highlight
                      ? 'text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 font-medium'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                  {item.label}
                  {item.highlight && (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action buttons (Seed data, Dark mode toggle) */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSeedData}
              disabled={isSeeding}
              className="text-xs hidden sm:inline-flex border-slate-200 dark:border-slate-700"
              title="Re-seed database with realistic synthetic data"
            >
              <Database className={`w-3.5 h-3.5 text-blue-600 ${isSeeding ? 'animate-spin' : ''}`} />
              {isSeeding ? 'Seeding...' : 'Seed Data'}
            </Button>

            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
