import React from 'react';
import { Menu, ShieldCheck, MapPin } from 'lucide-react';
import styles from '../../styles/layout.module.css';
import { APP_CONFIG } from '../../constants/navigation';

export const Header = ({ onOpenSidebar }) => {
  const { currentUser } = APP_CONFIG;

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

