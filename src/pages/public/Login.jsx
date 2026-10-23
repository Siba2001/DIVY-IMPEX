import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DivyLogo, { DivyLogoIcon } from '../../components/common/DivyLogo';
import { Lock, User, ArrowLeft, LogIn, Key, AlertCircle, Clock } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Read session expiry notice if redirected from auto-logout
  const [sessionNotice] = useState(() => {
    try {
      const notice = localStorage.getItem('divy_auth_session_notice');
      if (notice) {
        localStorage.removeItem('divy_auth_session_notice');
        return notice;
      }
    } catch { }
    return '';
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      setLoading(false);

      if (result.success) {
        if (result.user.role === 'worker') {
          navigate('/worker-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.message || 'Invalid username or password!');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Login failed. Please check network connection.');
    }
  };

  return (
    <div className="min-vh-100 bg-diamond-pattern d-flex align-items-center justify-content-center p-3" style={{ backgroundColor: '#071224' }}>
      <div className="card border-0 shadow-2xl rounded-4 overflow-hidden" style={{ maxWidth: '440px', width: '100%', background: '#FFFFFF' }}>
        {/* Header */}
        <div className="p-4 text-center text-white" style={{ background: 'linear-gradient(135deg, #0A192F 0%, #112240 100%)', borderBottom: '2px solid #D4AF37' }}>
          <DivyLogo stacked={true} iconSize={64} textClassName="fs-4" />
          <span className="text-uppercase tracking-widest text-slate-300 d-block mt-2" style={{ fontSize: '0.625rem', letterSpacing: '0.15em', color: '#94A3B8' }}>
            Diamond Management System Portal
          </span>
        </div>

        {/* Body */}
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h5 className="font-heading fw-bold text-dark mb-1" style={{ color: '#0A192F' }}>Internal Sign In</h5>
            <p className="text-muted small mb-0">Enter your credentials to access system</p>
          </div>

          {sessionNotice && (
            <div className="alert alert-warning d-flex align-items-center small p-3 rounded-3 mb-4 border-warning" role="alert">
              <Clock size={18} className="me-2 text-warning flex-shrink-0" />
              <div>{sessionNotice}</div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger d-flex align-items-center small p-3 rounded-3 mb-4" role="alert">
              <AlertCircle size={18} className="me-2 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label fw-semibold text-secondary small">User ID / Username</label>
              <div className="position-relative">
                <User size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input
                  type="text"
                  className="form-control ps-5 font-mono"
                  placeholder="Enter your User ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold text-secondary small">Password</label>
              <div className="position-relative">
                <Lock size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input
                  type="password"
                  className="form-control ps-5 font-mono"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-gold w-100 rounded-pill py-2 font-heading fw-bold d-flex align-items-center justify-content-center shadow-sm mb-3"
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              ) : (
                <LogIn size={18} className="me-2" />
              )}
              Sign In
            </button>
          </form>

          <Link to="/" className="btn btn-outline-secondary w-100 rounded-pill py-2 font-heading fw-medium small d-flex align-items-center justify-content-center">
            <ArrowLeft size={16} className="me-2" /> Back to Company Website
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
