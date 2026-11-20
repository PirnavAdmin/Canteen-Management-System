import React from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerHeader } from './CustomerHeader';
import { CartProvider } from '../../cart/context/CartContext';
import { CartDrawer } from '../../cart/components/CartDrawer';
import { FloatingOrderBubble } from '../../orders/components/FloatingOrderBubble';
import styles from '../styles/customerLayout.module.css';

export const CustomerLayout = () => {
  return (
    <CartProvider>
      <div className={styles.layoutContainer}>
        <div className={styles.mainWrapper} style={{ marginLeft: 0 }}>
          <CustomerHeader />
          <main className={styles.contentArea}>
            <Outlet />
          </main>
        </div>

        {/* Global Cart Slide-Out Tray Drawer */}
        <CartDrawer />

        {/* Global Floating Live Order Status Bubble */}
        <FloatingOrderBubble />
      </div>
    </CartProvider>
  );
};

export default CustomerLayout;
