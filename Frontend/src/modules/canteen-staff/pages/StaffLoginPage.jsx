import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ChefHat, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { STAFF_APP_CONFIG } from '../constants/staffNavigation';

export const StaffLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('staff');
  const [password, setPassword] = useState('Staff@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide staff username and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(username.trim(), password);
      navigate('/staff/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setUsername('staff');
    setPassword('Staff@123');
    try {
      setLoading(true);
      setError('');
      await login('staff', 'Staff@123');
      navigate('/staff/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '24px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        padding: '36px',
        color: '#1e293b'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            backgroundColor: '#fff7ed',
            color: '#f97316',
            marginBottom: '14px',
            boxShadow: '0 4px 10px rgba(249, 115, 22, 0.2)'
          }}>
            <ChefHat size={32} />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {STAFF_APP_CONFIG.portalName}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0 0' }}>
            {STAFF_APP_CONFIG.canteenOutlet} • Staff Operations Sign In
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
              Staff Username:
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '10px 14px',
              backgroundColor: '#f8fafc'
            }}>
              <User size={16} color="#64748b" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '14px',
                  width: '100%',
                  color: '#0f172a'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
              Password:
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '10px 14px',
              backgroundColor: '#f8fafc'
            }}>
              <Lock size={16} color="#64748b" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '14px',
                  width: '100%',
                  color: '#0f172a'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 18px',
              borderRadius: '10px',
              backgroundColor: '#f97316',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '6px',
              boxShadow: '0 4px 6px rgba(249, 115, 22, 0.25)'
            }}
          >
            {loading ? 'Authenticating Staff...' : 'Sign In to Operations Portal'}
          </button>
        </form>

        {/* 1-Click Quick Demo Login */}
        <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginBottom: '10px', fontWeight: 600 }}>
            DEMO STAFF ACCESS:
          </div>
          <button
            onClick={handleQuickLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px dashed #f97316',
              backgroundColor: '#fff7ed',
              color: '#c2410c',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ChefHat size={16} />
            <span>1-Click Demo Login as Ravi Kumar (Staff)</span>
          </button>
        </div>

        {/* Alternative Portals */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <Link to="/customer/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
            ← Student / Faculty Portal
          </Link>
          <Link to="/login" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600 }}>
            Admin Portal →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaffLoginPage;
