import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '../../services/api/apiClient';
import { API_ENDPOINTS } from '../../services/api/apiEndpoints';
import { ROLE_PERMISSIONS, ROLES } from '../../constants/permissions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Initialize and verify session with backend
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
        if (response && response.success && response.data) {
          setUser(response.data);
          localStorage.setItem('auth_user', JSON.stringify(response.data));
        } else {
          // Invalidate
          localStorage.removeItem('token');
          localStorage.removeItem('auth_user');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('Session verification failed or token expired:', err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('auth_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();

    // Listen for unauthorized events emitted by apiClient
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (usernameOrEmail, password) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
      usernameOrEmail,
      password
    });

    if (response && response.success && response.data) {
      const { token: jwtToken, user: userProfile } = response.data;
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('auth_user', JSON.stringify(userProfile));
      localStorage.setItem('institution_id', String(userProfile.institutionId || 1));
      setToken(jwtToken);
      setUser(userProfile);
      return response.data;
    }

    throw new Error(response?.message || 'Login failed.');
  }, []);

  const register = useCallback(async (registrationData) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, registrationData);

    if (response && response.success && response.data) {
      const { token: jwtToken, user: userProfile } = response.data;
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('auth_user', JSON.stringify(userProfile));
      localStorage.setItem('institution_id', String(userProfile.institutionId || 1));
      setToken(jwtToken);
      setUser(userProfile);
      return response.data;
    }

    throw new Error(response?.message || 'Registration failed.');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('institution_id');
    setToken(null);
    setUser(null);
  }, []);

  const userRole = useMemo(() => {
    return user?.role || 'Student';
  }, [user]);

  const permissions = useMemo(() => {
    const roleCode = user?.roleCode || (userRole === 'Admin' ? ROLES.INSTITUTION_ADMIN : userRole);
    return ROLE_PERMISSIONS[roleCode] || [];
  }, [user, userRole]);

  const hasPermission = useCallback((permission) => {
    if (!permission) return true;
    if (userRole === 'Admin') return true;
    return permissions.includes(permission);
  }, [permissions, userRole]);

  const hasAnyPermission = useCallback((permList = []) => {
    if (!permList || permList.length === 0) return true;
    if (userRole === 'Admin') return true;
    return permList.some(p => permissions.includes(p));
  }, [permissions, userRole]);

  const value = useMemo(() => ({
    user,
    role: userRole,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
    hasPermission,
    hasAnyPermission,
    setUser
  }), [user, userRole, token, loading, login, register, logout, hasPermission, hasAnyPermission]);

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
