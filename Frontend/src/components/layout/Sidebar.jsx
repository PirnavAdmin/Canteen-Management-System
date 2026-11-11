import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Utensils,
  X,
  Building2,
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
import { APP_CONFIG, ADMIN_NAV_CONFIG } from '../../constants/navigation';
import { useAuth } from '../../hooks/useAuth';

// Icon mapping registry
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

export const Sidebar = ({ isOpen, onClose }) => {
  const { hasPermission } = useAuth();

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`} aria-label="Main Navigation">
        <div className={styles.sidebarHeader}>
          <div className={styles.brandLogo}>
            <Utensils size={18} />
          </div>
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle}>Canteen Admin</span>
            <span className={styles.brandSubtitle}>SMS / CMS Integration</span>
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

        <nav className={styles.sidebarNav}>
          {ADMIN_NAV_CONFIG.map((group) => {
            // Filter items based on authenticated role permissions
            const visibleItems = group.items.filter(item => hasPermission(item.permission));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.group} className={styles.navGroup}>
                <div className={styles.navGroupLabel}>{group.group}</div>
                {visibleItems.map((item) => {
                  const IconComponent = ICON_MAP[item.icon] || Store;

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
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Building2 size={20} style={{ color: 'var(--text-sidebar-muted)', flexShrink: 0 }} />
          <div className={styles.institutionBadge}>
            <span className={styles.institutionName}>{APP_CONFIG.institutionName}</span>
            <span className={styles.institutionStatus}>
              <span className={styles.statusDot} />
              Institutional Mode Active
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
