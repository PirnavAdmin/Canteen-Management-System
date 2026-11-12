import React, { useState, useEffect } from 'react';
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
import { canteenService } from '../../outlets/services/canteenService';

export const DashboardPage = () => {
  const [selectedOutlet, setSelectedOutlet] = useState('ALL');
  const [outlets, setOutlets] = useState([]);

  useEffect(() => {
    let isMounted = true;
    canteenService.getAll().then((data) => {
      if (isMounted && Array.isArray(data)) {
        setOutlets(data);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

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
        description="Comprehensive real-time administrative intelligence across dining halls, order lifecycle, sales revenue, and kitchen inventory."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 12px 0 32px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Campus Outlets</option>
                {outlets.map(out => (
                  <option key={out.outletId || out.id} value={out.outletId || out.id}>
                    {out.name} ({out.code || 'MC'})
                  </option>
                ))}
              </select>
              <Store
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }}
              />
            </div>

            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={refreshDashboard}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
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
