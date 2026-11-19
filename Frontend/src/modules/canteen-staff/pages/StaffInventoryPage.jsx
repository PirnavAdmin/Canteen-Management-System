import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Send,
  History,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight,
  Clock,
  Truck,
  ShieldCheck,
  Package,
  Trash2
} from 'lucide-react';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { STAFF_APP_CONFIG } from '../constants/staffNavigation';
import { PageHeader } from '../../../components/common/PageHeader';

export const StaffInventoryPage = () => {
  const [searchParams] = useSearchParams();
  const {
    inventory,
    lowStockItems,
    stockRequests,
    createRequest,
    deleteRequest,
    markStockReceived
  } = useStaffInventory();

  // Active View State: 'inventory' | 'request' | 'history'
  const [activeView, setActiveView] = useState(() => {
    const view = searchParams.get('view');
    if (view === 'history') return 'history';
    if (view === 'request' || searchParams.get('item')) return 'request';
    return 'inventory';
  });

  // Inventory Table States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Request Stock Form States
  const [itemName, setItemName] = useState(() => searchParams.get('item') || '');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState(() => searchParams.get('unit') || 'kg');
  const [urgency, setUrgency] = useState('Normal');
  const [requiredByDate, setRequiredByDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(null);
  const [requestError, setRequestError] = useState('');

  // Request History Table States
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [historySuccessToast, setHistorySuccessToast] = useState('');

  // Check URL query params on mount or param changes
  useEffect(() => {
    const requestedItem = searchParams.get('item');
    const requestedUnit = searchParams.get('unit');
    const viewParam = searchParams.get('view');

    if (requestedItem) {
      setItemName(requestedItem);
      if (requestedUnit) setUnit(requestedUnit);
      setActiveView('request');
    } else if (viewParam === 'request') {
      setActiveView('request');
    } else if (viewParam === 'history') {
      setActiveView('history');
    } else if (!viewParam && !requestedItem) {
      setActiveView('inventory');
    }
  }, [searchParams]);

  // Handle Reorder click from table row
  const handleOpenReorder = (item) => {
    setItemName(item.ingredientName || '');
    setUnit(item.unit || 'kg');
    setQuantity(String(item.reorderLevel || 10));
    setRequestSuccess(null);
    setRequestError('');
    setActiveView('request');
  };

  // Handle Item Select from dropdown
  const handleItemSelect = (e) => {
    const selectedName = e.target.value;
    setItemName(selectedName);
    const matched = inventory.find(i => i.ingredientName === selectedName);
    if (matched && matched.unit) {
      setUnit(matched.unit);
    }
  };

  // Handle Request Stock Form Submission
  const handleSubmitStockRequest = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setRequestError('Please select or specify an ingredient/stock item name.');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setRequestError('Please enter a valid requested quantity greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setRequestError('');

      const matched = inventory.find(
        i => i.ingredientName.toLowerCase() === itemName.trim().toLowerCase()
      );

      const created = await createRequest({
        itemName: itemName.trim(),
        itemCode: matched?.itemCode || 'ING-REQ',
        category: matched?.category || 'General Kitchen Supplies',
        requestedQuantity: Number(quantity),
        unit,
        urgency,
        requiredByDate,
        notes: notes.trim(),
        outletId: STAFF_APP_CONFIG.outletId,
        outletName: STAFF_APP_CONFIG.canteenOutlet
      });

      setRequestSuccess(created);
    } catch (err) {
      setRequestError(err.message || 'Failed to submit stock request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Mark Received in History View
  const handleMarkReceived = async (reqId) => {
    try {
      await markStockReceived(reqId);
      setHistorySuccessToast(`Stock for requisition #${reqId} marked received and added to inventory!`);
      setTimeout(() => setHistorySuccessToast(''), 4500);
    } catch (err) {
      alert(err.message || 'Error marking stock received');
    }
  };

  // Handle Delete Request in History View
  const handleDeleteRequest = async (reqId) => {
    if (!window.confirm(`Are you sure you want to delete requisition ${reqId}?`)) {
      return;
    }
    try {
      await deleteRequest(reqId);
      setHistorySuccessToast(`Requisition #${reqId} deleted successfully.`);
      setTimeout(() => setHistorySuccessToast(''), 4500);
    } catch (err) {
      alert(err.message || 'Error deleting requisition');
    }
  };

  // Filter Inventory Items
  const filteredItems = inventory.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const name = String(item.ingredientName || '').toLowerCase();
    const code = String(item.itemCode || '').toLowerCase();
    const category = String(item.category || '').toLowerCase();

    const matchesSearch = !q || name.includes(q) || code.includes(q) || category.includes(q);

    let matchesStatus = true;
    if (statusFilter === 'LOW_STOCK') {
      matchesStatus = Number(item.availableQuantity) <= Number(item.reorderLevel);
    } else if (statusFilter === 'IN_STOCK') {
      matchesStatus = Number(item.availableQuantity) > Number(item.reorderLevel);
    }

    return matchesSearch && matchesStatus;
  });

  // Filter History Requisitions
  const filteredRequisitions = stockRequests.filter((req) => {
    if (historyStatusFilter === 'ALL') return true;
    if (historyStatusFilter === 'PENDING') return req.status === 'Pending Review';
    if (historyStatusFilter === 'APPROVED') return req.status === 'Approved' || req.status === 'Dispatched';
    if (historyStatusFilter === 'FULFILLED') return req.status === 'Fulfilled';
    if (historyStatusFilter === 'REJECTED') return req.status === 'Rejected';
    return true;
  });

  // Helper for Status Badge in History Table
  const getHistoryStatusBadge = (status) => {
    switch (status) {
      case 'Fulfilled':
        return {
          bg: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          border: 'var(--color-success-border)',
          label: '✓ Delivered & Received',
          icon: ShieldCheck
        };
      case 'Dispatched':
        return {
          bg: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          border: 'var(--color-primary-border)',
          label: '🚚 In Transit / Dispatched',
          icon: Truck
        };
      case 'Approved':
        return {
          bg: '#f0fdf4',
          color: '#16a34a',
          border: '#bbf7d0',
          label: '✓ Approved by Admin',
          icon: CheckCircle2
        };
      case 'Rejected':
        return {
          bg: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          border: 'var(--color-danger-border)',
          label: '✕ Rejected',
          icon: AlertCircle
        };
      default:
        return {
          bg: 'var(--color-warning-bg)',
          color: 'var(--color-warning)',
          border: 'var(--color-warning-border)',
          label: '⏳ Pending Admin Review',
          icon: Clock
        };
    }
  };

  // Header Title & Description dynamic per active view
  const getHeaderInfo = () => {
    if (activeView === 'request') {
      return {
        title: 'Request Raw Materials & Stock from Admin',
        description: `Outlet: ${STAFF_APP_CONFIG.canteenOutlet} • Submit an official replenishment requisition to Campus Admin`
      };
    }
    if (activeView === 'history') {
      return {
        title: 'Admin Stock Requisitions Ledger',
        description: `Outlet: ${STAFF_APP_CONFIG.canteenOutlet} • Historical record and delivery tracking of stock requests`
      };
    }
    return {
      title: 'Canteen Inventory & Raw Materials',
      description: `Outlet: ${STAFF_APP_CONFIG.canteenOutlet} • Real-time ingredient stock and safety reorder thresholds`
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header with Request Stock & Request History Actions */}
      <PageHeader
        title={headerInfo.title}
        description={headerInfo.description}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* BUTTON 1: REQUEST STOCK */}
            <button
              type="button"
              onClick={() => {
                setActiveView('request');
                setRequestSuccess(null);
                setRequestError('');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 16px',
                height: '36px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: activeView === 'request' ? 'var(--color-primary-dark, #1e40af)' : 'var(--color-primary)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all var(--transition-fast)'
              }}
              title="Submit a stock requisition to Central Admin"
            >
              <Send size={14} />
              <span>Request Stock</span>
            </button>

            {/* BUTTON 2: REQUEST HISTORY */}
            <button
              type="button"
              onClick={() => setActiveView('history')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 16px',
                height: '36px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: activeView === 'history' ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                border: activeView === 'history' ? '1.5px solid var(--color-primary)' : '1px solid var(--border-color)',
                color: activeView === 'history' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all var(--transition-fast)'
              }}
              title="View historical stock requests and delivery status"
            >
              <History size={14} />
              <span>Request History</span>
            </button>
          </div>
        }
      />

      {/* Sub-view Back to Inventory Bar (Displayed when on Request Stock or History View) */}
      {activeView !== 'inventory' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)',
          padding: '10px 16px',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <button
            type="button"
            onClick={() => setActiveView('inventory')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--color-primary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Inventory Management</span>
          </button>

          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Viewing {activeView === 'request' ? 'Stock Requisition Form' : 'Requisitions Ledger'}
          </span>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 1: MAIN INVENTORY MANAGEMENT TABLE                  */}
      {/* ======================================================== */}
      {activeView === 'inventory' && (
        <>
          {/* Filter / Search Bar */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              padding: '6px 12px',
              border: '1px solid var(--border-color)',
              width: '320px'
            }}>
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search ingredient, item code or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '13px',
                  width: '100%',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
              {[
                { id: 'ALL', label: `All (${inventory.length})` },
                { id: 'LOW_STOCK', label: `Low Stock (${lowStockItems.length})` },
                { id: 'IN_STOCK', label: 'In Stock' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid',
                    borderColor: statusFilter === tab.id ? 'var(--color-primary)' : 'var(--border-color)',
                    backgroundColor: statusFilter === tab.id ? 'var(--color-primary-light)' : 'var(--bg-app)',
                    color: statusFilter === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Table */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    <th style={{ padding: '12px 16px' }}>Item Code</th>
                    <th style={{ padding: '12px 16px' }}>Ingredient Name</th>
                    <th style={{ padding: '12px 16px' }}>Available Qty</th>
                    <th style={{ padding: '12px 16px' }}>Reorder Point</th>
                    <th style={{ padding: '12px 16px' }}>Batch No.</th>
                    <th style={{ padding: '12px 16px' }}>Expiry Date</th>
                    <th style={{ padding: '12px 16px' }}>Stock Health</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No inventory items match your search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => {
                      const isLow = Number(item.availableQuantity) <= Number(item.reorderLevel);
                      const isOut = Number(item.availableQuantity) <= 0;

                      return (
                        <tr
                          key={item.id || idx}
                          style={{
                            borderBottom: '1px solid var(--border-color-subtle)',
                            backgroundColor: isOut ? 'var(--color-danger-bg)' : isLow ? 'var(--color-warning-bg)' : 'var(--bg-surface)'
                          }}
                        >
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>
                            {item.itemCode || 'ING-001'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <Link
                              to={`/staff/inventory/${item.id || item.itemCode}`}
                              style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}
                            >
                              {item.ingredientName}
                            </Link>
                            {item.category && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.category}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: isLow ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                            {item.availableQuantity} {item.unit}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                            {item.reorderLevel} {item.unit}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                            {item.batchNumber || 'B-MAIN-01'}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                            {item.expiryDate || 'N/A'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: isOut ? 'var(--color-danger-bg)' : isLow ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                              color: isOut ? 'var(--color-danger)' : isLow ? 'var(--color-warning)' : 'var(--color-success)',
                              border: '1px solid var(--border-color)'
                            }}>
                              {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenReorder(item)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 'var(--border-radius-sm)',
                                  backgroundColor: isLow ? 'var(--color-danger)' : 'var(--color-primary-light)',
                                  color: isLow ? '#ffffff' : 'var(--color-primary)',
                                  border: 'none',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Reorder
                              </button>
                              <Link
                                to={`/staff/inventory/${item.id || item.itemCode}`}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 'var(--border-radius-sm)',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: 'var(--bg-app)',
                                  color: 'var(--text-secondary)',
                                  textDecoration: 'none',
                                  fontSize: '11.5px',
                                  fontWeight: 600
                                }}
                              >
                                Details
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: DIRECT REQUEST STOCK FORM                       */}
      {/* ======================================================== */}
      {activeView === 'request' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
          {/* Success Banner */}
          {requestSuccess && (
            <div style={{
              backgroundColor: 'var(--color-success-bg)',
              borderRadius: 'var(--border-radius-lg)',
              border: '1px solid var(--color-success-border)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-success)' }}>
                <CheckCircle2 size={22} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '14px' }}>Stock Requisition #{requestSuccess.id} Submitted to Admin!</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Your request for <strong>{requestSuccess.requestedQuantity} {requestSuccess.unit} of {requestSuccess.itemName}</strong> has been queued for Admin review.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setActiveView('history')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--color-success)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span>Track in Request History</span>
                  <ArrowRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequestSuccess(null);
                    setItemName('');
                    setQuantity('');
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + Submit Another Request
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('inventory')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ← Return to Inventory Table
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {requestError && (
            <div style={{
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              border: '1px solid var(--color-danger-border)',
              padding: '12px 16px',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{requestError}</span>
            </div>
          )}

          {/* Main Request Form Card */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px'
          }}>
            <form onSubmit={handleSubmitStockRequest} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Outlet Info Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                <Building size={16} style={{ color: 'var(--color-primary)' }} />
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Requesting for: <strong>{STAFF_APP_CONFIG.canteenOutlet}</strong> • Destination: <strong>Central Canteen Admin</strong>
                </div>
              </div>

              {/* Item Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Select Ingredient or Stock Item <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <select
                    onChange={handleItemSelect}
                    value={inventory.some(i => i.ingredientName === itemName) ? itemName : ''}
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '1.5px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Choose from existing canteen raw materials --</option>
                    {inventory.map((inv) => (
                      <option key={inv.id || inv.itemCode} value={inv.ingredientName}>
                        {inv.ingredientName} ({inv.availableQuantity} {inv.unit} in stock - Reorder: {inv.reorderLevel} {inv.unit})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Or type custom item name..."
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '1.5px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Quantity and Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Requested Quantity <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 25"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '1.5px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Measurement Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '1.5px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="litres">litres (Liquid)</option>
                    <option value="packets">packets (Packs)</option>
                    <option value="boxes">boxes (Cartons)</option>
                    <option value="tubs">tubs</option>
                    <option value="trays">trays</option>
                    <option value="cans">cans</option>
                    <option value="units">units (Pieces)</option>
                  </select>
                </div>
              </div>

              {/* Urgency and Required Date */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Urgency Level
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '1.5px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Low">Low (Buffer Stock)</option>
                    <option value="Normal">Normal (Routine Replenishment)</option>
                    <option value="High">High (Impending Stockout)</option>
                    <option value="Emergency">Emergency (Immediate Requirement)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Required By Date
                  </label>
                  <input
                    type="date"
                    value={requiredByDate}
                    onChange={(e) => setRequiredByDate(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '1.5px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Kitchen Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Kitchen Notes & Reason for Requisition
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify recipe requirements, preferred brand, or expected demand spike..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1.5px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveView('inventory')}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 22px',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'wait' : 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <Send size={14} />
                  <span>{isSubmitting ? 'Submitting to Admin...' : 'Submit Requisition to Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: DIRECT REQUEST HISTORY TABLE                    */}
      {/* ======================================================== */}
      {activeView === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {historySuccessToast && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              fontSize: '13px',
              fontWeight: 700,
              border: '1px solid var(--color-success-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} />
              <span>{historySuccessToast}</span>
            </div>
          )}

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `All Requests (${stockRequests.length})` },
                { id: 'PENDING', label: `Pending (${stockRequests.filter(r => r.status === 'Pending Review').length})` },
                { id: 'APPROVED', label: `Approved / Transit (${stockRequests.filter(r => r.status === 'Approved' || r.status === 'Dispatched').length})` },
                { id: 'FULFILLED', label: `Fulfilled (${stockRequests.filter(r => r.status === 'Fulfilled').length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHistoryStatusFilter(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid',
                    borderColor: historyStatusFilter === tab.id ? 'var(--color-primary)' : 'var(--border-color)',
                    backgroundColor: historyStatusFilter === tab.id ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                    color: historyStatusFilter === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Requisitions Table */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    <th style={{ padding: '12px 16px' }}>Req ID</th>
                    <th style={{ padding: '12px 16px' }}>Requested Item</th>
                    <th style={{ padding: '12px 16px' }}>Qty & Unit</th>
                    <th style={{ padding: '12px 16px' }}>Urgency</th>
                    <th style={{ padding: '12px 16px' }}>Admin Status</th>
                    <th style={{ padding: '12px 16px' }}>Admin Notes / Details</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequisitions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <Package size={28} style={{ color: 'var(--text-muted)' }} />
                          <span>No stock requisitions found matching this status filter.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRequisitions.map((req) => {
                      const badge = getHistoryStatusBadge(req.status);
                      const isPending = req.status === 'Pending Review';
                      const isApproved = req.status === 'Approved' || req.status === 'Dispatched';
                      const isFulfilled = req.status === 'Fulfilled';

                      return (
                        <tr
                          key={req.id}
                          style={{
                            borderBottom: '1px solid var(--border-color-subtle)',
                            backgroundColor: 'var(--bg-surface)'
                          }}
                        >
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {req.id}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{req.itemName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.category || 'Kitchen Supplies'}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {req.requestedQuantity} {req.unit}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: req.urgency === 'Emergency' ? 'var(--color-danger-bg)' : req.urgency === 'High' ? 'var(--color-warning-bg)' : 'var(--bg-app)',
                              color: req.urgency === 'Emergency' ? 'var(--color-danger)' : req.urgency === 'High' ? 'var(--color-warning)' : 'var(--text-secondary)',
                              border: '1px solid var(--border-color)'
                            }}>
                              {req.urgency}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`
                            }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px', maxWidth: '240px' }}>
                            {req.adminNotes || req.notes || 'Requisition submitted for approval.'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '8px'
                            }}>
                              {isApproved && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkReceived(req.id)}
                                  style={{
                                    padding: '5px 12px',
                                    borderRadius: 'var(--border-radius-sm)',
                                    backgroundColor: 'var(--color-success)',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Mark Received
                                </button>
                              )}
                              {isFulfilled && (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: 'var(--color-success)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}>
                                  <CheckCircle2 size={12} />
                                  Received
                                </span>
                              )}
                              {isPending && (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  Awaiting Admin
                                </span>
                              )}
                              <button
                                type="button"
                                title={`Delete ${req.id}`}
                                onClick={() => handleDeleteRequest(req.id)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  borderRadius: 'var(--border-radius-sm)',
                                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                  color: 'var(--color-danger, #ef4444)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffInventoryPage;
