import React, { useState } from 'react';
import { Eye, Edit, Power, Globe, GlobeLock, Trash2, Utensils, MoreVertical, X } from 'lucide-react';
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
  const [actionModalRow, setActionModalRow] = useState(null);

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
      width: '95px',
      render: (val, row) => (
        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          <div><strong>{formatNumber(row.remainingCapacity ?? val)}</strong> / {formatNumber(val)}</div>
          <div style={{
            width: '50px',
            height: '4px',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: '2px',
            marginTop: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.round(((row.remainingCapacity ?? val) / val) * 100)}%`,
              height: '100%',
              backgroundColor: '#10b981'
            }} />
          </div>
        </div>
      )
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
      align: 'right',
      width: '92px',
      render: (_, row) => {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
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
                cursor: 'pointer'
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
                cursor: 'pointer'
              }}
              title="Edit Item"
            >
              <Edit size={13} />
            </button>

            {/* Three Dots Button: Opens Small Secondary Actions Modal */}
            <button
              type="button"
              onClick={() => setActionModalRow(row)}
              style={{
                background: actionModalRow?.id === row.id ? 'var(--bg-muted)' : 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 5px',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
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

  const isActive = actionModalRow?.status === 'Active';
  const isPublished = actionModalRow?.publicationStatus === 'Published';

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        footer={footer}
      />

      {/* Small Compact Modal for Secondary Actions triggered by 3-dots */}
      {actionModalRow && (
        <div
          onClick={() => setActionModalRow(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 80,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--modal-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-lg)',
              boxShadow: 'var(--shadow-modal)',
              width: '100%',
              maxWidth: '300px',
              overflow: 'hidden'
            }}
          >
            {/* Small Modal Header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {actionModalRow.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Quick Item Actions ({actionModalRow.code})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionModalRow(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Remaining Action Icons & Labels */}
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  const target = actionModalRow;
                  setActionModalRow(null);
                  onTogglePublish(target);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--border-radius-md)',
                  border: 'none',
                  background: 'none',
                  color: isPublished ? 'var(--color-warning)' : 'var(--color-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-muted)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {isPublished ? <GlobeLock size={16} /> : <Globe size={16} />}
                <span>{isPublished ? 'Unpublish (Move to Draft)' : 'Publish Item'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = actionModalRow;
                  setActionModalRow(null);
                  onToggleStatus(target);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--border-radius-md)',
                  border: 'none',
                  background: 'none',
                  color: isActive ? 'var(--color-danger)' : 'var(--color-success)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-muted)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Power size={16} />
                <span>{isActive ? 'Deactivate Dish' : 'Activate Dish'}</span>
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '2px 0' }} />

              <button
                type="button"
                onClick={() => {
                  const target = actionModalRow;
                  setActionModalRow(null);
                  onDelete(target);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--border-radius-md)',
                  border: 'none',
                  background: 'none',
                  color: 'var(--color-danger)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-danger-bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Trash2 size={16} />
                <span>Delete Menu Item</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuTable;
