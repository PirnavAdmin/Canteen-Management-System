import React from 'react';
import { SearchInput } from '../../../../components/common/SearchInput';
import { FilterDropdown } from '../../../../components/common/FilterDropdown';
import { CATEGORY_STATUS_OPTIONS } from '../constants/categoryConstants';
import { Button } from '../../../../components/common/Button';
import { RotateCcw, CheckCircle2 } from 'lucide-react';

export const CategoryFilters = ({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  onReset
}) => {
  const isFiltered = Boolean(searchTerm || selectedStatus !== 'ALL');

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      padding: '16px 20px',
      backgroundColor: '#ffffff',
      border: '1px solid var(--border-color)',
      borderBottom: 'none',
      borderTopLeftRadius: 'var(--border-radius-lg)',
      borderTopRightRadius: 'var(--border-radius-lg)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', flex: 1 }}>
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search by category name or description..."
          width="320px"
        />

        <FilterDropdown
          label="Status"
          value={selectedStatus}
          options={CATEGORY_STATUS_OPTIONS}
          onChange={onStatusChange}
          icon={CheckCircle2}
        />

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            icon={RotateCcw}
            style={{ color: 'var(--text-muted)' }}
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};

