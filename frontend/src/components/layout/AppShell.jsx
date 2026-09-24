import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Sheet, SheetContent, SheetTrigger, Button, Badge } from '../ui';
import { Menu, Activity, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useWorkflow } from '../../context/WorkflowContext';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { currentWorkflow } = useWorkflow();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar (visible on md+) */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(prev => !prev)}
        />
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Mobile Header (visible on < md) */}
        <header className="flex md:hidden items-center justify-between h-14 px-4 border-b border-border bg-card shrink-0 z-40">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <Sidebar
                  collapsed={false}
                  onToggleCollapse={() => {}}
                  onItemClick={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-white shadow-xs">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-tight">FlowTwin AI</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] max-w-[120px] truncate">
              {currentWorkflow?.name || 'Workflow'}
            </Badge>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-primary" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </Button>
          </div>
        </header>

        {/* Scrollable Viewport for Pages */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
