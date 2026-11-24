import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CookingPot, CupSoda, Hamburger, Lock, Soup, UserRound, Utensils } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import heroImage from '../../../assets/images/campus-canteen-login-hero.png';
import styles from '../styles/LoginPage.module.css';

const demoAccounts = [
  ['admin', 'Admin@123', 'Admin (Sunitha)'],
  ['staff', 'Staff@123', 'Staff (Ravi)'],
  ['cashier', 'Cashier@123', 'Cashier (Rahul)'],
  ['aarav', 'Student@123', 'Student (Aarav)'],
  ['sunita.rao', 'Faculty@123', 'Faculty (Dr. Sunita)']
];

export const LoginPage = () => {
  const navigate = useNavigate(); const location = useLocation(); const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const from = location.state?.from?.pathname || '/admin/dashboard';
  const getDestination = (loggedUser) => {
    let userRole = loggedUser?.role || loggedUser?.roleCode || loggedUser?.userType;
    if (!userRole) { try { const stored = JSON.parse(localStorage.getItem('auth_user') || '{}'); userRole = stored.role || stored.roleCode || stored.userType; } catch { userRole = ''; } }
    const role = String(userRole || '').toUpperCase();
    if (role.includes('CASHIER')) return '/cashier/dashboard'; if (role.includes('STUDENT') || role.includes('FACULTY')) return '/customer/dashboard'; if (role.includes('STAFF')) return '/staff/dashboard';
    return from && from !== '/' && !from.startsWith('/customer') ? from : '/admin/dashboard';
  };
  const signIn = async (username, userPassword) => { try { setLoading(true); setError(''); const authData = await login(username.trim(), userPassword); navigate(getDestination(authData?.user), { replace: true }); } catch (err) { setError(err.message || 'Invalid username or password. Please try again.'); } finally { setLoading(false); } };
  const handleSubmit = (event) => { event.preventDefault(); if (!usernameOrEmail.trim() || !password) { setError('Please enter both username/email and password.'); return; } signIn(usernameOrEmail, password); };
  const handleQuickLogin = (username, userPassword) => { setUsernameOrEmail(username); setPassword(userPassword); signIn(username, userPassword); };

  return <main className={styles.page}><section className={styles.shell} aria-label="Canteen Management sign in">
    <aside className={styles.illustrationPanel}>
      <img className={styles.heroImage} src={heroImage} alt="Campus canteen staff serving a student" /><div className={styles.imageShade} />
      <div className={styles.welcomeCopy}><h2>Welcome to <span>Campus Canteen</span></h2><p>“Fresh food, warm service,<br />and joyful campus dining.”</p></div>
      <div className={styles.orangeWave}><div className={styles.foodIcons} aria-hidden="true"><CookingPot /><i /><CupSoda /><i /><Soup /><i /><Hamburger /></div></div>
    </aside>
    <section className={styles.formPanel}>
      <header className={styles.branding}><div className={styles.logo}><Utensils size={35} strokeWidth={2.2} /></div><h1>Canteen Management</h1><p>Sign in to access SMS &amp; CMS portal controls</p></header>
      <div className={styles.demoBox}><p>⚡ <strong>Quick Demo Accounts (Click to Sign In):</strong></p><div className={styles.demoButtons}>{demoAccounts.map(([username, userPassword, label]) => <button key={username} type="button" disabled={loading} onClick={() => handleQuickLogin(username, userPassword)}>{label}</button>)}</div></div>
      {error && <div className={styles.error}><AlertCircle size={17} /><span>{error}</span></div>}
      <form className={styles.form} onSubmit={handleSubmit}>
        <label><span>Username or Email</span><div className={styles.inputWrap}><UserRound size={25} /><input type="text" value={usernameOrEmail} onChange={(event) => setUsernameOrEmail(event.target.value)} placeholder="Enter username or email" autoComplete="username" required /></div></label>
        <label><span>Password</span><div className={styles.inputWrap}><Lock size={25} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" autoComplete="current-password" required /></div></label>
        <button className={styles.submit} type="submit" disabled={loading}>{loading ? 'Authenticating…' : <>Sign In <ArrowRight size={27} /></>}</button>
      </form>
      <p className={styles.register}>Don't have an account? <Link to="/register">Create Account</Link></p>
    </section>
  </section></main>;
};

export default LoginPage;
