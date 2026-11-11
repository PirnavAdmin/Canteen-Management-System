import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { COMPLAINT_CATEGORIES, FEEDBACK_STATUS } from '../../../../constants/appConstants';

export const FeedbackFilters = ({
  searchTerm = '',
  onSearchChange,
  selectedCategory = 'ALL',
  onCategoryChange,
  selectedStatus = 'ALL',
  onStatusChange,
  selectedRating = 'ALL',
  onRatingChange,
  onReset
}) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '10px 14px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'nowrap',
      overflowX: 'auto',
      boxShadow: 'var(--shadow-xs)'
    }}>
      {/* Search Input */}
      <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '160px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by ticket ID, student, or keyword..."
          style={{
            width: '100%',
            height: '34px',
            padding: '0 10px 0 30px',
            fontSize: '12.5px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        />
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: '9px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }}
        />
      </div>

      {/* Category */}
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        style={{
          height: '34px',
          padding: '0 8px',
          fontSize: '12.5px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          flexShrink: 0
        }}
      >
        <option value="ALL">All Categories</option>
        {COMPLAINT_CATEGORIES.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Rating */}
      <select
        value={selectedRating}
        onChange={(e) => onRatingChange(e.target.value)}
        style={{
          height: '34px',
          padding: '0 8px',
          fontSize: '12.5px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          flexShrink: 0
        }}
      >
        <option value="ALL">All Star Ratings</option>
        <option value="1">1 Star (Critical)</option>
        <option value="2">2 Stars (Poor)</option>
        <option value="3">3 Stars (Average)</option>
        <option value="4">4 Stars (Good)</option>
        <option value="5">5 Stars (Excellent)</option>
      </select>

      {/* Status */}
      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        style={{
          height: '34px',
          padding: '0 8px',
          fontSize: '12.5px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          flexShrink: 0
        }}
      >
        <option value="ALL">All Ticket Statuses</option>
        {Object.values(FEEDBACK_STATUS).map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Reset Icon Button */}
      <button
        type="button"
        onClick={onReset}
        title="Reset all filters"
        aria-label="Reset all filters"
        style={{
          width: '34px',
          height: '34px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all var(--transition-fast)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
          e.currentTarget.style.color = 'var(--color-accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
};

export default FeedbackFilters;
