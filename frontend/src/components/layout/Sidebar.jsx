import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GitFork,
  AlertOctagon,
  Sparkles,
  Users,
  FileText,
  PlayCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  Layers,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { Button, Badge, Separator, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui';
import { useTheme } from '../../context/ThemeContext';
import { useWorkflow } from '../../context/WorkflowContext';

export function Sidebar({ collapsed, onToggleCollapse, onItemClick }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { workflows, currentWorkflowId, setWorkflowId, currentWorkflow } = useWorkflow();

  const navItems = [
    { to: '/overview', label: 'Overview', icon: LayoutDashboard },
    { to: '/workflow', label: 'Workflow Graph', icon: GitFork },
    { to: '/bottlenecks', label: 'Bottlenecks', icon: AlertOctagon },
    { to: '/predictions', label: 'Predictions', icon: Sparkles },
    { to: '/sessions', label: 'Sessions', icon: Users },
    { to: '/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between h-full bg-card text-card-foreground border-r border-border transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Top Header / Brand */}
      <div>
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary via-blue-600 to-teal-400 text-white shadow-md shadow-primary/20 shrink-0">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-sm tracking-tight text-foreground truncate">
                  FlowTwin AI
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  Digital Twin Analytics
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Dynamic Workflow Selector */}
        {!collapsed ? (
          <div className="p-3 border-b border-border bg-muted/30">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Active Workflow
            </label>
            <Select value={currentWorkflowId} onValueChange={setWorkflowId}>
              <SelectTrigger className="h-8.5 text-xs bg-background">
                <SelectValue placeholder="Select workflow" />
              </SelectTrigger>
              <SelectContent>
                {workflows.map((wf) => (
                  <SelectItem key={wf.id} value={wf.id}>
                    <div className="flex flex-col text-left">
                      <span className="font-medium text-xs">{wf.name}</span>
                      <span className="text-[10px] text-muted-foreground">{wf.category}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="py-2 flex justify-center border-b border-border" title={`Workflow: ${currentWorkflow?.name}`}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {currentWorkflow?.name?.charAt(0) || 'W'}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold shadow-xs dark:bg-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  } ${collapsed ? 'justify-center px-0' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls (Theme, Demo Simulator, Settings) */}
      <div className="p-3 border-t border-border space-y-2">
        {/* Discrete Developer Simulator link */}
        <NavLink
          to="/demo/simulator"
          onClick={onItemClick}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-medium transition-colors ${
              isActive
                ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 font-semibold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            } ${collapsed ? 'justify-center px-0' : ''}`
          }
          title={collapsed ? "Developer Simulator" : undefined}
        >
          <PlayCircle className="w-3.5 h-3.5 shrink-0 text-teal-500" />
          {!collapsed && (
            <div className="flex items-center justify-between w-full">
              <span className="truncate">Simulator Sandbox</span>
              <Badge variant="outline" className="text-[9px] py-0 px-1 border-muted">Dev</Badge>
            </div>
          )}
        </NavLink>

        <Separator />

        {/* Theme Mode Selector */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-1`}>
          {!collapsed && (
            <span className="text-[11px] text-muted-foreground">Theme Mode</span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                {resolvedTheme === 'dark' ? (
                  <Moon className="w-4 h-4 text-primary" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={collapsed ? "center" : "end"}>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="w-3.5 h-3.5 mr-2 text-amber-500" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="w-3.5 h-3.5 mr-2 text-primary" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Laptop className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
