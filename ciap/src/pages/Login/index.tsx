import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/useAuth';

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('ramaiah@ksp.gov.in');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const demoBypass = import.meta.env.VITE_DEMO_BYPASS === 'true' || import.meta.env.DEV;

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  if (demoBypass && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-backdrop" />
      <div className="login-card">
        <div className="login-brand">
          <div className="sidebar-logo-icon">
            <Shield size={18} />
          </div>
          <div>
            <div className="login-title">KSP CIAP</div>
            <div className="login-subtitle">Crime Intelligence & Analytics Platform</div>
          </div>
        </div>

        <div className="login-copy">
          <div className="text-h2">Secure access for Karnataka Police</div>
          <p className="text-secondary">
            Sign in to access Command Center, Geo Intelligence, Forecasting, Risk, Link Analysis, Reports, and the AI Copilot.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span className="login-label"><Mail size={14} /> Official Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@ksp.gov.in"
              required
            />
          </label>

          <label className="login-field">
            <span className="login-label"><Lock size={14} /> Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </label>

          <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="login-footer text-caption text-muted">
          Catalyst Auth, JWT session management, and RBAC protection are enabled.
          {demoBypass ? ' Demo bypass is active.' : ''}
        </div>
      </div>
    </div>
  );
};

export default Login;
