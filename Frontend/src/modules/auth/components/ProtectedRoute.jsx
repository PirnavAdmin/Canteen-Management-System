import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles = null, children }) => {
  const { isAuthenticated, user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px auto'
          }} />
          <p style={{ color: '#64748b', fontSize: '14px' }}>Verifying authentication...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role Guard Check
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = role || user?.role || 'Student';
    const hasRole = allowedRoles.some(r => r.toLowerCase() === userRole.toLowerCase());

    if (!hasRole) {
      return (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            padding: '40px 32px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #fee2e2'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '16px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              marginBottom: '16px'
            }}>
              <ShieldAlert size={36} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
              Access Restricted
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              Your current account role (<strong>{userRole}</strong>) does not have sufficient permissions to access this administrative module.
            </p>
            <a
              href="/admin/dashboard"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;

