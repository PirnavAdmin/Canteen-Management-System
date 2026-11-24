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
    email: 'aarav.mehta@students.apexinstitute.edu',
    secondaryEmail: 'aarav.student@git.edu',
    password: 'Student@123',
    fullName: 'Aarav Mehta',
    role: 'Student',
    roleCode: ROLES.STUDENT,
    phoneNumber: '+91 98765 43210',
    rollNo: '2023-CSE-042',
    department: 'Computer Science & Engineering',
    balance: 850.00,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    userId: 4,
    institutionId: 1,
    username: 'sunita.rao',
    email: 'sunita.rao@faculty.apexinstitute.edu',
    secondaryEmail: 'sunita@faculty.edu',
    password: 'Faculty@123',
    fullName: 'Dr. Sunita Rao',
    role: 'Faculty',
    roleCode: ROLES.FACULTY,
    phoneNumber: '+91 98450 11223',
    rollNo: 'FAC-BIO-012',
    department: 'Biotechnology & Bioengineering',
    balance: 1420.00,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

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

const parseJwt = (token) => {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const normalizeUserProfile = (rawUser, jwtToken = null, inputIdentifier = '') => {
  const user = (rawUser && typeof rawUser === 'object') ? (rawUser.user || rawUser.data?.user || rawUser) : {};
  const jwt = parseJwt(jwtToken);
  const identifier = String(inputIdentifier || user.username || user.email || jwt?.name || '').trim().toLowerCase();

  // Detect raw role from all possible backend variations
  const rawRoleCandidate =
    user.role ||
    user.Role ||
    user.roleName ||
    user.RoleName ||
    user.roleCode ||
    user.RoleCode ||
    user.userType ||
    user.UserType ||
    (Array.isArray(user.roles) ? user.roles[0] : null) ||
    (Array.isArray(user.Roles) ? user.Roles[0] : null) ||
    jwt?.role ||
    jwt?.Role ||
    jwt?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
    (Array.isArray(jwt?.roles) ? jwt.roles[0] : null) ||
    '';

  const roleUpper = String(rawRoleCandidate).toUpperCase();

  let canonicalRole = 'Student';
  let canonicalRoleCode = ROLES.STUDENT;

  if (roleUpper.includes('STAFF') || identifier === 'staff' || identifier.startsWith('staff@') || identifier.includes('ravi.staff')) {
    canonicalRole = 'Staff';
    canonicalRoleCode = ROLES.CANTEEN_STAFF;
  } else if (roleUpper.includes('ADMIN') || identifier === 'admin' || identifier.startsWith('admin@')) {
    canonicalRole = 'Admin';
    canonicalRoleCode = ROLES.INSTITUTION_ADMIN;
  } else if (roleUpper.includes('FACULTY') || identifier.includes('faculty') || identifier.includes('sunita.rao')) {
    canonicalRole = 'Faculty';
    canonicalRoleCode = ROLES.FACULTY;
  } else if (roleUpper.includes('STUDENT') || identifier === 'student' || identifier === 'aarav' || identifier.startsWith('student@')) {
    canonicalRole = 'Student';
    canonicalRoleCode = ROLES.STUDENT;
  }

  const id = user.id || user.Id || user.userId || user.UserId || jwt?.nameid || jwt?.sub || (canonicalRole === 'Staff' ? 'staff-001' : 'usr-1');
  const campusId = user.campusId || user.CampusId || user.institutionId || user.InstitutionId || jwt?.campusId || jwt?.institutionId || 1;
  const username = user.username || user.Username || jwt?.unique_name || (identifier || (canonicalRole === 'Staff' ? 'staff' : 'user'));
  const fullName = user.fullName || user.FullName || user.name || user.Name || jwt?.name || jwt?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || (canonicalRole === 'Staff' ? 'Ravi Kumar' : canonicalRole === 'Admin' ? 'Sunitha Sharma' : 'Student User');
  const email = user.email || user.Email || jwt?.email || (canonicalRole === 'Staff' ? 'ravi.staff@canteen.edu' : 'user@canteen.edu');

  return {
    ...user,
    id,
    userId: id,
    username,
    email,
    fullName,
    name: fullName,
    role: canonicalRole,
    Role: canonicalRole,
    roleCode: canonicalRoleCode,
    campusId: Number(campusId) || 1,
    institutionId: Number(campusId) || 1
  };
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
      campusId: 1, institutionId: 1
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
      campusId: 1, institutionId: 1
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
    campusId: 1, institutionId: 1
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
        const payload = response?.data || response;
        if (payload && (response?.success || payload.id || payload.username || payload.role || payload.Role)) {
          const normalized = normalizeUserProfile(payload, savedToken);
          setUser(normalized);
          localStorage.setItem('auth_user', JSON.stringify(normalized));
        }
      } catch (err) {
        const status = err?.status || err?.raw?.response?.status;
        if (status === 401) {
          console.warn('Session expired or token invalid (401):', err.message);
          localStorage.removeItem('token');
          localStorage.removeItem('auth_user');
          setUser(null);
          setToken(null);
        } else {
          // 404 (endpoint not implemented) or network error: preserve existing session!
          console.info('Backend /auth/me not available (' + (status || 'offline') + ') — preserving authenticated session.');
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
    localStorage.setItem('campus_id', String(userProfile.campusId || userProfile.institutionId || 1));
        localStorage.setItem('institution_id', String(userProfile.campusId || userProfile.institutionId || 1));
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

      // Handle wrapped ({ success, data: { token, user } }) or flat response payloads
      const payload = response?.data || response;
      if (payload && (response?.success || payload.token || payload.accessToken || payload.jwtToken || payload.user)) {
        const jwtToken = payload.token || payload.accessToken || payload.jwtToken || payload.Token || payload.AccessToken || `token-${Date.now()}`;
        const rawUser = payload.user || payload.User || payload.data?.user || payload;
        const normalizedUser = normalizeUserProfile(rawUser, jwtToken, usernameOrEmail);
        return persistSession(jwtToken, normalizedUser);
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
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('auth_user', JSON.stringify(userProfile));
        localStorage.setItem('institution_id', String(userProfile.institutionId || 1));
        setToken(jwtToken);
        setUser(userProfile);
        return response.data;
      }
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
          campusId: registrationData.campusId || registrationData.institutionId || 1, institutionId: registrationData.campusId || registrationData.institutionId || 1
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
    localStorage.removeItem('campus_id');
    localStorage.removeItem('institution_id');
    setToken(null);
    setUser(null);
  }, []);

  const userRole = useMemo(() => {
    return user?.role || user?.Role || 'Student';
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
