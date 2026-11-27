import React from 'react';
import { RefreshCw, Store, Clock } from 'lucide-react';
import { Button } from '../../../../components/common/Button';
import { useDashboard } from '../hooks/useDashboard';
import { DashboardKPICards } from '../components/DashboardKPICards';
import { SalesAnalyticsChart } from '../components/SalesAnalyticsChart';
import { LiveOrderQueue } from '../components/LiveOrderQueue';
import { TopSellingItems } from '../components/TopSellingItems';
import { StockAlertsCard } from '../components/StockAlertsCard';
import { KitchenRequestsCard } from '../components/KitchenRequestsCard';
import { OutletSalesCard } from '../components/OutletSalesCard';
import { useCanteens } from '../../outlets/hooks/useCanteens';

export const DashboardPage = () => {
  const { selectedOutlet, selectedOutletObj } = useCanteens();

  const {
    loading,
    summary,
    salesData,
    liveOrders,
    topSelling,
    stockAlerts,
    kitchenRequests,
    outletSales,
    lastUpdated,
    refreshDashboard
  } = useDashboard(selectedOutlet);

  return (
    <div>
      {/* Header with Title and Actions aligned horizontally on the exact same row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Left: Title + Outlet Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            Canteen Operations Dashboard
          </h1>
          {selectedOutlet !== 'ALL' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                borderRadius: '9999px',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                fontSize: '11.5px',
                fontWeight: 600,
                border: '1px solid var(--border-color)'
              }}
            >
              <Store size={12} />
              {selectedOutletObj?.name || 'Active Outlet'}
            </span>
          )}
        </div>

        {/* Right: Last Updated Badge & Refresh Dashboard Button aligned on same line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {lastUpdated && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11.5px',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-muted)',
              padding: '5px 10px',
              borderRadius: 'var(--border-radius-full)',
              border: '1px solid var(--border-color)',
              whiteSpace: 'nowrap'
            }}>
              <Clock size={12} style={{ color: 'var(--text-muted)' }} />
              <span>Last updated {lastUpdated.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </span>
          )}
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={refreshDashboard}
            loading={loading}
          >
            Refresh Dashboard
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid - 9 Compact, Linear & Responsive Cards */}
      <DashboardKPICards summary={summary || {}} loading={loading} />

      {/* Operational Cards Grid - All Cards Same Size & Responsive */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '14px',
        alignItems: 'stretch'
      }}>
        <SalesAnalyticsChart salesData={salesData} loading={loading} />
        <LiveOrderQueue orders={liveOrders} loading={loading} />
        <TopSellingItems items={topSelling} loading={loading} />
        <OutletSalesCard outletSales={outletSales} loading={loading} />
        <StockAlertsCard alerts={stockAlerts} loading={loading} />
        <KitchenRequestsCard requests={kitchenRequests} loading={loading} />
      </div>
    </div>
  );
};

export default DashboardPage;
