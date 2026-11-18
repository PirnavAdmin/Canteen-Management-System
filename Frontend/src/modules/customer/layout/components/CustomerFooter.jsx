import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Shield } from 'lucide-react';
import styles from '../styles/customerLayout.module.css';

export const CustomerFooter = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.footerCol}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <Utensils size={18} />
              </div>
              <span className={styles.footerTitle}>Apex Campus Canteens</span>
            </div>
            <p className={styles.footerDesc}>
              Integrated dining management and digital token system for students and faculty. Enjoy fast prep, nutritional transparency, and contactless counter pickup.
            </p>
          </div>

          <div className={styles.footerCol}>
            <h4 className={styles.footerHeading}>Quick Links</h4>
            <div className={styles.footerLinksList}>
              <Link to="/customer/dashboard">Dashboard Overview</Link>
              <Link to="/customer/menu">Canteen Menu</Link>
              <Link to="/customer/orders">Live Order Tracking</Link>
              <Link to="/customer/order-history">Order Receipts</Link>
            </div>
          </div>

          <div className={styles.footerCol}>
            <h4 className={styles.footerHeading}>Dining Timings</h4>
            <div className={styles.footerTimings}>
              <div><span>Breakfast:</span> <strong>07:30 AM - 11:00 AM</strong></div>
              <div><span>Lunch Hours:</span> <strong>11:30 AM - 03:30 PM</strong></div>
              <div><span>Evening Snacks:</span> <strong>04:00 PM - 07:30 PM</strong></div>
              <div><span>Campus Helpline:</span> <strong>+91 40 2345 6789</strong></div>
            </div>
          </div>

          <div className={styles.footerCol}>
            <h4 className={styles.footerHeading}>Campus Trust</h4>
            <div className={styles.trustBadge}>
              <Shield size={16} className={styles.trustIcon} />
              <span>FSSAI Certified Campus Kitchens</span>
            </div>
            <p className={styles.trustSubtext}>
              Strict quality control, hygienic contactless prep stations, and daily fresh procurement.
            </p>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© 2026 Apex Institute Canteen Management System. All rights reserved.</p>
          <div className={styles.footerPolicyLinks}>
            <Link to="/customer/feedback">Data Privacy Notice</Link>
            <span>•</span>
            <Link to="/customer/feedback">Allergy & Dietary Advisory</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CustomerFooter;
