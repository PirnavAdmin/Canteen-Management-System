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
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      <StatCard
        title="Total Categories"
        value={total}
        description="Menu food groups configured"
        icon={LayoutGrid}
        color="var(--color-accent)"
        bgColor="var(--color-primary-light)"
      />
      <StatCard
        title="Active Categories"
        value={active}
        description={`${Math.round((active / (total || 1)) * 100)}% visible in student menu`}
        icon={CheckCircle2}
        color="var(--color-success)"
        bgColor="var(--color-success-bg)"
      />
      <StatCard
        title="Linked Food Items"
        value={totalItemsMapped}
        description="Historical & active menu items"
        icon={UtensilsCrossed}
        color="#8b5cf6"
        bgColor="#f5f3ff"
      />
      <StatCard
        title="Display Order Depth"
        value={`#${maxOrder}`}
        description="Highest priority rank assigned"
        icon={ListOrdered}
        color="#ea580c"
        bgColor="#fff7ed"
      />
    </div>
  );
};

