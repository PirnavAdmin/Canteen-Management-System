import React from 'react';
import { Menu, ShieldCheck, MapPin, LogOut } from 'lucide-react';
import styles from '../../styles/layout.module.css';
import { useAuth } from '../../app/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';

export const Header = ({ onOpenSidebar }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.fullName || user?.username || 'Canteen Administrator';
  const displayRole = user?.role || role || 'Admin';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
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

        <div className={styles.portalIndicator}>
          <ShieldCheck size={14} />
          <span>Integrated CMS / SMS Portal</span>
        </div>
      </div>

      <div className={styles.headerRight}>
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

        <div className={styles.userProfile} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className={styles.avatar} title={`${displayName} (${displayRole})`}>
            {initials}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userRole}>{displayRole}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginLeft: '6px'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
