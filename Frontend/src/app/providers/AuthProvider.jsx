import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { APP_CONFIG } from '../../constants/navigation';
import { ROLE_PERMISSIONS, ROLES } from '../../constants/permissions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('cms_user_profile');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return APP_CONFIG.currentUser;
  });

  const permissions = useMemo(() => {
    const roleCode = user?.roleCode || ROLES.INSTITUTION_ADMIN;
    return ROLE_PERMISSIONS[roleCode] || [];
  }, [user]);

  // Listen for session expiry event from apiClient responseInterceptor
  useEffect(() => {
    const handleAuthExpired = () => {
      console.warn('Session expired. Redirecting to login or refresh.');
    };

    window.addEventListener('cms:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('cms:auth-expired', handleAuthExpired);
  }, []);

  const hasPermission = useCallback((permission) => {
    if (!permission) return true;
    return permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((permList = []) => {
    if (!permList || permList.length === 0) return true;
    return permList.some(p => permissions.includes(p));
  }, [permissions]);

  const value = useMemo(() => ({
    user,
    role: user?.roleCode || ROLES.INSTITUTION_ADMIN,
    permissions,
    hasPermission,
    hasAnyPermission,
    isAuthenticated: Boolean(user),
    setUser
  }), [user, permissions, hasPermission, hasAnyPermission]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
