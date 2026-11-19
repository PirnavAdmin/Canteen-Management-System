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
import { STAFF_NAV_CONFIG } from '../constants/staffNavigation';

const ICON_MAP = {
  LayoutDashboard,
  ClipboardList,
  Flame,
  Package: Boxes,
  Boxes,
  AlertTriangle
};

export const StaffSidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`} aria-label="Staff Navigation">
        {/* Brand Header matching Admin */}
        <div className={styles.sidebarHeader}>
          <div className={styles.brandLogo}>
            <Utensils size={18} />
          </div>
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle} title="Apex Institute of Technology & Sciences">
              Apex Institute of Technology & Sciences
            </span>
          </div>
          <button
            onClick={onClose}
            className={styles.mobileMenuBtn}
            style={{ marginLeft: 'auto' }}
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation links matching Admin */}
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
                        borderRadius: '9999px',
                        fontWeight: 700,
                        backgroundColor: item.badge === 'Live' ? '#10b981' : '#f97316',
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

        {/* Institutional Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.institutionBadge}>
            <span className={styles.institutionName}>Central Dining Hall</span>
            <span className={styles.institutionStatus}>
              <span className={styles.statusDot} />
              Counter 02 Online
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default StaffSidebar;
