import React from 'react';
import { NavLink } from 'react-router-dom';
import { Utensils, X } from 'lucide-react';
import styles from '../styles/customerLayout.module.css';
import { CUSTOMER_NAV_GROUPS } from '../constants/customerNavigation';
import { APP_CONFIG } from '../../../../constants/navigation';
import { useCart } from '../../cart/hooks/useCart';

export const CustomerSidebar = ({ isOpen, onClose }) => {
  const { itemCount } = useCart();

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`} aria-label="Customer Navigation">
        {/* Sidebar Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.brandLogo}>
            <Utensils size={18} />
          </div>
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle} title={APP_CONFIG.institutionName}>
              {APP_CONFIG.institutionName}
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

        {/* Sidebar Navigation */}
        <nav className={styles.sidebarNav}>
          {CUSTOMER_NAV_GROUPS.map((group) => (
            <div key={group.group} className={styles.navGroup}>
              <div className={styles.navGroupLabel}>{group.group}</div>
              {group.items.map((item) => {
                const IconComponent = item.icon;

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
                    <div className={styles.navItemLeft}>
                      <IconComponent className={styles.navIcon} />
                      <span>{item.label}</span>
                    </div>

                    {item.showCartBadge && itemCount > 0 && (
                      <span className={styles.cartBadge}>{itemCount}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default CustomerSidebar;
