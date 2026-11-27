import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, ArrowRight, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export const KitchenRequestsCard = ({ requests = [], loading = false, selectedOutletName = 'All Campus Outlets' }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        padding: '12px 16px',
        boxShadow: 'var(--shadow-xs)',
        height: '300px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Skeleton Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="skeleton-box" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
            <div className="skeleton-box" style={{ width: '170px', height: '14px' }} />
          </div>
          <div className="skeleton-box" style={{ width: '90px', height: '14px' }} />
        </div>

        {/* Skeleton Body: Shimmering Rows */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color-subtle)',
                backgroundColor: 'var(--bg-app)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: 0 }}>
                <div className="skeleton-box" style={{ width: '150px', height: '12px' }} />
                <div className="skeleton-box" style={{ width: '190px', height: '10px' }} />
              </div>
              <div className="skeleton-box" style={{ width: '70px', height: '20px', borderRadius: '4px', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const itemsList = Array.isArray(requests) ? requests : [];

  const handleNavigate = () => {
    navigate('/admin/inventory', { state: { tab: 'kitchen-requests' } });
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-md)',
      border: '1px solid var(--border-color)',
      padding: '12px 16px',
      boxShadow: 'var(--shadow-xs)',
      height: '300px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Card Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginBottom: '10px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <ChefHat size={15} style={{ color: 'var(--color-primary, #2563eb)', flexShrink: 0 }} />
          <h3 style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }} title="Kitchen Requisition Requests">
            Kitchen Requisition Requests
          </h3>
        </div>

        <button
          type="button"
          onClick={handleNavigate}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-accent, #2563eb)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <span>Manage Requests</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Card Body with Scrollbar */}
      <div
        className="thin-scrollbar"
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}
      >
        {itemsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
            No pending kitchen requisition requests for {selectedOutletName}.
          </div>
        ) : (
          itemsList.map((req, idx) => {
            const s = (req.status || 'Pending').toLowerCase();
            const isRejected = s.includes('reject');

            let badgeLabel = 'Requested';
            let badgeBg = '#fffbeb';
            let badgeBorder = '#fde68a';
            let badgeColor = '#b45309';
            let rowBg = '#fffdfa';

            if (isRejected) {
              badgeLabel = 'Rejected';
              badgeBg = '#fef2f2';
              badgeBorder = '#fecaca';
              badgeColor = '#dc2626';
              rowBg = '#fefafa';
            } else if (s.includes('pending review') || s.includes('review') || s.includes('pending')) {
              badgeLabel = 'Pending';
              badgeBg = '#fffbeb';
              badgeBorder = '#fde68a';
              badgeColor = '#b45309';
              rowBg = '#fffdfa';
            } else {
              badgeLabel = 'Pending';
              badgeBg = '#fffbeb';
              badgeBorder = '#fde68a';
              badgeColor = '#b45309';
              rowBg = '#fffdfa';
            }

            const itemName = req.itemName || req.ingredientName || 'Kitchen Stock';
            const reqQty = Number(req.requestedQuantity ?? req.quantity ?? 1);
            const issQty = req.issuedQuantity !== undefined && req.issuedQuantity !== null ? Number(req.issuedQuantity) : null;
            const unit = req.unit || 'kg';
            const outletName = req.outletName || (req.outletId ? `Outlet #${req.outletId}` : 'Kitchen Outlet');
            const reqId = req.requestId || req.id || `REQ-${idx + 1}`;

            let dateDisplay = '';
            if (req.createdAt || req.requestDate) {
              const d = new Date(req.createdAt || req.requestDate);
              if (!isNaN(d.getTime())) {
                dateDisplay = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' +
                  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
            }

            return (
              <div
                key={req.id || req.requestId || idx}
                onClick={handleNavigate}
                title={`Click to view in Kitchen Requests: ${reqId}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: rowBg,
                  border: `1px solid ${badgeBorder}`,
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, transform 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    <strong style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                      {itemName}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700 }}>
                      • {reqQty} {unit}
                    </span>
                    {issQty !== null && issQty !== reqQty && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        (Issued: {issQty} {unit})
                      </span>
                    )}
                  </div>

                  <div style={{
                    fontSize: '10.5px',
                    color: 'var(--text-secondary)',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    <span style={{ fontWeight: 600 }}>{outletName}</span>
                    {reqId && <span> • <code>{reqId}</code></span>}
                    {dateDisplay && <span> • {dateDisplay}</span>}
                  </div>
                </div>

                <div style={{
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  backgroundColor: badgeBg,
                  color: badgeColor,
                  border: `1px solid ${badgeBorder}`,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  {badgeLabel}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default KitchenRequestsCard;
