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
        backgroundColor: '#0f172a',
        color: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid #f97316',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px auto'
          }} />
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Verifying Staff Access...</p>
        </div>
      </div>
    );
  }

  // If user not authenticated, redirect to staff login
  if (!user) {
    return <Navigate to="/staff/login" state={{ from: location }} replace />;
  }

  return children;
};

export default StaffProtectedRoute;
