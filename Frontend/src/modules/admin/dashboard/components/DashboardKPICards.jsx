import React from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  CheckCheck,
  XCircle,
  IndianRupee
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../../utils/formatters';

export const DashboardKPICards = ({ summary = {} }) => {
  const cards = [
    {
      label: 'Total Orders',
      value: formatNumber(summary.totalOrders || 0),
      subtext: 'Today across outlets',
      icon: ShoppingBag,
      color: '#2563eb',
      bg: '#eff6ff'
    },
    {
      label: 'Pending Orders',
      value: formatNumber(summary.pendingOrders || 0),
      subtext: 'Awaiting acceptance',
      icon: Clock,
      color: '#d97706',
      bg: '#fffbeb'
    },
    {
      label: 'Accepted Orders',
      value: formatNumber(summary.acceptedOrders || 0),
      subtext: 'Queued for prep',
      icon: CheckCircle2,
      color: '#0284c7',
      bg: '#f0f9ff'
    },
    {
      label: 'In Kitchen (Prep)',
      value: formatNumber(summary.preparingOrders || 0),
      subtext: 'Being cooked now',
      icon: ChefHat,
      color: '#8b5cf6',
      bg: '#f5f3ff'
    },
    {
      label: 'Ready for Pickup',
      value: formatNumber(summary.readyForPickup || 0),
      subtext: 'Tokens on counter display',
      icon: PackageCheck,
      color: '#059669',
      bg: '#ecfdf5'
    },
    {
      label: 'Completed Orders',
      value: formatNumber(summary.completedOrders || 0),
      subtext: 'Collected & closed',
      icon: CheckCheck,
      color: '#10b981',
      bg: '#ecfdf5'
    },
    {
      label: 'Cancelled Orders',
      value: formatNumber(summary.cancelledOrders || 0),
      subtext: 'Refunded / Voided',
      icon: XCircle,
      color: '#dc2626',
      bg: '#fef2f2'
    },
    {
      label: 'Total Sales Revenue',
      value: formatCurrency(summary.totalSales || 0),
      subtext: 'Today gross billing',
      icon: IndianRupee,
      color: '#1e3a8a',
      bg: '#e0e7ff',
      isHero: true
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '12px',
      marginBottom: '20px'
    }}>
      {cards.map((card, i) => {
        const IconComponent = card.icon;
        return (
          <div
            key={i}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: card.isHero ? '1.5px solid var(--color-primary-border)' : '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: 'var(--shadow-xs)',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: card.bg,
              color: card.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <IconComponent size={20} />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {card.label}
              </div>
              <div style={{
                fontSize: card.isHero ? '20px' : '18px',
                fontWeight: 700,
                color: card.isHero ? 'var(--color-primary)' : 'var(--text-primary)',
                lineHeight: 1.2,
                marginTop: '2px'
              }}>
                {card.value}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                marginTop: '2px'
              }}>
                {card.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardKPICards;
