import React, { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { DataTable } from '../../../components/tables/DataTable';
import { useCanteens } from '../../admin/outlets/hooks/useCanteens';
import CashierReportFilters from '../components/CashierReportFilters';
import { ReportSummaryHeader } from '../../admin/reports/components/ReportSummaryHeader';
import { ReportPrintPreviewModal } from '../../admin/reports/components/ReportPrintPreviewModal';
import { INITIAL_REPORT_DATA, REPORT_OPTIONS } from '../../admin/reports/constants/reportConstants';
import { reportService } from '../../admin/reports/services/reportService';
import { exportToExcel } from '../../admin/reports/utils/exportUtils';

/**
 * Cashier reporting deliberately reuses the shared reports data pipeline.
 * Server-side outlet/campus authorization remains the source of truth.
 */
export default function CashierReportsPage() {
  const { selectedCampus, canteens, selectedOutlet: globalOutlet } = useCanteens();
  const [selectedReport, setSelectedReport] = useState('sales_summary');
  const [selectedOutlet, setSelectedOutlet] = useState(globalOutlet || 'ALL');
  const [selectedDateRange, setSelectedDateRange] = useState('today');
  const [selectedPayment, setSelectedPayment] = useState('ALL');
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => setSelectedOutlet(globalOutlet || 'ALL'), [globalOutlet]);

  const assignedOutlet = useMemo(() => {
    if (selectedOutlet !== 'ALL') return selectedOutlet;
    const current = canteens?.[0];
    return current ? String(current.outletId || current.id) : 'ALL';
  }, [selectedOutlet, canteens]);

  const { reportData, loading, error, refreshReport } = useCashierReportData(selectedReport, {
    outlet: assignedOutlet, dateRange: selectedDateRange, payment: selectedPayment, campus: selectedCampus
  });
  const config = REPORT_OPTIONS.find(item => item.id === selectedReport) || REPORT_OPTIONS[0];
  const outletName = useMemo(() => {
    return canteens?.find(item => String(item.outletId || item.id) === String(assignedOutlet))?.name || 'Main Canteen';
  }, [assignedOutlet, canteens]);
  const exportReport = () => reportData && exportToExcel(`Cashier_Report_${selectedReport}`, reportData.columns, reportData.rows);

  return <div>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'16px', flexWrap:'wrap', marginBottom:'18px' }}>
      <div><h1 style={{ margin:0, color:'var(--text-primary)', fontSize:'26px', lineHeight:1.2 }}>Reports &amp; Financial Analytics</h1><p style={{ margin:'5px 0 0', color:'var(--text-secondary)', fontSize:'14px' }}>Authorized cashier collections and outlet performance.</p></div>
      <div style={{ display:'flex', gap:'8px' }}><Button variant="secondary" icon={FileSpreadsheet} onClick={exportReport} disabled={!reportData}>Excel</Button><Button variant="primary" icon={Printer} onClick={() => setPrintOpen(true)} disabled={!reportData}>Print / PDF</Button></div>
    </div>
    <CashierReportFilters selectedReport={selectedReport} onReportChange={setSelectedReport} campusName={selectedCampus || 'Main Campus'} outletName={outletName} selectedDateRange={selectedDateRange} onDateRangeChange={setSelectedDateRange} selectedPayment={selectedPayment} onPaymentChange={setSelectedPayment}/>
    {error && <div style={{ marginBottom:'16px', padding:'12px 14px', border:'1px solid var(--color-danger-border)', background:'var(--color-danger-bg)', color:'var(--color-danger-text)', borderRadius:'var(--border-radius-md)', display:'flex', justifyContent:'space-between', gap:'12px', alignItems:'center', fontSize:'13px' }}><span>Unable to load the report for these filters.</span><Button variant="secondary" onClick={refreshReport}>Retry</Button></div>}
    {reportData?.summaryMetrics && <ReportSummaryHeader metrics={reportData.summaryMetrics}/>} 
    <section style={{ background:'var(--bg-surface)', border:'1px solid var(--border-color)', borderRadius:'var(--border-radius-lg)', overflow:'hidden', boxShadow:'var(--shadow-xs)' }}>
      <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px' }}><h2 style={{ fontSize:'16px', margin:0, color:'var(--text-primary)' }}>{config.label}</h2><span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>Total Records: <b>{reportData?.rows?.length || 0}</b></span></div>
      <DataTable columns={reportData?.columns || []} data={reportData?.rows || []} loading={loading} style={{ border:'none', borderRadius:0, boxShadow:'none' }}/>
      {!loading && !error && (!reportData?.rows || reportData.rows.length===0) && <div style={{ padding:'28px', textAlign:'center', color:'var(--text-muted)', fontSize:'13px' }}>No records match the current report filters.</div>}
    </section>
    <ReportPrintPreviewModal isOpen={printOpen} onClose={() => setPrintOpen(false)} reportConfig={config} reportData={reportData} campus={selectedCampus || 'Main Campus'} outletName={outletName} dateRange={selectedDateRange} paymentMethod={selectedPayment}/>
  </div>;
}

function useCashierReportData(reportType, filters) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isDemoSession = () => localStorage.getItem('token')?.startsWith('local-demo-token-');
  const load = async () => {
    setLoading(true);
    setError(null);
    // A local demo token is intentionally not a backend credential. Do not call
    // protected endpoints with it; show only the clearly scoped demo fixture.
    if (isDemoSession()) {
      setReportData(INITIAL_REPORT_DATA[reportType] || INITIAL_REPORT_DATA.sales_summary);
      setLoading(false);
      return;
    }
    try {
      setReportData(await reportService.getReportData(reportType, filters));
    } catch (err) {
      setError(err?.message || 'Unable to load report data.');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [reportType, filters.outlet, filters.dateRange, filters.payment, filters.campus]);
  return { reportData, loading, error, refreshReport: load };
}
