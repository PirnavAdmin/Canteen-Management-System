import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  MapPin,
  LogOut,
  Sun,
  Moon,
  ShoppingCart,
  Search,
  X,
  ChevronDown,
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Check,
  Clock
} from 'lucide-react';
import styles from '../styles/customerLayout.module.css';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { useTheme } from '../../../../hooks/useTheme';
import { useCart } from '../../cart/hooks/useCart';
import { CUSTOMER_NAV_GROUPS } from '../constants/customerNavigation';
import { customerOrderService } from '../../orders/services/customerOrderService';
import { canteenService } from '../../../admin/outlets/services/canteenService';

/**
 * Returns color tokens and status label depending on the chef's manual order milestone
 */
const getOrderStatusStyle = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('prep') || s.includes('kitchen') || s.includes('cook')) {
    return {
      text: '#15803d',
      bg: '#dcfce7',
      border: '#bbf7d0',
      dot: '#16a34a',
      label: 'Preparing...'
    };
  }
  if (s.includes('ready') || s.includes('pickup')) {
    return {
      text: '#047857',
      bg: '#d1fae5',
      border: '#a7f3d0',
      dot: '#059669',
      label: 'Ready for Pickup'
    };
  }
  if (s.includes('accept')) {
    return {
      text: '#0369a1',
      bg: '#e0f2fe',
      border: '#bae6fd',
      dot: '#0284c7',
      label: 'Order Accepted'
    };
  }
  if (s.includes('placed') || s.includes('pending')) {
    return {
      text: '#4338ca',
      bg: '#e0e7ff',
      border: '#c7d2fe',
      dot: '#6366f1',
      label: 'Order Placed'
    };
  }
  if (s.includes('complete')) {
    return {
      text: '#334155',
      bg: '#f1f5f9',
      border: '#e2e8f0',
      dot: '#64748b',
      label: 'Completed'
    };
  }
  return {
    text: '#15803d',
    bg: '#dcfce7',
    border: '#bbf7d0',
    dot: '#16a34a',
    label: status || 'Preparing...'
  };
};

export const CustomerHeader = () => {
  const { user, role, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { selectedOutlet, setSelectedOutlet } = useCart();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [canteens, setCanteens] = useState([]);

  // Fetch active canteens for navbar outlet dropdown
  useEffect(() => {
    let isMounted = true;
    canteenService.getAll().then(res => {
      if (!isMounted) return;
      const list = Array.isArray(res) ? res : (res?.data || []);
      const active = list.filter(c => c && (c.status === 'Active' || !c.status));
      setCanteens(active);
    }).catch(err => {
      console.warn('Failed to fetch canteens for header dropdown:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Live order status & top-right modal state
  const [activeOrder, setActiveOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const profileContainerRef = useRef(null);

  // Click outside listener for profile menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileContainerRef.current && !profileContainerRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll live orders every 8s so chef status updates appear in real-time
  useEffect(() => {
    let isMounted = true;
    const fetchLatestOrder = async () => {
      try {
        const orders = await customerOrderService.getCustomerOrders(user);
        if (!isMounted) return;
        const list = Array.isArray(orders) ? orders : [];
        const active = list.find(o => !['Completed', 'Collected', 'Cancelled', 'Refunded'].includes(o.status));
        if (active) {
          setActiveOrder(active);
        } else if (list.length > 0) {
          setActiveOrder(list[0]);
        } else {
          setActiveOrder(null);
        }
      } catch (err) {
        console.warn('Could not fetch active order:', err);
      }
    };

    fetchLatestOrder();

    const handleOrderEvent = () => fetchLatestOrder();
    window.addEventListener('cms:order_created', handleOrderEvent);
    window.addEventListener('cms:order_status_updated', handleOrderEvent);

    const handleCustomTrigger = () => setShowOrderModal(true);
    window.addEventListener('cms:show-order-status', handleCustomTrigger);

    return () => {
      isMounted = false;
      window.removeEventListener('cms:order_created', handleOrderEvent);
      window.removeEventListener('cms:order_status_updated', handleOrderEvent);
      window.removeEventListener('cms:show-order-status', handleCustomTrigger);
    };
  }, [user]);

  // Auto-close order modal after 5 seconds
  useEffect(() => {
    if (!showOrderModal) return;
    const timer = setTimeout(() => {
      setShowOrderModal(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showOrderModal]);

  // User identity details
  const displayName = user?.fullName || user?.username || 'Aarav (B.Tech 2nd Year)';
  const studentName = displayName.split('(')[0].trim() || displayName;
  const rawRole = user?.role || role || user?.roleCode || user?.userType || 'Student';
  const isFaculty = String(rawRole).toUpperCase().includes('FACULTY');
  const displayRole = isFaculty ? 'Faculty' : 'Student';
  const userIdentifier = user?.rollNo || user?.facultyId || user?.studentId || (isFaculty ? 'FAC-BIO-012' : '2023-CSE-042');
  const displayEmail = user?.email || (isFaculty ? 'faculty@cms.edu' : 'student@cms.edu');

  const initials = studentName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/customer/login');
  };

  const statusTheme = getOrderStatusStyle(activeOrder?.status);
  const orderItemsCount = activeOrder?.itemsCount || (Array.isArray(activeOrder?.items) ? activeOrder.items.length : 2);
  const orderTotal = activeOrder?.totalAmount || 190;

  return (
    <>
      <header className={styles.header}>
        {/* Left: Brand Logo & Title (Clean, no sidebar) */}
        <div className={styles.headerLeft}>
          <Link
            to="/customer/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none'
            }}
            title="Main Campus Dining Dashboard"
          >
            <div className={styles.brandLogo}>
              <UtensilsCrossed size={18} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Main Campus
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Theme, Campus Outlets Dropdown, My Orders, Profile */}
        <div className={styles.headerRight}>
          {/* Light / Dark Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: 'var(--border-radius-full)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-muted)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
              e.currentTarget.style.borderColor = 'var(--color-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            {isDark ? (
              <>
                <Sun size={15} style={{ color: '#f59e0b' }} />
                <span className={styles.themeLabel}>Light</span>
              </>
            ) : (
              <>
                <Moon size={15} style={{ color: '#6366f1' }} />
                <span className={styles.themeLabel}>Dark</span>
              </>
            )}
          </button>

          {/* Outlets Dropdown in place of static badge, matching pill layout and size */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: 'var(--bg-muted)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-full)',
            padding: '4px 8px 4px 10px',
            transition: 'all var(--transition-fast)'
          }}>
            <MapPin size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
            <select
              value={selectedOutlet?.id || 'ALL'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ALL') {
                  setSelectedOutlet({ id: 'ALL', name: 'All Outlets' });
                } else {
                  const match = canteens.find(c => String(c.id) === String(val));
                  if (match) setSelectedOutlet(match);
                }
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                paddingRight: '2px'
              }}
              aria-label="Select Campus Outlet"
              title="Select Campus Outlet"
            >
              <option value="ALL">All Outlets</option>
              {canteens.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={12} style={{ color: 'var(--text-secondary)', pointerEvents: 'none', flexShrink: 0 }} />
          </div>

          {/* Quick My Orders Action Link in Top Navbar */}
          <Link to="/customer/orders" className={styles.cartHeaderBtn} title="View My Orders & Live Tracking">
            <ClipboardList size={15} />
            <span className={styles.cartBtnText}>My Orders</span>
          </Link>

          {/* User Profile - Trigger Button */}
          <div ref={profileContainerRef} className={styles.profileWrapper}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(prev => !prev)}
              className={styles.profileTriggerBtn}
              aria-label="Toggle user profile menu"
              aria-expanded={isProfileOpen}
              title={`${displayName} - Click for profile details & logout`}
            >
              <div className={styles.avatar}>
                {initials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: 1.15 }}>
                <span className={`${styles.userName} ${styles.userNameText}`}>{studentName}</span>
                {/* Status of the food shown below profile in small font with distinct color */}
                {activeOrder && (
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: statusTheme.dot,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      marginTop: '1px'
                    }}
                    title={`Chef Status: ${activeOrder.status}`}
                  >
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: statusTheme.dot }} />
                    {statusTheme.label}
                  </span>
                )}
              </div>
              <ChevronDown
                size={14}
                style={{
                  color: 'var(--text-muted)',
                  transform: isProfileOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform var(--transition-fast)'
                }}
              />
            </button>

            {/* Profile Modal / Dropdown */}
            {isProfileOpen && (
              <div className={styles.profileModal}>
                <div style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'var(--bg-surface)'
                }}>
                  <div className={styles.avatar} style={{ width: '40px', height: '40px', fontSize: '15px', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {displayName}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px'
                    }}>
                      {displayRole} • {userIdentifier}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '1px'
                    }}>
                      {displayEmail}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '6px' }}>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '9px 12px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-danger)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-danger-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Order Status Modal at Top Right Below Navbar */}
      {showOrderModal && (
        <>
          {/* Transparent Backdrop to close on click outside */}
          <div
            onClick={() => setShowOrderModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 90,
              background: 'transparent'
            }}
          />

          {/* Modal Container */}
          <div className={styles.orderStatusModalContainer}>
            {/* Close Button X */}
            <button
              type="button"
              onClick={() => setShowOrderModal(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close notification"
            >
              <X size={16} />
            </button>

            {/* Green Check Circle */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px'
              }}
            >
              <Check size={26} strokeWidth={2.8} />
            </div>

            {/* Title */}
            <h3 style={{ margin: '0 0 10px', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              Order Placed Successfully!
            </h3>

            {/* Summary Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
              margin: '0 0 12px',
              padding: '8px 12px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #f1f5f9'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShoppingCart size={14} style={{ color: '#0284c7' }} />
                {orderItemsCount} {orderItemsCount === 1 ? 'Item' : 'Items'}
              </span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>
                ₹{Number(orderTotal).toFixed(0)}
              </span>
            </div>

            {/* Chef Status Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: statusTheme.bg,
              color: statusTheme.text,
              border: `1px solid ${statusTheme.border}`,
              borderRadius: '999px',
              padding: '5px 14px',
              fontSize: '12px',
              fontWeight: 700,
              margin: '0 0 16px'
            }}>
              <Clock size={13} style={{ color: statusTheme.dot }} />
              <span>{statusTheme.label}</span>
            </div>

            {/* Action OK Button */}
            <button
              type="button"
              onClick={() => setShowOrderModal(false)}
              style={{
                width: '100%',
                padding: '11px',
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(30, 58, 138, 0.25)',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e40af'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1e3a8a'; }}
            >
              OK
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default CustomerHeader;
