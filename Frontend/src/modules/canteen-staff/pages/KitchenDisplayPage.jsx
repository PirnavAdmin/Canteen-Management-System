import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  RefreshCw,
  ChefHat,
  ArrowRight
} from 'lucide-react';
import { useStaffOrders } from '../hooks/useStaffOrders';
import { staffOrderService } from '../services/staffOrderService';
import { ORDER_STATUS } from '../../../constants/appConstants';
import { KITCHEN_STATIONS, ORDER_URGENCY_MINUTES } from '../constants/staffConstants';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';

export const KitchenDisplayPage = () => {
  const {
    orders,
    refreshOrders,
    markReadyForPickup
  } = useStaffOrders();

  const [stations, setStations] = useState(KITCHEN_STATIONS);
  const [kdsOrders, setKdsOrders] = useState([]);
  const [selectedStation, setSelectedStation] = useState('all');
  const [checkedItems, setCheckedItems] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [kdsToast, setKdsToast] = useState('');

  const loadKdsData = useCallback(async () => {
    try {
      const [kdsList, stationsList] = await Promise.all([
        staffOrderService.getKdsOrders(),
        staffOrderService.getKitchenStations()
      ]);
      if (Array.isArray(kdsList)) {
        setKdsOrders(kdsList);
      }
      if (Array.isArray(stationsList) && stationsList.length > 0) {
        setStations(stationsList);
      }
    } catch (err) {
      console.warn('Error loading KDS orders / stations:', err);
    }
  }, []);

  useEffect(() => {
    loadKdsData();
  }, [loadKdsData]);

  useEffect(() => {
    const handleOrderEvent = () => {
      loadKdsData();
    };
    window.addEventListener('cms:order_status_updated', handleOrderEvent);
    return () => {
      window.removeEventListener('cms:order_status_updated', handleOrderEvent);
    };
  }, [loadKdsData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const handleRefreshTickets = async () => {
    await Promise.all([refreshOrders(), loadKdsData()]);
  };

  const sourceOrders = kdsOrders.length > 0 ? kdsOrders : orders;
  const cookingOrders = sourceOrders.filter((o) => {
    const isCooking = o.status === ORDER_STATUS.PREPARING || o.status === ORDER_STATUS.ACCEPTED;
    if (!isCooking) return false;
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

  const getElapsedMinutes = (dateString, prepDateString) => {
    const effectiveDate = prepDateString || dateString;
    if (!effectiveDate) return 0;
    const orderTime = new Date(effectiveDate);
    const diffMs = currentTime.getTime() - orderTime.getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const toggleItemCheck = (orderId, itemIndex) => {
    const key = `${orderId}-${itemIndex}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCompleteOrder = async (order) => {
    try {
      await markReadyForPickup(order.id);
      setKdsToast(`Ticket #${order.token || order.id} is ready and moved to the Pickup Counter.`);
      setTimeout(() => setKdsToast(''), 4000);
    } catch (err) {
      alert(err.message || 'Error updating order to ready state');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Kitchen Display System (KDS)"
        description="Touch-friendly live chef cooking tickets & station prep timers"
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
              onClick={handleRefreshTickets}
            >
              Refresh Tickets ({cookingOrders.length})
            </Button>
          </div>
        }
      />

      {/* KDS Action Toast Banner */}
      {kdsToast && (
        <div style={{
          padding: '10px 16px',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--color-success-bg, #ecfdf5)',
          border: '1px solid var(--color-success-border, #a7f3d0)',
          color: 'var(--color-success, #059669)',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>{kdsToast}</span>
        </div>
      )}

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

      {/* Cooking Order Tickets Grid */}
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
            No tickets currently awaiting live cooking or prep.
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
            <span>Check Staff Order Board</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {cookingOrders.map((order) => {
            const elapsed = getElapsedMinutes(order.orderDate || order.createdAt, order.preparingAt);
            const isOverdue = elapsed >= ORDER_URGENCY_MINUTES.WARNING;
            const isWarning = elapsed >= ORDER_URGENCY_MINUTES.NORMAL;

            const timerColor = isOverdue ? 'var(--color-danger)' : isWarning ? 'var(--color-warning)' : 'var(--color-success)';

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--border-radius-lg)',
                  border: isOverdue ? '2px solid var(--color-danger)' : '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
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
                    <span style={{
                      fontSize: '18px',
                      fontWeight: 900,
                      color: 'var(--text-primary)'
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
                      #{order.id.slice(-6)}
                    </span>
                  </div>

                  {/* Elapsed Timer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--bg-surface)',
                    border: `1px solid ${timerColor}`,
                    color: timerColor,
                    fontSize: '12px',
                    fontWeight: 800
                  }}>
                    <Clock size={12} />
                    <span>{elapsed}m prep</span>
                  </div>
                </div>

                {/* Customer Details Bar */}
                <div style={{
                  padding: '7px 16px',
                  backgroundColor: 'var(--color-primary-light)',
                  fontSize: '11.5px',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-color-subtle)'
                }}>
                  <span>{order.customer?.name || 'Customer'}</span>
                  <span style={{ fontWeight: 700 }}>
                    {order.customer?.role || 'Student'} • Express Counter
                  </span>
                </div>

                {/* Special Cooking Notes for Chef */}
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
                    <span>⚠️ Note: {order.notes || order.cookingNotes}</span>
                  </div>
                )}

                {/* Food Items Checklist */}
                <div style={{
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
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
                          backgroundColor: isChecked ? 'var(--color-success-bg)' : 'var(--bg-app)',
                          border: `1px solid ${isChecked ? 'var(--color-success-border)' : 'var(--border-color)'}`,
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
                            fontSize: '13.5px',
                            fontWeight: 800,
                            color: isChecked ? 'var(--color-success)' : 'var(--text-primary)',
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

                {/* Action Completion Footer */}
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-app)',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <button
                    onClick={() => handleCompleteOrder(order)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--border-radius-sm)',
                      backgroundColor: 'var(--color-success)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Done • Move to Pickup Counter</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplayPage;
