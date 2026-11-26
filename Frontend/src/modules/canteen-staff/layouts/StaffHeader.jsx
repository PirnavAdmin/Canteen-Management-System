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
  Boxes,
  AlertTriangle
} from 'lucide-react';
import styles from '../../../styles/layout.module.css';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useTheme } from '../../../hooks/useTheme';
import { STAFF_NAV_CONFIG } from '../constants/staffNavigation';
import { useStaffOutlet } from '../hooks/useStaffOutlet';

const ICON_MAP = {
  LayoutDashboard,
  ClipboardList,
  Flame,
  Boxes,
  AlertTriangle
};

export const StaffHeader = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const {
    outlets,
    selectedOutlet,
    activeOutletName,
    activeCampusName,
    changeOutlet,
    isStaffRestricted,
    availableCampuses,
    selectedCampus,
    setSelectedCampus
  } = useStaffOutlet();

  const [moduleQuery, setModuleQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCampusOpen, setIsCampusOpen] = useState(false);
  const [campusSearchQuery, setCampusSearchQuery] = useState('');
  const [isOutletOpen, setIsOutletOpen] = useState(false);
  const [outletSearchQuery, setOutletSearchQuery] = useState('');

  const displayName = user?.fullName || user?.name || user?.username || 'Staff Member';
  const displayRole = user?.role || 'Staff';
  const displayEmail = user?.email || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST';

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
    const q = moduleQuery.trim().toLowerCase();
    if (!q) return allModules;
    return allModules.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.groupName.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
    );
  }, [allModules, moduleQuery]);

  const filteredCampuses = useMemo(() => {
    const list = Array.isArray(availableCampuses) ? availableCampuses : [];
    if (!campusSearchQuery.trim()) return list;
    const q = campusSearchQuery.toLowerCase();
    return list.filter((c) => {
      const str = typeof c === 'object' ? (c?.name || c?.id || '') : String(c || '');
      return str.toLowerCase().includes(q);
    });
  }, [availableCampuses, campusSearchQuery]);

  const filteredOutlets = useMemo(() => {
    const list = outlets || [];
    if (!outletSearchQuery.trim()) return list;
    const q = outletSearchQuery.toLowerCase();
    return list.filter((o) =>
      (o.name && o.name.toLowerCase().includes(q)) ||
      (o.code && o.code.toLowerCase().includes(q)) ||
      (o.campus && o.campus.toLowerCase().includes(q))
    );
  }, [outlets, outletSearchQuery]);

  const handleSelectModule = (path) => {
    setModuleQuery('');
    setIsSearchOpen(false);
    navigate(path);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && filteredModules.length > 0) {
      e.preventDefault();
      handleSelectModule(filteredModules[0].path);
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    try {
      if (logout) await logout();
    } finally {
      navigate('/staff/login', { replace: true });
    }
  };

  const currentCampusLabel = selectedCampus || activeCampusName || 'Campus';

  return (
    <header className={styles.header}>
      {/* Left: Mobile hamburger & Search modules matching Admin Header */}
      <div className={styles.headerLeft}>
        <button
          type="button"
          onClick={onOpenSidebar}
          className={styles.mobileMenuBtn}
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>

        <div style={{ position: 'relative', width: '240px', maxWidth: '36vw', minWidth: '100px', flexShrink: 1 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
          <input
            type="text"
            value={moduleQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setModuleQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search modules..."
            aria-label="Search sidebar modules"
            style={{
              width: '100%',
              height: '34px',
              padding: '0 28px 0 32px',
              fontSize: '12.5px',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
          {moduleQuery && (
            <button
              type="button"
              onClick={() => {
                setModuleQuery('');
                setIsSearchOpen(true);
              }}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <X size={13} />
            </button>
          )}

          {isSearchOpen && (
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
                  minWidth: '250px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--modal-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-modal)',
                  zIndex: 80,
                  padding: '4px'
                }}
              >
                {filteredModules.length === 0 ? (
                  <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No matching modules found
                  </div>
                ) : (
                  filteredModules.map((mod) => {
                    const IconComp = ICON_MAP[mod.icon] || Store;
                    return (
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
                        <IconComp size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {mod.label}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            {mod.groupName}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Campus, Outlet, Dark Mode Toggle & Profile matching Admin Header */}
      <div className={styles.headerRight} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* 1. Campus Selection Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setIsCampusOpen((prev) => !prev);
              setCampusSearchQuery('');
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
              transition: 'all var(--transition-fast)',
              maxWidth: '140px',
              minWidth: 0,
              flexShrink: 1
            }}
            title="Institutional campus location"
            aria-label="Select institutional campus"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-muted)'; }}
          >
            <MapPin size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
            <span
              style={{
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {currentCampusLabel}
            </span>
            <ChevronDown size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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
                  minWidth: '220px',
                  maxWidth: 'calc(100vw - 32px)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 70,
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  padding: '8px 10px',
                  borderBottom: '1px solid var(--border-color-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--bg-app)'
                }}>
                  <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <input
                    type="text"
                    value={campusSearchQuery}
                    onChange={(e) => setCampusSearchQuery(e.target.value)}
                    placeholder="Search campus..."
                    autoFocus
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {campusSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCampusSearchQuery('')}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px 0' }}>
                  {filteredCampuses.length === 0 ? (
                    <div style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      No campuses found
                    </div>
                  ) : (
                    filteredCampuses.map((campus, idx) => {
                      const campusName = typeof campus === 'object' ? (campus?.name || campus?.id || '') : String(campus || '');
                      const isSelected = campusName === selectedCampus;
                      return (
                        <div
                          key={typeof campus === 'object' ? (campus?.id || idx) : campus}
                          onClick={() => {
                            if (setSelectedCampus) setSelectedCampus(campusName);
                            setIsCampusOpen(false);
                          }}
                          style={{
                            padding: '7px 12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: isSelected ? 'var(--color-accent)' : 'var(--text-primary)',
                            backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                            fontWeight: isSelected ? 600 : 400
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <span>{campusName}</span>
                          {isSelected && <span style={{ fontSize: '11px', color: 'var(--color-accent)' }}>✓</span>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 2. Outlet Selection Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            disabled={isStaffRestricted}
            onClick={() => {
              if (isStaffRestricted) return;
              setIsOutletOpen((prev) => !prev);
              setOutletSearchQuery('');
              setIsCampusOpen(false);
              setIsProfileOpen(false);
            }}
            title={isStaffRestricted ? `Assigned to ${activeOutletName || 'Outlet'}` : 'Active Canteen / Dining Outlet'}
            aria-label="Select Canteen Outlet"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-muted)',
              padding: '5px 10px',
              borderRadius: 'var(--border-radius-full)',
              border: selectedOutlet ? '1px solid var(--color-primary-border, var(--border-color))' : '1px solid var(--border-color)',
              cursor: isStaffRestricted ? 'default' : 'pointer',
              transition: 'all var(--transition-fast)',
              maxWidth: '160px',
              minWidth: 0,
              flexShrink: 1
            }}
            onMouseEnter={(e) => { if (!isStaffRestricted) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-muted)'; }}
          >
            <Store size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span
              style={{
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {activeOutletName || 'Select Outlet'}
            </span>
            {!isStaffRestricted && (
              <ChevronDown size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            )}
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
                  minWidth: '240px',
                  maxWidth: 'calc(100vw - 32px)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 70,
                  overflow: 'hidden'
                }}
              >
                {outlets.length > 3 && (
                  <div style={{
                    padding: '8px 10px',
                    borderBottom: '1px solid var(--border-color-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--bg-app)'
                  }}>
                    <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input
                      type="text"
                      value={outletSearchQuery}
                      onChange={(e) => setOutletSearchQuery(e.target.value)}
                      placeholder="Search outlet..."
                      autoFocus
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        fontSize: '12px',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                )}

                <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px' }}>
                  {filteredOutlets.length === 0 ? (
                    <div style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      No outlets available
                    </div>
                  ) : (
                    filteredOutlets.map((out) => {
                      const isSelected = String(out.id) === String(selectedOutlet) || String(out.outletId) === String(selectedOutlet);
                      return (
                        <button
                          key={out.id}
                          type="button"
                          onClick={() => {
                            changeOutlet(out.id);
                            setIsOutletOpen(false);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '7px 10px',
                            borderRadius: 'var(--border-radius-sm)',
                            border: 'none',
                            backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                            color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '12px',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: out.status === 'Active' ? 'var(--color-success)' : 'var(--text-muted)',
                              flexShrink: 0
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {out.name}
                            </div>
                            {(out.code || out.campus) && (
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                {[out.code, out.campus].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 3. Light / Dark Theme Switcher */}
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
            aria-label="Open profile menu"
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
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayRole}{displayEmail ? ` • ${displayEmail}` : ''}
                    </div>
                    {activeOutletName && (
                      <div style={{ fontSize: '10.5px', color: 'var(--color-accent)', marginTop: '2px' }}>
                        {activeOutletName}
                      </div>
                    )}
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
                      fontSize: '13px',
                      fontWeight: 500,
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
                    <User size={15} style={{ color: 'var(--color-accent)' }} />
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
                      fontSize: '13px',
                      fontWeight: 600,
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
                    <LogOut size={15} />
                    <span>Logout</span>
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
