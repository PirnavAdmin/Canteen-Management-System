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
import { useCanteens } from '../../modules/admin/outlets/hooks/useCanteens';
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

  const {
    selectedCampus,
    setSelectedCampus,
    availableCampuses,
    canteens,
    selectedOutlet,
    setSelectedOutlet,
    selectedOutletObj
  } = useCanteens();
  const [isCampusDropdownOpen, setIsCampusDropdownOpen] = useState(false);
  const [campusSearchQuery, setCampusSearchQuery] = useState('');
  const [isOutletDropdownOpen, setIsOutletDropdownOpen] = useState(false);
  const [outletSearchQuery, setOutletSearchQuery] = useState('');

  const filteredOutlets = useMemo(() => {
    const list = canteens || [];
    if (!outletSearchQuery.trim()) return list;
    const q = outletSearchQuery.toLowerCase();
    return list.filter(o =>
      (o.name && o.name.toLowerCase().includes(q)) ||
      (o.code && o.code.toLowerCase().includes(q)) ||
      (o.campus && o.campus.toLowerCase().includes(q))
    );
  }, [canteens, outletSearchQuery]);

  const filteredCampuses = useMemo(() => {
    const list = availableCampuses || [];
    if (!campusSearchQuery.trim()) return list;
    const q = campusSearchQuery.toLowerCase();
    return list.filter(c => c.toLowerCase().includes(q));
  }, [availableCampuses, campusSearchQuery]);

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

      <div className={styles.headerRight} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* 1. Campus Selection Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setIsCampusDropdownOpen(prev => !prev);
              setCampusSearchQuery('');
              setIsOutletDropdownOpen(false);
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
              maxWidth: '150px'
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
              {selectedCampus || 'Main Campus'}
            </span>
            <ChevronDown size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </button>

          {isCampusDropdownOpen && (
            <>
              <div
                onClick={() => setIsCampusDropdownOpen(false)}
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
                {/* Search bar inside the same dropdown */}
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

                {/* Campus options list */}
                <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px 0' }}>
                  {filteredCampuses.length === 0 ? (
                    <div style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      No campuses found
                    </div>
                  ) : (
                    filteredCampuses.map((campus) => {
                      const isSelected = campus === selectedCampus;
                      return (
                        <div
                          key={campus}
                          onClick={() => {
                            setSelectedCampus(campus);
                            setIsCampusDropdownOpen(false);
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
                          <span>{campus}</span>
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

        {/* 2. Outlets Selection Dropdown (Global Active Outlet) */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setIsOutletDropdownOpen(prev => !prev);
              setOutletSearchQuery('');
              setIsCampusDropdownOpen(false);
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
              border: selectedOutlet !== 'ALL' ? '1px solid var(--color-primary-border, var(--border-color))' : '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              maxWidth: '180px'
            }}
            title="Active Canteen / Dining Outlet"
            aria-label="Select Canteen Outlet"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
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
              {selectedOutlet === 'ALL' ? 'All Campus Outlets' : (selectedOutletObj?.name || 'All Campus Outlets')}
            </span>
            <ChevronDown size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </button>

          {isOutletDropdownOpen && (
            <>
              <div
                onClick={() => setIsOutletDropdownOpen(false)}
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
                {/* Search bar inside the dropdown if > 3 outlets */}
                {canteens.length > 3 && (
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
                  {/* Option: All Campus Outlets */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOutlet('ALL');
                      setIsOutletDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: 'none',
                      backgroundColor: selectedOutlet === 'ALL' ? 'var(--color-primary-light)' : 'transparent',
                      color: selectedOutlet === 'ALL' ? 'var(--color-primary)' : 'var(--text-primary)',
                      fontWeight: selectedOutlet === 'ALL' ? 700 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedOutlet !== 'ALL') e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedOutlet !== 'ALL') e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Store size={14} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      All Campus Outlets
                    </span>
                  </button>

                  {/* List of individual Outlets */}
                  {filteredOutlets.map((outlet) => {
                    const isSelected = String(selectedOutlet) === String(outlet.outletId || outlet.id);
                    return (
                      <button
                        key={outlet.outletId || outlet.id}
                        type="button"
                        onClick={() => {
                          setSelectedOutlet(String(outlet.outletId || outlet.id));
                          setIsOutletDropdownOpen(false);
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
                            backgroundColor: outlet.status === 'Active' ? 'var(--color-success)' : 'var(--text-muted)',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {outlet.name}
                          </div>
                          {outlet.code && (
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {outlet.code} • {outlet.campus || 'Main Campus'}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 3. Light / Dark Theme Switcher Button (Icon only) */}
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
