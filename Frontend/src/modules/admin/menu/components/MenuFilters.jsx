import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

export const MenuFilters = ({
  searchTerm = '',
  onSearchChange,
  selectedCategory = 'ALL',
  onCategoryChange,
  selectedFoodType = 'ALL',
  onFoodTypeChange,
  selectedOutlet = 'ALL',
  onOutletChange,
  selectedStatus = 'ALL',
  onStatusChange,
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
      <div style={{ position: 'relative', flex: '1 1 220px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by item name or code..."
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

      {/* Category Dropdown */}
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
        <option value="Main Course">Main Course</option>
        <option value="Meals & Thalis">Meals & Thalis</option>
        <option value="Snacks & Quick Bites">Snacks & Quick Bites</option>
        <option value="Beverages">Beverages</option>
      </select>

      {/* Food Type */}
      <select
        value={selectedFoodType}
        onChange={(e) => onFoodTypeChange(e.target.value)}
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
        <option value="ALL">All Dietary Types</option>
        <option value="Veg">Pure Veg</option>
        <option value="Non-veg">Non-Veg</option>
        <option value="Egg">Egg</option>
      </select>

      {/* Outlet */}
      <select
        value={selectedOutlet}
        onChange={(e) => onOutletChange(e.target.value)}
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
        <option value="ALL">All Outlets</option>
        <option value="canteen-001">Central Dining Hall</option>
        <option value="canteen-002">North Campus Food Court</option>
        <option value="canteen-003">Engineering Block Kiosk</option>
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
        <option value="ALL">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>

      {/* Reset button */}
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

export default MenuFilters;

