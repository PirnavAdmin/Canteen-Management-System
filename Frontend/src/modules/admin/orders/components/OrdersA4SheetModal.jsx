import React, { useState } from 'react';
import { Printer, Download, X, Loader2 } from 'lucide-react';
import { formatTimeIST } from '../../../../utils/formatters';
import { Rupee } from './OrderReceiptModal';

export const OrdersA4SheetModal = ({
  isOpen,
  onClose,
  orders = [],
  activeFilters = {}
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!isOpen) return null;

  const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const paidCount = orders.filter(o => o.payment?.status === 'Paid' || o.paymentStatus === 'Paid').length;
  const completedCount = orders.filter(o => ['Completed', 'Collected'].includes(o.status)).length;
  const activeCount = orders.filter(o => ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup'].includes(o.status)).length;
  const cancelledCount = orders.filter(o => ['Cancelled', 'Refunded'].includes(o.status)).length;

  const handlePrint = () => {
    const sourceEl = document.getElementById('printable-orders-a4-sheet');
    if (!sourceEl) {
      window.print();
      return;
    }

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>CMS_Orders_Report_A4</title>
            <meta charset="utf-8" />
            <style>
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              @page {
                size: A4 landscape;
                margin: 8mm;
              }
              body {
                background: #ffffff;
                color: #000000;
                font-family: 'Segoe UI', Arial, sans-serif;
                width: 100%;
                margin: 0 auto;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
            </style>
          </head>
          <body>
            ${sourceEl.innerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {}
        }, 1500);
      }, 350);
    } catch (e) {
      console.warn('Iframe print fallback to window.print:', e);
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const sourceEl = document.getElementById('printable-orders-a4-sheet');
      if (!sourceEl) {
        window.print();
        return;
      }

      let html2canvasModule = null;
      let jsPDF = null;
      try {
        html2canvasModule = (await import(/* @vite-ignore */ 'html2canvas')).default;
        const jspdfModule = await import(/* @vite-ignore */ 'jspdf');
        jsPDF = jspdfModule.jsPDF;
      } catch (e) {
        window.print();
        return;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const safeOutlet = String(activeFilters.outlet || 'All_Outlets').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `CMS_Orders_Report_${safeOutlet}_${dateStr}_A4.pdf`;

      // Clean off-screen clone removes scrollbars, box-shadows, and layout shifts
      const clone = sourceEl.cloneNode(true);
      clone.style.boxShadow = 'none';
      clone.style.filter = 'none';
      clone.style.margin = '0';
      clone.style.width = '1122px'; // Standard A4 Landscape (297mm at 96 DPI)
      clone.style.backgroundColor = '#ffffff';

      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '0';
      wrapper.style.width = '1122px';
      wrapper.style.backgroundColor = '#ffffff';
      wrapper.style.zIndex = '-9999';
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      let canvas;
      try {
        canvas = await html2canvasModule(clone, {
          scale: 2.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1122
        });
      } finally {
        if (wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
      }

      const imgData = canvas.toDataURL('image/png', 1.0);

      // A4 Landscape: 297mm width x 210mm height
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 8;
      const printWidth = pageWidth - margin * 2;
      const printHeight = (canvas.height * printWidth) / canvas.width;

      doc.addImage(imgData, 'PNG', margin, margin, printWidth, Math.min(printHeight, pageHeight - margin * 2), undefined, 'NONE');
      doc.save(filename);
    } catch (err) {
      console.error('PDF generation error, falling back to window.print():', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const formattedGeneratedAt = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        overflow: 'hidden'
      }}
    >
      <style>{`
        .sheet-modal-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
          scroll-behavior: smooth;
        }
        .sheet-modal-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>

      {/* Modal Box */}
      <div
        style={{
          backgroundColor: 'var(--modal-bg, #ffffff)',
          color: 'var(--text-primary, #1e293b)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          className="no-print"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            flexShrink: 0
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Download & Print A4 Sheet
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              A4 Landscape configuration generated according to active filters ({orders.length} orders)
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                backgroundColor: 'var(--color-primary, #1e3a8a)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Print A4 Sheet"
            >
              <Printer size={14} />
              <span>Print A4</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: isGeneratingPDF ? 'not-allowed' : 'pointer',
                opacity: isGeneratingPDF ? 0.7 : 1
              }}
              title="Download A4 PDF"
            >
              {isGeneratingPDF ? (
                <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <Download size={14} />
              )}
              <span>Download A4 PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Sheet Preview Container (Hidden Scrollbar + Smooth Scroll) */}
        <div
          className="sheet-modal-scroll"
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-app, #f8fafc)',
            display: 'flex',
            justifyContent: 'center',
            flex: 1
          }}
        >
          {/* Printable A4 Sheet Body */}
          <div
            id="printable-orders-a4-sheet"
            style={{
              width: '100%',
              maxWidth: '1000px',
              backgroundColor: '#ffffff',
              color: '#111827',
              padding: '24px 28px',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              boxSizing: 'border-box',
              fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif"
            }}
          >
            {/* Institution Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1e3a8a', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.02em' }}>
                  Apex Institute of Technology & Sciences
                </h1>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#4b5563', marginTop: '2px' }}>
                  Canteen Management System • Orders & Live Queue Summary (A4 Sheet)
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
                <div><strong>Generated:</strong> {formattedGeneratedAt}</div>
                <div><strong>Outlet Filter:</strong> {activeFilters.outlet || 'All Outlets'}</div>
                <div><strong>Date Filter:</strong> {activeFilters.date || 'Today (IST)'}</div>
              </div>
            </div>

            {/* KPI Summary Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '10px',
                marginBottom: '16px',
                backgroundColor: '#f8fafc',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '12px'
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Total Orders</span>
                <strong style={{ fontSize: '15px', color: '#1e3a8a' }}>{orders.length}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Total Revenue</span>
                <strong style={{ fontSize: '15px', color: '#047857' }}>
                  <Rupee amount={totalAmount} bold size="15px" />
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Paid Transactions</span>
                <strong style={{ fontSize: '15px', color: '#0284c7' }}>{paidCount}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Active / In-Prep</span>
                <strong style={{ fontSize: '15px', color: '#d97706' }}>{activeCount}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Completed / Picked</span>
                <strong style={{ fontSize: '15px', color: '#10b981' }}>{completedCount}</strong>
              </div>
            </div>

            {/* Orders Table with fixed column widths so cells never shift */}
            <div style={{ overflowX: 'auto', marginBottom: '18px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                    <th style={{ padding: '8px 8px', fontWeight: 600, width: '50px' }}>Token</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600, width: '90px' }}>Order ID</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600, width: '65px' }}>Time</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600, width: '120px' }}>Customer</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600, width: '95px' }}>Outlet</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600 }}>Items Breakdown</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600, width: '85px' }}>Payment</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600, width: '85px' }}>Status</th>
                    <th style={{ padding: '8px 8px', fontWeight: 600, textAlign: 'right', width: '80px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                        No orders match the current filter selection.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order, idx) => {
                      const itemStr = (Array.isArray(order.items) ? order.items : [])
                        .map(i => `${i.name} (x${i.quantity || 1})`)
                        .join(', ') || '—';

                      const custName = typeof order.customer === 'object'
                        ? (order.customer?.name || order.customer?.fullName || 'Walk-in')
                        : (order.customer || 'Walk-in');

                      const outletStr = typeof order.outletName === 'object'
                        ? (order.outletName?.name || order.outletName?.id)
                        : (order.outletName || (typeof order.outlet === 'object' ? (order.outlet?.name || order.outlet?.id) : (order.outlet || 'Main Canteen')));

                      const orderDate = order.orderDate || order.createdAt;

                      return (
                        <tr
                          key={order.id || idx}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                          }}
                        >
                          <td style={{ padding: '7px 8px', fontWeight: 700, color: '#1e3a8a' }}>
                            {order.token}
                          </td>
                          <td style={{ padding: '7px 8px', color: '#4b5563', fontFamily: 'monospace', fontSize: '10.5px' }}>
                            {order.id}
                          </td>
                          <td style={{ padding: '7px 8px', whiteSpace: 'nowrap', color: '#4b5563' }}>
                            {orderDate ? formatTimeIST(orderDate) : '—'}
                          </td>
                          <td style={{ padding: '7px 8px', fontWeight: 600, wordBreak: 'break-word' }}>
                            {custName}
                          </td>
                          <td style={{ padding: '7px 8px', color: '#4b5563', wordBreak: 'break-word' }}>
                            {outletStr}
                          </td>
                          <td style={{ padding: '7px 8px', color: '#374151', wordBreak: 'break-word' }}>
                            {itemStr}
                          </td>
                          <td style={{ padding: '7px 8px' }}>
                            <div style={{ fontWeight: 600 }}>{order.payment?.method || 'Cash'}</div>
                            <div style={{ fontSize: '10px', color: order.payment?.status === 'Paid' ? '#047857' : '#b45309' }}>
                              {order.payment?.status || 'Paid'}
                            </div>
                          </td>
                          <td style={{ padding: '7px 8px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 5px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                backgroundColor: order.status === 'Completed' || order.status === 'Collected'
                                  ? '#dcfce7'
                                  : order.status === 'Cancelled'
                                  ? '#fee2e2'
                                  : '#dbeafe',
                                color: order.status === 'Completed' || order.status === 'Collected'
                                  ? '#15803d'
                                  : order.status === 'Cancelled'
                                  ? '#b91c1c'
                                  : '#1d4ed8'
                              }}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700 }}>
                            <Rupee amount={order.totalAmount} bold />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #1e3a8a', paddingTop: '10px', fontSize: '12px' }}>
              <div style={{ color: '#64748b' }}>
                Showing {orders.length} order entries. Verified institutional record.
              </div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Total Period Revenue:</span>
                <strong style={{ fontSize: '15px', color: '#1e3a8a' }}>
                  <Rupee amount={totalAmount} bold size="15px" />
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersA4SheetModal;
