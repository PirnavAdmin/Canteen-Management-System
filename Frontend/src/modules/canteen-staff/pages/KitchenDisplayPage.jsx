import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  RefreshCw,
  ChefHat,
  ArrowRight,
  Flame,
  BellRing,
  History,
  Search,
  RotateCcw,
  Eye,
  AlertTriangle,
  AlertCircle,
  Play,
  Store,
  X
} from 'lucide-react';
import { useStaffOrders } from '../hooks/useStaffOrders';
import { useToast } from '../../../app/providers/ToastProvider';
import { ORDER_STATUS } from '../../../constants/appConstants';
import {
  staffOrderService,
  isStatusPreparing,
  isStatusAccepted,
  isStatusReady,
  isStatusCompleted
} from '../services/staffOrderService';
import { ORDER_URGENCY_MINUTES } from '../constants/staffConstants';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';
import { Pagination } from '../../../components/common/Pagination';
import { EmptyState } from '../../../components/common/EmptyState';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { DataTable } from '../../../components/tables/DataTable';
import { StaffOrderDetailsModal } from '../components/StaffOrderDetailsModal';
import { formatTimeIST, isSameIstDate, isWithinDaysIST } from '../../../utils/formatters';
import styles from '../styles/staff.module.css';

export const KitchenDisplayPage = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const {
    orders,
    loading,
    error,
    refreshOrders,
    startPreparation,
    markReadyForPickup,
    activeOutletName,
    selectedOutlet
  } = useStaffOrders();

  const [activeTab, setActiveTab] = useState('queue');
  const [stations, setStations] = useState([{ id: 'all', name: 'All Kitchen Stations' }]);
  const [itemStationMap, setItemStationMap] = useState({ byMenuItemId: {}, byItemName: {} });
  const [stationsError, setStationsError] = useState(null);
  const [selectedStation, setSelectedStation] = useState('all');
  const [checkedItems, setCheckedItems] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('ALL');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);

  // Load kitchen stations from live backend categories & outlet menu
  const loadStations = useCallback(async () => {
    try {
      setStationsError(null);
      const params = selectedOutlet && selectedOutlet !== 'ALL' ? { outletId: selectedOutlet } : {};
      const { stations: liveStations, itemStationMap: liveMap } = await staffOrderService.getKitchenStationData(params);
      if (Array.isArray(liveStations) && liveStations.length > 0) {
        setStations(liveStations);
        setSelectedStation((prev) => (prev === 'all' || liveStations.some((s) => s.id === prev) ? prev : 'all'));
      } else {
        setStations([{ id: 'all', name: 'All Kitchen Stations' }]);
        setSelectedStation('all');
      }
      setItemStationMap(liveMap || { byMenuItemId: {}, byItemName: {} });
    } catch (err) {
      setStationsError(err.message || 'Unable to load kitchen stations from server.');
      setStations([{ id: 'all', name: 'All Kitchen Stations' }]);
      setItemStationMap({ byMenuItemId: {}, byItemName: {} });
    }
  }, [selectedOutlet]);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsedPrepTime = useCallback((prepStartedAt) => {
    if (!prepStartedAt) return null;
    const startMs = new Date(prepStartedAt).getTime();
    if (isNaN(startMs)) return null;

    const diffMs = Math.max(0, currentTime.getTime() - startMs);
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return {
      totalSecs,
      mins,
      secs,
      formatted: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    };
  }, [currentTime]);

  const cookingOrders = useMemo(() => {
    return orders.filter((o) => {
      const isCooking = isStatusPreparing(o.status) || isStatusAccepted(o.status);
      if (!isCooking) return false;
      if (isStatusReady(o.status) || isStatusCompleted(o.status)) return false;
      if (selectedStation === 'all') return true;

      if (String(o.stationId || '') === String(selectedStation)) return true;
      if (Array.isArray(o.items) && o.items.some((item) => {
        const mappedCat =
          itemStationMap.byMenuItemId?.[String(item.menuItemId ?? '')] ||
          itemStationMap.byItemName?.[String(item.name || '').trim().toLowerCase()];
        const effectiveStation = item.stationId ?? item.categoryId ?? mappedCat ?? '';
        return String(effectiveStation) === String(selectedStation);
      })) {
        return true;
      }
      return false;
    });
  }, [orders, selectedStation, itemStationMap]);

  const readyOrders = useMemo(
    () => orders.filter((o) => isStatusReady(o.status)),
    [orders]
  );

  const prepHistoryOrders = useMemo(() => {
    const list = orders
      .filter((o) => isStatusReady(o.status) || isStatusCompleted(o.status))
      .map((o) => ({
        orderId: String(o.id),
        id: String(o.id),
        token: o.token,
        customerName: o.customer?.name || 'Customer',
        customerRole: o.customer?.role || '',
        items: Array.isArray(o.items) ? o.items : [],
        totalAmount: o.totalAmount ?? 0,
        orderType: o.orderType || 'Pickup',
        prepStartedAt: o.prepStartedAt || o.preparingAt || o.createdAt,
        prepCompletedAt: o.prepCompletedAt || o.readyAt || o.updatedAt,
        durationSeconds: o.prepDurationSeconds || 0,
        durationFormatted: o.prepDurationFormatted || '—',
        status: isStatusReady(o.status) ? ORDER_STATUS.READY_FOR_PICKUP : (o.status || 'Collected'),
        orderDate: o.orderDate || o.createdAt
      }));

    return list
      .filter((item) => {
        if (historySearch.trim()) {
          const q = historySearch.toLowerCase().trim();
          const id = String(item.orderId || '').toLowerCase();
          const token = String(item.token || '').toLowerCase();
          const customer = String(item.customerName || '').toLowerCase();
          if (!id.includes(q) && !token.includes(q) && !customer.includes(q)) return false;
        }

        if (historyDateFilter !== 'ALL') {
          const dateVal = item.prepCompletedAt || item.orderDate || item.prepStartedAt;
          if (!dateVal) return false;
          if (historyDateFilter === 'TODAY') return isSameIstDate(dateVal);
          if (historyDateFilter === 'YESTERDAY') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return isSameIstDate(dateVal, yesterday);
          }
          if (historyDateFilter === 'WEEK') return isWithinDaysIST(dateVal, 7) || isSameIstDate(dateVal);
        }

        return true;
      })
      .sort((a, b) => new Date(b.prepCompletedAt || b.prepStartedAt || 0) - new Date(a.prepCompletedAt || a.prepStartedAt || 0));
  }, [orders, historySearch, historyDateFilter]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historySearch, historyDateFilter]);

  const paginatedPrepHistory = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return prepHistoryOrders.slice(start, start + historyPageSize);
  }, [prepHistoryOrders, historyPage, historyPageSize]);

  const toggleItemCheck = (orderId, itemIndex) => {
    const key = `${orderId}-${itemIndex}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartPrepare = async (order) => {
    try {
      setActionLoadingId(order.id);
      await startPreparation(order.id);
      success('Preparation Started', `Live timer active for Ticket #${order.token || order.id}.`);
    } catch (err) {
      toastError('Start Failed', err.message || 'Error starting preparation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkReady = async (order) => {
    try {
      setActionLoadingId(order.id);
      await markReadyForPickup(order.id);
      success('Ready for Pickup', `Ticket #${order.token || order.id} moved to pickup counter.`);
    } catch (err) {
      toastError('Update Failed', err.message || 'Error updating order for pickup counter.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const historyColumns = [
    {
      key: 'serial',
      header: '#',
      width: '48px',
      align: 'center',
      render: (_, __, idx) => (
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
          {(historyPage - 1) * historyPageSize + idx + 1}
        </span>
      )
    },
    {
      key: 'token',
      header: 'Token & Order ID',
      render: (val, rec) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className={styles.tokenBadge}>{val || 'T-ORD'}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>#{String(rec.orderId).slice(-6)}</span>
        </div>
      )
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (val, rec) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val || 'Customer'}</div>
          {rec.customerRole && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rec.customerRole}</div>}
        </div>
      )
    },
    {
      key: 'items',
      header: 'Food Order Details',
      render: (items) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {Array.isArray(items) && items.slice(0, 2).map((item, i) => (
            <span key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {item.quantity}x {item.name}
            </span>
          ))}
          {Array.isArray(items) && items.length > 2 && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              +{items.length - 2} more item(s)
            </span>
          )}
        </div>
      )
    },
    {
      key: 'prepStartedAt',
      header: 'Prep Started',
      render: (val) => (val ? formatTimeIST(val) : '—')
    },
    {
      key: 'prepCompletedAt',
      header: 'Prep Completed',
      render: (val) => (val ? formatTimeIST(val) : '—')
    },
    {
      key: 'durationFormatted',
      header: 'Total Duration',
      render: (val) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: 'var(--border-radius-xs)',
          backgroundColor: 'var(--color-success-bg)',
          color: 'var(--color-success-text)',
          fontWeight: 700,
          fontSize: '11.5px',
          border: '1px solid var(--color-success-border)'
        }}>
          <Clock size={11} />
          {val || '—'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Final Status',
      align: 'center',
      render: (val) => <StatusBadge status={val} size="sm" />
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'center',
      width: '80px',
      render: (_, rec) => (
        <Button
          variant="secondary"
          size="sm"
          icon={Eye}
          onClick={() => {
            const fullOrder = orders.find((o) => String(o.id) === String(rec.orderId));
            setSelectedOrderForView(fullOrder || rec);
          }}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        title="Kitchen Display System (KDS)"
        description="Live chef cooking tickets, preparation timers, and counter handoff."
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {activeOutletName && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: 'var(--border-radius-full)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                fontSize: '11.5px',
                fontWeight: 600,
                border: '1px solid var(--color-primary-border)'
              }}>
                <Store size={12} />
                {activeOutletName}
              </span>
            )}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: 'var(--border-radius-full)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '11.5px',
              fontWeight: 600,
              border: '1px solid var(--border-color)'
            }}>
              <Flame size={13} style={{ color: 'var(--color-accent)' }} />
              Live Kitchen Stations
            </span>
          </div>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={soundEnabled ? Volume2 : VolumeX}
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{ color: soundEnabled ? 'var(--color-success)' : 'var(--text-muted)' }}
            >
              {soundEnabled ? 'Sound ON' : 'Muted'}
            </Button>

            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={() => {
                refreshOrders();
                loadStations();
              }}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* API Error Banners */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={refreshOrders}>
            Retry
          </Button>
        </div>
      )}

      {stationsError && (
        <div className={styles.errorBanner} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{stationsError}</span>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadStations}>
            Retry Stations
          </Button>
        </div>
      )}

      {/* Underline Tabs matching Admin InventoryPage */}
      <div className={styles.tabList} role="tablist" aria-label="Kitchen Display Views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'queue'}
          onClick={() => setActiveTab('queue')}
          className={styles.tabButton}
        >
          <Flame size={15} />
          <span>Active Kitchen Queue</span>
          <span style={{
            padding: '1px 7px',
            borderRadius: 'var(--border-radius-full)',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: activeTab === 'queue' ? 'var(--color-primary)' : 'var(--bg-muted)',
            color: activeTab === 'queue' ? '#ffffff' : 'var(--text-primary)'
          }}>
            {cookingOrders.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'pickup'}
          onClick={() => setActiveTab('pickup')}
          className={styles.tabButton}
        >
          <BellRing size={15} />
          <span>Ready for Pickup Counter</span>
          <span style={{
            padding: '1px 7px',
            borderRadius: 'var(--border-radius-full)',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: activeTab === 'pickup' ? 'var(--color-primary)' : 'var(--bg-muted)',
            color: activeTab === 'pickup' ? '#ffffff' : 'var(--text-primary)'
          }}>
            {readyOrders.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
          className={styles.tabButton}
        >
          <History size={15} />
          <span>Preparation History</span>
          <span style={{
            padding: '1px 7px',
            borderRadius: 'var(--border-radius-full)',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: activeTab === 'history' ? 'var(--color-primary)' : 'var(--bg-muted)',
            color: activeTab === 'history' ? '#ffffff' : 'var(--text-primary)'
          }}>
            {prepHistoryOrders.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ACTIVE KITCHEN QUEUE */}
      {activeTab === 'queue' && (
        <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {stations.map((station) => {
              const isActive = selectedStation === station.id;
              return (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => setSelectedStation(station.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--color-primary)' : 'var(--border-color)',
                    backgroundColor: isActive ? 'var(--color-primary)' : 'var(--bg-surface)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {station.name}
                </button>
              );
            })}
          </div>

          {loading && orders.length === 0 ? (
            <div className={styles.kdsGrid}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton-box" style={{ height: '240px', borderRadius: 'var(--border-radius-lg)' }} />
              ))}
            </div>
          ) : cookingOrders.length === 0 ? (
            <EmptyState
              icon={ChefHat}
              title="Kitchen Queue is All Clear"
              message="No active orders awaiting cooking. Accepted orders will automatically appear here."
              actionLabel="Check Order Management"
              actionIcon={ArrowRight}
              onAction={() => navigate('/staff/board')}
            />
          ) : (
            <div className={styles.kdsGrid}>
              {cookingOrders.map((order) => {
                const effectivePrepStart = order.prepStartedAt || (isStatusPreparing(order.status) ? (order.updatedAt || order.orderDate) : null);
                const isPrepStarted = Boolean(effectivePrepStart);
                const prepTime = isPrepStarted ? formatElapsedPrepTime(effectivePrepStart) : null;
                const elapsedMins = prepTime ? prepTime.mins : 0;
                const isOverdue = elapsedMins >= ORDER_URGENCY_MINUTES.WARNING;
                const isWarning = elapsedMins >= ORDER_URGENCY_MINUTES.NORMAL;

                const timerBg = isOverdue
                  ? 'var(--color-danger-bg)'
                  : isWarning
                    ? 'var(--color-warning-bg)'
                    : 'var(--color-success-bg)';
                const timerBorder = isOverdue
                  ? 'var(--color-danger-border)'
                  : isWarning
                    ? 'var(--color-warning-border)'
                    : 'var(--color-success-border)';
                const timerColor = isOverdue
                  ? 'var(--color-danger-text)'
                  : isWarning
                    ? 'var(--color-warning-text)'
                    : 'var(--color-success-text)';

                const isLoading = actionLoadingId === order.id;
                const cardClass = `${styles.kdsCard} ${
                  isPrepStarted && isOverdue
                    ? styles.kdsCardOverdue
                    : !isPrepStarted
                      ? styles.kdsCardWaiting
                      : ''
                }`;

                return (
                  <div key={order.id} className={cardClass}>
                    {/* Live Preparation Timer Banner */}
                    <div style={{
                      padding: '8px 16px',
                      backgroundColor: isPrepStarted ? timerBg : 'var(--color-info-bg)',
                      borderBottom: `1px solid ${isPrepStarted ? timerBorder : 'var(--color-info-border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} style={{ color: isPrepStarted ? timerColor : 'var(--color-info-text)' }} />
                        <span style={{ fontWeight: 700, color: isPrepStarted ? timerColor : 'var(--color-info-text)' }}>
                          {isPrepStarted
                            ? `Preparation Time: ${prepTime?.formatted || '00:00'}`
                            : 'Awaiting Preparation'}
                        </span>
                      </div>

                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: isPrepStarted ? timerBorder : 'var(--color-primary-light)',
                        color: isPrepStarted ? timerColor : 'var(--color-primary)'
                      }}>
                        {isPrepStarted ? (isOverdue ? 'OVERDUE' : isWarning ? 'RUSH' : 'COOKING') : 'QUEUED'}
                      </span>
                    </div>

                    {/* Ticket Header */}
                    <div style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-app)',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {order.token || 'T-ORD'}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-muted)',
                          color: 'var(--text-muted)',
                          fontWeight: 600
                        }}>
                          #{String(order.id).slice(-6)}
                        </span>
                      </div>

                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 'var(--border-radius-sm)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)'
                      }}>
                        {order.orderType || 'Pickup'}
                      </span>
                    </div>

                    {/* Customer Info Bar */}
                    <div style={{
                      padding: '6px 16px',
                      backgroundColor: 'var(--color-primary-light)',
                      fontSize: '11.5px',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--border-color-subtle)'
                    }}>
                      <span style={{ fontWeight: 600 }}>{order.customer?.name || 'Customer'}</span>
                      {order.customer?.role && <span style={{ fontWeight: 700 }}>{order.customer.role}</span>}
                    </div>

                    {/* Chef Notes */}
                    {(order.notes || order.cookingNotes) && (
                      <div style={{
                        margin: '10px 16px 0 16px',
                        padding: '8px 12px',
                        borderRadius: 'var(--border-radius-sm)',
                        backgroundColor: 'var(--color-warning-bg)',
                        border: '1px solid var(--color-warning-border)',
                        color: 'var(--color-warning-text)',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                        <span>Note: {order.notes || order.cookingNotes}</span>
                      </div>
                    )}

                    {/* Food Items Checklist */}
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      {Array.isArray(order.items) && order.items.map((item, idx) => {
                        const itemKey = `${order.id}-${idx}`;
                        const isChecked = Boolean(checkedItems[itemKey]);

                        return (
                          <div
                            key={itemKey}
                            onClick={() => toggleItemCheck(order.id, idx)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              cursor: 'pointer',
                              padding: '8px 10px',
                              borderRadius: 'var(--border-radius-sm)',
                              backgroundColor: isChecked ? 'var(--color-success-bg)' : 'var(--bg-app)',
                              border: `1px solid ${isChecked ? 'var(--color-success-border)' : 'var(--border-color)'}`
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{ width: '15px', height: '15px', marginTop: '2px', cursor: 'pointer', accentColor: 'var(--color-success)' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: isChecked ? 'var(--color-success-text)' : 'var(--text-primary)',
                                textDecoration: isChecked ? 'line-through' : 'none'
                              }}>
                                {item.quantity}x {item.name}
                              </div>
                              {item.variant && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  Variant: {item.variant}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Ticket Footer */}
                    <div style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-app)',
                      borderTop: '1px solid var(--border-color)'
                    }}>
                      {!isPrepStarted ? (
                        <Button
                          variant="primary"
                          icon={Play}
                          loading={isLoading}
                          onClick={() => handleStartPrepare(order)}
                          style={{ width: '100%' }}
                        >
                          Start Preparing
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          icon={CheckCircle2}
                          loading={isLoading}
                          onClick={() => handleMarkReady(order)}
                          style={{ width: '100%', backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                        >
                          Ready for Pickup Counter
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: READY FOR PICKUP COUNTER */}
      {activeTab === 'pickup' && (
        <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className={styles.infoBanner}>
            <BellRing size={18} style={{ color: 'var(--color-success)' }} />
            <div>
              <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                Pickup Counter Queue ({readyOrders.length} Ready)
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                — Food preparation completed; awaiting customer pickup
              </span>
            </div>
          </div>

          {readyOrders.length === 0 ? (
            <EmptyState
              icon={BellRing}
              title="Pickup Counter is Clear"
              message="Orders marked Ready by the kitchen will automatically appear here."
            />
          ) : (
            <div className={styles.kdsGrid}>
              {readyOrders.map((order) => (
                <div key={order.id} className={`${styles.kdsCard} ${styles.kdsCardReady}`}>
                  <div style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-success-bg)',
                    borderBottom: '1px solid var(--color-success-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--color-success-text)'
                    }}>
                      <CheckCircle2 size={14} />
                      Ready for Pickup
                    </span>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--color-success-text)'
                    }}>
                      <Clock size={12} />
                      {order.prepDurationFormatted ? `Prep: ${order.prepDurationFormatted}` : 'Prep Complete'}
                    </span>
                  </div>

                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-app)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {order.token || 'T-ORD'}
                      </span>
                      <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)', fontWeight: 600 }}>
                        #{String(order.id).slice(-6)}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {order.customer?.name || 'Customer'}
                    </span>
                  </div>

                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    {Array.isArray(order.items) && order.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.quantity}x {item.name}
                        </span>
                        {item.variant && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.variant}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{
                    padding: '10px 16px',
                    backgroundColor: 'var(--bg-app)',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                      onClick={() => setSelectedOrderForView(order)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PREPARATION HISTORY */}
      {activeTab === 'history' && (
        <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className={styles.filterToolbar}>
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search
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
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history by Order ID, Token, or Customer..."
                style={{
                  width: '100%',
                  height: '34px',
                  padding: '0 28px 0 30px',
                  fontSize: '12.5px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              value={historyDateFilter}
              onChange={(e) => setHistoryDateFilter(e.target.value)}
              className={styles.filterSelect}
              aria-label="Filter history date range"
            >
              <option value="ALL">All Prepared Orders</option>
              <option value="TODAY">Today's Prepared Orders</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="WEEK">Last 7 Days</option>
            </select>

            {(historySearch || historyDateFilter !== 'ALL') && (
              <Button
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                onClick={() => {
                  setHistorySearch('');
                  setHistoryDateFilter('ALL');
                }}
              >
                Reset
              </Button>
            )}
          </div>

          <DataTable
            columns={historyColumns}
            data={paginatedPrepHistory}
            keyField="orderId"
            loading={loading}
            emptyState={
              <EmptyState
                icon={History}
                title="No preparation history records found"
                message="Completed and ready orders will appear here."
              />
            }
            footer={
              <Pagination
                currentPage={historyPage}
                totalItems={prepHistoryOrders.length}
                pageSize={historyPageSize}
                onPageChange={setHistoryPage}
                onPageSizeChange={(newSize) => {
                  setHistoryPageSize(newSize);
                  setHistoryPage(1);
                }}
                pageSizeOptions={[5, 10, 20]}
              />
            }
          />
        </div>
      )}

      {/* View Order Details Modal */}
      {selectedOrderForView && (
        <StaffOrderDetailsModal
          isOpen={Boolean(selectedOrderForView)}
          onClose={() => setSelectedOrderForView(null)}
          order={selectedOrderForView}
          onStartCooking={(orderId) => {
            const ord = orders.find((o) => String(o.id) === String(orderId)) || selectedOrderForView;
            handleStartPrepare(ord);
          }}
          onMarkReady={(orderId) => {
            const ord = orders.find((o) => String(o.id) === String(orderId)) || selectedOrderForView;
            handleMarkReady(ord);
          }}
        />
      )}
    </div>
  );
};

export default KitchenDisplayPage;
