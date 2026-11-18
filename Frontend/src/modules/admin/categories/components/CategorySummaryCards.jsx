import React from 'react';
import { LayoutGrid, CheckCircle2, ListOrdered, UtensilsCrossed } from 'lucide-react';
import { StatCard } from '../../../../components/common/StatCard';

export const CategorySummaryCards = ({ categories = [] }) => {
  const total = categories.length;
  const active = categories.filter(c => c.status === 'Active').length;
  const totalItemsMapped = categories.reduce((sum, c) => sum + (c.linkedItemCount || 0), 0);
  const maxOrder = categories.reduce((max, c) => Math.max(max, c.displayOrder || 0), 0);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
      gap: '12px',
      marginBottom: '16px'
    }}>
      <StatCard
        compact
        title="Total Categories"
        value={total}
        description="Menu food groups configured"
        icon={LayoutGrid}
        color="var(--color-accent)"
        bgColor="var(--color-primary-light)"
      />
      <StatCard
        compact
        title="Active Categories"
        value={active}
        description={`${Math.round((active / (total || 1)) * 100)}% visible in student menu`}
        icon={CheckCircle2}
        color="var(--color-success)"
        bgColor="var(--color-success-bg)"
      />
      <StatCard
        compact
        title="Linked Food Items"
        value={totalItemsMapped}
        description="Historical & active menu items"
        icon={UtensilsCrossed}
        color="var(--color-info)"
        bgColor="var(--color-info-bg)"
      />
      <StatCard
        compact
        title="Display Order Depth"
        value={`#${maxOrder}`}
        description="Highest priority rank assigned"
        icon={ListOrdered}
        color="var(--color-warning)"
        bgColor="var(--color-warning-bg)"
      />
    </div>
  );
};

