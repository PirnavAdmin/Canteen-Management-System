import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20]
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      }
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      padding: '14px 20px',
      borderTop: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-surface)',
      borderBottomLeftRadius: 'var(--border-radius-lg)',
      borderBottomRightRadius: 'var(--border-radius-lg)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <span>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{startItem}</strong> to{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{endItem}</strong> of{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong> entries
        </span>
        {onPageSizeChange && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                padding: '3px 8px',
                fontSize: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 10px',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: currentPage <= 1 ? 'var(--text-placeholder)' : 'var(--text-primary)',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            fontSize: '12.5px',
            gap: '4px'
          }}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
          <span>Prev</span>
        </button>

        {getPageNumbers().map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`dots-${idx}`} style={{ padding: '0 6px', color: 'var(--text-muted)' }}>
                ...
              </span>
            );
          }
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              style={{
                minWidth: '32px',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--border-radius-sm)',
                border: isActive ? '1px solid var(--color-primary)' : '1px solid transparent',
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-primary)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 10px',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: currentPage >= totalPages ? 'var(--text-placeholder)' : 'var(--text-primary)',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            fontSize: '12.5px',
            gap: '4px'
          }}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

