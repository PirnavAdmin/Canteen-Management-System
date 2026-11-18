import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  GraduationCap,
  Briefcase,
  MapPin,
  LogOut,
  Sun,
  Moon,
  ShoppingCart
} from 'lucide-react';
import styles from '../styles/customerLayout.module.css';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { useTheme } from '../../../../hooks/useTheme';
import { useCart } from '../../cart/hooks/useCart';

export const CustomerHeader = ({ onOpenSidebar }) => {
  const { user, role, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const displayName = user?.fullName || user?.username || 'Campus Diner';
  const rawRole = user?.role || role || user?.roleCode || user?.userType || 'Student';
  const isFaculty = String(rawRole).toUpperCase().includes('FACULTY');
  const displayRole = isFaculty ? 'Faculty' : 'Student';
  const userIdentifier = user?.rollNo || user?.facultyId || user?.studentId || (isFaculty ? 'FAC-BIO-012' : '2023-CSE-042');
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/customer/login');
  };

  return (
    <header className={styles.header}>
      {/* Left: Mobile menu toggle + Portal Indicator */}
      <div className={styles.headerLeft}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={onOpenSidebar}
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>

        <div className={styles.portalIndicator}>
          {isFaculty ? <Briefcase size={14} /> : <GraduationCap size={14} />}
          <span>Student & Faculty Dining Portal</span>
        </div>
      </div>

      {/* Right: Theme, Campus, Wallet, Cart, Profile & Logout */}
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
            padding: '6px 12px',
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
              <span className="theme-toggle-label">Light</span>
            </>
          ) : (
            <>
              <Moon size={15} style={{ color: '#6366f1' }} />
              <span className="theme-toggle-label">Dark</span>
            </>
          )}
        </button>

        {/* Campus Location Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--bg-muted)',
          padding: '4px 10px',
          borderRadius: 'var(--border-radius-full)'
        }}>
          <MapPin size={13} style={{ color: 'var(--color-accent)' }} />
          <span>Main Campus</span>
        </div>

        {/* Quick Cart Action Button */}
        <Link to="/customer/cart" className={styles.cartHeaderBtn} title="View Dining Cart">
          <ShoppingCart size={15} />
          <span>My Cart</span>
          {itemCount > 0 && (
            <span className={styles.cartHeaderCount}>{itemCount}</span>
          )}
        </Link>

        {/* User Profile Avatar & Information */}
        <div className={styles.userProfile}>
          <div className={styles.avatar} title={`${displayName} (${displayRole})`}>
            {initials}
          </div>

          <div className={styles.userInfo}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userRole}>{displayRole} • {userIdentifier}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out of dining portal"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginLeft: '6px'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default CustomerHeader;
