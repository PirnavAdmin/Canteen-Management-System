import React from 'react';
import { RefreshCw, Store } from 'lucide-react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { useDashboard } from '../hooks/useDashboard';
import { DashboardKPICards } from '../components/DashboardKPICards';
import { SalesAnalyticsChart } from '../components/SalesAnalyticsChart';
import { LiveOrderQueue } from '../components/LiveOrderQueue';
import { TopSellingItems } from '../components/TopSellingItems';
import { StockAlertsCard } from '../components/StockAlertsCard';
import { OutletSalesCard } from '../components/OutletSalesCard';
import { useCanteens } from '../../outlets/hooks/useCanteens';

export const DashboardPage = () => {
  const { selectedOutlet, selectedOutletObj } = useCanteens();

  const {
    loading,
    summary,
    hourlySales,
    liveOrders,
    topSelling,
    stockAlerts,
    outletSales,
    refreshDashboard
  } = useDashboard(selectedOutlet);

  return (
    <div>
      <PageHeader
        title="Canteen Operations Dashboard"
        description={
          selectedOutlet === 'ALL'
            ? 'Comprehensive real-time administrative intelligence across all dining halls, order lifecycle, sales revenue, and kitchen inventory.'
            : `Operational analytics, kitchen queues, and live activity for "${selectedOutletObj?.name || 'Selected Outlet'}".`
        }
        badge={
          selectedOutlet !== 'ALL' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--border-color)'
              }}
            >
              <Store size={12} />
              {selectedOutletObj?.name || 'Active Outlet'}
            </span>
          ) : null
        }
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={refreshDashboard}
            loading={loading}
          >
            Refresh
          </Button>
        }
      />

      {/* KPI Stats Grid */}
      <DashboardKPICards summary={summary || {}} />

      {/* Sales Velocity Chart */}
      <SalesAnalyticsChart data={hourlySales} />

      {/* Operational Grids */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Left Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <LiveOrderQueue orders={liveOrders} />
          <OutletSalesCard outletSales={outletSales} />
        </div>

        {/* Right Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <TopSellingItems items={topSelling} />
          <StockAlertsCard alerts={stockAlerts} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
