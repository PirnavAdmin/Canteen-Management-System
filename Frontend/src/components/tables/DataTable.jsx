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
  // Validate table column definitions before rendering
  const validColumns = Array.isArray(columns)
    ? columns.filter((col) => col && typeof col === 'object' && Boolean(col.key))
    : [];

  // Handle missing or null row data safely
  const tableData = Array.isArray(data)
    ? data.filter((row) => row != null)
    : [];

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
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{
              backgroundColor: 'var(--bg-app)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              {validColumns.map((col, colIdx) => {
                const isSorted = Boolean(sortField && sortField === col.key);
                const isSortable = Boolean(col.sortable && onSort);
                const headerText = col.header ?? col.label ?? col.title ?? '';

                return (
                  <th
                    key={col.key || `col-${colIdx}`}
                    scope="col"
                    onClick={() => isSortable && onSort(col.key)}
                    style={{
                      padding: '8px 10px',
                      fontSize: '11px',
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
                      <span>{headerText}</span>
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
                <td colSpan={validColumns.length || 1} style={{ padding: '48px', textAlign: 'center' }}>
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
            ) : tableData.length === 0 ? (
              <tr>
                <td colSpan={validColumns.length || 1} style={{ padding: '32px' }}>
                  {React.isValidElement(emptyState) ? (
                    emptyState
                  ) : emptyState && typeof emptyState === 'object' ? (
                    <EmptyState
                      icon={emptyState.icon}
                      title={emptyState.title}
                      message={emptyState.message || emptyState.description}
                      actionLabel={emptyState.actionLabel}
                      onAction={emptyState.onAction}
                    />
                  ) : (
                    <EmptyState />
                  )}
                </td>
              </tr>
            ) : (
              tableData.map((row, index) => {
                const rowKey = (row && typeof row === 'object' && (row[keyField] ?? row.id ?? row._id ?? index)) ?? index;
                return (
                  <tr
                    key={rowKey}
                    style={{
                      borderBottom: index < tableData.length - 1 ? '1px solid var(--border-color-subtle)' : 'none',
                      transition: 'background-color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {validColumns.map((col, colIdx) => {
                      const cellValue = row && typeof row === 'object' && col.key ? row[col.key] : undefined;
                      let cellContent;

                      if (typeof col.render === 'function') {
                        try {
                          cellContent = col.render(cellValue, row, index);
                        } catch (renderError) {
                          console.warn(`DataTable: error rendering column "${col.key}":`, renderError);
                          cellContent = cellValue != null ? String(cellValue) : '—';
                        }
                      } else {
                        cellContent = cellValue != null ? cellValue : '—';
                      }

                      // Defensive guard: prevent plain objects (e.g. { id, name }) from crashing React render
                      if (cellContent !== null && typeof cellContent === 'object' && !React.isValidElement(cellContent)) {
                        cellContent = cellContent.name || cellContent.title || cellContent.label || cellContent.fullName || cellContent.id || '—';
                      }

                      return (
                        <td
                          key={col.key || `cell-${colIdx}`}
                          style={{
                            padding: '8px 10px',
                            fontSize: '12.5px',
                            color: 'var(--text-primary)',
                            textAlign: col.align || 'left',
                            verticalAlign: 'middle',
                            width: col.width || 'auto'
                          }}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
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

export default DataTable;
