import React, { useState } from 'react';
import { Printer, Download, X, Building2, MapPin, Calendar, CreditCard, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Modal } from '../../../../components/modals/Modal';
import { Button } from '../../../../components/common/Button';

const DATE_RANGE_LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_7_days: 'Last 7 Days',
  month_to_date: 'Month to Date (MTD)',
  quarter_to_date: 'Current Academic Term'
};

export const ReportPrintPreviewModal = ({
  isOpen,
  onClose,
  reportConfig,
  reportData,
  campus = 'Main Campus',
  outletName = 'All Outlets',
  dateRange = 'today',
  paymentMethod = 'ALL'
}) => {
  if (!isOpen) return null;

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-report-sheet');
    if (!element) return;

    try {
      setIsGeneratingPDF(true);
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const safeReportName = (reportConfig?.label || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeCampus = (campus || 'Main_Campus').replace(/[^a-zA-Z0-9_-]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `CMS_${safeReportName}_${safeCampus}_${dateStr}.pdf`;

      const opt = {
        margin: [8, 8, 8, 8],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Direct PDF export error, falling back to window.print():', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const columns = reportData?.columns || [];
  const rows = reportData?.rows || [];
  const metrics = reportData?.summaryMetrics || null;

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Print & PDF Preview"
      subtitle="Review the compiled institutional report for your selected campus and outlet before printing or downloading."
      maxWidth="920px"
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-report-sheet, #printable-report-sheet * {
            visibility: visible !important;
          }
          #printable-report-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            z-index: 99999 !important;
          }
        }
      `}</style>

      {/* Top Action Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-md)',
        marginBottom: '16px',
        border: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Target: <strong>{campus}</strong> • <strong>{outletName}</strong> • {DATE_RANGE_LABELS[dateRange] || dateRange}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={isGeneratingPDF ? Loader2 : Download}
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? 'Downloading PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Printable Sheet Viewport */}
      <div
        id="printable-report-sheet"
        style={{
          backgroundColor: '#ffffff',
          color: '#0f172a',
          padding: '28px 32px',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid #cbd5e1',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Institutional Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid #0f172a',
          paddingBottom: '16px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '13px'
              }}>
                A
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                APEX INSTITUTE OF TECHNOLOGY & SCIENCES
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#475569', fontWeight: 500 }}>
              Office of Dining Facilities & Canteen Management Services
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '4px'
            }}>
              Official Audit Report
            </span>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Generated: {formattedDate}
            </div>
          </div>
        </div>

        {/* Report Scope & Parameters Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
          padding: '12px 14px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <div>
            <span style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Report Type
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>
              {reportConfig?.label || 'Consolidated Sales Report'}
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Campus
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <MapPin size={12} style={{ color: '#0284c7' }} />
              {campus}
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Dining Outlet
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b' }}>
              {outletName}
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Date Horizon
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Calendar size={12} style={{ color: '#16a34a' }} />
              {DATE_RANGE_LABELS[dateRange] || dateRange}
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Payment Channel
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b' }}>
              {paymentMethod === 'ALL' ? 'All Channels' : paymentMethod}
            </span>
          </div>
        </div>

        {/* Summary Metric Strip if metrics available */}
        {metrics && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            marginBottom: '20px'
          }}>
            {Object.entries(metrics).map(([key, val]) => {
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              const displayVal = typeof val === 'number' && (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('sales') || key.toLowerCase().includes('amount'))
                ? `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : String(val);

              return (
                <div key={key} style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {displayVal}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Data Records Table */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11.5px',
            textAlign: 'left'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1' }}>
                <th style={{ padding: '8px 12px', width: '40px', color: '#475569', fontWeight: 700 }}>#</th>
                {columns.map(col => (
                  <th key={col.key} style={{ padding: '8px 12px', color: '#1e293b', fontWeight: 700 }}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}
                  >
                    No matching record entries found for {campus} ({outletName}) under {DATE_RANGE_LABELS[dateRange] || dateRange}.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                    }}
                  >
                    <td style={{ padding: '7px 12px', color: '#64748b', fontWeight: 600 }}>
                      {index + 1}
                    </td>
                    {columns.map(col => {
                      const cellValue = row[col.key];
                      const display = cellValue !== undefined && cellValue !== null ? String(cellValue) : '--';
                      return (
                        <td key={col.key} style={{ padding: '7px 12px', color: '#334155' }}>
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Sign-off & Audit Trail */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingTop: '20px',
          borderTop: '1px dashed #cbd5e1',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <div>
            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
              Audit Verification Statement
            </div>
            <div>This document reflects live reconciled institutional database records.</div>
            <div style={{ fontSize: '10px', marginTop: '2px', color: '#94a3b8' }}>
              System Document ID: CMS-REP-{Date.now().toString().slice(-8)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '36px', textAlign: 'center' }}>
            <div>
              <div style={{ width: '130px', borderBottom: '1px solid #94a3b8', marginBottom: '4px' }} />
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>Canteen Administrator</span>
            </div>
            <div>
              <div style={{ width: '130px', borderBottom: '1px solid #94a3b8', marginBottom: '4px' }} />
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>Finance & Auditing Officer</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReportPrintPreviewModal;
