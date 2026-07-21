import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './i18n/index';

import './styles/globals.css';

import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import AICopilot from './components/ai/AICopilot';

import CommandCenter from './pages/CommandCenter';
import CrimeManagement from './pages/CrimeManagement';
import GeoHeatmap from './pages/GeoHeatmap';
import Forecasting from './pages/Forecasting';
import RiskAnalysis from './pages/RiskAnalysis';
import LinkAnalysis from './pages/LinkAnalysis';
import AlertsCenter from './pages/AlertsCenter';
import AICopilotPage from './pages/AICopilot';
import CitizenReports from './pages/CitizenReports';
import SCRBReports from './pages/SCRBReports';
import Administration from './pages/Administration';
import Settings from './pages/Settings';

// GeoHeatmap uses Leaflet CSS — inject it once here
import 'leaflet/dist/leaflet.css';

// Pages that use full-screen layout (no overflow scroll needed)
const FULLSCREEN_PAGES = ['/heatmap', '/link-analysis'];

const AppShell: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />
      <div className="main-area">
        <Topbar />
        <Routes>
          <Route path="/" element={<CommandCenter />} />
          <Route path="/command-center" element={<CommandCenter />} />
          <Route path="/crimes" element={<CrimeManagement />} />
          <Route path="/heatmap" element={<GeoHeatmap />} />
          <Route path="/forecasting" element={<Forecasting />} />
          <Route path="/risk" element={<RiskAnalysis />} />
          <Route path="/link-analysis" element={<LinkAnalysis />} />
          <Route path="/alerts" element={<AlertsCenter />} />
          <Route path="/ai-copilot" element={<AICopilotPage />} />
          <Route path="/citizen-reports" element={<CitizenReports />} />
          <Route path="/scrb-reports" element={<SCRBReports />} />
          <Route path="/administration" element={<Administration />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
      {/* Persistent AI Copilot FAB */}
      <AICopilot />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppShell />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--navy-800)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
          },
        }}
      />
    </BrowserRouter>
  );
};

export default App;
