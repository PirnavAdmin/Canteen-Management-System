import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCanteens } from '../hooks/useCanteens';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { CanteenSummaryCards } from '../components/CanteenSummaryCards';
import { CanteenFilters } from '../components/CanteenFilters';
import { CanteenTable } from '../components/CanteenTable';
import { Pagination } from '../../../../components/common/Pagination';
import { ConfirmationModal } from '../../../../components/common/ConfirmationModal';
import { PlusCircle } from 'lucide-react';

export const CanteenListPage = () => {
  const navigate = useNavigate();
  const { canteens, loading, toggleCanteenStatus, refreshCanteens } = useCanteens();

  // Ensure latest list is loaded when navigating to outlets page
  useEffect(() => {
    if (refreshCanteens) {
      refreshCanteens();
    }
  }, [refreshCanteens]);

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Status toggle confirmation modal
  const [canteenToToggle, setCanteenToToggle] = useState(null);

  // Filter canteens
  const filteredCanteens = useMemo(() => {
    return canteens.filter(c => {
      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(query);
        const matchesCode = c.code?.toLowerCase().includes(query);
        const matchesCampus = c.campus?.toLowerCase().includes(query);
        const matchesLoc = c.location?.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesCampus && !matchesLoc) {
          return false;
        }
      }

      // Campus filter
      if (selectedCampus !== 'ALL' && c.campus !== selectedCampus) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && c.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [canteens, searchTerm, selectedCampus, selectedStatus]);

  // Sort canteens with recently added first (by createdAt or outletId descending)
  const sortedCanteens = useMemo(() => {
    return [...filteredCanteens].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;
      return Number(b.outletId || b.id || 0) - Number(a.outletId || a.id || 0);
    });
  }, [filteredCanteens]);

  // Paginated records
  const paginatedCanteens = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCanteens.slice(start, start + pageSize);
  }, [sortedCanteens, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCampus('ALL');
    setSelectedStatus('ALL');
    setCurrentPage(1);
  };

  const handleConfirmToggle = async () => {
    if (canteenToToggle) {
      await toggleCanteenStatus(canteenToToggle.id);
      setCanteenToToggle(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Canteen & Outlet Management"
        description="Configure institutional dining halls, operating hours, operating days, and staff assignments across campuses."
        breadcrumbItems={[
          { label: 'Canteen Management' },
          { label: 'Canteen Outlets' }
        ]}
        actions={
          <Button
            variant="primary"
            icon={PlusCircle}
            onClick={() => navigate('/admin/outlets/create')}
          >
            Add Canteen Outlet
          </Button>
        }
      />

      {/* Summary KPI Cards */}
      <CanteenSummaryCards canteens={canteens} />

      {/* Filter Bar */}
      <CanteenFilters
        searchTerm={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
        selectedCampus={selectedCampus}
        onCampusChange={(val) => { setSelectedCampus(val); setCurrentPage(1); }}
        selectedStatus={selectedStatus}
        onStatusChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}
        onReset={handleResetFilters}
      />

      {/* Canteen Data Table */}
      <CanteenTable
        canteens={paginatedCanteens}
        loading={loading}
        onToggleStatus={(canteen) => setCanteenToToggle(canteen)}
        footer={
          <Pagination
            currentPage={currentPage}
            totalItems={sortedCanteens.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            pageSizeOptions={[5, 10, 20]}
          />
        }
      />

      {/* Status Toggle Confirmation Modal */}
      {canteenToToggle && (
        <ConfirmationModal
          isOpen={Boolean(canteenToToggle)}
          onClose={() => setCanteenToToggle(null)}
          onConfirm={handleConfirmToggle}
          title={canteenToToggle.status === 'Active' ? 'Deactivate Canteen Outlet' : 'Activate Canteen Outlet'}
          variant={canteenToToggle.status === 'Active' ? 'warning' : 'primary'}
          message={
            canteenToToggle.status === 'Active'
              ? `Are you sure you want to deactivate "${canteenToToggle.name}" (${canteenToToggle.code})? It will temporarily suspend active order acceptance and menu browsing for students and faculty.`
              : `Are you sure you want to activate "${canteenToToggle.name}" (${canteenToToggle.code})? It will re-open the outlet for active campus operations.`
          }
          confirmText={canteenToToggle.status === 'Active' ? 'Deactivate Outlet' : 'Activate Outlet'}
        />
      )}
    </div>
  );
};

export default CanteenListPage;

