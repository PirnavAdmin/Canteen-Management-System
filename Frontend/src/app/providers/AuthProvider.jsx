import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '../../services/api/apiClient';
import { API_ENDPOINTS } from '../../services/api/apiEndpoints';
import { ROLE_PERMISSIONS, ROLES } from '../../constants/permissions';

const AuthContext = createContext(null);
const LOCAL_USERS_KEY = 'cms_local_registered_users';

const isNetworkFailure = (err) => {
  if (!err) return false;
  const raw = err.raw || err;
  return (
    !raw?.response ||
    raw?.code === 'ERR_NETWORK' ||
    err.message === 'Network Error' ||
    err.message === 'Failed to fetch'
  );
};

const getLocalUsers = () => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const createLocalSessionProfile = (usernameOrEmail) => {
  const identifier = (usernameOrEmail || '').trim().toLowerCase();
  const localUsers = getLocalUsers();

  const matchedLocal = localUsers.find(
    (u) =>
      u.username?.toLowerCase() === identifier ||
      u.email?.toLowerCase() === identifier
  );
  if (matchedLocal) {
    return matchedLocal;
  }

  if (identifier === 'staff' || identifier.startsWith('staff@')) {
    return {
      id: 'staff-001',
      username: 'staff',
      fullName: 'Ravi Kumar',
      name: 'Ravi Kumar',
      email: 'staff@cms.edu',
      role: 'Staff',
      roleCode: ROLES.CANTEEN_STAFF,
      institutionId: 1
    };
  }

  if (identifier === 'aarav' || identifier === 'student' || identifier.startsWith('student@')) {
    return {
      id: 'stu-001',
      username: 'aarav',
      fullName: 'Aarav Patel',
      name: 'Aarav Patel',
      email: 'aarav@cms.edu',
      role: 'Student',
      roleCode: ROLES.STUDENT,
      institutionId: 1
    };
  }

  return {
    id: 'adm-001',
    username: (usernameOrEmail || '').trim(),
    fullName: identifier === 'admin' ? 'Sunitha Sharma' : 'Dr. Rajesh Sharma',
    name: identifier === 'admin' ? 'Sunitha Sharma' : 'Dr. Rajesh Sharma',
    email: identifier.includes('@') ? (usernameOrEmail || '').trim() : 'admin@cms.edu',
    role: 'Admin',
    roleCode: ROLES.INSTITUTION_ADMIN,
    institutionId: 1
  };
};

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

  // Initialize and verify session with backend (with offline/local demo fallback)
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      // Skip backend call when operating in local frontend-only demo session
      if (savedToken.startsWith('local-demo-token-')) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
        if (response && response.success && response.data) {
          setUser(response.data);
          localStorage.setItem('auth_user', JSON.stringify(response.data));
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('auth_user');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        if (isNetworkFailure(err) && localStorage.getItem('auth_user')) {
          console.info('Backend offline — preserving local authenticated session.');
        } else {
          console.warn('Session verification failed or token expired:', err.message);
          localStorage.removeItem('token');
          localStorage.removeItem('auth_user');
          setUser(null);
          setToken(null);
        }
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

  const persistSession = useCallback((jwtToken, userProfile) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('auth_user', JSON.stringify(userProfile));
    localStorage.setItem('institution_id', String(userProfile.institutionId || 1));
    setToken(jwtToken);
    setUser(userProfile);
    return { token: jwtToken, user: userProfile };
  }, []);

  const login = useCallback(async (usernameOrEmail, password) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        usernameOrEmail,
        password
      });

      if (response && response.success && response.data) {
        const { token: jwtToken, user: userProfile } = response.data;
        return persistSession(jwtToken, userProfile);
      }

      throw new Error(response?.message || 'Login failed.');
    } catch (err) {
      // Fall back to local session authentication when backend is not connected yet
      if (isNetworkFailure(err)) {
        const localProfile = createLocalSessionProfile(usernameOrEmail);
        const localToken = `local-demo-token-${Date.now()}`;
        return persistSession(localToken, localProfile);
      }
      throw new Error(err?.message || 'Login failed.', { cause: err });
    }
  }, [persistSession]);

  const register = useCallback(async (registrationData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, registrationData);

      if (response && response.success && response.data) {
        const { token: jwtToken, user: userProfile } = response.data;
        return persistSession(jwtToken, userProfile);
      }

      throw new Error(response?.message || 'Registration failed.');
    } catch (err) {
      if (isNetworkFailure(err)) {
        const role = registrationData.role || 'Student';
        const roleCode =
          role === 'Admin'
            ? ROLES.INSTITUTION_ADMIN
            : role === 'Staff'
              ? ROLES.CANTEEN_STAFF
              : ROLES.STUDENT;

        const newUser = {
          id: `usr-${Date.now()}`,
          username: registrationData.username,
          email: registrationData.email,
          fullName: registrationData.fullName,
          name: registrationData.fullName,
          phoneNumber: registrationData.phoneNumber || null,
          role,
          roleCode,
          institutionId: registrationData.institutionId || 1
        };

        const existing = getLocalUsers();
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([...existing, newUser]));
        const localToken = `local-demo-token-${Date.now()}`;
        return persistSession(localToken, newUser);
      }
      throw new Error(err?.message || 'Registration failed.', { cause: err });
    }
  }, [persistSession]);

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
