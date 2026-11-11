import React from 'react';
import { Menu, ShieldCheck, MapPin, Sun, Moon } from 'lucide-react';
import styles from '../../styles/layout.module.css';
import { APP_CONFIG } from '../../constants/navigation';
import { useTheme } from '../../hooks/useTheme';

export const Header = ({ onOpenSidebar }) => {
  const { currentUser } = APP_CONFIG;
  const { toggleTheme, isDark } = useTheme();

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
          <span>{currentUser.campus}</span>
        </div>

        <div className={styles.userProfile}>
          <div className={styles.avatar} title={`${currentUser.name} (${currentUser.id})`}>
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{currentUser.name}</span>
            <span className={styles.userRole}>{currentUser.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};


