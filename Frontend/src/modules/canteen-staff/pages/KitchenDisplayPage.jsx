import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  Play,
  Store
} from 'lucide-react';
import { useStaffOrders } from '../hooks/useStaffOrders';
import { ORDER_STATUS } from '../../../constants/appConstants';
import {
  isStatusPreparing,
  isStatusAccepted,
  isStatusReady,
  isStatusCompleted
} from '../services/staffOrderService';

// Fallback safeguard to guarantee isStatusCompleted can never throw ReferenceError
const checkCompleted = (status) => {
  if (typeof isStatusCompleted === 'function') {
    return isStatusCompleted(status);
  }
  const s = String(status || '').trim().toLowerCase();
  return s === 'completed' || s === 'collected';
};
import { KITCHEN_STATIONS, ORDER_URGENCY_MINUTES } from '../constants/staffConstants';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';
import { Pagination } from '../../../components/common/Pagination';
import { StaffOrderDetailsModal } from '../components/StaffOrderDetailsModal';
import { isSameIstDate, isWithinDaysIST } from '../../../utils/formatters';

export const KitchenDisplayPage = () => {
  const {
    orders,
    refreshOrders,
    startPreparation,
    markReadyForPickup,
    activeOutletName
  } = useStaffOrders();

  // Active View Tab: 'queue' (Active Cooking) | 'pickup' (Ready for Pickup Counter) | 'history' (Preparation History)
  const [activeTab, setActiveTab] = useState('queue');

  const [stations, setStations] = useState(KITCHEN_STATIONS);
  const [selectedStation, setSelectedStation] = useState('all');
  const [checkedItems, setCheckedItems] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [kdsToast, setKdsToast] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // History Filter States
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK'
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);

  // 1. High-frequency 1-second timer for live preparation counters
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Elapsed Prep Time in MM:SS (Calculated from actual prepStartedAt timestamp)
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

  // 3. Active Kitchen Cooking Tickets (Preparing or Accepted, strictly excluding Ready for Pickup)
  const cookingOrders = useMemo(() => {
    return orders.filter((o) => {
      const isCooking = isStatusPreparing(o.status) || isStatusAccepted(o.status);
      if (!isCooking) return false;
      if (isStatusReady(o.status) || checkCompleted(o.status)) return false;
      if (selectedStation === 'all') return true;

      if (o.stationId === selectedStation) return true;
      if (Array.isArray(o.items) && o.items.some((item) => item.stationId === selectedStation)) return true;

      if (selectedStation === 'station-1') {
        return Array.isArray(o.items) && o.items.some((i) => {
          const cat = (i.category || i.name || '').toLowerCase();
          return cat.includes('curry') || cat.includes('biryani') || cat.includes('dosa') || cat.includes('meal') || cat.includes('chole') || cat.includes('noodles') || cat.includes('rice') || cat.includes('main');
        });
      }
      if (selectedStation === 'station-2') {
        return Array.isArray(o.items) && o.items.some((i) => {
          const cat = (i.category || i.name || '').toLowerCase();
          return cat.includes('snack') || cat.includes('roll') || cat.includes('samosa') || cat.includes('sandwich') || cat.includes('bites');
        });
      }
      if (selectedStation === 'station-3') {
        return Array.isArray(o.items) && o.items.some((i) => {
          const cat = (i.category || i.name || '').toLowerCase();
          return cat.includes('coffee') || cat.includes('tea') || cat.includes('lemonade') || cat.includes('lassi') || cat.includes('shake') || cat.includes('juice') || cat.includes('beverage');
        });
      }
      return false;
    });
  }, [orders, selectedStation]);

  // 4. Ready for Pickup Orders (Food plated, waiting at counter for collection)
  const readyOrders = useMemo(() => {
    return orders.filter((o) => isStatusReady(o.status));
  }, [orders]);

  // 5. Preparation History (All prepared orders directly from live backend DB)
  const prepHistoryOrders = useMemo(() => {
    const list = orders
      .filter((o) => isStatusReady(o.status) || checkCompleted(o.status) || o.status === 'Completed' || o.status === 'Collected')
      .map((o) => {
        const id = String(o.id);
        const statusToDisplay = isStatusReady(o.status)
          ? ORDER_STATUS.READY_FOR_PICKUP
          : (o.status || ORDER_STATUS.READY_FOR_PICKUP);

        return {
          orderId: id,
          token: o.token,
          customerName: o.customer?.name || 'Customer',
          customerRole: o.customer?.role || 'Student',
          items: (o.items && o.items.length > 0) ? o.items : [],
          totalAmount: o.totalAmount ?? 0,
          orderType: o.orderType || 'Pickup',
          prepStartedAt: o.prepStartedAt || o.preparingAt || o.createdAt,
          prepCompletedAt: o.prepCompletedAt || o.readyAt || o.updatedAt,
          durationSeconds: o.prepDurationSeconds || 0,
          durationFormatted: o.prepDurationFormatted || '—',
          status: statusToDisplay,
          orderDate: o.orderDate || o.createdAt
        };
      });

    // Apply Filters
    return list.filter((item) => {
      // Search filter (Token, Order ID, Customer Name)
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase().trim();
        const id = String(item.orderId || '').toLowerCase();
        const token = String(item.token || '').toLowerCase();
        const customer = String(item.customerName || '').toLowerCase();
        if (!id.includes(q) && !token.includes(q) && !customer.includes(q)) {
          return false;
        }
      }

      // Date range filter
      if (historyDateFilter !== 'ALL') {
        const dateVal = item.prepCompletedAt || item.orderDate || item.prepStartedAt;
        if (!dateVal) return false;

        if (historyDateFilter === 'TODAY') {
          return isSameIstDate(dateVal);
        }
        if (historyDateFilter === 'YESTERDAY') {
          const d = new Date(dateVal);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return isSameIstDate(d, yesterday);
        }
        if (historyDateFilter === 'WEEK') {
          return isWithinDaysIST(dateVal, 7) || isSameIstDate(dateVal);
        }
      }

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.prepCompletedAt || a.prepStartedAt || 0).getTime();
      const timeB = new Date(b.prepCompletedAt || b.prepStartedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [orders, historySearch, historyDateFilter]);

  // Reset pagination when history filter changes
  useEffect(() => {
    setHistoryPage(1);
  }, [historySearch, historyDateFilter]);

  const paginatedPrepHistory = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return prepHistoryOrders.slice(start, start + historyPageSize);
  }, [prepHistoryOrders, historyPage, historyPageSize]);

  const toggleItemCheck = (orderId, itemIndex) => {
    const key = `${orderId}-${itemIndex}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Kitchen Staff clicks "Start Preparing" -> Records preparation start timestamp in DB, live timer starts
  const handleStartPrepare = async (order) => {
    try {
      setActionLoadingId(order.id);
      await startPreparation(order.id);
      setKdsToast(`⏱️ Preparation started for Ticket #${order.token || order.id}. Live timer active!`);
      setTimeout(() => setKdsToast(''), 4500);
    } catch (err) {
      alert(err.message || 'Error starting preparation');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Kitchen Staff clicks "Ready for Pickup Counter" -> Updates status to Ready for Pickup, stops timer, removes from active queue, adds to Preparation History
  const handleMarkReady = async (order) => {
    try {
      setActionLoadingId(order.id);
      await markReadyForPickup(order.id);
      setKdsToast(`✅ Ticket #${order.token || order.id} moved to Ready for Pickup Counter & Preparation History!`);
      setTimeout(() => setKdsToast(''), 4500);
    } catch (err) {
      alert(err.message || 'Error updating order for pickup counter');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. Header with Controls */}
      <PageHeader
        title="Kitchen Display System (KDS)"
        description="Touch-friendly live chef cooking tickets, preparation timers, and counter handoff."
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
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
            }}>
              <Store size={12} />
              {activeOutletName || 'Central Dining Hall'}
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '9999px',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
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
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                height: '36px',
                padding: '0 12px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                color: soundEnabled ? 'var(--color-success)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                fontWeight: 600
              }}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>{soundEnabled ? 'Sound ON' : 'MUTE'}</span>
            </button>

            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={refreshOrders}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* 2. Top KDS View Tabs (Active Queue | Ready Counter | History) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'var(--bg-surface)',
        padding: '6px',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          style={{
            flex: 1,
            padding: '9px 16px',
            borderRadius: 'var(--border-radius-md)',
            border: 'none',
            backgroundColor: activeTab === 'queue' ? 'var(--color-accent)' : 'transparent',
            color: activeTab === 'queue' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Flame size={16} />
          <span>Active Kitchen Queue</span>
          <span style={{
            padding: '1px 7px',
            borderRadius: '9999px',
            fontSize: '11px',
            backgroundColor: activeTab === 'queue' ? 'rgba(255,255,255,0.25)' : 'var(--bg-muted)',
            color: activeTab === 'queue' ? '#ffffff' : 'var(--text-primary)'
          }}>
            {cookingOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pickup')}
          style={{
            flex: 1,
            padding: '9px 16px',
            borderRadius: 'var(--border-radius-md)',
            border: 'none',
            backgroundColor: activeTab === 'pickup' ? '#059669' : 'transparent',
            color: activeTab === 'pickup' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <BellRing size={16} />
          <span>Ready for Pickup Counter</span>
          <span style={{
            padding: '1px 7px',
            borderRadius: '9999px',
            fontSize: '11px',
            backgroundColor: activeTab === 'pickup' ? 'rgba(255,255,255,0.25)' : 'var(--bg-muted)',
            color: activeTab === 'pickup' ? '#ffffff' : 'var(--text-primary)'
          }}>
            {readyOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1,
            padding: '9px 16px',
            borderRadius: 'var(--border-radius-md)',
            border: 'none',
            backgroundColor: activeTab === 'history' ? '#4f46e5' : 'transparent',
            color: activeTab === 'history' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <History size={16} />
          <span>Preparation History</span>
          <span style={{
            padding: '1px 7px',
            borderRadius: '9999px',
            fontSize: '11px',
            backgroundColor: activeTab === 'history' ? 'rgba(255,255,255,0.25)' : 'var(--bg-muted)',
            color: activeTab === 'history' ? '#ffffff' : 'var(--text-primary)'
          }}>
            {prepHistoryOrders.length}
          </span>
        </button>
      </div>

      {/* Action Notification Toast Banner */}
      {kdsToast && (
        <div style={{
          padding: '11px 18px',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle2 size={17} style={{ color: '#059669' }} />
          <span>{kdsToast}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: ACTIVE KITCHEN QUEUE                              */}
      {/* ======================================================== */}
      {activeTab === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Station Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {stations.map((station) => (
              <button
                key={station.id}
                onClick={() => setSelectedStation(station.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid',
                  borderColor: selectedStation === station.id ? 'var(--color-accent)' : 'var(--border-color)',
                  backgroundColor: selectedStation === station.id ? 'var(--color-accent)' : 'var(--bg-surface)',
                  color: selectedStation === station.id ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {station.name}
              </button>
            ))}
          </div>

          {cookingOrders.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--border-radius-lg)',
              border: '1px solid var(--border-color)'
            }}>
              <ChefHat size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Kitchen Queue is All Clear!
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 16px 0' }}>
                No active orders awaiting cooking. Accepted orders will automatically appear here.
              </p>
              <Link
                to="/staff/board"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'var(--color-accent)',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <span>Check Order Management</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: '16px'
            }}>
              {cookingOrders.map((order) => {
                const effectivePrepStart = order.prepStartedAt || (isStatusPreparing(order.status) ? (order.updatedAt || order.orderDate) : null);
                const isPrepStarted = Boolean(effectivePrepStart);
                const prepTime = isPrepStarted ? formatElapsedPrepTime(effectivePrepStart) : null;
                const elapsedMins = prepTime ? prepTime.mins : 0;
                const isOverdue = elapsedMins >= ORDER_URGENCY_MINUTES.WARNING;
                const isWarning = elapsedMins >= ORDER_URGENCY_MINUTES.NORMAL;

                const timerBg = isOverdue ? '#fef2f2' : isWarning ? '#fffbeb' : '#ecfdf5';
                const timerBorder = isOverdue ? '#fca5a5' : isWarning ? '#fde68a' : '#a7f3d0';
                const timerColor = isOverdue ? '#dc2626' : isWarning ? '#d97706' : '#059669';

                const isLoading = actionLoadingId === order.id;

                return (
                  <div
                    key={order.id}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--border-radius-lg)',
                      border: isPrepStarted && isOverdue
                        ? '2px solid #dc2626'
                        : isPrepStarted
                          ? '1.5px solid var(--border-color)'
                          : '1.5px dashed #93c5fd',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    {/* Live Preparation Timer Banner (Top of Order Card) */}
                    <div style={{
                      padding: '8px 16px',
                      backgroundColor: isPrepStarted ? timerBg : '#eff6ff',
                      borderBottom: `1px solid ${isPrepStarted ? timerBorder : '#bfdbfe'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12.5px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={15} style={{ color: isPrepStarted ? timerColor : '#2563eb' }} />
                        <span style={{
                          fontWeight: 800,
                          color: isPrepStarted ? timerColor : '#1d4ed8',
                          letterSpacing: '0.02em'
                        }}>
                          {isPrepStarted
                            ? `Preparation Time: ${prepTime?.formatted || '00:00'}`
                            : 'Awaiting Preparation (Timer Paused)'}
                        </span>
                      </div>

                      {isPrepStarted ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: timerBorder,
                          color: timerColor
                        }}>
                          {isOverdue ? 'OVERDUE' : isWarning ? 'RUSH' : 'COOKING'}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af'
                        }}>
                          READY TO COOK
                        </span>
                      )}
                    </div>

                    {/* Ticket Token & Identification Header */}
                    <div style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-app)',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '20px',
                          fontWeight: 900,
                          color: 'var(--text-primary)',
                          fontFamily: 'monospace'
                        }}>
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
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
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
                      <span style={{ fontWeight: 700 }}>
                        {order.customer?.role || 'Student'}
                      </span>
                    </div>

                    {/* Chef Instructions Banner */}
                    {(order.notes || order.cookingNotes) && (
                      <div style={{
                        margin: '10px 16px 0 16px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#fffbeb',
                        border: '1.5px solid #fde68a',
                        color: '#92400e',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <AlertTriangle size={14} style={{ color: '#d97706', flexShrink: 0 }} />
                        <span>Note: {order.notes || order.cookingNotes}</span>
                      </div>
                    )}

                    {/* Food Items Checklist */}
                    <div style={{
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '9px',
                      flex: 1
                    }}>
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
                              backgroundColor: isChecked ? '#ecfdf5' : 'var(--bg-app)',
                              border: `1px solid ${isChecked ? '#a7f3d0' : 'var(--border-color)'}`,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{
                                width: '16px',
                                height: '16px',
                                marginTop: '2px',
                                cursor: 'pointer',
                                accentColor: '#10b981'
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: 800,
                                color: isChecked ? '#059669' : 'var(--text-primary)',
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

                    {/* Ticket Action Footer: Prepare OR Mark Ready */}
                    <div style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-app)',
                      borderTop: '1px solid var(--border-color)'
                    }}>
                      {!isPrepStarted ? (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleStartPrepare(order)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 'var(--border-radius-sm)',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 800,
                            cursor: isLoading ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: 'var(--shadow-xs)'
                          }}
                        >
                          <Play size={15} fill="#ffffff" />
                          <span>{isLoading ? 'Starting...' : 'Start Preparing'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleMarkReady(order)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 'var(--border-radius-sm)',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 800,
                            cursor: isLoading ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: 'var(--shadow-xs)'
                          }}
                        >
                          <CheckCircle2 size={16} />
                          <span>{isLoading ? 'Updating...' : 'Ready for Pickup Counter'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: READY FOR PICKUP COUNTER                         */}
      {/* ======================================================== */}
      {activeTab === 'pickup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)',
            padding: '12px 16px',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BellRing size={18} style={{ color: '#059669' }} />
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  Pickup Counter Queue ({readyOrders.length} Ready)
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  — Food preparation completed; awaiting student and faculty pickup
                </span>
              </div>
            </div>
          </div>

          {readyOrders.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--border-radius-lg)',
              border: '1px solid var(--border-color)'
            }}>
              <BellRing size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Pickup Counter is Clear
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
                Orders marked 'Ready' by the kitchen will automatically appear here.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px'
            }}>
              {readyOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--border-radius-lg)',
                    border: '1.5px solid #a7f3d0',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  {/* Top Ready Banner */}
                  <div style={{
                    padding: '8px 16px',
                    backgroundColor: '#ecfdf5',
                    borderBottom: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#059669'
                    }}>
                      <CheckCircle2 size={14} />
                      Ready for Pickup • At Counter
                    </span>

                    {/* Actual Preparation Duration */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: '#d1fae5',
                      color: '#065f46'
                    }}>
                      <Clock size={12} />
                      {order.prepDurationFormatted
                        ? `Prep Duration: ${order.prepDurationFormatted}`
                        : 'Prep Complete'}
                    </span>
                  </div>

                  {/* Order Token & ID */}
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-app)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '22px',
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                        fontFamily: 'monospace'
                      }}>
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
                      fontWeight: 700,
                      color: 'var(--color-primary)'
                    }}>
                      {order.customer?.name || 'Customer'}
                    </span>
                  </div>

                  {/* Items Summary */}
                  <div style={{
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    flex: 1
                  }}>
                    {Array.isArray(order.items) && order.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12.5px'
                        }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.quantity}x {item.name}
                        </span>
                        {item.variant && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {item.variant}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Footer: View Details button */}
                  <div style={{
                    padding: '10px 16px',
                    backgroundColor: 'var(--bg-app)',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForView(order)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye size={12} />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PREPARATION HISTORY                               */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* History Search & Filter Toolbar */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              flex: '1 1 260px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              padding: '0 12px',
              height: '36px'
            }}>
              <Search size={15} style={{ color: 'var(--text-placeholder)' }} />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history by Order ID or Token..."
                style={{
                  width: '100%',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Prepared Orders</option>
                <option value="TODAY">Today's Prepared Orders</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="WEEK">Last 7 Days</option>
              </select>

              {(historySearch || historyDateFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setHistorySearch('');
                    setHistoryDateFilter('ALL');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-secondary)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Preparation History Table */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '12.5px'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: 'var(--bg-app)',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    textTransform: 'uppercase'
                  }}>
                    <th style={{ padding: '12px 14px' }}>#</th>
                    <th style={{ padding: '12px 14px' }}>Token & Order ID</th>
                    <th style={{ padding: '12px 14px' }}>Customer</th>
                    <th style={{ padding: '12px 14px' }}>Food Order Details</th>
                    <th style={{ padding: '12px 14px' }}>Prep Started</th>
                    <th style={{ padding: '12px 14px' }}>Prep Completed</th>
                    <th style={{ padding: '12px 14px' }}>Total Duration</th>
                    <th style={{ padding: '12px 14px' }}>Final Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPrepHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No preparation history records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedPrepHistory.map((rec, index) => {
                      const serialNumber = (historyPage - 1) * historyPageSize + index + 1;
                      const startTime = rec.prepStartedAt
                        ? new Date(rec.prepStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—';
                      const endTime = rec.prepCompletedAt
                        ? new Date(rec.prepCompletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—';

                      return (
                        <tr
                          key={rec.orderId || index}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {serialNumber}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '13px' }}>
                                {rec.token || 'T-ORD'}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                #{String(rec.orderId).slice(-6)}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {rec.customerName || 'Customer'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {rec.customerRole || 'Student'}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {Array.isArray(rec.items) && rec.items.slice(0, 2).map((item, i) => (
                                <span key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                  {item.quantity}x {item.name}
                                </span>
                              ))}
                              {Array.isArray(rec.items) && rec.items.length > 2 && (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  +{rec.items.length - 2} more item(s)
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                            {startTime}
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                            {endTime}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              fontWeight: 700,
                              fontSize: '11.5px',
                              border: '1px solid #a7f3d0'
                            }}>
                              <Clock size={11} />
                              {rec.durationFormatted || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '9999px',
                              backgroundColor: rec.status === 'Collected' ? '#ecfdf5' : '#eff6ff',
                              color: rec.status === 'Collected' ? '#059669' : '#2563eb',
                              fontWeight: 700,
                              fontSize: '11px',
                              border: `1px solid ${rec.status === 'Collected' ? '#a7f3d0' : '#bfdbfe'}`
                            }}>
                              <CheckCircle2 size={12} />
                              {rec.status === 'Collected' ? 'Collected' : 'Ready for Pickup'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const fullOrder = orders.find(o => String(o.id) === String(rec.orderId));
                                setSelectedOrderForView(fullOrder || rec);
                              }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-secondary)',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Eye size={12} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {prepHistoryOrders.length > 0 && (
              <Pagination
                currentPage={historyPage}
                totalItems={prepHistoryOrders.length}
                pageSize={historyPageSize}
                onPageChange={setHistoryPage}
                onPageSizeChange={(newSize) => {
                  setHistoryPageSize(newSize);
                  setHistoryPage(1);
                }}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            )}
          </div>
        </div>
      )}

      {/* View Order Details Modal */}
      {selectedOrderForView && (
        <StaffOrderDetailsModal
          isOpen={Boolean(selectedOrderForView)}
          onClose={() => setSelectedOrderForView(null)}
          order={selectedOrderForView}
          onStartCooking={(orderId) => {
            const ord = orders.find(o => String(o.id) === String(orderId)) || selectedOrderForView;
            handleStartPrepare(ord);
          }}
          onMarkReady={(orderId) => {
            const ord = orders.find(o => String(o.id) === String(orderId)) || selectedOrderForView;
            handleMarkReady(ord);
          }}
        />
      )}
    </div>
  );
};

export default KitchenDisplayPage;
