import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, UserRound, Utensils } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { STAFF_APP_CONFIG } from '../constants/staffNavigation';
import heroImage from '../../../assets/images/campus-canteen-login-hero.png';
import styles from '../styles/staff.module.css';

export const StaffLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both staff username/email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(username.trim(), password);
      navigate('/staff/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginShell} aria-label="Canteen Staff sign in">
        <aside className={styles.loginIllustration}>
          <img
            className={styles.loginHeroImage}
            src={heroImage}
            alt="Campus canteen staff serving a student"
          />
          <div className={styles.loginImageShade} />
          <div className={styles.loginWelcomeCopy}>
            <h2>
              Welcome to <span>{STAFF_APP_CONFIG.portalName}</span>
            </h2>
            <p>
              “Live kitchen operations, order prep,
              <br />
              and counter inventory control.”
            </p>
          </div>
        </aside>

        <section className={styles.loginFormPanel}>
          <header className={styles.loginBranding}>
            <div className={styles.loginLogo}>
              <Utensils size={32} strokeWidth={2.2} />
            </div>
            <h1>{STAFF_APP_CONFIG.portalName}</h1>
            <p>Sign in to access kitchen &amp; counter operations</p>
          </header>

          {error && (
            <div className={styles.loginError} role="alert">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <label>
              <span>Username or Email</span>
              <div className={styles.loginInputWrap}>
                <UserRound size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter staff username or email"
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            <label>
              <span>Password</span>
              <div className={styles.loginInputWrap}>
                <Lock size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>

            <button className={styles.loginSubmit} type="submit" disabled={loading}>
              {loading ? (
                'Authenticating…'
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className={styles.loginLinks}>
            <Link to="/customer/login">← Student / Faculty Portal</Link>
            <Link to="/login">Admin Portal →</Link>
          </div>
        </section>
      </section>
    </main>
  );
};

export default StaffLoginPage;
