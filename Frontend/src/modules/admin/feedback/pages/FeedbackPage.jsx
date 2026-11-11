import React, { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { Pagination } from '../../../../components/common/Pagination';
import { useFeedback } from '../hooks/useFeedback';
import { FeedbackFilters } from '../components/FeedbackFilters';
import { FeedbackTable } from '../components/FeedbackTable';
import { FeedbackDetailsModal } from '../components/FeedbackDetailsModal';

export const FeedbackPage = () => {
  const {
    feedbackList,
    loading,
    resolveTicket,
    refreshFeedback
  } = useFeedback();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRating, setSelectedRating] = useState('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [activeTicket, setActiveTicket] = useState(null);

  // Filtered feedback
  const filteredFeedback = useMemo(() => {
    return feedbackList.filter(item => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesId = item.id?.toLowerCase().includes(q);
        const matchesName = item.customerName?.toLowerCase().includes(q);
        const matchesComments = item.comments?.toLowerCase().includes(q);
        const matchesOrder = item.orderToken?.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesComments && !matchesOrder) return false;
      }
      if (selectedCategory !== 'ALL' && item.complaintCategory !== selectedCategory) return false;
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
      if (selectedRating !== 'ALL' && String(item.rating) !== selectedRating) return false;
      return true;
    });
  }, [feedbackList, searchTerm, selectedCategory, selectedStatus, selectedRating]);

  // Paginated records
  const paginatedFeedback = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFeedback.slice(start, start + pageSize);
  }, [filteredFeedback, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedRating('ALL');
    setCurrentPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Feedback & Grievances Management"
        description="Review student and faculty dining satisfaction ratings, investigate food quality or delay complaints, and log institutional corrective actions."
        breadcrumbItems={[
          { label: 'Admin' },
          { label: 'Feedback & Grievances' }
        ]}
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={refreshFeedback}
            loading={loading}
          >
            Refresh Tickets
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <FeedbackFilters
        searchTerm={searchTerm}
        onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
        selectedCategory={selectedCategory}
        onCategoryChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}
        selectedStatus={selectedStatus}
        onStatusChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}
        selectedRating={selectedRating}
        onRatingChange={(v) => { setSelectedRating(v); setCurrentPage(1); }}
        onReset={handleResetFilters}
      />

      {/* Feedback Table */}
      <FeedbackTable
        feedbackList={paginatedFeedback}
        loading={loading}
        onViewDetails={(t) => setActiveTicket(t)}
        footer={
          <Pagination
            currentPage={currentPage}
            totalItems={filteredFeedback.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
            pageSizeOptions={[5, 10, 20]}
          />
        }
      />

      {/* Details & Resolution Modal */}
      <FeedbackDetailsModal
        isOpen={Boolean(activeTicket)}
        onClose={() => setActiveTicket(null)}
        ticket={activeTicket}
        onResolve={resolveTicket}
      />
    </div>
  );
};

export default FeedbackPage;
