import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';

export default function CashierProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="cashier-loading">Verifying cashier access…</div>;
  if (!user) return <Navigate to="/cashier/login" state={{ from: location }} replace />;
  if (user.role !== 'Cashier' && user.roleCode !== 'CASHIER') {
    const destination = user.role === 'Admin' ? '/admin/dashboard' : user.role === 'Staff' ? '/staff/dashboard' : '/customer/dashboard';
    return <Navigate to={destination} replace />;
  }
  return children;
}
