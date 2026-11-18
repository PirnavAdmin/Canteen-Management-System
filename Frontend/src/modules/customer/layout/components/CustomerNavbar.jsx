import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCart } from '../../cart/hooks/useCart';
import {
  Home,
  UtensilsCrossed,
  ShoppingCart,
  Clock,
  FileText,
  Star
} from 'lucide-react';
import styles from '../styles/customerLayout.module.css';

export const CustomerNavbar = () => {
  const { itemCount } = useCart();

  return (
    <nav className={styles.navbar}>
      <div className={styles.navInner}>
        <div className={styles.navLinks}>
          <NavLink
            to="/customer/dashboard"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            <Home size={17} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/customer/menu"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            <UtensilsCrossed size={17} />
            <span>Canteen Menu</span>
          </NavLink>

          <NavLink
            to="/customer/cart"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            <ShoppingCart size={17} />
            <span>My Cart</span>
            {itemCount > 0 && <span className={styles.navCartPill}>{itemCount}</span>}
          </NavLink>

          <NavLink
            to="/customer/orders"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            <Clock size={17} />
            <span>My Orders</span>
          </NavLink>

          <NavLink
            to="/customer/order-history"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            <FileText size={17} />
            <span>Order History</span>
          </NavLink>

          <NavLink
            to="/customer/feedback"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            <Star size={17} />
            <span>Rate & Privacy</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default CustomerNavbar;
