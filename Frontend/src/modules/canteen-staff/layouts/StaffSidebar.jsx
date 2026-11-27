import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Utensils,
  X,
  LayoutDashboard,
  ClipboardList,
  Flame,
  Boxes,
  AlertTriangle
} from 'lucide-react';
import styles from '../../../styles/layout.module.css';
import { STAFF_NAV_CONFIG, STAFF_APP_CONFIG } from '../constants/staffNavigation';
import { useStaffOutlet } from '../hooks/useStaffOutlet';

const ICON_MAP = {
  LayoutDashboard,
  ClipboardList,
  Flame,
  Package: Boxes,
  Boxes,
  AlertTriangle
};

export const StaffSidebar = ({ isOpen, onClose }) => {
  const { activeOutletName, selectedOutletObj, outletsLoading } = useStaffOutlet();
  const outletStatus = selectedOutletObj?.status || (outletsLoading ? 'Connecting...' : 'Online');

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`} aria-label="Staff Navigation">
        {/* Brand Header matching Admin Sidebar */}
        <div className={styles.sidebarHeader}>
          <div className={styles.brandLogo}>
            <Utensils size={18} />
          </div>
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle} title={STAFF_APP_CONFIG.institutionName}>
              {STAFF_APP_CONFIG.institutionName}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.mobileMenuBtn}
            style={{ marginLeft: 'auto' }}
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation links matching Admin Sidebar */}
        <nav className={styles.sidebarNav}>
          {STAFF_NAV_CONFIG.filter((group) => group.items && group.items.length > 0).map((group) => (
            <div key={group.group} className={styles.navGroup}>
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
                    title={item.description}
                  >
                    <IconComponent className={styles.navIcon} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: 'var(--border-radius-full)',
                        fontWeight: 700,
                        backgroundColor: 'var(--color-success)',
                        color: '#ffffff'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Live Outlet Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.institutionBadge}>
            <span className={styles.institutionName}>
              {activeOutletName || (outletsLoading ? 'Loading outlet...' : 'Canteen Operations')}
            </span>
            <span className={styles.institutionStatus}>
              <span className={styles.statusDot} />
              {selectedOutletObj?.code ? `${selectedOutletObj.code} • ${outletStatus}` : outletStatus}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default StaffSidebar;
