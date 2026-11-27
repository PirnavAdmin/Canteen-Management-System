import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { customerOrderService } from '../services/customerOrderService';
import { customerMenuService } from '../../menu/services/customerMenuService';
import { SafeImage } from '../../../../components/common/SafeImage';
import { subscribeToOrderSync } from '../../../../utils/orderSync';
import { formatCurrency } from '../../../../utils/formatters';

const getStatusBadgeStyle = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('ready') || s.includes('pickup')) {
    return { bg: '#10b981', color: '#ffffff', border: '#059669', label: 'Ready for Pickup', dot: '#10b981' };
  }
  if (s.includes('prep') || s.includes('kitchen') || s.includes('cook')) {
    return { bg: '#f59e0b', color: '#ffffff', border: '#d97706', label: 'Preparing', dot: '#f59e0b' };
  }
  if (s.includes('accept')) {
    return { bg: '#0284c7', color: '#ffffff', border: '#0369a1', label: 'Accepted', dot: '#0284c7' };
  }
  return { bg: '#6366f1', color: '#ffffff', border: '#4f46e5', label: 'Placed', dot: '#6366f1' };
};

export const FloatingOrderBubble = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeOrders, setActiveOrders] = useState([]);
  const [isListOpen, setIsListOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [menuImages, setMenuImages] = useState({});

  const activeOrdersRef = useRef([]);
  activeOrdersRef.current = activeOrders;
  const isFetchingRef = useRef(false);
  const popupRef = useRef(null);
  const bubbleRef = useRef(null);

  // Synchronously listen to live status updates & trigger upon order placement
  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      if (isFetchingRef.current) return;
      try {
        isFetchingRef.current = true;
        const list = await customerOrderService.getCustomerOrders(user);
        if (!isMounted) return;
        const orders = Array.isArray(list) ? list : [];
        // Sort descending so the most recent order is checked first
        const sorted = [...orders].sort((a, b) => {
          const timeA = new Date(a.orderDate || a.createdAt || 0).getTime();
          const timeB = new Date(b.orderDate || b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        // Active in-progress orders (disappears once Completed, Collected, Cancelled, or Refunded)
        const active = sorted.filter(
          o => o && !['completed', 'collected', 'cancelled', 'refunded'].includes(String(o.status || '').toLowerCase())
        );
        setActiveOrders(active);
      } catch (err) {
        console.warn('Could not fetch active orders for bubble:', err);
      } finally {
        isFetchingRef.current = false;
      }
    };

    fetchOrders();

    const handleOrderEvent = () => {
      fetchOrders();
    };

    const unsubscribe = subscribeToOrderSync(handleOrderEvent, fetchOrders);

    // Heartbeat check when active orders are present
    const gentleInterval = setInterval(() => {
      if (activeOrdersRef.current && activeOrdersRef.current.length > 0) {
        fetchOrders();
      }
    }, 20000);

    const handleFocus = () => {
      if (activeOrdersRef.current && activeOrdersRef.current.length > 0) fetchOrders();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(gentleInterval);
      window.removeEventListener('focus', handleFocus);
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

  // Close list popup on click outside or escape key
  useEffect(() => {
    if (!isListOpen) return;
    const handleClickOutside = (e) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        bubbleRef.current &&
        !bubbleRef.current.contains(e.target)
      ) {
        setIsListOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsListOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isListOpen]);

  // Collect items across all active orders to rotate smoothly in the bubble
  const allItems = useMemo(() => {
    if (!activeOrders || activeOrders.length === 0) return [];
    const collected = [];
    activeOrders.forEach(ord => {
      const oItems = Array.isArray(ord.items) && ord.items.length > 0
        ? ord.items
        : [{ name: ord.outletName || 'Campus Meal', price: ord.totalAmount }];
      oItems.forEach(it => {
        collected.push({ ...it, orderId: ord.id, orderStatus: ord.status, token: ord.token });
      });
    });
    return collected;
  }, [activeOrders]);

  // Cycle through ordered items every 3 seconds if there are multiple items
  useEffect(() => {
    if (allItems.length <= 1) {
      setActiveItemIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setActiveItemIndex(prev => (prev + 1) % allItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [allItems.length]);

  // If no active orders, bubble completely disappears
  if (!activeOrders || activeOrders.length === 0) {
    return null;
  }

  const handleTrackOrder = (order) => {
    if (!order) return;
    setIsListOpen(false);
    if (window.location.pathname === '/customer/orders') {
      window.dispatchEvent(new CustomEvent('cms:open-order-tracker', { detail: { order } }));
    } else {
      navigate('/customer/orders', { state: { trackOrder: order, trackOrderId: order.id } });
    }
  };

  const handleBubbleClick = (e) => {
    e?.stopPropagation?.();
    if (activeOrders.length === 0) return;
    if (activeOrders.length > 1) {
      setIsListOpen(prev => !prev);
    } else {
      handleTrackOrder(activeOrders[0]);
    }
  };

  const currentItem = allItems[activeItemIndex] || allItems[0] || {};
  const firstOrder = activeOrders[0] || {};
  const statusStyle = getStatusBadgeStyle(firstOrder.status);

  const itemImage =
    currentItem.imageUrl ||
    menuImages[`id:${String(currentItem.id || '')}`] ||
    menuImages[`name:${String(currentItem.name || '').trim().toLowerCase()}`] ||
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80';

  return (
    <>
      {/* Multiple Orders List & Tracking Popup */}
      {isListOpen && activeOrders.length > 1 && (
        <div
          ref={popupRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            bottom: '108px',
            right: '28px',
            width: '380px',
            maxWidth: 'calc(100vw - 36px)',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderRadius: '16px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.2), 0 2px 10px rgba(0, 0, 0, 0.08)',
            border: '1px solid var(--border-color, #e2e8f0)',
            zIndex: 999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            backgroundColor: 'var(--bg-muted, #f8fafc)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary-light, #eff6ff)',
                color: 'var(--color-primary, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShoppingBag size={16} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  Active Orders ({activeOrders.length})
                </h4>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                  Follow orders from kitchen prep to pickup
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsListOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #64748b)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close list"
              aria-label="Close list"
            >
              <X size={16} />
            </button>
          </div>

          {/* Orders Scrollable List */}
          <div
            className="thin-scrollbar"
            style={{
              padding: '10px 12px',
              maxHeight: '360px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {activeOrders.map((ord, idx) => {
              const oItems = Array.isArray(ord.items) && ord.items.length > 0 ? ord.items : [];
              const firstItem = oItems[0] || {};
              const oImg =
                firstItem.imageUrl ||
                menuImages[`id:${String(firstItem.id || '')}`] ||
                menuImages[`name:${String(firstItem.name || '').trim().toLowerCase()}`] ||
                'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80';
              const oStatus = getStatusBadgeStyle(ord.status);
              const orderIdDisplay = ord.orderId || ord.id || `ORD-${idx + 1}`;

              return (
                <div
                  key={ord.id || ord.orderId || idx}
                  onClick={() => handleTrackOrder(ord)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary, #2563eb)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-muted, #f8fafc)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface, #ffffff)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  title={`Click to track Order #${orderIdDisplay}`}
                >
                  {/* Card Top: Order ID & Token & Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                        Order #{orderIdDisplay}
                      </span>
                      {ord.token && (
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-muted, #f1f5f9)',
                          color: 'var(--color-primary, #2563eb)',
                          border: '1px solid var(--border-color-subtle, #e2e8f0)'
                        }}>
                          {ord.token}
                        </span>
                      )}
                    </div>

                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: oStatus.bg,
                      color: oStatus.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: `1px solid ${oStatus.border}`,
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
                      {oStatus.label}
                    </span>
                  </div>

                  {/* Card Middle: Food Thumbnail + Dishes + Outlet Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: 'var(--bg-muted, #f1f5f9)'
                    }}>
                      <SafeImage
                        src={oImg}
                        alt="Dish"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        fallback={
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <UtensilsCrossed size={16} />
                          </div>
                        }
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: 'var(--text-primary, #0f172a)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {oItems.length > 0
                          ? oItems.map(it => `${it.name || it.itemName} × ${it.quantity || 1}`).join(', ')
                          : (ord.outletName || 'Campus Meal')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                        {ord.outletName || 'Main Canteen'} • {formatCurrency(ord.totalAmount || ord.total || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Track Action */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px dashed var(--border-color, #f1f5f9)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                      Total: <strong>{formatCurrency(ord.totalAmount || ord.total || 0)}</strong>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackOrder(ord);
                      }}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: 'var(--color-primary, #2563eb)',
                        backgroundColor: 'var(--color-primary-light, #eff6ff)',
                        border: '1px solid var(--border-color-subtle, #dbeafe)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>Track Order</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Action */}
          <div style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            backgroundColor: 'var(--bg-muted, #f8fafc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748b)' }}>
              Click any order to view tracking details
            </span>
            <button
              type="button"
              onClick={() => {
                setIsListOpen(false);
                navigate('/customer/orders');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary, #2563eb)',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Outer Floating Bubble Container */}
      <div
        ref={bubbleRef}
        onClick={handleBubbleClick}
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
        title={
          activeOrders.length > 1
            ? `${activeOrders.length} Active Orders - Click to view list and track`
            : `Live Order #${firstOrder?.id}: ${currentItem.name || 'Dish'} (${firstOrder?.status}) - Click to track`
        }
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.06) translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
        }}
      >
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

          {/* Multiple Orders Count Badge at TOP-LEFT if > 1 order */}
          {activeOrders.length > 1 && (
            <div style={{
              position: 'absolute',
              top: '-6px',
              left: '-6px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              zIndex: 2
            }}>
              {activeOrders.length}
            </div>
          )}

          {/* Status / Count Badge floating at the TOP-RIGHT of the bubble */}
          <div style={{
            position: 'absolute',
            top: '-6px',
            right: '-8px',
            backgroundColor: activeOrders.length > 1 ? '#2563eb' : statusStyle.bg,
            color: activeOrders.length > 1 ? '#ffffff' : statusStyle.color,
            fontSize: '9.5px',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: '9999px',
            border: '1.5px solid #ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            whiteSpace: 'nowrap',
            zIndex: 2
          }}>
            <span style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              display: 'inline-block'
            }} />
            <span>{activeOrders.length > 1 ? `${activeOrders.length} Orders` : statusStyle.label}</span>
          </div>

          {/* Items count indicator at bottom if more than 1 item */}
          {allItems.length > 1 && (
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
              whiteSpace: 'nowrap',
              zIndex: 2
            }}>
              {activeItemIndex + 1}/{allItems.length}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FloatingOrderBubble;
