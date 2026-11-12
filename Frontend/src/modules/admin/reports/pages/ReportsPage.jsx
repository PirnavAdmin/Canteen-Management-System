import React, { useState } from 'react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { DataTable } from '../../../../components/tables/DataTable';
import { useReports } from '../hooks/useReports';
import { ReportFilters } from '../components/ReportFilters';
import { ReportSummaryHeader } from '../components/ReportSummaryHeader';
import { exportToCSV, exportToExcel, triggerPrintPDF } from '../utils/exportUtils';
import { REPORT_OPTIONS } from '../constants/reportConstants';

export const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState('sales_summary');
  const [selectedOutlet, setSelectedOutlet] = useState('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState('today');
  const [selectedPayment, setSelectedPayment] = useState('ALL');

  const { reportData, loading } = useReports(selectedReport, {
    outlet: selectedOutlet,
    dateRange: selectedDateRange,
    payment: selectedPayment
  });

  const activeReportConfig = REPORT_OPTIONS.find(r => r.id === selectedReport) || REPORT_OPTIONS[0];

  const handleExportCSV = () => {
    if (!reportData) return;
    exportToCSV(`CMS_Report_${selectedReport}`, reportData.columns, reportData.rows);
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    exportToExcel(`CMS_Report_${selectedReport}`, reportData.columns, reportData.rows);
  };

  return (
    <div>
      <PageHeader
        title="Reports & Financial Analytics"
        description="Statutory GST tax reporting, daily/monthly revenue reconciliation, kitchen wastage audits, item performance, and capacity analytics."
        breadcrumbItems={[
          { label: 'Admin' },
          { label: 'Reports & Analytics' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={Download}
              onClick={handleExportCSV}
              disabled={!reportData}
            >
              CSV
            </Button>
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
              onClick={triggerPrintPDF}
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
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {activeReportConfig.label}
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Classification: {activeReportConfig.category} • Institutional Verified Records
            </span>
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
    </div>
  );
};

export default ReportsPage;
