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
  RotateCcw,
  XCircle,
  Utensils,
  History,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { useStaffOutlet } from '../hooks/useStaffOutlet';
import { useToast } from '../../../app/providers/ToastProvider';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';
import { StatCard } from '../../../components/common/StatCard';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { DataTable } from '../../../components/tables/DataTable';
import { Pagination } from '../../../components/common/Pagination';
import { EmptyState } from '../../../components/common/EmptyState';
import { Modal } from '../../../components/modals/Modal';
import { ConfirmationModal } from '../../../components/common/ConfirmationModal';
import { formatDate, formatNumber, isSameIstDate, isWithinDaysIST } from '../../../utils/formatters';
import { ConfirmReceiptModal } from '../components/ConfirmReceiptModal';
import { LogKitchenUsageModal } from '../components/LogKitchenUsageModal';
import { SearchableIngredientSelect } from '../components/SearchableIngredientSelect';
import styles from '../styles/staff.module.css';

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
  const [searchParams] = useSearchParams();
  const { success, error: toastError } = useToast();

  const {
    selectedOutlet,
    activeOutletName
  } = useStaffOutlet();

  const {
    kitchenStock,
    kitchenLedger,
    incomingTransfers,
    stockRequests,
    loading,
    error,
    refreshInventory,
    createRequest,
    confirmReceipt,
    recordUsage,
    deleteRequest
  } = useStaffInventory(selectedOutlet);

  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab') || searchParams.get('view');
    if (tabParam === 'history' || tabParam === 'request') return 'history';
    if (tabParam === 'incoming') return 'incoming';
    if (tabParam === 'ledger') return 'ledger';
    return 'stock';
  });

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
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // TAB 1: MY KITCHEN STOCK
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

  const stockMetrics = useMemo(() => {
    const total = kitchenStock.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    kitchenStock.forEach((item) => {
      const q = Number(item.availableQuantity) || 0;
      const r = Number(item.reorderLevel) || 0;
      if (q <= 0 || item.status === 'Out of Stock') outOfStock++;
      else if (q <= r || item.status === 'Low Stock') lowStock++;
      else inStock++;
    });

    return { total, inStock, lowStock, outOfStock };
  }, [kitchenStock]);

  // TAB 2: REQUEST HISTORY & REQUISITION MODAL
  const [requestSearch, setRequestSearch] = useState('');
  const [requestFilterStatus, setRequestFilterStatus] = useState('ALL');
  const [requestPage, setRequestPage] = useState(1);
  const [requestPageSize, setRequestPageSize] = useState(8);

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
    } else if (Number(selection.availableQuantity) <= Number(selection.reorderLevel)) {
      setRequestPriority('Urgent');
      setRequestReason(`Kitchen stock low (${selection.availableQuantity} ${selection.unit || 'kg'} remaining). Reorder required.`);
    } else {
      setRequestPriority('Normal');
      setRequestReason('Kitchen stock replenishment.');
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
      toastError('Validation Error', 'Please choose or enter an ingredient name.');
      return;
    }
    const q = Number(requestQuantity);
    if (!requestQuantity || q <= 0) {
      toastError('Validation Error', 'Please enter a valid requested quantity greater than zero.');
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

      success(
        'Requisition Submitted',
        `REQ-${created.id} for "${requestItemName.trim()}" submitted to Central Warehouse.`
      );
      setIsRequestModalOpen(false);
      setRequestItemName('');
      setRequestCategory('General Kitchen Supplies');
      setRequestIsCustom(false);
      setRequestQuantity('');
      setRequestReason('Kitchen stock replenishment.');
    } catch (err) {
      toastError('Submission Failed', err.message || 'Failed to submit stock requisition.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleConfirmDeleteRequest = async () => {
    if (!requestToDelete) return;
    try {
      setActionLoading(true);
      await deleteRequest(requestToDelete.id);
      success('Requisition Cancelled', `Stock requisition REQ-${requestToDelete.id} removed.`);
      setRequestToDelete(null);
    } catch (err) {
      toastError('Cancellation Failed', err.message || 'Failed to cancel stock requisition.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return stockRequests.filter((r) => {
      const q = requestSearch.trim().toLowerCase();
      const idStr = String(r.id || r.requestId || '').toLowerCase();
      const name = String(r.itemName || r.ingredientName || '').toLowerCase();
      const code = String(r.itemCode || '').toLowerCase();
      if (q && !idStr.includes(q) && !name.includes(q) && !code.includes(q)) return false;

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

  // TAB 3: INCOMING STOCK
  const [incomingSearch, setIncomingSearch] = useState('');
  const [incomingStatusFilter, setIncomingStatusFilter] = useState('ALL');
  const [incomingPage, setIncomingPage] = useState(1);
  const [incomingPageSize, setIncomingPageSize] = useState(6);

  const filteredIncoming = useMemo(() => {
    return incomingTransfers.filter((trf) => {
      const q = incomingSearch.trim().toLowerCase();
      const name = String(trf.ingredientName || trf.itemName || '').toLowerCase();
      const code = String(trf.transferId || trf.id || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || code.includes(q);

      const s = String(trf.status || '').toLowerCase();
      let matchesStatus = true;
      if (incomingStatusFilter === 'Pending') {
        matchesStatus = s === 'dispatched' || s === 'in transit' || s === 'approved';
      } else if (incomingStatusFilter === 'Received') {
        matchesStatus = s === 'received' || s === 'partially received' || s === 'fulfilled';
      }

      return matchesSearch && matchesStatus;
    });
  }, [incomingTransfers, incomingSearch, incomingStatusFilter]);

  const paginatedIncoming = useMemo(() => {
    const start = (incomingPage - 1) * incomingPageSize;
    return filteredIncoming.slice(start, start + incomingPageSize);
  }, [filteredIncoming, incomingPage, incomingPageSize]);

  const pendingIncomingCount = useMemo(() => {
    return incomingTransfers.filter((t) => {
      const s = String(t.status || '').toLowerCase();
      return s === 'dispatched' || s === 'in transit' || s === 'approved';
    }).length;
  }, [incomingTransfers]);

  const handleConfirmReceiptSubmit = async (payload) => {
    try {
      setActionLoading(true);
      await confirmReceipt(payload);
      success(
        'Stock Inwarded',
        `+${payload.receivedQuantity} ${payload.unit} ${payload.ingredientName} added to ${activeOutletName || 'kitchen'} stock.`
      );
    } catch (err) {
      toastError('Receipt Failed', err.message || 'Error confirming receipt.');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // TAB 4: STOCK LEDGER
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('ALL');
  const [ledgerDateFilter, setLedgerDateFilter] = useState('ALL');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(8);

  const filteredLedger = useMemo(() => {
    return kitchenLedger.filter((entry) => {
      const q = ledgerSearch.trim().toLowerCase();
      const name = String(entry.ingredientName || '').toLowerCase();
      const ref = String(entry.reference || '').toLowerCase();
      const desc = String(entry.description || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || ref.includes(q) || desc.includes(q);
      const matchesType = ledgerTypeFilter === 'ALL' || String(entry.transactionType || '').toUpperCase() === ledgerTypeFilter;

      let matchesDate = true;
      if (ledgerDateFilter === 'TODAY') {
        matchesDate = Boolean(entry.dateTime) && isSameIstDate(entry.dateTime);
      } else if (ledgerDateFilter === 'WEEK') {
        matchesDate = Boolean(entry.dateTime) && (isWithinDaysIST(entry.dateTime, 7) || isSameIstDate(entry.dateTime));
      } else if (ledgerDateFilter === 'MONTH') {
        matchesDate = Boolean(entry.dateTime) && (isWithinDaysIST(entry.dateTime, 30) || isSameIstDate(entry.dateTime));
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [kitchenLedger, ledgerSearch, ledgerTypeFilter, ledgerDateFilter]);

  const paginatedLedger = useMemo(() => {
    const start = (ledgerPage - 1) * ledgerPageSize;
    return filteredLedger.slice(start, start + ledgerPageSize);
  }, [filteredLedger, ledgerPage, ledgerPageSize]);

  const handleLogUsageSubmit = async (payload) => {
    try {
      setActionLoading(true);
      await recordUsage(payload);
      success(
        'Kitchen Usage Recorded',
        `-${payload.quantity} ${payload.ingredientName} deducted from ${activeOutletName || 'kitchen'} stock.`
      );
    } catch (err) {
      toastError('Usage Error', err.message || 'Error recording usage.');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // DataTable Columns
  const stockColumns = [
    {
      key: 'ingredientName',
      header: 'Ingredient / Material',
      render: (val, item) => (
        <div>
          <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
            {val}
          </strong>
          <code style={{
            fontSize: '10.5px',
            color: 'var(--color-primary)',
            backgroundColor: 'var(--bg-muted)',
            padding: '1px 5px',
            borderRadius: '3px',
            fontWeight: 600
          }}>
            {item.itemCode}
          </code>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (val) => (
        <span style={{ color: 'var(--text-secondary)' }}>{val || 'General Supplies'}</span>
      )
    },
    {
      key: 'availableQuantity',
      header: 'Available Stock',
      align: 'right',
      render: (val, item) => {
        const qty = Number(val) || 0;
        const reorder = Number(item.reorderLevel) || 0;
        const isOut = qty <= 0;
        const isLow = qty <= reorder && qty > 0;
        return (
          <strong style={{ color: isOut ? 'var(--color-danger)' : isLow ? 'var(--color-warning)' : 'var(--text-primary)' }}>
            {formatNumber(qty)} {item.unit}
          </strong>
        );
      }
    },
    {
      key: 'reorderLevel',
      header: 'Min Stock Level',
      align: 'right',
      render: (val, item) => (
        <span style={{ color: 'var(--text-muted)' }}>{formatNumber(Number(val) || 0)} {item.unit}</span>
      )
    },
    {
      key: 'status',
      header: 'Stock Status',
      align: 'center',
      render: (_, item) => {
        const qty = Number(item.availableQuantity) || 0;
        const reorder = Number(item.reorderLevel) || 0;
        const label = qty <= 0 ? 'Out of Stock' : qty <= reorder ? 'Low Stock' : 'In Stock';
        return <StatusBadge status={label} size="sm" />;
      }
    },
    {
      key: 'lastUpdated',
      header: 'Last Movement',
      render: (val, item) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {(val || item.updatedAt) ? formatDate(val || item.updatedAt) : '—'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (_, item) => {
        const qty = Number(item.availableQuantity) || 0;
        const reorder = Number(item.reorderLevel) || 0;
        const needsReorder = qty <= reorder;
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Button
              variant={needsReorder ? 'primary' : 'secondary'}
              size="sm"
              icon={Send}
              onClick={() => handleQuickRequestFromStock(item)}
              style={{ padding: '4px 10px', fontSize: '11.5px' }}
            >
              Request
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Utensils}
              onClick={() => setUsageModal({ isOpen: true, preselectedItem: item })}
              style={{ padding: '4px 9px', fontSize: '11.5px' }}
            >
              Use
            </Button>
          </div>
        );
      }
    }
  ];

  const requestColumns = [
    {
      key: 'serial',
      header: '#',
      width: '45px',
      align: 'center',
      render: (_, __, idx) => (requestPage - 1) * requestPageSize + idx + 1
    },
    {
      key: 'id',
      header: 'Request ID',
      render: (val, req) => (
        <code style={{
          backgroundColor: 'var(--bg-muted)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11.5px',
          fontWeight: 700,
          color: 'var(--color-primary)'
        }}>
          REQ-{val || req.requestId}
        </code>
      )
    },
    {
      key: 'itemName',
      header: 'Ingredient Name',
      render: (val, req) => (
        <div>
          <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{val || req.ingredientName}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {req.category || 'Kitchen Supplies'}{req.notes ? ` • Note: ${req.notes}` : ''}
          </span>
        </div>
      )
    },
    {
      key: 'requestedQuantity',
      header: 'Requested Qty',
      align: 'right',
      render: (val, req) => (
        <div>
          <strong style={{ color: 'var(--color-primary)' }}>{val} {req.unit || 'kg'}</strong>
          {req.issuedQuantity && req.issuedQuantity !== val && (
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
              Approved: {req.issuedQuantity} {req.unit || 'kg'}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Request Date',
      render: (val, req) => (
        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          <div>Sent: {val ? formatDate(val) : '—'}</div>
          {req.requiredByDate && (
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px', marginTop: '2px' }}>
              Needed: {formatDate(req.requiredByDate)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'urgency',
      header: 'Priority',
      align: 'center',
      render: (val) => {
        const isUrgent = String(val).toLowerCase() === 'urgent' || String(val).toLowerCase() === 'emergency';
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: '4px',
            backgroundColor: isUrgent ? 'var(--color-danger-bg)' : 'var(--bg-muted)',
            color: isUrgent ? 'var(--color-danger-text)' : 'var(--text-secondary)',
            border: `1px solid ${isUrgent ? 'var(--color-danger-border)' : 'var(--border-color)'}`
          }}>
            {val || 'Normal'}
          </span>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (val) => <StatusBadge status={val || 'Pending'} size="sm" />
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (_, req) => {
        const s = String(req.status || 'Pending').toUpperCase();
        const isPending = s.includes('PENDING') || s === 'REQUESTED';
        const isDispatched = s.includes('TRANSIT') || s.includes('DISPATCH') || s.includes('ISSUED');
        const isReceived = s.includes('RECEIVED') || s.includes('COMPLETED') || s.includes('FULFILLED');

        if (isDispatched && !isReceived) {
          return (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('incoming')}
              style={{ padding: '4px 10px', fontSize: '11.5px' }}
            >
              Inward Stock →
            </Button>
          );
        }
        if (isPending) {
          return (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setRequestToDelete(req)}
              style={{ padding: '4px 10px', fontSize: '11.5px' }}
            >
              Cancel
            </Button>
          );
        }
        if (isReceived) {
          return (
            <span style={{ fontSize: '11.5px', color: 'var(--color-success-text)', fontWeight: 600 }}>
              Completed ✓
            </span>
          );
        }
        return <span style={{ color: 'var(--text-muted)' }}>—</span>;
      }
    }
  ];

  const incomingColumns = [
    {
      key: 'id',
      header: 'Transfer ID',
      render: (val, trf) => (
        <div>
          <code style={{
            backgroundColor: 'var(--bg-muted)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: 'var(--color-primary)'
          }}>
            {trf.transferId || `TRF-${val}`}
          </code>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Ref: {trf.requestId || `REQ-${val}`}
          </div>
        </div>
      )
    },
    {
      key: 'ingredientName',
      header: 'Ingredient Delivered',
      render: (val, trf) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{val || trf.itemName}</strong>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{trf.category || 'General Ingredients'}</span>
        </div>
      )
    },
    {
      key: 'dispatchedQuantity',
      header: 'Dispatched Qty',
      align: 'right',
      render: (val, trf) => (
        <div>
          <strong style={{ color: 'var(--color-primary)' }}>
            {val || trf.issuedQuantity || trf.approvedQuantity || trf.requestedQuantity} {trf.unit}
          </strong>
          {trf.receivedQuantity && (
            <div style={{ fontSize: '11px', color: 'var(--color-success-text)', fontWeight: 600 }}>
              Received: {trf.receivedQuantity} {trf.unit}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'dispatchDate',
      header: 'Dispatch Date & Source',
      render: (val, trf) => (
        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          <div>{(val || trf.createdAt) ? formatDate(val || trf.createdAt) : '—'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {trf.dispatchedBy || 'Central Warehouse'}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Delivery Status',
      align: 'center',
      render: (val) => <StatusBadge status={val || 'Dispatched'} size="sm" />
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'center',
      render: (_, trf) => {
        const s = String(trf.status || '').toLowerCase();
        const isReceived = s === 'received' || s === 'partially received' || s === 'fulfilled';
        if (!isReceived) {
          return (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              onClick={() => setReceiptModal({ isOpen: true, transfer: trf })}
            >
              Confirm Received
            </Button>
          );
        }
        return (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Inwarded to Kitchen
          </span>
        );
      }
    }
  ];

  const ledgerColumns = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (val) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          {val ? formatDate(val) : '—'}
        </span>
      )
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (val) => (
        <code style={{
          backgroundColor: 'var(--bg-muted)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--color-primary)'
        }}>
          {val}
        </code>
      )
    },
    {
      key: 'ingredientName',
      header: 'Ingredient',
      render: (val) => <strong style={{ color: 'var(--text-primary)' }}>{val}</strong>
    },
    {
      key: 'transactionType',
      header: 'Transaction Type',
      align: 'center',
      render: (val) => {
        const upper = String(val || '').toUpperCase();
        const isIn = upper.includes('RECEIVED') || upper.includes('STOCK IN') || upper.includes('OPENING');
        const isWaste = upper.includes('WASTE') || upper.includes('WASTAGE');
        return (
          <span style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: isIn ? 'var(--color-success-bg)' : isWaste ? 'var(--color-danger-bg)' : 'var(--color-info-bg)',
            color: isIn ? 'var(--color-success-text)' : isWaste ? 'var(--color-danger-text)' : 'var(--color-info-text)',
            border: `1px solid ${isIn ? 'var(--color-success-border)' : isWaste ? 'var(--color-danger-border)' : 'var(--color-info-border)'}`
          }}>
            {val}
          </span>
        );
      }
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      render: (val, entry) => {
        const isPositive = Number(val) > 0;
        return (
          <strong style={{ color: isPositive ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {isPositive ? `+${val}` : val} {entry.unit}
          </strong>
        );
      }
    },
    {
      key: 'newStock',
      header: 'Balance Change',
      align: 'right',
      render: (val, entry) => (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {entry.previousStock} → <strong style={{ color: 'var(--text-primary)' }}>{val} {entry.unit}</strong>
        </span>
      )
    },
    {
      key: 'performedBy',
      header: 'Operator & Notes',
      render: (val, entry) => (
        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{entry.description}</div>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        title="Kitchen Inventory & Stock Ledger"
        description="Trace raw ingredient stocks, requisitions to central warehouse, incoming stock transfers, and kitchen ledger movements."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

      {error && (
        <div className={styles.errorBanner} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={refreshInventory}>
            Retry
          </Button>
        </div>
      )}

      {/* Underline Tabs matching Admin InventoryPage */}
      <div className={styles.tabList} role="tablist" aria-label="Inventory Sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'stock'}
          onClick={() => setActiveTab('stock')}
          className={styles.tabButton}
        >
          <Package size={15} />
          <span>My Kitchen Stock</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
          className={styles.tabButton}
        >
          <History size={15} />
          <span>Request History</span>
          {stockRequests.length > 0 && (
            <span style={{
              padding: '1px 7px',
              borderRadius: 'var(--border-radius-full)',
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
          role="tab"
          aria-selected={activeTab === 'incoming'}
          onClick={() => setActiveTab('incoming')}
          className={styles.tabButton}
        >
          <Truck size={15} />
          <span>Incoming Stock</span>
          {pendingIncomingCount > 0 && (
            <span style={{
              padding: '1px 7px',
              borderRadius: 'var(--border-radius-full)',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: activeTab === 'incoming' ? 'var(--color-primary)' : 'var(--color-warning)',
              color: '#ffffff'
            }}>
              {pendingIncomingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ledger'}
          onClick={() => setActiveTab('ledger')}
          className={styles.tabButton}
        >
          <BookOpen size={15} />
          <span>Stock Ledger</span>
        </button>
      </div>

      {/* TAB 1: MY KITCHEN STOCK */}
      {activeTab === 'stock' && (
        <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <StatCard
              title="Total Ingredients"
              value={formatNumber(stockMetrics.total)}
              icon={Package}
              description={activeOutletName ? `Active in ${activeOutletName}` : 'Kitchen inventory'}
              color="var(--color-accent)"
              bgColor="var(--color-primary-light)"
              compact
            />
            <StatCard
              title="Healthy Stock"
              value={formatNumber(stockMetrics.inStock)}
              icon={CheckCircle2}
              description="Above reorder threshold"
              color="var(--color-success)"
              bgColor="var(--color-success-bg)"
              compact
            />
            <StatCard
              title="Low Stock Warning"
              value={formatNumber(stockMetrics.lowStock)}
              icon={AlertTriangle}
              description="Requisition recommended"
              color="var(--color-warning)"
              bgColor="var(--color-warning-bg)"
              compact
            />
            <StatCard
              title="Out of Stock"
              value={formatNumber(stockMetrics.outOfStock)}
              icon={XCircle}
              description="Needs immediate replenishment"
              color="var(--color-danger)"
              bgColor="var(--color-danger-bg)"
              compact
            />
          </div>

          <div className={styles.filterToolbar}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
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
                  height: '34px',
                  padding: '0 12px 0 30px',
                  fontSize: '12.5px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            <select
              value={stockCategoryFilter}
              onChange={(e) => {
                setStockCategoryFilter(e.target.value);
                setStockPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="ALL">All Categories</option>
              {stockCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={stockStatusFilter}
              onChange={(e) => {
                setStockStatusFilter(e.target.value);
                setStockPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            {(stockSearch || stockCategoryFilter !== 'ALL' || stockStatusFilter !== 'ALL') && (
              <Button
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                onClick={() => {
                  setStockSearch('');
                  setStockCategoryFilter('ALL');
                  setStockStatusFilter('ALL');
                  setStockPage(1);
                }}
              >
                Reset
              </Button>
            )}

            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
              Showing <strong>{filteredStock.length}</strong> ingredients
            </span>
          </div>

          <DataTable
            columns={stockColumns}
            data={paginatedStock}
            loading={loading}
            emptyState={
              <EmptyState
                icon={Package}
                title="No kitchen stock items found"
                message="Adjust your search terms or request stock from Central Warehouse."
              />
            }
            footer={
              <Pagination
                currentPage={stockPage}
                totalItems={filteredStock.length}
                pageSize={stockPageSize}
                onPageChange={setStockPage}
                onPageSizeChange={(sz) => {
                  setStockPageSize(sz);
                  setStockPage(1);
                }}
                pageSizeOptions={[5, 8, 15, 20]}
              />
            }
          />
        </div>
      )}

      {/* TAB 2: REQUEST HISTORY */}
      {activeTab === 'history' && (
        <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className={styles.filterToolbar}>
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search by Request ID or Item..."
                value={requestSearch}
                onChange={(e) => {
                  setRequestSearch(e.target.value);
                  setRequestPage(1);
                }}
                style={{
                  width: '100%',
                  height: '34px',
                  padding: '0 12px 0 30px',
                  fontSize: '12.5px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            <select
              value={requestFilterStatus}
              onChange={(e) => {
                setRequestFilterStatus(e.target.value);
                setRequestPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="IN TRANSIT">In Transit / Dispatched</option>
              <option value="RECEIVED">Received &amp; Inwarded</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => setIsRequestModalOpen(true)}
            >
              New Request
            </Button>
          </div>

          <DataTable
            columns={requestColumns}
            data={paginatedRequests}
            loading={loading}
            emptyState={
              <EmptyState
                icon={History}
                title="No stock requisitions found"
                message="Click 'New Request' or 'Request Stock' to submit an ingredient request to Central Warehouse."
              />
            }
            footer={
              <Pagination
                currentPage={requestPage}
                totalItems={filteredRequests.length}
                pageSize={requestPageSize}
                onPageChange={setRequestPage}
                onPageSizeChange={(sz) => {
                  setRequestPageSize(sz);
                  setRequestPage(1);
                }}
                pageSizeOptions={[5, 8, 15, 20]}
              />
            }
          />
        </div>
      )}

      {/* TAB 3: INCOMING STOCK */}
      {activeTab === 'incoming' && (
        <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className={styles.infoBanner}>
            <Truck size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <div>
              <strong>Central Warehouse Deliveries:</strong> When supplies arrive from Admin logistics, click{' '}
              <strong>&ldquo;Confirm Received&rdquo;</strong> to verify actual quantities and inward them into your kitchen stock.
            </div>
          </div>

          <div className={styles.filterToolbar}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
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
                  height: '34px',
                  padding: '0 12px 0 30px',
                  fontSize: '12.5px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            <select
              value={incomingStatusFilter}
              onChange={(e) => {
                setIncomingStatusFilter(e.target.value);
                setIncomingPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="ALL">All Delivery Statuses</option>
              <option value="Pending">Awaiting Receipt (Dispatched)</option>
              <option value="Received">Confirmed Received</option>
            </select>

            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
              <strong>{filteredIncoming.length}</strong> incoming transfers
            </span>
          </div>

          <DataTable
            columns={incomingColumns}
            data={paginatedIncoming}
            loading={loading}
            emptyState={
              <EmptyState
                icon={Truck}
                title="No incoming deliveries for this kitchen"
                message="When Central Warehouse approves and dispatches your stock requests, they will appear here."
              />
            }
            footer={
              <Pagination
                currentPage={incomingPage}
                totalItems={filteredIncoming.length}
                pageSize={incomingPageSize}
                onPageChange={setIncomingPage}
                onPageSizeChange={(sz) => {
                  setIncomingPageSize(sz);
                  setIncomingPage(1);
                }}
                pageSizeOptions={[5, 10, 15, 20]}
              />
            }
          />
        </div>
      )}

      {/* TAB 4: STOCK LEDGER */}
      {activeTab === 'ledger' && (
        <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className={styles.filterToolbar}>
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
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
                  height: '34px',
                  padding: '0 12px 0 30px',
                  fontSize: '12.5px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            <select
              value={ledgerTypeFilter}
              onChange={(e) => {
                setLedgerTypeFilter(e.target.value);
                setLedgerPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="ALL">All Transaction Types</option>
              <option value="STOCK IN">Stock In</option>
              <option value="STOCK OUT">Stock Out</option>
              <option value="WASTAGE">Wastage / Spoilage</option>
              <option value="ADJUSTMENT">Stock Adjustment</option>
            </select>

            <select
              value={ledgerDateFilter}
              onChange={(e) => {
                setLedgerDateFilter(e.target.value);
                setLedgerPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
            </select>

            <Button
              variant="secondary"
              size="sm"
              icon={Utensils}
              onClick={() => setUsageModal({ isOpen: true, preselectedItem: null })}
            >
              Log Kitchen Usage
            </Button>
          </div>

          <DataTable
            columns={ledgerColumns}
            data={paginatedLedger}
            loading={loading}
            emptyState={
              <EmptyState
                icon={BookOpen}
                title="No ledger transactions found"
                message="Stock receipts, consumption usages, and kitchen adjustments will appear here."
              />
            }
            footer={
              <Pagination
                currentPage={ledgerPage}
                totalItems={filteredLedger.length}
                pageSize={ledgerPageSize}
                onPageChange={setLedgerPage}
                onPageSizeChange={(sz) => {
                  setLedgerPageSize(sz);
                  setLedgerPage(1);
                }}
                pageSizeOptions={[5, 8, 15, 20]}
              />
            }
          />
        </div>
      )}

      {/* Requisition Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => !isSubmittingRequest && setIsRequestModalOpen(false)}
        title="Request Stock from Central Admin"
        subtitle={activeOutletName ? `${activeOutletName} • Requisition will be reviewed and dispatched by Admin` : undefined}
        maxWidth="560px"
      >
        <form onSubmit={handleSubmitStockRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Ingredient Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              {requestIsCustom && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  backgroundColor: 'var(--color-primary-light)',
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
              placeholder="Search kitchen ingredient (e.g. Rice, Sugar, Oil)..."
            />
          </div>

          {requestIsCustom ? (
            <div style={{
              padding: '12px 14px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              border: '1px solid var(--color-primary-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                <strong>Special Requisition: &ldquo;{requestItemName}&rdquo;</strong>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Central Admin will review, source, and dispatch this item to your kitchen.
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                  Ingredient Category <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <select
                  value={requestCategory}
                  onChange={(e) => setRequestCategory(e.target.value)}
                  className={styles.formInput}
                >
                  {INGREDIENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : selectedStockItemObj ? (
            <div style={{
              padding: '12px 14px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--bg-muted)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px'
            }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  Current Kitchen Balance
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedStockItemObj.availableQuantity} {selectedStockItemObj.unit}
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '6px' }}>
                    (Min: {selectedStockItemObj.reorderLevel} {selectedStockItemObj.unit})
                  </span>
                </div>
              </div>
              <StatusBadge
                status={Number(selectedStockItemObj.availableQuantity) <= Number(selectedStockItemObj.reorderLevel) ? 'Low Stock' : 'In Stock'}
                size="sm"
              />
            </div>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Requested Quantity <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                placeholder="e.g. 25"
                value={requestQuantity}
                onChange={(e) => setRequestQuantity(e.target.value)}
                className={styles.formInput}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Unit <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                value={requestUnit}
                onChange={(e) => setRequestUnit(e.target.value)}
                className={styles.formInput}
              >
                <option value="kg">kg (Kilograms)</option>
                <option value="g">g (Grams)</option>
                <option value="litre">litre (Litres)</option>
                <option value="ml">ml (Millilitres)</option>
                <option value="pieces">pieces (Pcs)</option>
                <option value="packets">packets</option>
                <option value="boxes">boxes</option>
                <option value="bags">bags</option>
                <option value="cans">cans</option>
              </select>
            </div>
          </div>

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
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: requestPriority === 'Normal' ? '1.5px solid var(--color-primary)' : '1px solid var(--border-color)',
                    backgroundColor: requestPriority === 'Normal' ? 'var(--color-primary-light)' : 'var(--bg-app)',
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
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: requestPriority === 'Urgent' ? '1.5px solid var(--color-danger)' : '1px solid var(--border-color)',
                    backgroundColor: requestPriority === 'Urgent' ? 'var(--color-danger-bg)' : 'var(--bg-app)',
                    color: requestPriority === 'Urgent' ? 'var(--color-danger-text)' : 'var(--text-secondary)'
                  }}
                >
                  Urgent
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
                className={styles.formInput}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Requisition Reason / Operational Notes
            </label>
            <textarea
              rows={3}
              placeholder="Provide details about expected usage or reason for request..."
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              className={styles.formTextarea}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <Button variant="secondary" onClick={() => setIsRequestModalOpen(false)} disabled={isSubmittingRequest}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Send}
              loading={isSubmittingRequest}
              disabled={!requestItemName}
            >
              Submit Request to Admin
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete / Cancel Requisition Modal */}
      <ConfirmationModal
        isOpen={Boolean(requestToDelete)}
        onClose={() => !actionLoading && setRequestToDelete(null)}
        onConfirm={handleConfirmDeleteRequest}
        title="Cancel Stock Requisition"
        message={`Are you sure you want to cancel requisition REQ-${requestToDelete?.id} for "${requestToDelete?.itemName}"?`}
        confirmText="Cancel Requisition"
        variant="danger"
        loading={actionLoading}
      />

      {/* Confirm Receipt Modal */}
      <ConfirmReceiptModal
        isOpen={receiptModal.isOpen}
        transfer={receiptModal.transfer}
        onClose={() => setReceiptModal({ isOpen: false, transfer: null })}
        onConfirm={handleConfirmReceiptSubmit}
        loading={actionLoading}
      />

      {/* Log Kitchen Usage Modal */}
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
