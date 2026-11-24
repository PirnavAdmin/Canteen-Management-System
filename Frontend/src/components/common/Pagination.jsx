import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 5,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 20]
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const [isCustom, setIsCustom] = React.useState(![5, 10, 15, 20].includes(pageSize));
  const [customInput, setCustomInput] = React.useState(pageSize || '');

  React.useEffect(() => {
    if (![5, 10, 15, 20].includes(pageSize)) {
      setIsCustom(true);
      setCustomInput(pageSize);
    }
  }, [pageSize]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      padding: '10px 16px',
      borderTop: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-surface)',
      borderBottomLeftRadius: 'var(--border-radius-lg)',
      borderBottomRightRadius: 'var(--border-radius-lg)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
        {onPageSizeChange && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>Show:</span>
            <select
              value={isCustom ? 'custom' : pageSize}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustom(true);
                  if (customInput && Number(customInput) > 0) {
                    onPageSizeChange(Number(customInput));
                  }
                } else {
                  setIsCustom(false);
                  onPageSizeChange(Number(e.target.value));
                }
              }}
              aria-label="Items per page"
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
              {[5, 10, 15, 20].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>

            {isCustom && (
              <input
                type="number"
                min="1"
                max="500"
                placeholder="Qty"
                value={customInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomInput(val);
                  const num = parseInt(val, 10);
                  if (num > 0) {
                    onPageSizeChange(num);
                  }
                }}
                style={{
                  width: '58px',
                  padding: '3px 6px',
                  fontSize: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
                aria-label="Custom page size"
              />
            )}
          </div>
        )}
      </div>

      {/* Pagination controls: prev {current page / total number of pages} next */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => {
            if (currentPage > 1) {
              onPageChange(currentPage - 1);
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 12px',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: currentPage <= 1 ? 'var(--bg-muted, #f1f5f9)' : 'var(--bg-surface)',
            color: currentPage <= 1 ? 'var(--text-muted, #94a3b8)' : 'var(--text-primary)',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage <= 1 ? 0.45 : 1,
            fontSize: '12.5px',
            fontWeight: 500,
            gap: '4px',
            transition: 'all 0.15s ease'
          }}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
          <span>Prev</span>
        </button>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 10px',
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            minWidth: '50px',
            userSelect: 'none'
          }}
        >
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => {
            if (currentPage < totalPages) {
              onPageChange(currentPage + 1);
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 12px',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: currentPage >= totalPages ? 'var(--bg-muted, #f1f5f9)' : 'var(--bg-surface)',
            color: currentPage >= totalPages ? 'var(--text-muted, #94a3b8)' : 'var(--text-primary)',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage >= totalPages ? 0.45 : 1,
            fontSize: '12.5px',
            fontWeight: 500,
            gap: '4px',
            transition: 'all 0.15s ease'
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

