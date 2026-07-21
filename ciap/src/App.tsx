import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './i18n/index';

import './styles/globals.css';

import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import AICopilot from './components/ai/AICopilot';
import PresenterOverlay from './components/demo/PresenterOverlay';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';

const CommandCenter = lazy(() => import('./pages/CommandCenter'));
const GeoHeatmap = lazy(() => import('./pages/GeoHeatmap'));
const Forecasting = lazy(() => import('./pages/Forecasting'));
const RiskAnalysis = lazy(() => import('./pages/RiskAnalysis'));
const LinkAnalysis = lazy(() => import('./pages/LinkAnalysis'));
const AlertsCenter = lazy(() => import('./pages/AlertsCenter'));
const AICopilotPage = lazy(() => import('./pages/AICopilot'));
const SCRBReports = lazy(() => import('./pages/SCRBReports'));
const Administration = lazy(() => import('./pages/Administration'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));

// GeoHeatmap uses Leaflet CSS — inject it once here
import 'leaflet/dist/leaflet.css';

const AppShell: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />
      <div className="main-area">
        <Topbar />
        <Suspense fallback={<div className="page-content"><div className="skeleton-panel" /></div>}>
          <Routes>
            <Route path="/" element={<CommandCenter />} />
            <Route path="/command-center" element={<CommandCenter />} />
            <Route path="/heatmap" element={<GeoHeatmap />} />
            <Route path="/forecasting" element={<Forecasting />} />
            <Route path="/risk" element={<RiskAnalysis />} />
            <Route path="/link-analysis" element={<LinkAnalysis />} />
            <Route path="/alerts" element={<AlertsCenter />} />
            <Route path="/ai-copilot" element={<AICopilotPage />} />
            <Route path="/scrb-reports" element={<SCRBReports />} />
            <Route path="/administration" element={<Administration />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/command-center" replace />} />
          </Routes>
        </Suspense>
      </div>
      {/* Persistent AI Copilot FAB */}
      <AICopilot />
      <PresenterOverlay />
    </div>
  );
};

const ProtectedShell: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="empty-state">
            <div className="text-h3">Loading CIAP...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AppShell />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="login-page"><div className="login-card"><div className="skeleton-panel" /></div></div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedShell />} />
          </Routes>
        </Suspense>
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
    </AuthProvider>
  );
};

export default App;
