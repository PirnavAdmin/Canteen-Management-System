import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Flame,
  ClipboardList,
  QrCode,
  X,
  UtensilsCrossed,
  ChefHat
} from 'lucide-react';
import styles from '../styles/staff.module.css';
import { STAFF_NAV_CONFIG, STAFF_APP_CONFIG } from '../constants/staffNavigation';

const ICON_MAP = {
  LayoutDashboard,
  Flame,
  ClipboardList,
  QrCode
};

export const StaffSidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 45
          }}
        />
      )}

      <aside className={`${styles.staffSidebar} ${isOpen ? styles.staffSidebarOpen : ''}`} aria-label="Staff Navigation">
        {/* Brand Header */}
        <div className={styles.staffSidebarHeader}>
          <div className={styles.brandLogo}>
            <ChefHat size={20} />
          </div>
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle} title={STAFF_APP_CONFIG.portalName}>
              {STAFF_APP_CONFIG.portalName}
            </span>
            <span className={styles.brandSubtitle}>
              {STAFF_APP_CONFIG.counterName}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'none'
            }}
            className="mobileOnly"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className={styles.staffNav}>
          {STAFF_NAV_CONFIG.map((group) => (
            <div key={group.group} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className={styles.navGroupLabel}>{group.group}</div>
              {group.items.map((item) => {
                const IconComponent = ICON_MAP[item.icon] || ClipboardList;

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                    }
                  >
                    <IconComponent size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer station status */}
        <div style={{
          padding: '14px 18px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '11.5px',
          backgroundColor: 'var(--bg-app)',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-success)', marginBottom: '2px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            Kitchen Display Active
          </div>
          <div>Terminal: Station 02 (Cook Line)</div>
        </div>
      </aside>
    </>
  );
};

export default StaffSidebar;
