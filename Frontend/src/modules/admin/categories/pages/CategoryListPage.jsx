import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { CategorySummaryCards } from '../components/CategorySummaryCards';
import { CategoryFilters } from '../components/CategoryFilters';
import { CategoryTable } from '../components/CategoryTable';
import { Pagination } from '../../../../components/common/Pagination';
import { ConfirmationModal } from '../../../../components/common/ConfirmationModal';
import { PlusCircle } from 'lucide-react';

export const CategoryListPage = () => {
  const navigate = useNavigate();
  const { categories, loading, toggleCategoryStatus } = useCategories();

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Sorting state
  const [sortField, setSortField] = useState('displayOrder');
  const [sortDirection, setSortDirection] = useState('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Status toggle confirmation modal
  const [categoryToToggle, setCategoryToToggle] = useState(null);

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered & Sorted categories
  const processedCategories = useMemo(() => {
    // 1. Filter
    const filtered = categories.filter(c => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(query);
        const matchesDesc = c.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }
      if (selectedStatus !== 'ALL' && c.status !== selectedStatus) {
        return false;
      }
      return true;
    });

    // 2. Sort
    filtered.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'displayOrder') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortDirection === 'asc' ? cmp : -cmp;
      }

      return 0;
    });

    return filtered;
  }, [categories, searchTerm, selectedStatus, sortField, sortDirection]);

  // Paginated records
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedCategories.slice(start, start + pageSize);
  }, [processedCategories, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('ALL');
    setCurrentPage(1);
  };

  const handleConfirmToggle = async () => {
    if (categoryToToggle) {
      await toggleCategoryStatus(categoryToToggle.id);
      setCategoryToToggle(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Food Category Management"
        description="Establish standardized food categories, arrange display ordering, and control menu section visibility."
        breadcrumbItems={[
          { label: 'Categories Management' },
          { label: 'Food Categories' }
        ]}
        actions={
          <Button
            variant="primary"
            icon={PlusCircle}
            onClick={() => navigate('/categories/create')}
          >
            Add Food Category
          </Button>
        }
      />

      {/* Summary KPI Cards */}
      <CategorySummaryCards categories={categories} />

      {/* Filter Bar */}
      <CategoryFilters
        searchTerm={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
        selectedStatus={selectedStatus}
        onStatusChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}
        onReset={handleResetFilters}
      />

      {/* Category Data Table with Column Sorting */}
      <CategoryTable
        categories={paginatedCategories}
        loading={loading}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onToggleStatus={(cat) => setCategoryToToggle(cat)}
        footer={
          <Pagination
            currentPage={currentPage}
            totalItems={processedCategories.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            pageSizeOptions={[5, 10, 20]}
          />
        }
      />

      {/* Status Toggle Confirmation Modal */}
      {categoryToToggle && (
        <ConfirmationModal
          isOpen={Boolean(categoryToToggle)}
          onClose={() => setCategoryToToggle(null)}
          onConfirm={handleConfirmToggle}
          title={categoryToToggle.status === 'Active' ? 'Deactivate Food Category' : 'Activate Food Category'}
          variant={categoryToToggle.status === 'Active' ? 'warning' : 'primary'}
          message={
            categoryToToggle.status === 'Active'
              ? `Are you sure you want to deactivate "${categoryToToggle.name}"? It will hide this category section from active dining menu schedules while preserving all past order and pricing history.`
              : `Are you sure you want to activate "${categoryToToggle.name}"? It will restore this category to active menu scheduling.`
          }
          confirmText={categoryToToggle.status === 'Active' ? 'Deactivate Category' : 'Activate Category'}
        />
      )}
    </div>
  );
};

