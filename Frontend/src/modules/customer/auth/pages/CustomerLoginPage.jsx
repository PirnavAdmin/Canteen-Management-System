import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { Utensils, Lock, User, AlertCircle, ArrowRight, GraduationCap, Briefcase } from 'lucide-react';
import styles from '../styles/customerAuth.module.css';

export const CustomerLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rawFrom = location.state?.from?.pathname;
  const from = (rawFrom && rawFrom !== '/customer' && rawFrom !== '/' && !rawFrom.includes('/login')) ? rawFrom : '/customer/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setError('Please enter both your Student/Faculty ID or email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(usernameOrEmail.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your Student or Faculty account.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleUser, rolePass) => {
    setUsernameOrEmail(roleUser);
    setPassword(rolePass);
    try {
      setLoading(true);
      setError('');
      await login(roleUser, rolePass);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authCard}>
        {/* Header Branding */}
        <div className={styles.authHeader}>
          <div className={styles.authLogo}>
            <Utensils size={28} />
          </div>
          <span className={styles.institutionTag}>Apex Institute SMS & CMS</span>
          <h1 className={styles.authTitle}>Student & Faculty Dining</h1>
          <p className={styles.authSubtitle}>
            Sign in with your campus credentials to order meals, track kitchen tokens, and view dining balance.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} className={styles.errorIcon} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Student Roll No / Faculty ID / Email
            </label>
            <div className={styles.inputRelative}>
              <User size={18} className={styles.inputIcon} />
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="aarav or sunita.rao@faculty.apexinstitute.edu"
                required
                className={styles.textInput}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Password
            </label>
            <div className={styles.inputRelative}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={styles.textInput}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? 'Authenticating...' : (
              <>
                <span>Enter Dining Portal</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className={styles.demoHelper}>
          <p className={styles.demoTitle}>⚡ Quick Demo Sign-In (Click to Log In):</p>
          <div className={styles.demoButtonsRow}>
            <button
              type="button"
              onClick={() => handleQuickLogin('aarav', 'Student@123')}
              className={`${styles.demoBtn} ${styles.studentDemoBtn}`}
            >
              <GraduationCap size={15} />
              <span>Student (Aarav Mehta)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('sunita.rao', 'Faculty@123')}
              className={`${styles.demoBtn} ${styles.facultyDemoBtn}`}
            >
              <Briefcase size={15} />
              <span>Faculty (Dr. Sunita Rao)</span>
            </button>
          </div>

          <div className={styles.credentialsHint}>
            <div>🎓 <strong>Student:</strong> <code>aarav</code> / <code>Student@123</code></div>
            <div>💼 <strong>Faculty:</strong> <code>sunita.rao</code> / <code>Faculty@123</code></div>
          </div>
        </div>

        {/* Admin Portal Switcher */}
        <div className={styles.adminSwitchFooter}>
          <span>Are you Canteen Staff or Administrator? </span>
          <Link to="/login" className={styles.adminLink}>
            Staff & Admin Login →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerLoginPage;
