import React, { useState } from 'react';
import { Eye, Edit, Power, Globe, GlobeLock, Trash2, Utensils, MoreVertical } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatCurrency, formatNumber } from '../../../../utils/formatters';

export const MenuTable = ({
  items = [],
  loading = false,
  onView,
  onEdit,
  onToggleStatus,
  onTogglePublish,
  onDelete,
  footer
}) => {
  const [popoverState, setPopoverState] = useState(null);

  const handleOpenPopover = (e, row) => {
    if (popoverState?.row?.id === row.id) {
      setPopoverState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const openUpward = rect.bottom + 145 > window.innerHeight - 12;
    setPopoverState({
      row,
      top: openUpward ? undefined : rect.bottom + 4,
      bottom: openUpward ? window.innerHeight - rect.top + 4 : undefined,
      right: Math.max(12, window.innerWidth - rect.right)
    });
  };

  const columns = [
    {
      key: 'name',
      header: 'Menu Item',
      width: '205px',
      render: (val, row) => {
        const typeColor = row.foodType === 'Veg' ? '#059669' : row.foodType === 'Non-veg' ? '#dc2626' : '#d97706';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
            {/* Small format dish photo in the list */}
            <div
              onClick={() => onView(row)}
              style={{
                position: 'relative',
                width: '38px',
                height: '38px',
                borderRadius: 'var(--border-radius-md)',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-muted)',
                border: '1px solid var(--border-color)',
                flexShrink: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-xs)'
              }}
              title={`View ${val} details`}
            >
              {row.imageUrl ? (
                <img
                  src={row.imageUrl}
                  alt={val}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div style={{
                display: row.imageUrl ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--text-muted)'
              }}>
                <Utensils size={15} />
              </div>
            </div>

            {/* Dish text with ellipsis and tooltip */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                {/* Dietary badge */}
                <div style={{
                  width: '11px',
                  height: '11px',
                  border: `1.5px solid ${typeColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1px',
                  flexShrink: 0
                }} title={row.foodType}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: typeColor }} />
                </div>

                <span
                  onClick={() => onView(row)}
                  title={`Dish: ${val} (Click to view details)`}
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block',
                    maxWidth: '140px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                >
                  {val}
                </span>
              </div>

              <div
                title={`Outlet: ${row.outletName || 'Main Campus Dining'}`}
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '145px'
                }}
              >
                {row.outletName || 'Main Campus Dining'}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'code',
      header: 'Code',
      width: '70px',
      render: (val) => (
        <code
          title={`SKU Code: ${val}`}
          style={{
            backgroundColor: 'var(--bg-muted)',
            padding: '2px 5px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap'
          }}
        >
          {val}
        </code>
      )
    },
    {
      key: 'category',
      header: 'Category',
      width: '100px',
      render: (val) => (
        <span
          title={`Category: ${val}`}
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
            maxWidth: '95px'
          }}
        >
          {val}
        </span>
      )
    },
    {
      key: 'price',
      header: 'Price',
      width: '75px',
      render: (val) => (
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'dailyCapacity',
      header: 'Capacity',
      width: '100px',
      render: (val, row) => {
        const remaining = row.remainingCapacity ?? val;
        const percent = Math.min(100, Math.round((remaining / (val || 1)) * 100));
        return (
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', minWidth: '85px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span><strong>{formatNumber(remaining)}</strong>/{formatNumber(val)}</span>
              <span style={{ color: 'var(--text-muted)' }}>{percent}%</span>
            </div>
            <div
              title={`${remaining} of ${val} portions remaining`}
              style={{
                width: '100%',
                height: '5px',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: '999px',
                overflow: 'hidden'
              }}
            >
              <div style={{
                width: `${percent}%`,
                height: '100%',
                backgroundColor: percent <= 20 ? 'var(--color-danger)' : percent <= 50 ? 'var(--color-warning)' : '#10b981',
                borderRadius: '999px'
              }} />
            </div>
          </div>
        );
      }
    },
    {
      key: 'publicationStatus',
      header: 'Publish',
      width: '95px',
      render: (val) => {
        const isPub = val === 'Published';
        return (
          <span
            title={`Publication state: ${val}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 7px',
              borderRadius: 'var(--border-radius-full)',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: isPub ? 'var(--color-primary-light)' : 'var(--bg-muted)',
              color: isPub ? 'var(--color-primary)' : 'var(--text-muted)',
              border: `1px solid ${isPub ? 'var(--color-primary-border)' : 'var(--border-color)'}`,
              whiteSpace: 'nowrap'
            }}
          >
            {isPub ? <Globe size={11} /> : <GlobeLock size={11} />}
            <span>{val}</span>
          </span>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      width: '80px',
      render: (val) => <StatusBadge status={val} size="sm" />
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '92px',
      render: (_, row) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            {/* Primary Action 1: View Details */}
            <button
              type="button"
              onClick={() => onView(row)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 5px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="View Details"
            >
              <Eye size={13} />
            </button>

            {/* Primary Action 2: Edit Item */}
            <button
              type="button"
              onClick={() => onEdit(row)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 5px',
                color: 'var(--color-accent)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Edit Item"
            >
              <Edit size={13} />
            </button>

            {/* Three Dots Button: Opens Floating Popover at Column */}
            <button
              type="button"
              onClick={(e) => handleOpenPopover(e, row)}
              style={{
                background: popoverState?.row?.id === row.id ? 'var(--bg-muted)' : 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 5px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="More actions"
              aria-label="More actions"
            >
              <MoreVertical size={13} />
            </button>
          </div>
        );
      }
    }
  ];

  const targetRow = popoverState?.row;
  const isActive = targetRow?.status === 'Active';
  const isPublished = targetRow?.publicationStatus === 'Published';

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        footer={footer}
      />

      {/* Floating Action Popover anchored directly at the 3-dots column */}
      {popoverState && (
        <>
          <div
            onClick={() => setPopoverState(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 75
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: popoverState.top,
              bottom: popoverState.bottom,
              right: popoverState.right,
              backgroundColor: 'var(--modal-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              boxShadow: 'var(--shadow-modal)',
              zIndex: 80,
              minWidth: '175px',
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setPopoverState(null);
                onTogglePublish(targetRow);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: 'none',
                color: isPublished ? 'var(--color-warning)' : 'var(--color-primary)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-muted)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {isPublished ? <GlobeLock size={14} /> : <Globe size={14} />}
              <span>{isPublished ? 'Unpublish (Draft)' : 'Publish Item'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPopoverState(null);
                onToggleStatus(targetRow);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: 'none',
                color: isActive ? 'var(--color-danger)' : 'var(--color-success)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-muted)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Power size={14} />
              <span>{isActive ? 'Deactivate Dish' : 'Activate Dish'}</span>
            </button>

            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '2px 0' }} />

            <button
              type="button"
              onClick={() => {
                setPopoverState(null);
                onDelete(targetRow);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: 'none',
                color: 'var(--color-danger)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-danger-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Trash2 size={14} />
              <span>Delete Menu Item</span>
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default MenuTable;
