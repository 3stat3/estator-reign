import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';

// Validation schema for forgot password
const forgotPasswordSchema = yup.object().shape({
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required')
    .max(255, 'Email too long'),
});

// Theme Context
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

const ForgotPassword = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { forgotPassword, resendResetLink } = useAuth();
  const navigate = useNavigate();
  const emailInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid, isDirty }
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
    }
  });

  const emailValue = watch('email');

  // Get the base URL for redirects
  const getRedirectUrl = () => {
    // In production, use the Vercel URL
    if (process.env.NODE_ENV === 'production') {
      return 'https://estatorreign.vercel.app/reset-password';
    }
    // In development, use localhost
    return 'http://localhost:3000/reset-password';
  };

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cooldown timer for rate limiting
  useEffect(() => {
    let timer;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownTime]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const onSubmit = async (data) => {
    if (cooldownTime > 0) {
      setError(`Please wait ${cooldownTime} seconds before trying again.`);
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // Use the correct redirect URL
      await forgotPassword(data.email, {
        redirectTo: getRedirectUrl()
      });
      setSuccess(true);
      setCooldownTime(60);
    } catch (err) {
      setError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    if (resendCooldown > 0 || !emailValue) return;
    
    setError('');
    setLoading(true);
    
    try {
      await resendResetLink(emailValue, {
        redirectTo: getRedirectUrl()
      });
      setResendCooldown(30);
      setSuccess(true);
    } catch (err) {
      setError('Failed to resend link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`forgot-container ${theme}`} data-theme={theme}>
      {/* Dynamic background */}
      <div className="forgot-background">
        <div className={`bg-gradient ${theme}`}></div>
        <div className="bg-pattern"></div>
      </div>
      
      <div className="forgot-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="forgot-card"
        >
          {/* Theme Toggle */}
          <div className="theme-toggle-wrapper">
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
          
          {/* Back Button */}
          <button onClick={() => navigate('/login')} className="back-button">
            <ArrowLeftIcon />
            <span>Back to login</span>
          </button>
          
          {/* Brand Section */}
          <div className="brand-section">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="icon-wrapper"
            >
              <ShieldCheckIcon className="brand-icon" />
            </motion.div>
            <h1 className="title">Forgot password?</h1>
            <p className="subtitle">
              No worries! Enter your email address and we'll send you a link to reset your password.
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
          
          {/* Success Display */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="success-message"
              >
                <CheckBadgeIcon className="icon" />
                <div className="success-content">
                  <strong>Reset link sent!</strong>
                  <p>We've sent a password reset link to <strong>{emailValue}</strong>. Please check your email (including spam folder).</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Forgot Password Form */}
          {!success ? (
            <form onSubmit={handleSubmit(onSubmit)} className="forgot-form" noValidate>
              <div className="form-group">
                <label className="form-label">
                  <EnvelopeIcon className="input-icon" />
                  Email address
                </label>
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''} ${isDirty && !errors.email && emailValue ? 'valid' : ''}`}
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register('email', {
                    required: 'Email is required',
                    onChange: (e) => {
                      setValue('email', e.target.value, { shouldValidate: true });
                    }
                  })}
                  ref={emailInputRef}
                  autoFocus
                />
                {errors.email && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="error-text"
                  >
                    {errors.email.message}
                  </motion.span>
                )}
              </div>
              
              {cooldownTime > 0 && (
                <div className="cooldown-warning">
                  <div className="cooldown-progress">
                    <div 
                      className="cooldown-progress-bar" 
                      style={{ width: `${(cooldownTime / 60) * 100}%` }}
                    />
                  </div>
                  <span>Please wait {cooldownTime} seconds before requesting another link</span>
                </div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="submit-btn"
                disabled={loading || cooldownTime > 0 || !isValid}
              >
                {loading ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    Send reset link
                    <PaperAirplaneIcon className="btn-icon" />
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            <div className="success-actions">
              <button
                onClick={handleResendLink}
                className="resend-btn"
                disabled={loading || resendCooldown > 0}
              >
                {loading ? (
                  <div className="spinner-small"></div>
                ) : (
                  <>
                    {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend link'}
                  </>
                )}
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="login-redirect"
              >
                Return to login
                <ArrowRightIcon className="link-icon" />
              </button>
            </div>
          )}
          
          {/* Help Section */}
          <div className="help-section">
            <p className="help-text">
              <span className="help-icon">?</span>
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => {
                  if (success) {
                    handleResendLink();
                  } else {
                    const email = watch('email');
                    if (email && isValid) {
                      handleSubmit(onSubmit)();
                    } else {
                      setError('Please enter your email address first');
                      emailInputRef.current?.focus();
                    }
                  }
                }}
                className="help-link"
                disabled={loading}
              >
                try again
              </button>
            </p>
          </div>
          
          {/* Security Notice */}
          <div className="security-notice">
            <ShieldCheckIcon className="security-icon" />
            <div className="security-text">
              <strong>Secure password reset</strong>
              <p>The reset link will expire in 1 hour for your security.</p>
            </div>
          </div>
        </motion.div>
      </div>
      
      <style>{`
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
        
        .forgot-container {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: var(--bg-primary);
          transition: background 0.3s ease;
        }
        
        .forgot-background {
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
        
        .forgot-wrapper {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(1rem, 5vw, 2rem);
        }
        
        .forgot-card {
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
        
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.875rem;
          padding: 0.5rem 0;
          margin-bottom: 1.5rem;
          transition: color 0.2s;
        }
        
        .back-button svg {
          width: 1rem;
          height: 1rem;
        }
        
        .back-button:hover {
          color: var(--gradient-start);
        }
        
        .brand-section {
          text-align: center;
          margin-bottom: clamp(1.5rem, 4vw, 2rem);
        }
        
        .icon-wrapper {
          display: inline-block;
          margin-bottom: clamp(1rem, 3vw, 1.5rem);
        }
        
        .brand-icon {
          width: clamp(3rem, 10vw, 4rem);
          height: clamp(3rem, 10vw, 4rem);
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
          line-height: 1.5;
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
        
        .success-content strong {
          display: block;
          margin-bottom: 0.25rem;
        }
        
        .success-content p {
          font-size: 0.75rem;
          margin: 0;
        }
        
        .forgot-form {
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
        
        .form-input.error {
          border-color: #ef4444;
        }
        
        .form-input.valid {
          border-color: #22c55e;
        }
        
        .error-text {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        
        .cooldown-warning {
          margin-top: -0.5rem;
        }
        
        .cooldown-progress {
          height: 4px;
          background: var(--border-color);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }
        
        .cooldown-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
          transition: width 1s linear;
        }
        
        .cooldown-warning span {
          font-size: 0.7rem;
          color: var(--text-secondary);
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
        
        .spinner-small {
          width: 0.875rem;
          height: 0.875rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        
        .success-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        
        .resend-btn {
          background: transparent;
          border: 2px solid var(--border-color);
          padding: 0.75rem;
          border-radius: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          color: var(--text-primary);
          transition: all 0.2s;
        }
        
        .resend-btn:hover:not(:disabled) {
          border-color: var(--gradient-start);
          color: var(--gradient-start);
        }
        
        .resend-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .login-redirect {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: var(--bg-secondary);
          border: none;
          padding: 0.75rem;
          border-radius: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          color: var(--text-primary);
          transition: all 0.2s;
        }
        
        .login-redirect:hover {
          background: var(--hover-bg);
          color: var(--gradient-start);
        }
        
        .link-icon {
          width: 0.875rem;
          height: 0.875rem;
        }
        
        .help-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
        }
        
        .help-text {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-align: center;
          flex-wrap: wrap;
        }
        
        .help-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.125rem;
          height: 1.125rem;
          background: var(--bg-secondary);
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        
        .help-link {
          background: none;
          border: none;
          color: var(--gradient-start);
          cursor: pointer;
          font-weight: 500;
          text-decoration: underline;
        }
        
        .help-link:hover:not(:disabled) {
          opacity: 0.8;
        }
        
        .help-link:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .security-notice {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-top: 1rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-radius: 0.75rem;
        }
        
        .security-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        
        .security-text strong {
          display: block;
          font-size: 0.75rem;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }
        
        .security-text p {
          font-size: 0.7rem;
          color: var(--text-secondary);
          margin: 0;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
          
          .help-text {
            flex-direction: column;
            gap: 0.25rem;
          }
        }
        
        @media (min-width: 1025px) {
          .forgot-card {
            max-width: 480px;
          }
          
          .forgot-card:hover {
            transform: translateY(-5px);
            transition: transform 0.3s ease;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .forgot-card,
          .submit-btn,
          .theme-toggle,
          .resend-btn,
          .login-redirect {
            transition: none;
          }
          
          .spinner,
          .spinner-small {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

// Wrap the component with ThemeProvider
const ForgotPasswordWithTheme = (props) => (
  <ThemeProvider>
    <ForgotPassword {...props} />
  </ThemeProvider>
);

export default ForgotPasswordWithTheme;