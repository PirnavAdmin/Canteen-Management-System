import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../app/providers/AuthProvider';

export const CustomerProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
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
          <p style={{ color: '#64748b', fontSize: '14px' }}>Loading dining portal...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!['Student', 'Faculty'].includes(user?.role)) {
    return <Navigate to={user?.role === 'Cashier' ? '/cashier/dashboard' : user?.role === 'Staff' ? '/staff/dashboard' : '/admin/dashboard'} replace />;
  }

  return children;
};

export default CustomerProtectedRoute;
