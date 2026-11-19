import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  MapPin,
  Store,
  Sun,
  Moon,
  Search,
  X,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  ClipboardList,
  Flame,
  QrCode,
  Boxes,
  Send,
  History
} from 'lucide-react';
import styles from '../../../styles/layout.module.css';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useTheme } from '../../../hooks/useTheme';
import { STAFF_APP_CONFIG, STAFF_NAV_CONFIG } from '../constants/staffNavigation';

export const StaffHeader = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCampusOpen, setIsCampusOpen] = useState(false);
  const [isOutletOpen, setIsOutletOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState('Main Campus');
  const [selectedOutlet, setSelectedOutlet] = useState('Central Dining Hall');

  const displayName = user?.fullName || user?.name || 'Ravi Kumar';
  const displayRole = user?.role || 'Canteen Staff';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Searchable staff modules
  const allModules = useMemo(() => {
    const list = [];
    STAFF_NAV_CONFIG.forEach((group) => {
      group.items.forEach((item) => {
        list.push({ ...item, groupName: group.group });
      });
    });
    return list;
  }, []);

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allModules.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.groupName.toLowerCase().includes(q)
    );
  }, [allModules, searchQuery]);

  const handleSelectModule = (path) => {
    navigate(path);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className={styles.header}>
      {/* Left: Mobile hamburger & Search modules */}
      <div className={styles.headerLeft}>
        <button
          type="button"
          onClick={onOpenSidebar}
          className={styles.mobileMenuBtn}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Module Search matching Admin */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setIsSearchOpen(true);
            }}
            placeholder="Search modules..."
            style={{
              width: '100%',
              height: '34px',
              padding: '0 30px 0 34px',
              fontSize: '12.5px',
              borderRadius: 'var(--border-radius-full)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <X size={13} />
            </button>
          )}

          {/* Search Dropdown */}
          {isSearchOpen && filteredModules.length > 0 && (
            <>
              <div
                onClick={() => setIsSearchOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 75 }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: '100%',
                  minWidth: '260px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--modal-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-modal)',
                  zIndex: 80,
                  padding: '4px'
                }}
              >
                {filteredModules.map((mod) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => handleSelectModule(mod.path)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{mod.label}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        {mod.groupName}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Campus, Outlet, Dark Mode Toggle & Profile matching Admin */}
      <div className={styles.headerRight}>
        {/* 1. Campus Selection Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setIsCampusOpen((prev) => !prev);
              setIsOutletOpen(false);
              setIsProfileOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-muted)',
              padding: '5px 10px',
              borderRadius: 'var(--border-radius-full)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <MapPin size={13} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {selectedCampus}
            </span>
            <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
          </button>

          {isCampusOpen && (
            <>
              <div
                onClick={() => setIsCampusOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 65 }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  minWidth: '180px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 70,
                  padding: '4px'
                }}
              >
                {['Main Campus', 'North Campus', 'Engineering Block'].map((campus) => (
                  <button
                    key={campus}
                    type="button"
                    onClick={() => {
                      setSelectedCampus(campus);
                      setIsCampusOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: 'none',
                      backgroundColor: selectedCampus === campus ? 'var(--color-primary-light)' : 'transparent',
                      color: selectedCampus === campus ? 'var(--color-primary)' : 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: selectedCampus === campus ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {campus}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 2. Outlet Selection Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setIsOutletOpen((prev) => !prev);
              setIsCampusOpen(false);
              setIsProfileOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-muted)',
              padding: '5px 10px',
              borderRadius: 'var(--border-radius-full)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Store size={13} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {selectedOutlet}
            </span>
            <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
          </button>

          {isOutletOpen && (
            <>
              <div
                onClick={() => setIsOutletOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 65 }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  minWidth: '220px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 70,
                  padding: '4px'
                }}
              >
                {['Central Dining Hall', 'North Campus Food Court', 'Engineering Block Kiosk'].map((out) => (
                  <button
                    key={out}
                    type="button"
                    onClick={() => {
                      setSelectedOutlet(out);
                      setIsOutletOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: 'none',
                      backgroundColor: selectedOutlet === out ? 'var(--color-primary-light)' : 'transparent',
                      color: selectedOutlet === out ? 'var(--color-primary)' : 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: selectedOutlet === out ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {out}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 3. Dark Mode Toggle Icon */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
            e.currentTarget.style.borderColor = 'var(--color-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          {isDark ? (
            <Sun size={16} style={{ color: '#f59e0b' }} />
          ) : (
            <Moon size={16} style={{ color: '#6366f1' }} />
          )}
        </button>

        {/* 4. Staff Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen((prev) => !prev);
              setIsCampusOpen(false);
              setIsOutletOpen(false);
            }}
            className={styles.userProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              cursor: 'pointer',
              padding: '4px 6px 4px 10px',
              borderRadius: 'var(--border-radius-md)'
            }}
          >
            <div className={styles.avatar} title={`${displayName} (${displayRole})`}>
              {initials}
            </div>
            <div className={styles.userInfo} style={{ textAlign: 'left' }}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.userRole}>{displayRole}</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {isProfileOpen && (
            <>
              <div
                onClick={() => setIsProfileOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 75 }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: '220px',
                  backgroundColor: 'var(--modal-bg)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-lg)',
                  boxShadow: 'var(--shadow-modal)',
                  zIndex: 80,
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div className={styles.avatar} style={{ flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {displayRole}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--color-accent)', marginTop: '2px' }}>
                      {STAFF_APP_CONFIG.counterName}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '6px' }}>
                  <Link
                    to="/staff/profile"
                    onClick={() => setIsProfileOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      borderRadius: 'var(--border-radius-sm)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <User size={14} style={{ color: 'var(--color-accent)' }} />
                    <span>My Profile & Station</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      fontSize: '12.5px',
                      color: 'var(--color-danger)',
                      background: 'none',
                      border: 'none',
                      borderRadius: 'var(--border-radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-danger-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default StaffHeader;
