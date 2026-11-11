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
      backgroundColor: '#ffffff',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '12px 16px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
      boxShadow: 'var(--shadow-xs)'
    }}>
      {/* Search Input */}
      <div style={{ position: 'relative', flex: '1 1 200px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by ticket ID, student, or keyword..."
          style={{
            width: '100%',
            height: '36px',
            padding: '0 12px 0 32px',
            fontSize: '13px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--bg-app)',
            outline: 'none'
          }}
        />
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: '10px',
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
          height: '36px',
          padding: '0 10px',
          fontSize: '13px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: '#ffffff',
          color: 'var(--text-secondary)'
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
          height: '36px',
          padding: '0 10px',
          fontSize: '13px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: '#ffffff',
          color: 'var(--text-secondary)'
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
          height: '36px',
          padding: '0 10px',
          fontSize: '13px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: '#ffffff',
          color: 'var(--text-secondary)'
        }}
      >
        <option value="ALL">All Ticket Statuses</option>
        {Object.values(FEEDBACK_STATUS).map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Reset */}
      <button
        type="button"
        onClick={onReset}
        style={{
          height: '36px',
          padding: '0 12px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12.5px',
          cursor: 'pointer'
        }}
      >
        <RotateCcw size={13} />
        <span>Reset</span>
      </button>
    </div>
  );
};

export default FeedbackFilters;
