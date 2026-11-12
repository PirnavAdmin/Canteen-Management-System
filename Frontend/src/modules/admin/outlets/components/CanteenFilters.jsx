import React from 'react';
import { SearchInput } from '../../../../components/common/SearchInput';
import { FilterDropdown } from '../../../../components/common/FilterDropdown';
import { CAMPUSES, STATUS_OPTIONS } from '../constants/canteenConstants';
import { Button } from '../../../../components/common/Button';
import { RotateCcw, MapPin, CheckCircle2 } from 'lucide-react';

export const CanteenFilters = ({
  searchTerm,
  onSearchChange,
  selectedCampus,
  onCampusChange,
  selectedStatus,
  onStatusChange,
  onReset
}) => {
  const isFiltered = Boolean(searchTerm || selectedCampus !== 'ALL' || selectedStatus !== 'ALL');

  const campusOptions = [
    { value: 'ALL', label: 'All Campuses' },
    ...CAMPUSES.map(c => ({ value: c, label: c }))
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      padding: '16px 20px',
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderBottom: 'none',
      borderTopLeftRadius: 'var(--border-radius-lg)',
      borderTopRightRadius: 'var(--border-radius-lg)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', flex: 1 }}>
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search by name, code, location..."
          width="300px"
        />

        <FilterDropdown
          label="Campus"
          value={selectedCampus}
          options={campusOptions}
          onChange={onCampusChange}
          icon={MapPin}
        />

        <FilterDropdown
          label="Status"
          value={selectedStatus}
          options={STATUS_OPTIONS}
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

