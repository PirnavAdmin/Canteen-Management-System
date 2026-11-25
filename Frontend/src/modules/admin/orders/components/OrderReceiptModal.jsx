import React, { useState } from 'react';
import { Printer, Download, X, Loader2 } from 'lucide-react';
import { formatTimeIST, formatDate } from '../../../../utils/formatters';

// Clean Rupee component that uses Segoe UI / Arial so html2canvas & printers NEVER turn ₹ into ?
export const Rupee = ({ amount, bold = false, size = 'inherit' }) => {
  const val = Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <span style={{ whiteSpace: 'nowrap', fontWeight: bold ? 800 : 600, fontSize: size, display: 'inline' }}>
      <span
        style={{
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif",
          fontWeight: 700,
          marginRight: '2px'
        }}
      >
        ₹
      </span>
      <span>{val}</span>
    </span>
  );
};

export const OrderReceiptModal = ({ isOpen, onClose, order }) => {
  const [printFormat, setPrintFormat] = useState('thermal'); // 'thermal' | 'a4'
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!isOpen || !order) return null;

  const outletName = typeof order.outletName === 'object'
    ? (order.outletName?.name || order.outletName?.id || 'Main Canteen')
    : (order.outletName || (typeof order.outlet === 'object' ? (order.outlet?.name || order.outlet?.id) : (order.outlet || 'Main Canteen')));

  const orderDate = order.orderDate || order.createdAt;
  const paymentMethod = order.payment?.method || (typeof order.payment === 'string' ? order.payment : 'Cash');
  const paymentStatus = order.payment?.status || order.paymentStatus || 'Paid';
  const items = Array.isArray(order.items) ? order.items : [];

  // Print via isolated iframe to prevent Chromium modal scroll clipping
  const handlePrint = () => {
    const isThermal = printFormat === 'thermal';
    const targetElementId = isThermal ? 'printable-receipt-thermal' : 'printable-receipt-a4';
    const sourceEl = document.getElementById(targetElementId);

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
            <title>Receipt_${order.token || order.id}</title>
            <meta charset="utf-8" />
            <style>
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              @page {
                size: ${isThermal ? '80mm auto' : 'A4 portrait'};
                margin: ${isThermal ? '2mm' : '8mm'};
              }
              body {
                background: #ffffff;
                color: #000000;
                font-family: ${isThermal ? "'Courier New', Courier, monospace" : "'Segoe UI', Arial, sans-serif"};
                width: ${isThermal ? '76mm' : '100%'};
                margin: 0 auto;
                padding: ${isThermal ? '3mm 2mm' : '0'};
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

  // Direct html2canvas + jsPDF export guaranteeing strictly 1 SINGLE PAGE, lossless sharpness, and zero shadow/clip distortions
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const isThermal = printFormat === 'thermal';
      const targetElementId = isThermal ? 'printable-receipt-thermal' : 'printable-receipt-a4';
      const sourceEl = document.getElementById(targetElementId);

      if (!sourceEl) {
        window.print();
        return;
      }

      let html2canvasModule = null;
      let jsPDF = null;
      try {
        const h2cPkg = 'html2canvas';
        const jspdfPkg = 'jspdf';
        const h2c = await import(/* @vite-ignore */ h2cPkg);
        html2canvasModule = h2c.default || h2c;
        const jspdfMod = await import(/* @vite-ignore */ jspdfPkg);
        jsPDF = jspdfMod.jsPDF || jspdfMod.default;
      } catch (e) {
        console.warn('Direct PDF export library unavailable, using print fallback:', e);
        window.print();
        return;
      }

      const safeOutlet = String(outletName).replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeToken = String(order.token || order.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Receipt_${safeToken}_${safeOutlet}_${isThermal ? 'Thermal' : 'A4'}.pdf`;

      // Clean off-screen clone eliminates drop-shadows, modal scroll offsets, and viewport clipping
      const clone = sourceEl.cloneNode(true);
      clone.style.boxShadow = 'none';
      clone.style.filter = 'none';
      clone.style.margin = '0';
      clone.style.borderRadius = '0';

      if (isThermal) {
        clone.style.width = '300px';
        clone.style.maxWidth = '300px';
        clone.style.padding = '14px 16px';
        clone.style.backgroundColor = '#ffffff';
      } else {
        clone.style.width = '794px'; // 210mm at 96 DPI
        clone.style.maxWidth = '794px';
        clone.style.padding = '36px 40px';
        clone.style.backgroundColor = '#ffffff';
      }

      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '0';
      wrapper.style.width = isThermal ? '300px' : '794px';
      wrapper.style.backgroundColor = '#ffffff';
      wrapper.style.zIndex = '-9999';
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      let canvas;
      try {
        canvas = await html2canvasModule(clone, {
          scale: 3, // Razor-sharp 300+ DPI
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: isThermal ? 300 : 794
        });
      } finally {
        if (wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
      }

      const imgData = canvas.toDataURL('image/png', 1.0);

      if (isThermal) {
        // Guaranteed strictly 1 single page matching the canvas aspect ratio
        const pdfWidthMm = 80;
        const pdfHeightMm = (canvas.height * pdfWidthMm) / canvas.width;

        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [pdfWidthMm, Math.ceil(pdfHeightMm)]
        });

        // 'NONE' ensures lossless PNG compression for razor-sharp text
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'NONE');
        doc.save(filename);
      } else {
        // A4 Document (210mm x 297mm)
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const marginX = 8;
        const marginY = 8;
        const printWidth = pageWidth - marginX * 2;
        const printHeight = (canvas.height * printWidth) / canvas.width;

        doc.addImage(imgData, 'PNG', marginX, marginY, printWidth, Math.min(printHeight, pageHeight - marginY * 2), undefined, 'NONE');
        doc.save(filename);
      }
    } catch (err) {
      console.error('Error generating receipt PDF, falling back to window.print():', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

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
        .receipt-modal-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
          scroll-behavior: smooth;
        }
        .receipt-modal-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>

      {/* Modal Container */}
      <div
        style={{
          backgroundColor: 'var(--modal-bg, #ffffff)',
          color: 'var(--text-primary, #1e293b)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: printFormat === 'thermal' ? '460px' : '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          transition: 'max-width 0.25s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div
          className="no-print"
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            flexShrink: 0
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Receipt Preview & Print
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Order {order.token} ({order.id}) • {outletName}
            </span>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Format Switcher */}
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--bg-muted, #f1f5f9)',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #e2e8f0)'
              }}
            >
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: printFormat === 'thermal' ? 'var(--color-primary, #1e3a8a)' : 'transparent',
                  color: printFormat === 'thermal' ? '#ffffff' : 'var(--text-secondary, #64748b)',
                  transition: 'all 0.15s ease'
                }}
                title="Print as compact 80mm POS Thermal Slip"
              >
                Thermal Print
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: printFormat === 'a4' ? 'var(--color-primary, #1e3a8a)' : 'transparent',
                  color: printFormat === 'a4' ? '#ffffff' : 'var(--text-secondary, #64748b)',
                  transition: 'all 0.15s ease'
                }}
                title="Print / Download as A4 Institutional Sheet"
              >
                A4 Size
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: 'var(--color-primary, #1e3a8a)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.15s ease'
              }}
              title="Print Receipt"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isGeneratingPDF ? 'not-allowed' : 'pointer',
                opacity: isGeneratingPDF ? 0.7 : 1,
                transition: 'opacity 0.15s ease'
              }}
              title="Download as single-page PDF"
            >
              {isGeneratingPDF ? (
                <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <Download size={13} />
              )}
              <span>Download PDF</span>
            </button>

            {/* Close Button */}
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
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body (Responsive with Hidden Scrollbar & Smooth Scroll) */}
        <div
          className="receipt-modal-scroll"
          style={{
            padding: '20px 16px',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-app, #f8fafc)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            flex: 1
          }}
        >
          {/* FORMAT 1: THERMAL RECEIPT SLIP (80mm) matching reference image */}
          {printFormat === 'thermal' && (
            <div
              id="printable-receipt-thermal-container"
              style={{
                width: '320px',
                filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.12))',
                margin: '0 auto',
                backgroundColor: '#ffffff'
              }}
            >
              {/* Jagged Top Edge */}
              <svg width="100%" height="7" viewBox="0 0 320 7" preserveAspectRatio="none" style={{ display: 'block' }}>
                <path
                  d="M0,7 L5,0 L10,7 L15,0 L20,7 L25,0 L30,7 L35,0 L40,7 L45,0 L50,7 L55,0 L60,7 L65,0 L70,7 L75,0 L80,7 L85,0 L90,7 L95,0 L100,7 L105,0 L110,7 L115,0 L120,7 L125,0 L130,7 L135,0 L140,7 L145,0 L150,7 L155,0 L160,7 L165,0 L170,7 L175,0 L180,7 L185,0 L190,7 L195,0 L200,7 L205,0 L210,7 L215,0 L220,7 L225,0 L230,7 L235,0 L240,7 L245,0 L250,7 L255,0 L260,7 L265,0 L270,7 L275,0 L280,7 L285,0 L290,7 L295,0 L300,7 L305,0 L310,7 L315,0 L320,7 Z"
                  fill="#ffffff"
                />
              </svg>

              {/* Thermal Slip Content (Tables ensure html2canvas never breaks columns or shifts text) */}
              <div
                id="printable-receipt-thermal"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  padding: '14px 18px',
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: '12px',
                  lineHeight: 1.45,
                  boxSizing: 'border-box',
                  width: '100%'
                }}
              >
                {/* Outlet Name (replaces shop name; address removed) */}
                <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '16.5px',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: '#000000'
                    }}
                  >
                    {outletName}
                  </h2>
                  <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '2px', letterSpacing: '0.02em' }}>
                    Apex Institute of Technology & Sciences
                  </div>
                </div>

                {/* Dashed Separator */}
                <div style={{ borderTop: '1px dashed #6b7280', margin: '7px 0', width: '100%' }} />

                {/* Receipt Title */}
                <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '12.5px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#111827' }}>
                  {paymentMethod.toUpperCase()} RECEIPT
                </div>

                {/* Dashed Separator */}
                <div style={{ borderTop: '1px dashed #6b7280', margin: '7px 0', width: '100%' }} />

                {/* Order Meta Info in Table Layout */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', lineHeight: '1.6', marginBottom: '4px' }}>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'left', color: '#374151', width: '40%' }}>TOKEN:</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '13px', width: '60%', color: '#111827' }}>{order.token}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'left', color: '#374151' }}>ORDER ID:</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>#{order.id}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'left', color: '#374151' }}>DATE:</td>
                      <td style={{ textAlign: 'right' }}>{orderDate ? `${formatDate(orderDate)}, ${formatTimeIST(orderDate)}` : '—'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Dashed Separator */}
                <div style={{ borderTop: '1px dashed #6b7280', margin: '7px 0', width: '100%' }} />

                {/* Items Breakdown Table (Fixed column widths guarantee zero text fragmentation) */}
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '11.5px', margin: '4px 0 6px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px dashed #9ca3af' }}>
                      <th style={{ textAlign: 'left', padding: '4px 0', fontWeight: 700, width: '68%', color: '#111827' }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 700, width: '32%', color: '#111827' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const itemQty = Number(item.quantity || 1);
                      const itemPrice = Number(item.price || (order.totalAmount / (items.length || 1)));
                      const itemTotal = Number(item.total || itemPrice * itemQty);

                      return (
                        <tr key={idx} style={{ borderBottom: idx === items.length - 1 ? 'none' : '1px dotted #e5e7eb' }}>
                          <td style={{ padding: '5px 0', verticalAlign: 'top', wordBreak: 'break-word', width: '68%' }}>
                            <div style={{ fontWeight: 600, color: '#111827' }}>
                              {item.name} <span style={{ color: '#4b5563', fontWeight: 500 }}>(x{itemQty})</span>
                            </div>
                            {item.variant && (
                              <div style={{ fontSize: '9.5px', color: '#6b7280' }}>
                                ({typeof item.variant === 'object' ? (item.variant.name || item.variant.id) : item.variant}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '5px 0', textAlign: 'right', verticalAlign: 'top', width: '32%', whiteSpace: 'nowrap', fontWeight: 600 }}>
                            <Rupee amount={itemTotal} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Dashed Separator */}
                <div style={{ borderTop: '1px dashed #6b7280', margin: '7px 0', width: '100%' }} />

                {/* Total Section */}
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: '6px 0' }}>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'left', fontSize: '14px', fontWeight: 800, color: '#111827' }}>Total</td>
                      <td style={{ textAlign: 'right', fontSize: '15px', fontWeight: 800, color: '#111827' }}>
                        <Rupee amount={order.totalAmount} bold size="15px" />
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Payment Breakdown (showing type of payment) */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', lineHeight: '1.6', marginTop: '4px' }}>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'left', color: '#374151' }}>Payment Type:</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#111827' }}>{paymentMethod}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'left', color: '#374151' }}>Payment Status:</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#047857' }}>{paymentStatus}</td>
                    </tr>
                    {order.payment?.transactionId && (
                      <tr>
                        <td style={{ textAlign: 'left', color: '#6b7280', fontSize: '10px' }}>Txn Ref:</td>
                        <td style={{ textAlign: 'right', color: '#6b7280', fontSize: '10px' }}>{order.payment.transactionId}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Dashed Separator */}
                <div style={{ borderTop: '1px dashed #6b7280', margin: '8px 0 6px', width: '100%' }} />

                {/* Thank You Note (Barcode is removed) */}
                <div style={{ textAlign: 'center', marginTop: '8px', paddingBottom: '2px' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.08em', color: '#111827' }}>
                    THANK YOU!
                  </div>
                  <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '2px' }}>
                    Please show your token at the counter.
                  </div>
                </div>
              </div>

              {/* Jagged Bottom Edge */}
              <svg width="100%" height="7" viewBox="0 0 320 7" preserveAspectRatio="none" style={{ display: 'block' }}>
                <path
                  d="M0,0 L5,7 L10,0 L15,7 L20,0 L25,7 L30,0 L35,7 L40,0 L45,7 L50,0 L55,7 L60,0 L65,7 L70,0 L75,7 L80,0 L85,7 L90,0 L95,7 L100,0 L105,7 L110,0 L115,7 L120,0 L125,7 L130,0 L135,7 L140,0 L145,7 L150,0 L155,7 L160,0 L165,7 L170,0 L175,7 L180,0 L185,7 L190,0 L195,7 L200,0 L205,7 L210,0 L215,7 L220,0 L225,7 L230,0 L235,7 L240,0 L245,7 L250,0 L255,7 L260,0 L265,7 L270,0 L275,7 L280,0 L285,7 L290,0 L295,7 L300,0 L305,7 L310,0 L315,7 L320,0 Z"
                  fill="#ffffff"
                />
              </svg>
            </div>
          )}

          {/* FORMAT 2: A4 DOCUMENT RECEIPT */}
          {printFormat === 'a4' && (
            <div
              id="printable-receipt-a4"
              style={{
                width: '680px',
                backgroundColor: '#ffffff',
                color: '#111827',
                padding: '36px 40px',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                boxSizing: 'border-box',
                fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif",
                margin: '0 auto'
              }}
            >
              {/* Institutional Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1e3a8a', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.02em' }}>
                    Apex Institute of Technology & Sciences
                  </h1>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#4b5563', marginTop: '2px' }}>
                    Campus Dining Services • {outletName}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-block', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '6px 14px' }}>
                    <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 600 }}>TOKEN NUMBER</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a8a' }}>{order.token}</div>
                  </div>
                </div>
              </div>

              {/* Receipt Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', fontSize: '13px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Order Details
                  </div>
                  <div><strong>Order ID:</strong> #{order.id}</div>
                  <div><strong>Date:</strong> {orderDate ? `${formatDate(orderDate)}, ${formatTimeIST(orderDate)}` : '—'}</div>
                  <div><strong>Outlet:</strong> {outletName}</div>
                  <div><strong>Status:</strong> {order.status}</div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Payment Information
                  </div>
                  <div><strong>Payment Method:</strong> {paymentMethod}</div>
                  <div><strong>Payment Status:</strong> <span style={{ color: '#047857', fontWeight: 700 }}>{paymentStatus}</span></div>
                  {order.payment?.transactionId && <div><strong>Transaction Ref:</strong> {order.payment.transactionId}</div>}
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div style={{ marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                      <th style={{ padding: '9px 12px', fontWeight: 600, width: '40px', borderRadius: '4px 0 0 0' }}>#</th>
                      <th style={{ padding: '9px 12px', fontWeight: 600 }}>Description</th>
                      <th style={{ padding: '9px 12px', fontWeight: 600, textAlign: 'center', width: '60px' }}>Qty</th>
                      <th style={{ padding: '9px 12px', fontWeight: 600, textAlign: 'right', width: '100px' }}>Unit Price</th>
                      <th style={{ padding: '9px 12px', fontWeight: 600, textAlign: 'right', width: '110px', borderRadius: '0 4px 0 0' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const itemQty = Number(item.quantity || 1);
                      const itemPrice = Number(item.price || (order.totalAmount / (items.length || 1)));
                      const itemTotal = Number(item.total || itemPrice * itemQty);

                      return (
                        <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>{index + 1}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                            {item.name}
                            {item.variant && (
                              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: 400 }}>
                                {typeof item.variant === 'object' ? (item.variant.name || item.variant.id) : item.variant}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>{itemQty}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <Rupee amount={itemPrice} />
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                            <Rupee amount={itemTotal} bold />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total & Summary Box */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
                <div style={{ width: '280px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Subtotal:</span>
                    <Rupee amount={order.totalAmount} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Taxes / Canteen Surcharge:</span>
                    <Rupee amount={0} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1e3a8a', paddingTop: '8px', fontSize: '16px', fontWeight: 800, color: '#1e3a8a' }}>
                    <span>Total Amount:</span>
                    <Rupee amount={order.totalAmount} bold size="16px" />
                  </div>
                </div>
              </div>

              {/* Institutional Footer (No barcode) */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
                <div>
                  Official electronic receipt. Please present your token at <strong>{outletName}</strong> counter for food collection.
                </div>
                <div style={{ fontWeight: 600 }}>
                  Apex Campus Dining System
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderReceiptModal;
