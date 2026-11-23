import React from 'react';
import { Lock } from 'lucide-react';
import { REPORT_OPTIONS } from '../../admin/reports/constants/reportConstants';
import { PAYMENT_METHODS } from '../../../constants/appConstants';

const fieldStyle = { width:'100%', height:'34px', padding:'0 8px', fontSize:'12.5px', border:'1px solid var(--border-color)', borderRadius:'var(--border-radius-md)', backgroundColor:'var(--bg-surface)', color:'var(--text-primary)' };
const labelStyle = { display:'block', fontSize:'11px', fontWeight:600, color:'var(--text-muted)', marginBottom:'3px', textTransform:'uppercase', letterSpacing:'0.02em' };

export default function CashierReportFilters({ selectedReport, onReportChange, campusName, outletName, selectedDateRange, onDateRangeChange, selectedPayment, onPaymentChange }) {
  return <div style={{ backgroundColor:'var(--bg-surface)', borderRadius:'var(--border-radius-lg)', border:'1px solid var(--border-color)', padding:'10px 14px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', boxShadow:'var(--shadow-xs)' }}>
    <Field label="Select Report" grow="1.2 1 180px"><select value={selectedReport} onChange={e=>onReportChange(e.target.value)} style={{ ...fieldStyle, fontWeight:600, color:'var(--color-primary)', borderColor:'var(--color-primary-border)', backgroundColor:'var(--color-primary-light)' }}>{REPORT_OPTIONS.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></Field>
    <Field label={<><span>Campus</span><span style={{ float:'right', fontSize:'9.5px', textTransform:'none', fontWeight:400, display:'inline-flex', alignItems:'center', gap:'2px' }}><Lock size={9}/> Locked</span></>} grow="1 1 140px"><div style={{ ...fieldStyle, display:'flex', alignItems:'center', backgroundColor:'var(--bg-muted)', color:'var(--text-secondary)', fontWeight:500 }}>{campusName}</div></Field>
    <Field label="Dining Outlet" grow="1.1 1 170px"><div style={{ ...fieldStyle, display:'flex', alignItems:'center', backgroundColor:'var(--bg-muted)', color:'var(--text-secondary)', fontWeight:500 }}>{outletName}</div></Field>
    <Field label="Date" grow="1 1 130px"><select value={selectedDateRange} onChange={e=>onDateRangeChange(e.target.value)} style={fieldStyle}><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="last_7_days">Last 7 Days</option><option value="month_to_date">Month to Date (MTD)</option><option value="quarter_to_date">Current Academic Term</option></select></Field>
    <Field label="Payment Method" grow="1 1 150px"><select value={selectedPayment} onChange={e=>onPaymentChange(e.target.value)} style={fieldStyle}><option value="ALL">All Payment Channels</option>{Object.values(PAYMENT_METHODS).map(x=><option key={x} value={x}>{x}</option>)}</select></Field>
  </div>;
}
function Field({ label, grow, children }) { return <div style={{ flex:grow, minWidth:'130px' }}><label style={labelStyle}>{label}</label>{children}</div>; }
