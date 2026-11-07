import React from 'react';
import { Store, CheckCircle, MapPin, Clock } from 'lucide-react';
import { StatCard } from '../../../components/common/StatCard';
import { calculateTotalHours } from '../utils/canteenFormatters';

export const CanteenSummaryCards = ({ canteens = [] }) => {
  const total = canteens.length;
  const active = canteens.filter(c => c.status === 'Active').length;
  const campuses = new Set(canteens.map(c => c.campus)).size;

  // Calculate average daily operating hours
  let totalHours = 0;
  let countWithHours = 0;
  canteens.forEach(c => {
    if (c.openingTime && c.closingTime) {
      totalHours += parseFloat(calculateTotalHours(c.openingTime, c.closingTime));
      countWithHours++;
    }
  });
  const avgHours = countWithHours > 0 ? (totalHours / countWithHours).toFixed(1) : '0';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      <StatCard
        title="Total Outlets"
        value={total}
        description="Registered institutional dining halls"
        icon={Store}
        color="var(--color-accent)"
        bgColor="var(--color-primary-light)"
      />
      <StatCard
        title="Active Outlets"
        value={active}
        description={`${Math.round((active / (total || 1)) * 100)}% operational across campuses`}
        icon={CheckCircle}
        color="var(--color-success)"
        bgColor="var(--color-success-bg)"
      />
      <StatCard
        title="Campuses Served"
        value={campuses}
        description="Locations with dining services"
        icon={MapPin}
        color="#8b5cf6"
        bgColor="#f5f3ff"
      />
      <StatCard
        title="Avg. Daily Hours"
        value={`${avgHours} hrs`}
        description="Daily service window per outlet"
        icon={Clock}
        color="#ea580c"
        bgColor="#fff7ed"
      />
    </div>
  );
};

