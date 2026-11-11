import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const DataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  sortField,
  sortDirection = 'asc',
  onSort,
  emptyState,
  loading = false,
  footer,
  style = {}
}) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-xs)',
      overflow: 'hidden',
      ...style
    }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{
              backgroundColor: 'var(--bg-app)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              {columns.map((col) => {
                const isSorted = sortField === col.key;
                const isSortable = col.sortable && onSort;

                return (
                  <th
                    key={col.key}
                    scope="col"
                    onClick={() => isSortable && onSort(col.key)}
                    style={{
                      padding: '9px 12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: col.width || 'auto',
                      textAlign: col.align || 'left',
                      cursor: isSortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start'
                    }}>
                      <span>{col.header}</span>
                      {isSortable && (
                        <span style={{ color: isSorted ? 'var(--color-accent)' : 'var(--text-placeholder)' }}>
                          {isSorted ? (
                            sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                          ) : (
                            <ArrowUpDown size={13} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      border: '2px solid var(--color-primary)',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    <span>Loading data records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '32px' }}>
                  {emptyState || <EmptyState />}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowKey = row[keyField] || index;
                return (
                  <tr
                    key={rowKey}
                    style={{
                      borderBottom: index < data.length - 1 ? '1px solid var(--border-color-subtle)' : 'none',
                      transition: 'background-color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          padding: '8px 12px',
                          fontSize: '13px',
                          color: 'var(--text-primary)',
                          textAlign: col.align || 'left',
                          verticalAlign: 'middle',
                          width: col.width || 'auto'
                        }}
                      >
                        {col.render ? col.render(row[col.key], row, index) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
};

