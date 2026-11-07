import React from 'react';
import { NavLink } from 'react-router-dom';
import { Utensils, LayoutGrid, PlusCircle, Store, X, Building2 } from 'lucide-react';
import styles from '../../styles/layout.module.css';
import { APP_CONFIG } from '../../constants/navigation';

export const Sidebar = ({ isOpen, onClose }) => {
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
          {/* Canteen Management Section */}
          <div className={styles.navGroup}>
            <div className={styles.navGroupLabel}>Canteen Management</div>
            <NavLink
              to="/canteen"
              end
              onClick={onClose}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <Store className={styles.navIcon} />
              <span>Canteen List</span>
            </NavLink>
            <NavLink
              to="/canteen/create"
              onClick={onClose}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <PlusCircle className={styles.navIcon} />
              <span>Add Canteen</span>
            </NavLink>
          </div>

          {/* Categories Management Section */}
          <div className={styles.navGroup}>
            <div className={styles.navGroupLabel}>Categories Management</div>
            <NavLink
              to="/categories"
              end
              onClick={onClose}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <LayoutGrid className={styles.navIcon} />
              <span>Category List</span>
            </NavLink>
            <NavLink
              to="/categories/create"
              onClick={onClose}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <PlusCircle className={styles.navIcon} />
              <span>Add Category</span>
            </NavLink>
          </div>
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

