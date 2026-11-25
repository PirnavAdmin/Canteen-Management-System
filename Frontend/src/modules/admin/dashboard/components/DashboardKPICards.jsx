import React from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChefHat,
  BellRing,
  CheckCheck,
  XCircle,
  IndianRupee
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../../utils/formatters';

export const DashboardKPICards = ({ summary = {}, loading = false }) => {
  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '8px',
        marginBottom: '16px'
      }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '54px'
            }}
          >
            <div
              className="skeleton-box"
              style={{ width: '30px', height: '30px', borderRadius: '6px', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="skeleton-box" style={{ width: '60%', height: '9px' }} />
              <div className="skeleton-box" style={{ width: '45%', height: '14px' }} />
              <div className="skeleton-box" style={{ width: '75%', height: '8px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Today's Orders",
      value: formatNumber(summary.todayOrders || 0),
      tag: 'Today',
      subtext: 'Placed today',
      icon: ShoppingBag,
      color: '#2563eb',
      bg: '#eff6ff'
    },
    {
      label: 'Pending Orders',
      value: formatNumber(summary.todayPending || 0),
      tag: 'Awaiting',
      subtext: 'Awaiting acceptance',
      icon: Clock,
      color: '#d97706',
      bg: '#fffbeb'
    },
    {
      label: 'Accepted Orders',
      value: formatNumber(summary.todayAccepted || 0),
      tag: 'Queued',
      subtext: 'Queued for prep',
      icon: CheckCircle2,
      color: '#0284c7',
      bg: '#f0f9ff'
    },
    {
      label: 'In Kitchen (Prep)',
      value: formatNumber(summary.todayPreparing || 0),
      tag: 'Cooking',
      subtext: 'Being cooked now',
      icon: ChefHat,
      color: '#8b5cf6',
      bg: '#f5f3ff'
    },
    {
      label: 'Ready for Pickup',
      value: formatNumber(summary.todayReady || 0),
      tag: 'Ready',
      subtext: 'On counter display',
      icon: BellRing,
      color: '#059669',
      bg: '#ecfdf5'
    },
    {
      label: 'Completed Orders',
      value: formatNumber(summary.todayCompleted || 0),
      tag: 'Closed',
      subtext: 'Collected & closed',
      icon: CheckCheck,
      color: '#10b981',
      bg: '#ecfdf5'
    },
    {
      label: 'Cancelled Orders',
      value: formatNumber(summary.todayCancelled || 0),
      tag: 'Voided',
      subtext: 'Refunded / Voided',
      icon: XCircle,
      color: '#dc2626',
      bg: '#fef2f2'
    },
    {
      label: "Today's Sales",
      value: formatCurrency(summary.todayRevenue || 0),
      tag: 'Today',
      subtext: 'Today gross billing',
      icon: IndianRupee,
      color: '#0284c7',
      bg: '#e0f2fe'
    },
    {
      label: 'Total Sales Revenue',
      value: formatCurrency(summary.monthlyRevenue || summary.totalSales || 0),
      tag: 'Monthly',
      subtext: 'Current month gross',
      icon: IndianRupee,
      color: '#1e3a8a',
      bg: '#e0e7ff',
      isHero: true
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '8px',
      marginBottom: '16px'
    }}>
      {cards.map((card, i) => {
        const IconComponent = card.icon;
        return (
          <div
            key={i}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: card.isHero ? '1.5px solid var(--color-primary-border)' : '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-xs)',
              minHeight: '54px',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
            }}
          >
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              backgroundColor: card.bg,
              color: card.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <IconComponent size={14} />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: '9.5px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2
              }}>
                {card.label}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '2px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  fontSize: card.isHero ? '15px' : '14px',
                  fontWeight: 700,
                  color: card.isHero ? 'var(--color-primary)' : 'var(--text-primary)',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap'
                }}>
                  {card.value}
                </span>

                {card.tag && (
                  <span style={{
                    fontSize: '8px',
                    fontWeight: 700,
                    padding: '1px 3.5px',
                    borderRadius: '3px',
                    backgroundColor: card.bg,
                    color: card.color,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    {card.tag}
                  </span>
                )}
              </div>

              <div style={{
                fontSize: '9px',
                color: 'var(--text-secondary)',
                marginTop: '1px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
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
