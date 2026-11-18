import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerSidebar } from './CustomerSidebar';
import { CustomerHeader } from './CustomerHeader';
import { CartProvider } from '../../cart/context/CartContext';
import { CartDrawer } from '../../cart/components/CartDrawer';
import styles from '../styles/customerLayout.module.css';

export const CustomerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <CartProvider>
      <div className={styles.layoutContainer}>
        <CustomerSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className={styles.mainWrapper}>
          <CustomerHeader onOpenSidebar={() => setSidebarOpen(true)} />
          <main className={styles.contentArea}>
            <Outlet />
          </main>
        </div>

        {/* Global Cart Slide-Out Tray Drawer */}
        <CartDrawer />
      </div>
    </CartProvider>
  );
};

export default CustomerLayout;
