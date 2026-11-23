import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, ReceiptText, Lock, User } from 'lucide-react';
import { useAuth } from '../../../../app/providers/AuthProvider';
import styles from '../../../customer/auth/styles/customerAuth.module.css';

export default function CashierLoginPage() {
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const go = async (u, p) => { try { setLoading(true); setError(''); const result = await login(u, p); const account = result?.user; if (account?.role !== 'Cashier' && account?.roleCode !== 'CASHIER') throw new Error('This account is not authorized for the Cashier Portal.'); const requested = location.state?.from?.pathname; navigate(requested?.startsWith('/cashier') ? requested : '/cashier/dashboard', { replace: true }); } catch (e) { setError(e.message || 'Unable to sign in.'); } finally { setLoading(false); } };
  return <div className={styles.authWrapper}><div className={styles.authCard}>
    <div className={styles.authHeader}><div className={styles.authLogo}><ReceiptText size={28}/></div><span className={styles.institutionTag}>Canteen Management System</span><h1 className={styles.authTitle}>Cashier Portal</h1><p className={styles.authSubtitle}>Sign in to manage billing, payments and order pickup.</p></div>
    {error && <div className={styles.errorAlert}><AlertCircle size={16}/><span>{error}</span></div>}
    <form className={styles.form} onSubmit={(e) => { e.preventDefault(); if (!username || !password) { setError('Enter your cashier ID and password.'); return; } go(username, password); }}>
      <div className={styles.inputGroup}><label className={styles.inputLabel}>Cashier ID / Email</label><div className={styles.inputRelative}><User size={18} className={styles.inputIcon}/><input className={styles.textInput} value={username} onChange={e => setUsername(e.target.value)} placeholder="cashier" autoComplete="username"/></div></div>
      <div className={styles.inputGroup}><label className={styles.inputLabel}>Password</label><div className={styles.inputRelative}><Lock size={18} className={styles.inputIcon}/><input className={styles.textInput} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"/></div></div>
      <button className={styles.submitBtn} disabled={loading}>{loading ? 'Authenticating…' : <><span>Enter Cashier Portal</span><ArrowRight size={16}/></>}</button>
    </form>
    <div className={styles.demoHelper}><p className={styles.demoTitle}>⚡ Quick Demo Sign-In</p><button className={`${styles.demoBtn} ${styles.studentDemoBtn}`} disabled={loading} onClick={() => go('cashier', 'Cashier@123')}><ReceiptText size={16}/>Demo Cashier (Rahul Verma)</button><div className={styles.credentialsHint}><div><strong>Demo:</strong> <code>cashier</code> / <code>Cashier@123</code></div></div></div>
    <div className={styles.adminSwitchFooter}><Link className={styles.adminLink} to="/customer/login">Student / Faculty</Link><span> · </span><Link className={styles.adminLink} to="/staff/login">Staff</Link><span> · </span><Link className={styles.adminLink} to="/login">Admin</Link></div>
  </div></div>;
}
