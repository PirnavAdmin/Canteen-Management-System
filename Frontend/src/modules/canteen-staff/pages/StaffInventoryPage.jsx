import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  BookOpen,
  Send,
  Truck,
  Search,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  ArrowDownUp,
  Store,
  ChefHat,
  RefreshCw,
  SlidersHorizontal,
  RotateCcw,
  Boxes,
  Check,
  XCircle,
  Calendar,
  Utensils,
  History,
  Sparkles,
  X
} from 'lucide-react';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { useStaffOutlet } from '../hooks/useStaffOutlet';
import { STAFF_APP_CONFIG } from '../constants/staffNavigation';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';
import { StatCard } from '../../../components/common/StatCard';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Pagination } from '../../../components/common/Pagination';
import { EmptyState } from '../../../components/common/EmptyState';
import { formatDate, formatNumber, isSameIstDate, isWithinDaysIST } from '../../../utils/formatters';
import { ConfirmReceiptModal } from '../components/ConfirmReceiptModal';
import { LogKitchenUsageModal } from '../components/LogKitchenUsageModal';
import { SearchableIngredientSelect } from '../components/SearchableIngredientSelect';

const INGREDIENT_CATEGORIES = [
  'Vegetables',
  'Groceries',
  'Dairy',
  'Spices',
  'Beverages',
  'Grains',
  'Fruits',
  'Oils',
  'Bakery',
  'Packaging',
  'General Kitchen Supplies'
];

export const StaffInventoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Outlet Context & Management
  const {
    outlets,
    selectedOutlet,
    activeOutletName,
    activeCampusName,
    changeOutlet,
    isStaffRestricted
  } = useStaffOutlet();

  // 2. Kitchen Inventory & Operations Hook
  const {
    kitchenStock,
    kitchenLedger,
    incomingTransfers,
    stockRequests,
    loading,
    refreshInventory,
    createRequest,
    confirmReceipt,
    recordUsage,
    deleteRequest
  } = useStaffInventory(selectedOutlet);

  // 3. Tab State: 'stock' | 'history' | 'incoming' | 'ledger'
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab') || searchParams.get('view');
    if (tabParam === 'history' || tabParam === 'request') return 'history';
    if (tabParam === 'incoming') return 'incoming';
    if (tabParam === 'ledger') return 'ledger';
    return 'stock';
  });

  // Keep search params in sync with tab switches
  useEffect(() => {
    const tabParam = searchParams.get('tab') || searchParams.get('view');
    if ((tabParam === 'history' || tabParam === 'request') && activeTab !== 'history') setActiveTab('history');
    else if (tabParam === 'incoming' && activeTab !== 'incoming') setActiveTab('incoming');
    else if (tabParam === 'ledger' && activeTab !== 'ledger') setActiveTab('ledger');
  }, [searchParams, activeTab]);

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState({ isOpen: false, transfer: null });
  const [usageModal, setUsageModal] = useState({ isOpen: false, preselectedItem: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // TAB 1: MY KITCHEN STOCK (FILTERS & PAGINATION)
  // -------------------------------------------------------------
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');
  const [stockPage, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState(8);

  const stockCategories = useMemo(() => {
    const set = new Set();
    kitchenStock.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [kitchenStock]);

  const filteredStock = useMemo(() => {
    return kitchenStock.filter((item) => {
      const q = stockSearch.trim().toLowerCase();
      const name = String(item.ingredientName || '').toLowerCase();
      const code = String(item.itemCode || '').toLowerCase();
      const cat = String(item.category || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || code.includes(q) || cat.includes(q);
      const matchesCategory = stockCategoryFilter === 'ALL' || item.category === stockCategoryFilter;

      let matchesStatus = true;
      if (stockStatusFilter === 'In Stock') {
        matchesStatus = item.status === 'In Stock' && Number(item.availableQuantity) > Number(item.reorderLevel);
      } else if (stockStatusFilter === 'Low Stock') {
        matchesStatus = item.status === 'Low Stock' || (Number(item.availableQuantity) <= Number(item.reorderLevel) && Number(item.availableQuantity) > 0);
      } else if (stockStatusFilter === 'Out of Stock') {
        matchesStatus = item.status === 'Out of Stock' || Number(item.availableQuantity) <= 0;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [kitchenStock, stockSearch, stockCategoryFilter, stockStatusFilter]);

  const paginatedStock = useMemo(() => {
    const start = (stockPage - 1) * stockPageSize;
    return filteredStock.slice(start, start + stockPageSize);
  }, [filteredStock, stockPage, stockPageSize]);

  // Summary Metrics for Kitchen Stock
  const stockMetrics = useMemo(() => {
    const total = kitchenStock.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    kitchenStock.forEach((item) => {
      const q = Number(item.availableQuantity) || 0;
      const r = Number(item.reorderLevel) || 10;
      if (q <= 0 || item.status === 'Out of Stock') outOfStock++;
      else if (q <= r || item.status === 'Low Stock') lowStock++;
      else inStock++;
    });

    return { total, inStock, lowStock, outOfStock };
  }, [kitchenStock]);

  // -------------------------------------------------------------
  // TAB 2: REQUEST STOCK (FORM & SUBMISSIONS TABLE)
  // -------------------------------------------------------------
  // TAB 2: REQUEST HISTORY (AUDIT LOG & STATUS TRACKING)
  // -------------------------------------------------------------
  const [requestSearch, setRequestSearch] = useState('');
  const [requestFilterStatus, setRequestFilterStatus] = useState('ALL');
  const [requestPage, setRequestPage] = useState(1);
  const [requestPageSize, setRequestPageSize] = useState(8);

  // Requisition Form state (used by Request Stock Modal)
  const [requestItemName, setRequestItemName] = useState(() => searchParams.get('item') || '');
  const [requestCategory, setRequestCategory] = useState('General Kitchen Supplies');
  const [requestIsCustom, setRequestIsCustom] = useState(false);
  const [requestQuantity, setRequestQuantity] = useState('');
  const [requestUnit, setRequestUnit] = useState(() => searchParams.get('unit') || 'kg');
  const [requestPriority, setRequestPriority] = useState('Normal');
  const [requestNeededBy, setRequestNeededBy] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [requestReason, setRequestReason] = useState('Kitchen stock is running low.');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Pre-fill item if requested from query params or row click
  useEffect(() => {
    const queryItem = searchParams.get('item');
    const queryUnit = searchParams.get('unit');
    if (queryItem) {
      setRequestItemName(queryItem);
      if (queryUnit) setRequestUnit(queryUnit);
      setIsRequestModalOpen(true);
    }
  }, [searchParams]);

  const selectedStockItemObj = useMemo(() => {
    if (!requestItemName || requestIsCustom) return null;
    return kitchenStock.find(
      (i) => i.ingredientName.trim().toLowerCase() === requestItemName.trim().toLowerCase()
    );
  }, [kitchenStock, requestItemName, requestIsCustom]);

  const handleSelectIngredient = (selection) => {
    if (!selection || !selection.itemName) {
      setRequestItemName('');
      setRequestCategory('General Kitchen Supplies');
      setRequestIsCustom(false);
      return;
    }

    setRequestItemName(selection.itemName);
    setRequestCategory(selection.category || 'General Kitchen Supplies');
    setRequestUnit(selection.unit || 'kg');
    setRequestIsCustom(Boolean(selection.isCustom));

    if (selection.isCustom) {
      setRequestPriority('Normal');
      setRequestReason('Required for kitchen operations.');
    } else {
      if (Number(selection.availableQuantity) <= Number(selection.reorderLevel)) {
        setRequestPriority('Urgent');
        setRequestReason(`Kitchen stock low (${selection.availableQuantity} ${selection.unit || 'kg'} remaining). Reorder required.`);
      } else {
        setRequestPriority('Normal');
        setRequestReason('Kitchen stock replenishment.');
      }
    }
  };

  const handleQuickRequestFromStock = (item) => {
    setRequestItemName(item.ingredientName);
    setRequestCategory(item.category || 'General Kitchen Supplies');
    setRequestUnit(item.unit || 'kg');
    setRequestQuantity(String(item.reorderLevel || 10));
    setRequestPriority(Number(item.availableQuantity) <= Number(item.reorderLevel) ? 'Urgent' : 'Normal');
    setRequestIsCustom(false);
    setRequestReason(`Kitchen stock low (${item.availableQuantity} ${item.unit} remaining). Reorder required.`);
    setIsRequestModalOpen(true);
  };

  const handleSubmitStockRequest = async (e) => {
    e.preventDefault();
    if (!requestItemName.trim()) {
      showToast('error', 'Please choose or enter an ingredient name.');
      return;
    }
    const q = Number(requestQuantity);
    if (!requestQuantity || q <= 0) {
      showToast('error', 'Please enter a valid requested quantity greater than zero.');
      return;
    }

    try {
      setIsSubmittingRequest(true);
      const matched = kitchenStock.find(
        (i) => i.ingredientName.trim().toLowerCase() === requestItemName.trim().toLowerCase()
      );

      const created = await createRequest({
        ingredientId: (!requestIsCustom && matched?.id) ? matched.id : null,
        itemId: (!requestIsCustom && matched?.id) ? matched.id : null,
        itemName: requestItemName.trim(),
        itemCode: matched?.itemCode || (requestIsCustom ? 'ING-NEW-REQ' : 'ING-REQ'),
        category: requestCategory || matched?.category || 'General Kitchen Supplies',
        requestedQuantity: q,
        unit: requestUnit || matched?.unit || 'kg',
        urgency: requestPriority,
        requiredByDate: requestNeededBy,
        notes: requestReason.trim(),
        outletId: selectedOutlet,
        outletName: activeOutletName
      });

      showToast(
        'success',
        `Requisition #${created.id || 'REQ'} for "${requestItemName.trim()}" submitted to Central Warehouse! Status: PENDING.`
      );
      setIsRequestModalOpen(false);
      setRequestItemName('');
      setRequestCategory('General Kitchen Supplies');
      setRequestIsCustom(false);
      setRequestQuantity('');
      setRequestReason('Kitchen stock replenishment.');
    } catch (err) {
      showToast('error', err.message || 'Failed to submit stock requisition.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return stockRequests.filter((r) => {
      const q = requestSearch.trim().toLowerCase();
      const idStr = String(r.id || r.requestId || '').toLowerCase();
      const name = String(r.itemName || r.ingredientName || '').toLowerCase();
      const code = String(r.itemCode || '').toLowerCase();
      const matchesSearch = !q || idStr.includes(q) || name.includes(q) || code.includes(q);

      if (!matchesSearch) return false;
      if (requestFilterStatus === 'ALL') return true;

      const s = String(r.status || 'Pending').toUpperCase();
      if (requestFilterStatus === 'PENDING') return s.includes('PENDING') || s.includes('REQUESTED');
      if (requestFilterStatus === 'APPROVED') return s === 'APPROVED';
      if (requestFilterStatus === 'IN TRANSIT') return s.includes('TRANSIT') || s.includes('DISPATCH') || s.includes('ISSUED');
      if (requestFilterStatus === 'RECEIVED') return s.includes('RECEIVED');
      if (requestFilterStatus === 'COMPLETED') return s.includes('COMPLETED') || s.includes('RECEIVED');
      if (requestFilterStatus === 'REJECTED') return s.includes('REJECT') || s.includes('CANCEL');
      return s === requestFilterStatus;
    });
  }, [stockRequests, requestSearch, requestFilterStatus]);

  const paginatedRequests = useMemo(() => {
    const start = (requestPage - 1) * requestPageSize;
    return filteredRequests.slice(start, start + requestPageSize);
  }, [filteredRequests, requestPage, requestPageSize]);

  // -------------------------------------------------------------
  // TAB 3: INCOMING STOCK (DISPATCHED FROM ADMIN WAREHOUSE)
  // -------------------------------------------------------------
  const [incomingSearch, setIncomingSearch] = useState('');
  const [incomingStatusFilter, setIncomingStatusFilter] = useState('ALL');
  const [incomingPage, setIncomingPage] = useState(1);
  const [incomingPageSize, setIncomingPageSize] = useState(6);

  const filteredIncoming = useMemo(() => {
    return incomingTransfers.filter((trf) => {
      const q = incomingSearch.trim().toLowerCase();
      const name = String(trf.ingredientName || '').toLowerCase();
      const code = String(trf.transferId || trf.id || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || code.includes(q);

      let matchesStatus = true;
      if (incomingStatusFilter === 'Pending') {
        matchesStatus = trf.status === 'Dispatched' || trf.status === 'In Transit';
      } else if (incomingStatusFilter === 'Received') {
        matchesStatus = trf.status === 'Received' || trf.status === 'Partially Received';
      }

      return matchesSearch && matchesStatus;
    });
  }, [incomingTransfers, incomingSearch, incomingStatusFilter]);

  const paginatedIncoming = useMemo(() => {
    const start = (incomingPage - 1) * incomingPageSize;
    return filteredIncoming.slice(start, start + incomingPageSize);
  }, [filteredIncoming, incomingPage, incomingPageSize]);

  const pendingIncomingCount = useMemo(() => {
    return incomingTransfers.filter((t) => t.status === 'Dispatched' || t.status === 'In Transit').length;
  }, [incomingTransfers]);

  const handleOpenConfirmReceipt = (transfer) => {
    setReceiptModal({ isOpen: true, transfer });
  };

  const handleConfirmReceiptSubmit = async (payload) => {
    try {
      setActionLoading(true);
      await confirmReceipt(payload);
      showToast(
        'success',
        `Confirmed! +${payload.receivedQuantity} ${payload.unit} ${payload.ingredientName} added to ${activeOutletName} kitchen stock.`
      );
    } catch (err) {
      showToast('error', err.message || 'Error confirming receipt');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 4: STOCK LEDGER (AUDIT TRAIL)
  // -------------------------------------------------------------
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('ALL');
  const [ledgerDateFilter, setLedgerDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'WEEK' | 'MONTH'
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(8);

  const filteredLedger = useMemo(() => {
    return kitchenLedger.filter((entry) => {
      const q = ledgerSearch.trim().toLowerCase();
      const name = String(entry.ingredientName || '').toLowerCase();
      const ref = String(entry.reference || '').toLowerCase();
      const desc = String(entry.description || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || ref.includes(q) || desc.includes(q);
      const matchesType = ledgerTypeFilter === 'ALL' || entry.transactionType === ledgerTypeFilter;

      let matchesDate = true;
      if (ledgerDateFilter === 'TODAY') {
        matchesDate = isSameIstDate(entry.dateTime);
      } else if (ledgerDateFilter === 'WEEK') {
        matchesDate = isWithinDaysIST(entry.dateTime, 7) || isSameIstDate(entry.dateTime);
      } else if (ledgerDateFilter === 'MONTH') {
        matchesDate = isWithinDaysIST(entry.dateTime, 30) || isSameIstDate(entry.dateTime);
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [kitchenLedger, ledgerSearch, ledgerTypeFilter, ledgerDateFilter]);

  const paginatedLedger = useMemo(() => {
    const start = (ledgerPage - 1) * ledgerPageSize;
    return filteredLedger.slice(start, start + ledgerPageSize);
  }, [filteredLedger, ledgerPage, ledgerPageSize]);

  // Log usage submission
  const handleLogUsageSubmit = async (payload) => {
    try {
      setActionLoading(true);
      await recordUsage(payload);
      showToast(
        'success',
        `Recorded! -${payload.quantity} ${payload.ingredientName} deducted from ${activeOutletName} stock.`
      );
    } catch (err) {
      showToast('error', err.message || 'Error recording usage');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 110,
          padding: '12px 18px',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: toastMessage.type === 'error' ? '#ef4444' : '#059669',
          color: '#ffffff',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 600,
          animation: 'fadeIn 0.2s ease'
        }}>
          {toastMessage.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Page Header matching Admin Inventory UI Reference */}
      <PageHeader
        title="Kitchen Inventory & Stock Ledger"
        description="Trace raw ingredient stocks, requisitions to central warehouse, incoming stock transfers, and kitchen ledger movements."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={Utensils}
              onClick={() => setUsageModal({ isOpen: true, preselectedItem: null })}
            >
              Log Kitchen Usage
            </Button>
            <Button
              variant="primary"
              icon={Send}
              onClick={() => setIsRequestModalOpen(true)}
            >
              Request Stock
            </Button>
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={refreshInventory}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* 2. Four Main Tabs Navigation (Exact Admin UI Tab Style) */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        gap: '4px',
        overflowX: 'auto'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'stock' ? 600 : 500,
            color: activeTab === 'stock' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'stock' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <Package size={15} />
          <span>My Kitchen Stock</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'history' ? 600 : 500,
            color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'history' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <History size={15} />
          <span>Request History</span>
          {stockRequests.length > 0 && (
            <span style={{
              padding: '1px 7px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: activeTab === 'history' ? 'var(--color-primary)' : 'var(--bg-muted)',
              color: activeTab === 'history' ? '#ffffff' : 'var(--text-primary)'
            }}>
              {stockRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('incoming')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'incoming' ? 600 : 500,
            color: activeTab === 'incoming' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'incoming' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <Truck size={15} />
          <span>Incoming Stock</span>
          {pendingIncomingCount > 0 && (
            <span style={{
              padding: '1px 7px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: activeTab === 'incoming' ? 'var(--color-primary)' : '#d97706',
              color: '#ffffff'
            }}>
              {pendingIncomingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'ledger' ? 600 : 500,
            color: activeTab === 'ledger' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'ledger' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <BookOpen size={15} />
          <span>Stock Ledger</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: MY KITCHEN STOCK                                       */}
      {/* ============================================================= */}
      {activeTab === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary Metric Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <StatCard
              title="Total Ingredients"
              value={formatNumber(stockMetrics.total)}
              icon={Package}
              subtitle={`Active in ${activeOutletName}`}
              variant="default"
            />
            <StatCard
              title="Healthy Stock"
              value={formatNumber(stockMetrics.inStock)}
              icon={CheckCircle2}
              subtitle="Above reorder threshold"
              variant="success"
            />
            <StatCard
              title="Low Stock Warning"
              value={formatNumber(stockMetrics.lowStock)}
              icon={AlertTriangle}
              subtitle="Requisition recommended"
              variant="warning"
            />
            <StatCard
              title="Out of Stock"
              value={formatNumber(stockMetrics.outOfStock)}
              icon={XCircle}
              subtitle="Needs immediate replenishment"
              variant="danger"
            />
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  type="text"
                  value={stockSearch}
                  onChange={(e) => {
                    setStockSearch(e.target.value);
                    setStockPage(1);
                  }}
                  placeholder="Search ingredient by name or code..."
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 12px 0 34px',
                    fontSize: '13px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Category Filter */}
              <select
                value={stockCategoryFilter}
                onChange={(e) => {
                  setStockCategoryFilter(e.target.value);
                  setStockPage(1);
                }}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '12.5px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="ALL">All Categories</option>
                {stockCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={stockStatusFilter}
                onChange={(e) => {
                  setStockStatusFilter(e.target.value);
                  setStockPage(1);
                }}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '12.5px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(stockSearch || stockCategoryFilter !== 'ALL' || stockStatusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setStockSearch('');
                    setStockCategoryFilter('ALL');
                    setStockStatusFilter('ALL');
                    setStockPage(1);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Reset Filters</span>
                </button>
              )}
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Showing <strong>{filteredStock.length}</strong> ingredients
              </span>
            </div>
          </div>

          {/* Kitchen Stock Table */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{
                    backgroundColor: 'var(--bg-muted)',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    <th style={{ padding: '12px 16px' }}>Ingredient / Material</th>
                    <th style={{ padding: '12px 14px' }}>Category</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Available Stock</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Min Stock Level</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Stock Status</th>
                    <th style={{ padding: '12px 14px' }}>Last Movement</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStock.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center' }}>
                        <EmptyState
                          icon={Package}
                          title="No kitchen stock items match your search"
                          description="Adjust your search terms or filter options to locate ingredients."
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedStock.map((item) => {
                      const qty = Number(item.availableQuantity) || 0;
                      const reorder = Number(item.reorderLevel) || 10;
                      const isLow = qty <= reorder && qty > 0;
                      const isOut = qty <= 0;

                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: isOut
                              ? 'rgba(239, 68, 68, 0.03)'
                              : isLow
                                ? 'rgba(245, 158, 11, 0.03)'
                                : 'transparent'
                          }}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div>
                                <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                                  {item.ingredientName}
                                </strong>
                                <span style={{
                                  fontSize: '10.5px',
                                  color: 'var(--color-primary)',
                                  backgroundColor: 'var(--bg-muted)',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  fontWeight: 600
                                }}>
                                  {item.itemCode || `ING-${item.id}`}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '12px 14px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                            {item.category || 'General Supplies'}
                          </td>

                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <strong style={{
                              fontSize: '13.5px',
                              color: isOut ? '#dc2626' : isLow ? '#d97706' : 'var(--text-primary)'
                            }}>
                              {formatNumber(qty)} {item.unit}
                            </strong>
                          </td>

                          <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {formatNumber(reorder)} {item.unit}
                          </td>

                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            {isOut ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca'
                              }}>
                                <XCircle size={12} />
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#fffbeb',
                                color: '#d97706',
                                border: '1px solid #fde68a'
                              }}>
                                <AlertTriangle size={12} />
                                Low Stock
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0'
                              }}>
                                <CheckCircle2 size={12} />
                                In Stock
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '12px 14px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            {formatDate(item.lastUpdated || new Date())}
                          </td>

                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleQuickRequestFromStock(item)}
                                title="Request restock from Central Warehouse"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  borderRadius: 'var(--border-radius-sm)',
                                  backgroundColor: isLow || isOut ? 'var(--color-primary)' : 'var(--bg-app)',
                                  color: isLow || isOut ? '#ffffff' : 'var(--text-primary)',
                                  border: '1px solid var(--border-color)',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                <Send size={12} />
                                <span>Request</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setUsageModal({ isOpen: true, preselectedItem: item })}
                                title="Log kitchen usage or wastage deduction"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 8px',
                                  borderRadius: 'var(--border-radius-sm)',
                                  backgroundColor: 'var(--bg-app)',
                                  color: 'var(--text-secondary)',
                                  border: '1px solid var(--border-color)',
                                  fontSize: '11.5px',
                                  fontWeight: 500,
                                  cursor: 'pointer'
                                }}
                              >
                                <Utensils size={12} />
                                <span>Use</span>
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

            {/* Pagination */}
            {filteredStock.length > stockPageSize && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                <Pagination
                  currentPage={stockPage}
                  totalPages={Math.ceil(filteredStock.length / stockPageSize)}
                  onPageChange={setStockPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: REQUEST HISTORY                                        */}
      {/* ============================================================= */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Card with Controls */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: 'var(--bg-muted)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Stock Requisitions & History Log
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Track all replenishment requests sent to Central Admin Warehouse ({filteredRequests.length} total)
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--bg-app)',
                  padding: '6px 12px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                  width: '210px'
                }}>
                  <Search size={14} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by ID or Item..."
                    value={requestSearch}
                    onChange={(e) => {
                      setRequestSearch(e.target.value);
                      setRequestPage(1);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                      width: '100%'
                    }}
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={requestFilterStatus}
                  onChange={(e) => {
                    setRequestFilterStatus(e.target.value);
                    setRequestPage(1);
                  }}
                  style={{
                    height: '34px',
                    padding: '0 10px',
                    fontSize: '12px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="IN TRANSIT">In Transit / Dispatched</option>
                  <option value="RECEIVED">Received & Inwarded</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                {/* Request Stock Action Button */}
                <Button
                  variant="primary"
                  icon={PlusCircle}
                  onClick={() => setIsRequestModalOpen(true)}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  New Request
                </Button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '920px' }}>
                <thead>
                  <tr style={{
                    backgroundColor: 'var(--bg-muted)',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    <th style={{ padding: '10px 14px', width: '45px', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '10px 14px', width: '130px' }}>Request ID</th>
                    <th style={{ padding: '10px 14px' }}>Ingredient Name</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', width: '120px' }}>Requested Qty</th>
                    <th style={{ padding: '10px 14px', width: '150px' }}>Request Date</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '90px' }}>Priority</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '130px' }}>Admin Approval</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '130px' }}>Dispatch Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '140px' }}>Receipt Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '90px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '40px 16px', textAlign: 'center' }}>
                        <EmptyState
                          icon={History}
                          title="No stock requisitions found"
                          description="Click 'New Request' or the top 'Request Stock' button to submit an ingredient request to Central Warehouse."
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((req, idx) => {
                      const serial = (requestPage - 1) * requestPageSize + idx + 1;
                      const s = String(req.status || 'Pending').toUpperCase();

                      const isRejected = s.includes('REJECT') || s.includes('CANCEL');
                      const isPending = s.includes('PENDING') || s === 'REQUESTED';
                      const isApproved = s === 'APPROVED' || s.includes('TRANSIT') || s.includes('DISPATCH') || s.includes('ISSUED') || s.includes('RECEIVED') || s.includes('COMPLETED');
                      const isDispatched = s.includes('TRANSIT') || s.includes('DISPATCH') || s.includes('ISSUED') || s.includes('RECEIVED') || s.includes('COMPLETED');
                      const isReceived = s.includes('RECEIVED') || s.includes('COMPLETED');

                      return (
                        <tr
                          key={req.id || idx}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          {/* 1. Index */}
                          <td style={{ padding: '11px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11.5px', fontWeight: 600 }}>
                            {serial}
                          </td>

                          {/* 2. Request ID */}
                          <td style={{ padding: '11px 14px' }}>
                            <code style={{
                              backgroundColor: 'var(--bg-muted)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: 'var(--color-primary)'
                            }}>
                              REQ-{req.id || req.requestId}
                            </code>
                          </td>

                          {/* 3. Ingredient Name */}
                          <td style={{ padding: '11px 14px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                              {req.itemName || req.ingredientName}
                            </strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                              {req.category || 'Kitchen Supplies'}
                              {req.notes ? ` • Note: ${req.notes}` : ''}
                            </div>
                          </td>

                          {/* 4. Requested Quantity */}
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--color-primary)' }}>
                              {req.requestedQuantity} {req.unit || 'kg'}
                            </strong>
                            {req.issuedQuantity && req.issuedQuantity !== req.requestedQuantity && (
                              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                                Approved: {req.issuedQuantity} {req.unit || 'kg'}
                              </div>
                            )}
                          </td>

                          {/* 5. Request Date */}
                          <td style={{ padding: '11px 14px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            <div>Sent: {formatDate(req.createdAt || new Date())}</div>
                            {req.requiredByDate && (
                              <div style={{ color: 'var(--text-muted)', fontSize: '10.5px', marginTop: '2px' }}>
                                Needed: {formatDate(req.requiredByDate)}
                              </div>
                            )}
                          </td>

                          {/* 6. Priority */}
                          <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              backgroundColor: req.urgency === 'Urgent' ? '#fee2e2' : 'var(--bg-muted)',
                              color: req.urgency === 'Urgent' ? '#b91c1c' : 'var(--text-secondary)'
                            }}>
                              {req.urgency === 'Urgent' ? '🚨 Urgent' : (req.urgency || 'Normal')}
                            </span>
                          </td>

                          {/* 7. Admin Approval Status */}
                          <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                            {isRejected ? (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#dc2626',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}>
                                REJECTED
                              </span>
                            ) : isApproved ? (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#059669',
                                backgroundColor: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}>
                                APPROVED
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#b45309',
                                backgroundColor: '#fef3c7',
                                border: '1px solid #fde68a',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}>
                                PENDING
                              </span>
                            )}
                          </td>

                          {/* 8. Dispatch Status */}
                          <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                            {isReceived ? (
                              <div>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#059669',
                                  backgroundColor: '#ecfdf5',
                                  border: '1px solid #a7f3d0',
                                  padding: '2px 8px',
                                  borderRadius: '4px'
                                }}>
                                  DISPATCHED
                                </span>
                                {req.transferId && (
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {req.transferId}
                                  </div>
                                )}
                              </div>
                            ) : isDispatched ? (
                              <div>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#2563eb',
                                  backgroundColor: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  padding: '2px 8px',
                                  borderRadius: '4px'
                                }}>
                                  IN TRANSIT
                                </span>
                                {req.transferId && (
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {req.transferId}
                                  </div>
                                )}
                              </div>
                            ) : isRejected ? (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            ) : (
                              <span style={{
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                backgroundColor: 'var(--bg-muted)',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}>
                                NOT DISPATCHED
                              </span>
                            )}
                          </td>

                          {/* 9. Receipt Status */}
                          <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                            {isReceived ? (
                              <div>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#059669',
                                  backgroundColor: '#ecfdf5',
                                  border: '1px solid #a7f3d0',
                                  padding: '2px 8px',
                                  borderRadius: '4px'
                                }}>
                                  <CheckCircle2 size={11} />
                                  RECEIVED
                                </span>
                                {req.actualReceivedQuantity && (
                                  <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                                    +{req.actualReceivedQuantity} {req.unit || 'kg'}
                                  </div>
                                )}
                              </div>
                            ) : isDispatched ? (
                              <button
                                type="button"
                                onClick={() => setActiveTab('incoming')}
                                title="Click to view in Incoming Stock tab and confirm receipt"
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#2563eb',
                                  backgroundColor: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Truck size={11} />
                                <span>Awaiting Arrival</span>
                              </button>
                            ) : isRejected ? (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            ) : (
                              <span style={{
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                backgroundColor: 'var(--bg-muted)',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}>
                                PENDING
                              </span>
                            )}
                          </td>

                          {/* 10. Actions */}
                          <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                            {isDispatched && !isReceived && (
                              <button
                                type="button"
                                onClick={() => setActiveTab('incoming')}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 'var(--border-radius-sm)',
                                  backgroundColor: 'var(--color-primary-light)',
                                  color: 'var(--color-primary)',
                                  border: 'none',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Inward Stock →
                              </button>
                            )}
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => deleteRequest(req.id)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 'var(--border-radius-sm)',
                                  backgroundColor: 'var(--bg-app)',
                                  color: 'var(--text-muted)',
                                  border: '1px solid var(--border-color)',
                                  fontSize: '11px',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                            )}
                            {isReceived && (
                              <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>
                                Completed ✓
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Request History */}
            {filteredRequests.length > 0 && (
              <Pagination
                currentPage={requestPage}
                totalItems={filteredRequests.length}
                pageSize={requestPageSize}
                onPageChange={setRequestPage}
                onPageSizeChange={(newSize) => {
                  setRequestPageSize(newSize);
                  setRequestPage(1);
                }}
                pageSizeOptions={[5, 8, 15, 20]}
              />
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: INCOMING STOCK                                         */}
      {/* ============================================================= */}
      {activeTab === 'incoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Informational Guidance Alert */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--color-primary-light)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Truck size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <div style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
              <strong>Central Warehouse Deliveries:</strong> When supplies arrive from Admin logistics, click{' '}
              <strong>"Confirm Received"</strong> to verify actual quantities. Your local kitchen stock increases only upon receipt confirmation.
            </div>
          </div>

          {/* Search & Filters */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={14} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                value={incomingSearch}
                onChange={(e) => {
                  setIncomingSearch(e.target.value);
                  setIncomingPage(1);
                }}
                placeholder="Search delivery by transfer ID or item name..."
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 12px 0 34px',
                  fontSize: '13px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={incomingStatusFilter}
                onChange={(e) => {
                  setIncomingStatusFilter(e.target.value);
                  setIncomingPage(1);
                }}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '12.5px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="ALL">All Delivery Statuses</option>
                <option value="Pending">Awaiting Receipt (Dispatched)</option>
                <option value="Received">Confirmed Received</option>
              </select>

              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong>{filteredIncoming.length}</strong> incoming transfers
              </span>
            </div>
          </div>

          {/* Incoming Deliveries Table */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{
                    backgroundColor: 'var(--bg-muted)',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    <th style={{ padding: '12px 16px' }}>Transfer ID</th>
                    <th style={{ padding: '12px 14px' }}>Ingredient Delivered</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Dispatched Qty</th>
                    <th style={{ padding: '12px 14px' }}>Dispatch Date & Courier</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Delivery Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedIncoming.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>
                        <EmptyState
                          icon={Truck}
                          title="No incoming deliveries for this kitchen"
                          description="When Central Warehouse approves and dispatches your stock requests, they will appear here for receipt confirmation."
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedIncoming.map((trf) => {
                      const isReceived = trf.status === 'Received' || trf.status === 'Partially Received';

                      return (
                        <tr key={trf.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <code style={{
                              backgroundColor: 'var(--bg-muted)',
                              padding: '3px 7px',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: 'var(--color-primary)'
                            }}>
                              {trf.transferId || `TRF-${trf.id}`}
                            </code>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Ref: {trf.requestId || 'REQ-CENTRAL'}
                            </div>
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)', display: 'block' }}>
                              {trf.ingredientName}
                            </strong>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                              {trf.category || 'General Ingredients'}
                            </span>
                          </td>

                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <strong style={{ fontSize: '14px', color: 'var(--color-primary)' }}>
                              {trf.dispatchedQuantity || trf.approvedQuantity} {trf.unit}
                            </strong>
                            {trf.receivedQuantity && (
                              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                                Received: {trf.receivedQuantity} {trf.unit}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '12px 14px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            <div>{formatDate(trf.dispatchDate || new Date())}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {trf.dispatchedBy || 'Admin Warehouse Staff'}
                            </div>
                          </td>

                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            {isReceived ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0'
                              }}>
                                <CheckCircle2 size={12} />
                                {trf.status}
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe'
                              }}>
                                <Truck size={12} />
                                In Transit
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {!isReceived ? (
                              <Button
                                variant="primary"
                                icon={CheckCircle2}
                                onClick={() => handleOpenConfirmReceipt(trf)}
                              >
                                Confirm Received
                              </Button>
                            ) : (
                              <span style={{
                                fontSize: '11.5px',
                                color: 'var(--text-muted)',
                                fontWeight: 500
                              }}>
                                Inwarded to Kitchen
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredIncoming.length > incomingPageSize && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                <Pagination
                  currentPage={incomingPage}
                  totalPages={Math.ceil(filteredIncoming.length / incomingPageSize)}
                  onPageChange={setIncomingPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: STOCK LEDGER                                           */}
      {/* ============================================================= */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search & Filters Toolbar */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  type="text"
                  value={ledgerSearch}
                  onChange={(e) => {
                    setLedgerSearch(e.target.value);
                    setLedgerPage(1);
                  }}
                  placeholder="Search ledger by ingredient or reference ID..."
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 12px 0 34px',
                    fontSize: '13px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Transaction Type Filter */}
              <select
                value={ledgerTypeFilter}
                onChange={(e) => {
                  setLedgerTypeFilter(e.target.value);
                  setLedgerPage(1);
                }}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '12.5px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="ALL">All Transaction Types</option>
                <option value="OPENING STOCK">Opening Stock</option>
                <option value="RECEIVED FROM ADMIN">Received from Admin</option>
                <option value="KITCHEN CONSUMPTION">Kitchen Consumption</option>
                <option value="WASTAGE">Wastage / Spoilage</option>
                <option value="STOCK ADJUSTMENT">Stock Adjustment</option>
              </select>

              {/* Date Filter */}
              <select
                value={ledgerDateFilter}
                onChange={(e) => {
                  setLedgerDateFilter(e.target.value);
                  setLedgerPage(1);
                }}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '12.5px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="ALL">All Dates</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">Last 7 Days</option>
                <option value="MONTH">Last 30 Days</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="secondary"
                icon={Utensils}
                onClick={() => setUsageModal({ isOpen: true, preselectedItem: null })}
              >
                Log Kitchen Usage
              </Button>
            </div>
          </div>

          {/* Kitchen Stock Ledger Table */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{
                    backgroundColor: 'var(--bg-muted)',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    <th style={{ padding: '12px 16px' }}>Date & Time</th>
                    <th style={{ padding: '12px 14px' }}>Reference</th>
                    <th style={{ padding: '12px 14px' }}>Ingredient</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Transaction Type</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Quantity</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Balance Change</th>
                    <th style={{ padding: '12px 16px' }}>Operator & Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLedger.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center' }}>
                        <EmptyState
                          icon={BookOpen}
                          title="No ledger transactions found"
                          description="Stock receipts, consumption usages, and kitchen adjustments will appear here."
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedLedger.map((entry) => {
                      const isPositive = Number(entry.quantity) > 0;
                      const isConsumption = entry.transactionType === 'KITCHEN CONSUMPTION';
                      const isWaste = entry.transactionType === 'WASTAGE';
                      const isReceived = entry.transactionType === 'RECEIVED FROM ADMIN';

                      return (
                        <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {formatDate(entry.dateTime || new Date())}
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <code style={{
                              backgroundColor: 'var(--bg-muted)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'var(--color-primary)'
                            }}>
                              {entry.reference}
                            </code>
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                              {entry.ingredientName}
                            </strong>
                          </td>

                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              backgroundColor: isReceived
                                ? '#ecfdf5'
                                : isConsumption
                                  ? '#eff6ff'
                                  : isWaste
                                    ? '#fef2f2'
                                    : 'var(--bg-muted)',
                              color: isReceived
                                ? '#059669'
                                : isConsumption
                                  ? '#2563eb'
                                  : isWaste
                                    ? '#dc2626'
                                    : 'var(--text-primary)',
                              border: isReceived
                                ? '1px solid #a7f3d0'
                                : isConsumption
                                  ? '1px solid #bfdbfe'
                                  : isWaste
                                    ? '1px solid #fecaca'
                                    : '1px solid var(--border-color)'
                            }}>
                              {entry.transactionType}
                            </span>
                          </td>

                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <strong style={{
                              fontSize: '13px',
                              color: isPositive ? '#059669' : '#dc2626'
                            }}>
                              {isPositive ? `+${entry.quantity}` : entry.quantity} {entry.unit}
                            </strong>
                          </td>

                          <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span>{entry.previousStock}</span>
                            <span style={{ margin: '0 4px' }}>→</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{entry.newStock} {entry.unit}</strong>
                          </td>

                          <td style={{ padding: '12px 16px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {entry.performedBy}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '1px' }}>
                              {entry.description}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredLedger.length > ledgerPageSize && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                <Pagination
                  currentPage={ledgerPage}
                  totalPages={Math.ceil(filteredLedger.length / ledgerPageSize)}
                  onPageChange={setLedgerPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requisition Modal (Triggered by Top Request Stock Button & Quick Request) */}
      {isRequestModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(3px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRequestModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-app)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(14, 165, 233, 0.12)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Send size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Request Stock from Central Admin
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                    {activeOutletName} • Requisition will be reviewed and dispatched by Admin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                title="Close dialog"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitStockRequest} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Field 1: Searchable Kitchen Ingredient Selector */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Ingredient Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    {requestIsCustom && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#ea580c',
                        backgroundColor: 'rgba(234, 88, 12, 0.1)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Sparkles size={11} /> New Custom Ingredient
                      </span>
                    )}
                  </div>
                  <SearchableIngredientSelect
                    value={requestItemName}
                    onSelect={handleSelectIngredient}
                    kitchenStock={kitchenStock}
                    disabled={isSubmittingRequest}
                    placeholder="Search kitchen ingredient (e.g. Rice, Sugar, Green Chillies)..."
                  />
                </div>

                {/* Field 1b: If Custom Ingredient, Show Informative Card & Category Dropdown */}
                {requestIsCustom ? (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(234, 88, 12, 0.06)',
                    border: '1px solid rgba(234, 88, 12, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Sparkles size={16} style={{ color: '#ea580c', marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c' }}>
                          Special Requisition: "{requestItemName}"
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          This ingredient does not exist in your kitchen inventory. Central Admin will review, source, and dispatch it. Once received, it will automatically initialize in your kitchen inventory.
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                        Ingredient Category <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        value={requestCategory}
                        onChange={(e) => setRequestCategory(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-primary)',
                          fontSize: '12.5px',
                          outline: 'none'
                        }}
                      >
                        {INGREDIENT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : selectedStockItemObj ? (
                  /* Field 2: Current Kitchen Stock Balance Indicator */
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-muted)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px'
                    }}
                  >
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Current Kitchen Balance
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {selectedStockItemObj.availableQuantity} {selectedStockItemObj.unit}
                        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '6px' }}>
                          (Min Level: {selectedStockItemObj.reorderLevel} {selectedStockItemObj.unit})
                        </span>
                      </div>
                    </div>
                    <div>
                      {Number(selectedStockItemObj.availableQuantity) <= Number(selectedStockItemObj.reorderLevel) ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca'
                        }}>
                          <AlertTriangle size={12} /> Low Stock Alert
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0'
                        }}>
                          <CheckCircle2 size={12} /> Stock Adequate
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Fields 3 & 4: Requested Quantity & Unit */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Requested Quantity <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      placeholder="e.g. 25"
                      value={requestQuantity}
                      onChange={(e) => setRequestQuantity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Unit <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={requestUnit}
                      onChange={(e) => setRequestUnit(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      <option value="kg">kg (Kilograms)</option>
                      <option value="g">g (Grams)</option>
                      <option value="litre">litre (Litres)</option>
                      <option value="ml">ml (Millilitres)</option>
                      <option value="pieces">pieces (Pcs)</option>
                      <option value="packets">packets (Packets)</option>
                      <option value="boxes">boxes (Boxes)</option>
                      <option value="bags">bags (Bags)</option>
                      <option value="cans">cans (Cans)</option>
                    </select>
                  </div>
                </div>

                {/* Fields 5 & 6: Priority & Required By Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Priority Level
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setRequestPriority('Normal')}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: requestPriority === 'Normal' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                          backgroundColor: requestPriority === 'Normal' ? 'rgba(14, 165, 233, 0.12)' : 'var(--bg-app)',
                          color: requestPriority === 'Normal' ? 'var(--color-primary)' : 'var(--text-secondary)'
                        }}
                      >
                        Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => setRequestPriority('Urgent')}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: requestPriority === 'Urgent' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                          backgroundColor: requestPriority === 'Urgent' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-app)',
                          color: requestPriority === 'Urgent' ? '#ef4444' : 'var(--text-secondary)'
                        }}
                      >
                        🚨 Urgent
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Required Date
                    </label>
                    <input
                      type="date"
                      value={requestNeededBy}
                      onChange={(e) => setRequestNeededBy(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Field 7: Reason / Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Requisition Reason / Operational Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about expected usage or reason for request..."
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  backgroundColor: 'var(--bg-app)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  disabled={isSubmittingRequest}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
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
                  disabled={isSubmittingRequest || !requestItemName}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: (isSubmittingRequest || !requestItemName) ? 'not-allowed' : 'pointer',
                    opacity: (isSubmittingRequest || !requestItemName) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={14} />
                  <span>{isSubmittingRequest ? 'Submitting Requisition...' : 'Submit Request to Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Receipt Modal (Tab 3) */}
      <ConfirmReceiptModal
        isOpen={receiptModal.isOpen}
        transfer={receiptModal.transfer}
        onClose={() => setReceiptModal({ isOpen: false, transfer: null })}
        onConfirm={handleConfirmReceiptSubmit}
        loading={actionLoading}
      />

      {/* Log Kitchen Usage Modal (Tabs 1 & 4) */}
      <LogKitchenUsageModal
        isOpen={usageModal.isOpen}
        preselectedItem={usageModal.preselectedItem}
        kitchenStock={kitchenStock}
        onClose={() => setUsageModal({ isOpen: false, preselectedItem: null })}
        onLogUsage={handleLogUsageSubmit}
        loading={actionLoading}
      />
    </div>
  );
};

export default StaffInventoryPage;
