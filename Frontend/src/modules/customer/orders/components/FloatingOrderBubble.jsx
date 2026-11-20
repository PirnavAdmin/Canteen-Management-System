import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Clock } from 'lucide-react';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { customerOrderService } from '../services/customerOrderService';
import { customerMenuService } from '../../menu/services/customerMenuService';
import { SafeImage } from '../../../../components/common/SafeImage';

const getStatusBadgeStyle = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('ready') || s.includes('pickup')) {
    return { bg: '#10b981', color: '#ffffff', border: '#059669', label: 'Ready' };
  }
  if (s.includes('prep') || s.includes('kitchen') || s.includes('cook')) {
    return { bg: '#f59e0b', color: '#ffffff', border: '#d97706', label: 'Preparing' };
  }
  if (s.includes('accept')) {
    return { bg: '#0284c7', color: '#ffffff', border: '#0369a1', label: 'Accepted' };
  }
  return { bg: '#6366f1', color: '#ffffff', border: '#4f46e5', label: 'Placed' };
};

export const FloatingOrderBubble = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeOrder, setActiveOrder] = useState(null);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [menuImages, setMenuImages] = useState({});

  // Poll live orders every 5 seconds
  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        const list = await customerOrderService.getCustomerOrders(user);
        if (!isMounted) return;
        const orders = Array.isArray(list) ? list : [];
        // Only active in-progress orders (not Completed, Cancelled, or Refunded)
        const active = orders.find(o => o && !['Completed', 'Cancelled', 'Refunded'].includes(o.status));
        setActiveOrder(active || null);
      } catch (err) {
        console.warn('Could not fetch active order for bubble:', err);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // Load menu image mapping for dish image lookups
  useEffect(() => {
    let isMounted = true;
    customerMenuService.getAllFoodItems().then((items) => {
      if (!isMounted) return;
      const index = (Array.isArray(items) ? items : []).reduce((acc, item) => {
        if (!item?.imageUrl) return acc;
        if (item.id) acc[`id:${String(item.id)}`] = item.imageUrl;
        if (item.name) acc[`name:${item.name.trim().toLowerCase()}`] = item.imageUrl;
        return acc;
      }, {});
      setMenuImages(index);
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const items = Array.isArray(activeOrder?.items) ? activeOrder.items : [];

  // Cycle through ordered items every 3 seconds if there are multiple items
  useEffect(() => {
    if (items.length <= 1) {
      setActiveItemIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setActiveItemIndex(prev => (prev + 1) % items.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [items.length]);

  // If no active order, or once order is completed, bubble completely disappears
  if (!activeOrder || items.length === 0) {
    return null;
  }

  const currentItem = items[activeItemIndex] || items[0] || {};
  const itemImage =
    currentItem.imageUrl ||
    menuImages[`id:${String(currentItem.id || '')}`] ||
    menuImages[`name:${String(currentItem.name || '').trim().toLowerCase()}`] ||
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80';

  const statusStyle = getStatusBadgeStyle(activeOrder.status);

  return (
    <div
      onClick={() => navigate('/customer/orders')}
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 998,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'transform 0.25s ease',
        userSelect: 'none'
      }}
      title={`Live Order #${activeOrder.id}: ${currentItem.name || 'Dish'} (${activeOrder.status}) - Click to track`}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.06) translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) translateY(0)';
      }}
    >
      {/* Outer Floating Bubble Container */}
      <div style={{
        position: 'relative',
        width: '68px',
        height: '68px',
        borderRadius: '50%',
        backgroundColor: 'var(--bg-surface, #ffffff)',
        padding: '3px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(37, 99, 235, 0.25)',
        border: '2.5px solid var(--color-accent, #2563eb)',
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Animated Inner Food Image with Smooth Transition */}
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-muted, #f1f5f9)',
          position: 'relative'
        }}>
          <SafeImage
            key={`${currentItem.id || currentItem.name}-${activeItemIndex}`}
            src={itemImage}
            alt={currentItem.name || 'Ordered Food'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              animation: 'fadeIn 0.4s ease-in-out'
            }}
            fallback={
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <UtensilsCrossed size={22} />
              </div>
            }
          />
        </div>

        {/* Status Badge floating at the TOP-RIGHT of the bubble */}
        <div style={{
          position: 'absolute',
          top: '-6px',
          right: '-8px',
          backgroundColor: statusStyle.bg,
          color: statusStyle.color,
          fontSize: '9.5px',
          fontWeight: 800,
          padding: '2px 7px',
          borderRadius: '9999px',
          border: '1.5px solid #ffffff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          whiteSpace: 'nowrap'
        }}>
          <span style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            display: 'inline-block'
          }} />
          <span>{statusStyle.label}</span>
        </div>

        {/* Multiple items count indicator at bottom if more than 1 item */}
        {items.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            fontSize: '9px',
            fontWeight: 800,
            padding: '1px 5px',
            borderRadius: '9999px',
            border: '1px solid #ffffff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap'
          }}>
            {activeItemIndex + 1}/{items.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingOrderBubble;
