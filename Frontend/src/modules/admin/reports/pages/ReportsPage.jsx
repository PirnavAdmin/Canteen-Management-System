import React, { useState, useMemo, useEffect } from 'react';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { DataTable } from '../../../../components/tables/DataTable';
import { useReports } from '../hooks/useReports';
import { ReportFilters } from '../components/ReportFilters';
import { ReportSummaryHeader } from '../components/ReportSummaryHeader';
import { ReportPrintPreviewModal } from '../components/ReportPrintPreviewModal';
import { exportToExcel } from '../utils/exportUtils';
import { REPORT_OPTIONS } from '../constants/reportConstants';
import { useCanteens } from '../../outlets/hooks/useCanteens';

export const ReportsPage = () => {
  const { selectedCampus, canteens, selectedOutlet: globalOutlet, setSelectedOutlet: setGlobalOutlet } = useCanteens();
  const [selectedReport, setSelectedReport] = useState('sales_summary');
  const [selectedOutlet, setSelectedOutlet] = useState(globalOutlet || 'ALL');
  const [selectedDateRange, setSelectedDateRange] = useState('today');
  const [selectedPayment, setSelectedPayment] = useState('ALL');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  useEffect(() => {
    setSelectedOutlet(globalOutlet || 'ALL');
  }, [globalOutlet]);

  const { reportData, loading } = useReports(selectedReport, {
    outlet: selectedOutlet,
    dateRange: selectedDateRange,
    payment: selectedPayment,
    campus: selectedCampus
  });

  const activeReportConfig = REPORT_OPTIONS.find(r => r.id === selectedReport) || REPORT_OPTIONS[0];

  const selectedOutletName = useMemo(() => {
    if (selectedOutlet === 'ALL') {
      return selectedCampus ? `All Outlets (${selectedCampus})` : 'All Outlets';
    }
    const found = canteens?.find(c => String(c.id || c.outletId) === String(selectedOutlet));
    return found ? found.name : 'All Outlets';
  }, [selectedOutlet, selectedCampus, canteens]);

  const handleExportExcel = () => {
    if (!reportData) return;
    exportToExcel(`CMS_Report_${selectedReport}`, reportData.columns, reportData.rows);
  };

  return (
    <div>
      <PageHeader
        title="Reports & Financial Analytics"
        breadcrumbItems={[
          { label: 'Admin' },
          { label: 'Reports & Analytics' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={FileSpreadsheet}
              onClick={handleExportExcel}
              disabled={!reportData}
            >
              Excel
            </Button>
            <Button
              variant="primary"
              icon={Printer}
              onClick={() => setIsPrintPreviewOpen(true)}
              disabled={!reportData}
            >
              Print / PDF
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <ReportFilters
        selectedReport={selectedReport}
        onReportChange={setSelectedReport}
        selectedOutlet={selectedOutlet}
        onOutletChange={setSelectedOutlet}
        selectedDateRange={selectedDateRange}
        onDateRangeChange={setSelectedDateRange}
        selectedPayment={selectedPayment}
        onPaymentChange={setSelectedPayment}
      />

      {/* KPI Metric Summary for Active Report */}
      {reportData?.summaryMetrics && (
        <ReportSummaryHeader metrics={reportData.summaryMetrics} />
      )}

      {/* Report Data Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {activeReportConfig.label}
            </h3>
          </div>

          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Total Records: <strong>{reportData?.rows?.length || 0}</strong>
          </span>
        </div>

        <DataTable
          columns={reportData?.columns || []}
          data={reportData?.rows || []}
          loading={loading}
          style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}
        />
      </div>

      {/* Print & PDF Preview Modal */}
      <ReportPrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        reportConfig={activeReportConfig}
        reportData={reportData}
        campus={selectedCampus || 'Main Campus'}
        outletName={selectedOutletName}
        dateRange={selectedDateRange}
        paymentMethod={selectedPayment}
      />
    </div>
  );
};

export default ReportsPage;
