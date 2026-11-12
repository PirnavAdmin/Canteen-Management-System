import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '../../services/api/apiClient';
import { API_ENDPOINTS } from '../../services/api/apiEndpoints';
import { ROLE_PERMISSIONS, ROLES } from '../../constants/permissions';

const DEMO_USERS = [
  {
    userId: 1,
    institutionId: 1,
    username: 'admin',
    email: 'admin@canteen.edu',
    password: 'Admin@123',
    fullName: 'Mrs. Sunitha (Canteen Admin)',
    role: 'Admin',
    roleCode: ROLES.INSTITUTION_ADMIN,
    phoneNumber: '+91 98765 43210',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    userId: 2,
    institutionId: 1,
    username: 'staff',
    email: 'ravi.staff@canteen.edu',
    password: 'Staff@123',
    fullName: 'Ravi (Kitchen & Counter Staff)',
    role: 'Staff',
    roleCode: ROLES.CANTEEN_STAFF,
    phoneNumber: '+91 98765 43211',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    userId: 3,
    institutionId: 1,
    username: 'aarav',
    email: 'aarav.student@git.edu',
    password: 'Student@123',
    fullName: 'Aarav (B.Tech 2nd Year)',
    role: 'Student',
    roleCode: ROLES.STUDENT,
    phoneNumber: '+91 98765 43212',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

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

      // If already authenticated via demo or local session, keep valid user profile
      const storedUser = localStorage.getItem('auth_user');
      if (savedToken.startsWith('demo-token-') && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
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
        // Fallback: If backend is offline or network error, retain existing user session
        if (storedUser && (err.message?.includes('Network Error') || !err.status || err.status >= 500)) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            setUser(null);
          }
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

  const login = useCallback(async (usernameOrEmail, password) => {
    try {
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
    } catch (err) {
      // If backend returned a clear 400/401 auth rejection from an active server, reject accordingly
      const isNetworkError =
        !err.status ||
        err.status >= 500 ||
        err.message?.includes('Network Error') ||
        err.message?.includes('ECONNREFUSED') ||
        err.raw?.code === 'ERR_NETWORK';

      if (!isNetworkError) {
        throw new Error(err.message || 'Invalid username or password.');
      }

      // Backend API server is offline - Use offline demo authentication fallback
      console.warn('Backend API server unreachable (Network Error). Using demo authentication fallback.');

      const cleanInput = (usernameOrEmail || '').trim().toLowerCase();
      const localUsers = JSON.parse(localStorage.getItem('cms_registered_users') || '[]');
      const allUsers = [...DEMO_USERS, ...localUsers];

      const matchedUser = allUsers.find(u =>
        u.username.toLowerCase() === cleanInput ||
        u.email.toLowerCase() === cleanInput
      );

      if (!matchedUser) {
        throw new Error('Account not found. Please click one of the quick demo accounts below.');
      }

      // Validate password (allow exact match, lowercase match, or standard demo passwords)
      const validPasswords = [
        matchedUser.password,
        matchedUser.password?.toLowerCase(),
        'admin@123',
        'staff@123',
        'student@123',
        'admin',
        '123456'
      ].filter(Boolean);

      const enteredPass = (password || '').trim();
      const isPassValid = validPasswords.some(p => p.toLowerCase() === enteredPass.toLowerCase());

      if (!isPassValid) {
        throw new Error('Incorrect password. For demo accounts, click the quick demo buttons below.');
      }

      const { password: _, ...userProfile } = matchedUser;
      const demoToken = `demo-token-${userProfile.role.toLowerCase()}-${Date.now()}`;

      localStorage.setItem('token', demoToken);
      localStorage.setItem('auth_user', JSON.stringify(userProfile));
      localStorage.setItem('institution_id', String(userProfile.institutionId || 1));
      setToken(demoToken);
      setUser(userProfile);

      return {
        token: demoToken,
        user: userProfile
      };
    }
  }, []);

  const register = useCallback(async (registrationData) => {
    try {
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
    } catch (err) {
      const isNetworkError =
        !err.status ||
        err.status >= 500 ||
        err.message?.includes('Network Error') ||
        err.message?.includes('ECONNREFUSED') ||
        err.raw?.code === 'ERR_NETWORK';

      if (!isNetworkError) {
        throw new Error(err.message || 'Registration failed.');
      }

      // Offline mock registration fallback
      const localUsers = JSON.parse(localStorage.getItem('cms_registered_users') || '[]');
      const usernameExists = localUsers.some(u => u.username.toLowerCase() === registrationData.username.trim().toLowerCase()) ||
        DEMO_USERS.some(u => u.username.toLowerCase() === registrationData.username.trim().toLowerCase());

      if (usernameExists) {
        throw new Error(`Username "${registrationData.username}" is already taken.`);
      }

      const newUser = {
        userId: Date.now() % 100000,
        institutionId: registrationData.institutionId || 1,
        username: registrationData.username.trim(),
        email: registrationData.email.trim(),
        password: registrationData.password,
        fullName: registrationData.fullName.trim(),
        role: registrationData.role || 'Student',
        roleCode: registrationData.role === 'Admin' ? ROLES.INSTITUTION_ADMIN : registrationData.role === 'Staff' ? ROLES.CANTEEN_STAFF : ROLES.STUDENT,
        phoneNumber: registrationData.phoneNumber ? registrationData.phoneNumber.trim() : null,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      localUsers.push(newUser);
      localStorage.setItem('cms_registered_users', JSON.stringify(localUsers));

      const { password: _, ...userProfile } = newUser;
      const demoToken = `demo-token-${userProfile.role.toLowerCase()}-${Date.now()}`;

      localStorage.setItem('token', demoToken);
      localStorage.setItem('auth_user', JSON.stringify(userProfile));
      localStorage.setItem('institution_id', String(userProfile.institutionId || 1));
      setToken(demoToken);
      setUser(userProfile);

      return {
        token: demoToken,
        user: userProfile
      };
    }
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
