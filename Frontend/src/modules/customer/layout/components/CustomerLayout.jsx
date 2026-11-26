import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerHeader } from './CustomerHeader';
import { CartProvider } from '../../cart/context/CartContext';
import { CartDrawer } from '../../cart/components/CartDrawer';
import { FloatingOrderBubble } from '../../orders/components/FloatingOrderBubble';
import { FoodRatingModal, inMemoryRatedOrderIds } from '../../feedback/components/FoodRatingModal';
import { subscribeToOrderSync } from '../../../../utils/orderSync';
import styles from '../styles/customerLayout.module.css';

export const CustomerLayout = () => {
  const [feedbackOrder, setFeedbackOrder] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const prevStatusesRef = useRef({});

  // Synchronously listen to order status transitions across customer portal
  useEffect(() => {
    const handleOrderUpdate = (order) => {
      if (!order) return;
      const orderId = String(order.id || order.orderId || '');
      if (!orderId) return;

      const prevStatus = prevStatusesRef.current[orderId];
      const newStatus = order.status;
      prevStatusesRef.current[orderId] = newStatus;

      // When order status transitions to 'Collected' or 'Completed' (from 'Ready for Pickup' or in-progress)
      const isFinished = (newStatus === 'Collected' || newStatus === 'Completed');
      if (isFinished && !inMemoryRatedOrderIds.has(orderId)) {
        setFeedbackOrder(order);
        setIsFeedbackOpen(true);
      }
    };

    const unsubscribe = subscribeToOrderSync(handleOrderUpdate, (newOrder) => {
      if (newOrder?.id) {
        prevStatusesRef.current[String(newOrder.id)] = newOrder.status || 'Placed';
      }
    });

    const handleCustomFeedbackOpen = (e) => {
      if (e.detail?.order) {
        setFeedbackOrder(e.detail.order);
        setIsFeedbackOpen(true);
      }
    };

    window.addEventListener('cms:open-dish-feedback', handleCustomFeedbackOpen);

    return () => {
      unsubscribe();
      window.removeEventListener('cms:open-dish-feedback', handleCustomFeedbackOpen);
    };
  }, []);

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

        {/* Feedback & Rating Modal for Recently Taken Dish */}
        <FoodRatingModal
          isOpen={isFeedbackOpen}
          order={feedbackOrder}
          onClose={() => {
            if (feedbackOrder) {
              const oId = String(feedbackOrder.id || feedbackOrder.orderId || '');
              if (oId) inMemoryRatedOrderIds.add(oId);
            }
            setIsFeedbackOpen(false);
            setFeedbackOrder(null);
          }}
        />
      </div>
    </CartProvider>
  );
};

export default CustomerLayout;
