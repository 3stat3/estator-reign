import React, { useState, useEffect, useContext, createContext } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../../supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

// Theme Context (same as Login)
const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [tokenValid, setTokenValid] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setTokenValid(true);
        } else if (token) {
          setError('Please use the link from your email. The session may have expired.');
        } else {
          setTokenValid(false);
          setError('No reset token provided. Please request a new password reset.');
        }
      } catch (err) {
        setError('Invalid or expired reset link.');
      }
    };

    checkSession();
  }, [token]);

  // Password strength checker
  const checkPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.match(/[a-z]/)) strength++;
    if (pwd.match(/[A-Z]/)) strength++;
    if (pwd.match(/[0-9]/)) strength++;
    if (pwd.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        if (updateError.message.includes('token')) {
          throw new Error('Your reset link has expired. Please request a new one.');
        }
        throw updateError;
      }

      setMessage('Password reset successful! Redirecting to login...');
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If no token, show error
  if (!tokenValid) {
    return (
      <div className={`reset-container ${theme}`} data-theme={theme}>
        <div className="reset-background">
          <div className={`bg-gradient ${theme}`}></div>
          <div className="bg-pattern"></div>
        </div>
        <div className="reset-wrapper">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="reset-card"
          >
            <div className="theme-toggle-wrapper">
              <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>
            </div>
            <div className="text-center">
              <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="title">Invalid Reset Link</h2>
              <p className="subtitle mb-6">
                This password reset link is invalid or has expired.
              </p>
              <Link
                to="/forgot-password"
                className="submit-btn"
              >
                Request New Reset Link
                <ArrowRightIcon className="btn-icon" />
              </Link>
            </div>
          </motion.div>
        </div>
        <style>{resetStyles}</style>
      </div>
    );
  }

  return (
    <div className={`reset-container ${theme}`} data-theme={theme}>
      <div className="reset-background">
        <div className={`bg-gradient ${theme}`}></div>
        <div className="bg-pattern"></div>
      </div>
      
      <div className="reset-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="reset-card"
        >
          {/* Theme Toggle */}
          <div className="theme-toggle-wrapper">
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
          
          {/* Brand Section */}
          <div className="brand-section">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="logo-wrapper"
            >
              <div className="logo">
                <KeyIcon className="logo-icon" />
                <span className="logo-text">Reset <span>Password</span></span>
              </div>
            </motion.div>
            <h1 className="title">Set New Password</h1>
            <p className="subtitle">
              Please enter your new password below
            </p>
          </div>
          
          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="error-message"
              >
                <ExclamationTriangleIcon className="icon" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Success Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="success-message"
              >
                <CheckBadgeIcon className="icon" />
                <span>{message}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <form onSubmit={handleSubmit} className="reset-form">
            {/* New Password */}
            <div className="form-group">
              <label className="form-label">
                <KeyIcon className="input-icon" />
                New Password
              </label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  disabled={loading}
                  className={`form-input ${password && password.length >= 8 ? 'valid' : ''}`}
                  placeholder="Enter new password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="strength-container">
                  <div className="strength-bars">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`strength-bar ${level <= passwordStrength ? 
                          passwordStrength <= 2 ? 'weak' : 
                          passwordStrength <= 3 ? 'medium' : 
                          'strong' : ''}`}
                      />
                    ))}
                  </div>
                  <p className="strength-text">
                    {passwordStrength <= 2 && '🔴 Weak password'}
                    {passwordStrength === 3 && '🟡 Medium password'}
                    {passwordStrength >= 4 && '🟢 Strong password'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">
                <KeyIcon className="input-icon" />
                Confirm Password
              </label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className={`form-input ${confirmPassword && password === confirmPassword ? 'valid' : ''}`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle"
                >
                  {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span className="error-text">Passwords do not match</span>
              )}
            </div>
            
            {/* Password Requirements */}
            <div className="requirements">
              <p className="requirements-title">Password Requirements:</p>
              <ul className="requirements-list">
                <li className={password.length >= 8 ? 'met' : ''}>
                  <span>{password.length >= 8 ? '✓' : '○'}</span>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(password) ? 'met' : ''}>
                  <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                  At least one uppercase letter
                </li>
                <li className={/[a-z]/.test(password) ? 'met' : ''}>
                  <span>{/[a-z]/.test(password) ? '✓' : '○'}</span>
                  At least one lowercase letter
                </li>
                <li className={/[0-9]/.test(password) ? 'met' : ''}>
                  <span>{/[0-9]/.test(password) ? '✓' : '○'}</span>
                  At least one number
                </li>
              </ul>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="submit-btn"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  Reset Password
                  <ArrowRightIcon className="btn-icon" />
                </>
              )}
            </motion.button>
            
            <div className="back-link-wrapper">
              <Link to="/login" className="back-link">
                ← Back to Login
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
      
      <style>{resetStyles}</style>
    </div>
  );
};

// Wrap with ThemeProvider
const ResetPasswordWithTheme = (props) => (
  <ThemeProvider>
    <ResetPassword {...props} />
  </ThemeProvider>
);

export default ResetPasswordWithTheme;

// Shared styles matching Login page
const resetStyles = `
  /* CSS Variables for Themes */
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #f7fafc;
    --text-primary: #1a202c;
    --text-secondary: #718096;
    --border-color: #e2e8f0;
    --card-bg: #ffffff;
    --input-bg: #ffffff;
    --hover-bg: #f7fafc;
    --shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    --gradient-start: #667eea;
    --gradient-end: #764ba2;
  }
  
  [data-theme="dark"] {
    --bg-primary: #0a0e27;
    --bg-secondary: #1a1f3a;
    --text-primary: #e2e8f0;
    --text-secondary: #94a3b8;
    --border-color: #2d3748;
    --card-bg: #1a1f3a;
    --input-bg: #0f142a;
    --hover-bg: #2d3748;
    --shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    --gradient-start: #4c51bf;
    --gradient-end: #5b3a8a;
  }
  
  .reset-container {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    background: var(--bg-primary);
    transition: background 0.3s ease;
  }
  
  .reset-background {
    position: absolute;
    inset: 0;
    z-index: 0;
  }
  
  .bg-gradient {
    position: absolute;
    inset: 0;
    transition: all 0.3s ease;
  }
  
  .bg-gradient:not(.dark) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .bg-gradient.dark {
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  }
  
  .bg-pattern {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
  
  .reset-wrapper {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(1rem, 5vw, 2rem);
  }
  
  .reset-card {
    max-width: min(440px, 100%);
    width: 100%;
    background: var(--card-bg);
    border-radius: clamp(1.5rem, 4vw, 2rem);
    padding: clamp(1.5rem, 5vw, 2.5rem);
    box-shadow: var(--shadow);
    transition: all 0.3s ease;
    position: relative;
  }
  
  .theme-toggle-wrapper {
    position: absolute;
    top: clamp(1rem, 3vw, 1.5rem);
    right: clamp(1rem, 3vw, 1.5rem);
  }
  
  .theme-toggle {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-primary);
  }
  
  .theme-toggle svg {
    width: 20px;
    height: 20px;
  }
  
  .theme-toggle:hover {
    transform: scale(1.05);
    background: var(--hover-bg);
  }
  
  @media (max-width: 640px) {
    .theme-toggle {
      width: 32px;
      height: 32px;
    }
    .theme-toggle svg {
      width: 16px;
      height: 16px;
    }
  }
  
  .brand-section {
    text-align: center;
    margin-bottom: clamp(1.5rem, 4vw, 2rem);
  }
  
  .logo-wrapper {
    display: inline-block;
    margin-bottom: clamp(1rem, 3vw, 1.5rem);
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: clamp(1.25rem, 4vw, 1.5rem);
    font-weight: 700;
    color: var(--text-primary);
  }
  
  .logo-icon {
    width: clamp(1.5rem, 5vw, 2rem);
    height: clamp(1.5rem, 5vw, 2rem);
    color: var(--gradient-start);
  }
  
  .logo-text span {
    color: var(--gradient-start);
  }
  
  .title {
    font-size: clamp(1.5rem, 5vw, 1.875rem);
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    color: var(--text-secondary);
    font-size: clamp(0.75rem, 3vw, 0.875rem);
  }
  
  .error-message, .success-message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem);
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
    font-size: clamp(0.75rem, 3vw, 0.875rem);
  }
  
  .error-message {
    background: rgba(220, 38, 38, 0.1);
    color: #ef4444;
    border-left: 4px solid #ef4444;
  }
  
  .success-message {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
    border-left: 4px solid #22c55e;
  }
  
  .error-message .icon, .success-message .icon {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }
  
  .reset-form {
    display: flex;
    flex-direction: column;
    gap: clamp(1rem, 3vw, 1.25rem);
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: clamp(0.75rem, 3vw, 0.875rem);
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .input-icon {
    width: 1rem;
    height: 1rem;
    color: var(--text-secondary);
  }
  
  .form-input {
    width: 100%;
    padding: clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2vw, 1rem);
    border: 2px solid var(--border-color);
    border-radius: 0.75rem;
    font-size: clamp(0.75rem, 3vw, 0.875rem);
    transition: all 0.2s;
    background: var(--input-bg);
    color: var(--text-primary);
  }
  
  .form-input:focus {
    outline: none;
    border-color: var(--gradient-start);
    box-shadow: 0 0 0 3px rgba(76, 81, 191, 0.1);
  }
  
  .form-input.valid {
    border-color: #22c55e;
  }
  
  .password-wrapper {
    position: relative;
  }
  
  .password-toggle {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
  }
  
  .password-toggle svg {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .error-text {
    color: #ef4444;
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
  
  /* Strength Indicator */
  .strength-container {
    margin-top: 0.5rem;
  }
  
  .strength-bars {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 0.25rem;
  }
  
  .strength-bar {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: var(--border-color);
    transition: all 0.3s ease;
  }
  
  .strength-bar.weak {
    background: #ef4444;
  }
  
  .strength-bar.medium {
    background: #f59e0b;
  }
  
  .strength-bar.strong {
    background: #22c55e;
  }
  
  .strength-text {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin: 0;
  }
  
  /* Requirements */
  .requirements {
    background: var(--bg-secondary);
    border-radius: 0.75rem;
    padding: 1rem;
  }
  
  .requirements-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .requirements-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem 0.5rem;
  }
  
  @media (max-width: 480px) {
    .requirements-list {
      grid-template-columns: 1fr;
    }
  }
  
  .requirements-list li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
    transition: color 0.3s ease;
  }
  
  .requirements-list li.met {
    color: #22c55e;
  }
  
  .requirements-list li span {
    display: inline-block;
    width: 1rem;
    text-align: center;
  }
  
  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: clamp(0.625rem, 2vw, 0.75rem);
    background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: clamp(0.75rem, 3vw, 0.875rem);
  }
  
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px -5px rgba(76, 81, 191, 0.4);
  }
  
  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-icon {
    width: 1rem;
    height: 1rem;
  }
  
  .spinner {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .back-link-wrapper {
    text-align: center;
    margin-top: 0.5rem;
  }
  
  .back-link {
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s;
  }
  
  .back-link:hover {
    color: var(--gradient-start);
  }
  
  @media (min-width: 1025px) {
    .reset-card:hover {
      transform: translateY(-5px);
      transition: transform 0.3s ease;
    }
  }
  
  @media (max-width: 640px) and (orientation: landscape) {
    .reset-wrapper {
      padding: 1rem;
    }
    .reset-card {
      padding: 1rem;
    }
    .brand-section {
      margin-bottom: 1rem;
    }
    .logo-wrapper {
      margin-bottom: 0.5rem;
    }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .reset-card,
    .submit-btn,
    .theme-toggle {
      transition: none;
    }
    .spinner {
      animation: none;
    }
  }
`;