import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { AppShell } from './components/layout/AppShell';

import { OverviewPage } from './pages/OverviewPage';
import { WorkflowGraphPage } from './pages/WorkflowGraphPage';
import { BottlenecksPage } from './pages/BottlenecksPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { SessionsPage } from './pages/SessionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SimulatorPage } from './pages/SimulatorPage';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <WorkflowProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/workflow" element={<WorkflowGraphPage />} />
              <Route path="/bottlenecks" element={<BottlenecksPage />} />
              <Route path="/predictions" element={<PredictionsPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/demo/simulator" element={<SimulatorPage />} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WorkflowProvider>
    </ThemeProvider>
  );
}
