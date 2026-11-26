import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';

export const StaffProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--color-primary)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px auto'
          }} />
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Verifying Staff Access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/staff/login" state={{ from: location }} replace />;
  }

  const roleStr = String(user.role || '').toUpperCase();
  const roleCodeStr = String(user.roleCode || '').toUpperCase();
  if (roleStr !== 'STAFF' && roleCodeStr !== 'CANTEEN_STAFF' && !roleStr.includes('STAFF')) {
    return (
      <Navigate
        to={
          roleStr === 'CASHIER'
            ? '/cashier/dashboard'
            : roleStr === 'ADMIN'
              ? '/admin/dashboard'
              : '/customer/dashboard'
        }
        replace
      />
    );
  }

  return children;
};

export default StaffProtectedRoute;
