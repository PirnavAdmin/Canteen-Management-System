import React, { useState, useMemo } from 'react';
import {
  Menu,
  MapPin,
  LogOut,
  Sun,
  Moon,
  Search,
  X,
  ChevronDown,
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Clock,
  Boxes,
  BarChart3,
  MessageSquareWarning,
  Store,
  Layers,
  Settings
} from 'lucide-react';
import styles from '../../styles/layout.module.css';
import { useAuth } from '../../app/providers/AuthProvider';
import { useTheme } from '../../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { ADMIN_NAV_CONFIG } from '../../constants/navigation';

const ICON_MAP = {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Clock,
  Boxes,
  BarChart3,
  MessageSquareWarning,
  Store,
  Layers,
  Settings
};

export const Header = ({ onOpenSidebar }) => {
  const { user, role, logout, hasPermission } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [moduleQuery, setModuleQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const displayName = user?.fullName || user?.username || 'Canteen Administrator';
  const displayRole = user?.role || role || 'Admin';
  const displayEmail = user?.email || 'admin@cms.edu';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Flatten existing sidebar modules permitted for current user
  const allModules = useMemo(() => {
    const list = [];
    ADMIN_NAV_CONFIG.forEach((group) => {
      group.items.forEach((item) => {
        if (hasPermission(item.permission)) {
          list.push({ ...item, groupName: group.group });
        }
      });
    });
    return list;
  }, [hasPermission]);

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

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={onOpenSidebar}
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>

        {/* Sidebar Modules Search Bar */}
        <div style={{ position: 'relative', width: '260px', maxWidth: '48vw' }}>
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

          {/* Floating Module Search Results */}
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

      <div className={styles.headerRight}>
        {/* Light / Dark Theme Switcher Button */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--border-radius-full)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-muted)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
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
            <>
              <Sun size={15} style={{ color: '#f59e0b' }} />
              <span className="theme-toggle-label">Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={15} style={{ color: '#6366f1' }} />
              <span className="theme-toggle-label">Dark Mode</span>
            </>
          )}
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--bg-muted)',
          padding: '4px 10px',
          borderRadius: 'var(--border-radius-full)'
        }}>
          <MapPin size={13} style={{ color: 'var(--color-accent)' }} />
          <span>Main Campus</span>
        </div>

        {/* Clickable Profile Trigger + Floating Profile Modal */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
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
                {/* Profile Details */}
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
                      {displayRole} • {displayEmail}
                    </div>
                  </div>
                </div>

                {/* Logout Action */}
                <div style={{ padding: '6px' }}>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: 'none',
                      background: 'none',
                      color: 'var(--color-danger)',
                      fontSize: '13px',
                      fontWeight: 600,
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

export default Header;
