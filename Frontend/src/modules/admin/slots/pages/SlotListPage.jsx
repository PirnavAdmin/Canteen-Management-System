import React, { useState, useMemo } from 'react';
import { PlusCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { Pagination } from '../../../../components/common/Pagination';
import { useSlots } from '../hooks/useSlots';
import { SlotFilters } from '../components/SlotFilters';
import { SlotTable } from '../components/SlotTable';
import { SlotModal } from '../components/SlotModal';
import { AdjustCapacityModal } from '../components/AdjustCapacityModal';

export const SlotListPage = () => {
  const {
    slots,
    loading,
    createSlot,
    updateCapacity,
    togglePause,
    refreshSlots
  } = useSlots();

  // Filters state
  const [selectedOutlet, setSelectedOutlet] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals & action loading state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [slotToAdjust, setSlotToAdjust] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const handleTogglePause = async (slot) => {
    try {
      setActionLoadingId(slot.id);
      await togglePause(slot.id);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateSlot = async (data) => {
    try {
      setModalLoading(true);
      await createSlot(data);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateCapacity = async (id, cap) => {
    try {
      setModalLoading(true);
      await updateCapacity(id, cap);
    } finally {
      setModalLoading(false);
    }
  };

  // Filtered slots
  const filteredSlots = useMemo(() => {
    return slots.filter(slot => {
      if (selectedOutlet !== 'ALL' && slot.outletId !== selectedOutlet) return false;
      if (selectedSession !== 'ALL' && slot.mealSession !== selectedSession) return false;
      if (selectedStatus !== 'ALL' && slot.status !== selectedStatus) return false;
      if (selectedDate && slot.date !== selectedDate) return false;
      return true;
    });
  }, [slots, selectedOutlet, selectedSession, selectedStatus, selectedDate]);

  // Paginated slots
  const paginatedSlots = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSlots.slice(start, start + pageSize);
  }, [filteredSlots, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSelectedOutlet('ALL');
    setSelectedSession('ALL');
    setSelectedStatus('ALL');
    setSelectedDate('');
    setCurrentPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Meal Slot & Capacity Management"
        description="Regulate peak-hour dining hall crowds, manage meal session windows, throttle order influx quotas, and enforce order cut-off deadlines."
        breadcrumbItems={[
          { label: 'Admin' },
          { label: 'Slot Management' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={refreshSlots}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              icon={PlusCircle}
              onClick={() => setIsCreateOpen(true)}
            >
              Create Meal Slot
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <SlotFilters
        selectedOutlet={selectedOutlet}
        onOutletChange={(v) => { setSelectedOutlet(v); setCurrentPage(1); }}
        selectedSession={selectedSession}
        onSessionChange={(v) => { setSelectedSession(v); setCurrentPage(1); }}
        selectedStatus={selectedStatus}
        onStatusChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}
        selectedDate={selectedDate}
        onDateChange={(v) => { setSelectedDate(v); setCurrentPage(1); }}
        onReset={handleResetFilters}
      />

      {/* Slot Table */}
      <SlotTable
        slots={paginatedSlots}
        loading={loading}
        actionLoadingId={actionLoadingId}
        onAdjustCapacity={(slot) => setSlotToAdjust(slot)}
        onTogglePause={handleTogglePause}
        footer={
          <Pagination
            currentPage={currentPage}
            totalItems={filteredSlots.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
            pageSizeOptions={[5, 10, 20]}
          />
        }
      />

      {/* Create Slot Modal */}
      <SlotModal
        isOpen={isCreateOpen}
        onClose={() => !modalLoading && setIsCreateOpen(false)}
        loading={modalLoading}
        onSubmit={handleCreateSlot}
      />

      {/* Adjust Capacity Modal */}
      <AdjustCapacityModal
        isOpen={Boolean(slotToAdjust)}
        onClose={() => !modalLoading && setSlotToAdjust(null)}
        slot={slotToAdjust}
        loading={modalLoading}
        onSaveCapacity={handleUpdateCapacity}
      />
    </div>
  );
};

export default SlotListPage;
