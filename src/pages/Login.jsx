import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  KeyIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Validation schema
const loginSchema = yup.object().shape({
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required')
    .max(255, 'Email too long'),
  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: yup.boolean(),
});

// Theme Context
const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);

// Theme Provider Component
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

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [displayError, setDisplayError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [showPasswordless, setShowPasswordless] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [suggestedEmail, setSuggestedEmail] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { login, loginWith2FA, sendMagicLink } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailInputRef = useRef(null);
  
  const from = location.state?.from?.pathname || '/dashboard';
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid, isDirty, touchedFields }
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      email: localStorage.getItem('savedEmail') || '',
      password: '',
      rememberMe: localStorage.getItem('rememberMe') === 'true'
    }
  });
  
  const emailValue = watch('email');
  const passwordValue = watch('password');
  const rememberMe = watch('rememberMe');
  
  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Device fingerprinting
  useEffect(() => {
    const getDeviceInfo = () => {
      const info = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        touchPoints: navigator.maxTouchPoints
      };
      setDeviceInfo(info);
    };
    getDeviceInfo();
  }, []);
  
  // Cooldown timer
  useEffect(() => {
    let timer;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownTime]);
  
  // Email suggestion (domain correction)
  useEffect(() => {
    if (emailValue && emailValue.includes('@') && !emailValue.includes('.') && !errors.email) {
      const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
      const [localPart] = emailValue.split('@');
      commonDomains.forEach(domain => {
        if (!emailValue.includes(domain) && 
            emailValue.toLowerCase().includes(domain.split('.')[0])) {
          setSuggestedEmail(`${localPart}@${domain}`);
        }
      });
    } else {
      setSuggestedEmail('');
    }
  }, [emailValue, errors.email]);
  
  // Magic link login
  const handleMagicLink = async () => {
    if (!emailValue) {
      setDisplayError('Please enter your email first');
      emailInputRef.current?.focus();
      return;
    }
    
    const isValidEmail = await trigger('email');
    if (!isValidEmail) {
      setDisplayError('Please enter a valid email address');
      return;
    }
    
    try {
      setLoading(true);
      await sendMagicLink(emailValue);
      setMagicLinkSent(true);
      setDisplayError('');
    } catch (err) {
      setDisplayError('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Main login handler
  const onSubmit = async (data) => {
    setDisplayError('');
    
    if (cooldownTime > 0) {
      setDisplayError(`Too many attempts. Please wait ${cooldownTime} seconds.`);
      return;
    }
    
    setLoading(true);
    
    try {
      if (data.rememberMe) {
        localStorage.setItem('savedEmail', data.email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('savedEmail');
        localStorage.removeItem('rememberMe');
      }
      
      const result = await login(data.email, data.password, deviceInfo);
      
      if (result?.error) {
        const errorMessageText = result.error;
        
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        let displayErrorMsg;
        if (newAttempts >= 5) {
          setCooldownTime(30);
          displayErrorMsg = `Too many failed attempts. Please wait 30 seconds.`;
        } else {
          const remainingAttempts = 5 - newAttempts;
          displayErrorMsg = `${errorMessageText}. ${remainingAttempts} attempt(s) remaining.`;
        }
        
        setDisplayError(displayErrorMsg);
        
        const formElement = document.querySelector('.login-form');
        if (formElement) {
          formElement.classList.add('shake');
          setTimeout(() => {
            formElement.classList.remove('shake');
          }, 500);
        }
        
        setLoading(false);
        return;
      }
      
      if (result?.user) {
        setDisplayError('');
        await handleUserApproval(result.user);
      } else {
        setDisplayError('Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      const errorMessageText = err?.message || 'Invalid email or password';
      
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      let displayErrorMsg;
      if (newAttempts >= 5) {
        setCooldownTime(30);
        displayErrorMsg = `Too many failed attempts. Please wait 30 seconds.`;
      } else {
        const remainingAttempts = 5 - newAttempts;
        displayErrorMsg = `${errorMessageText}. ${remainingAttempts} attempt(s) remaining.`;
      }
      
      setDisplayError(displayErrorMsg);
      
      const formElement = document.querySelector('.login-form');
      if (formElement) {
        formElement.classList.add('shake');
        setTimeout(() => {
          formElement.classList.remove('shake');
        }, 500);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 2FA submission
  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDisplayError('');
    
    try {
      const result = await loginWith2FA(twoFactorCode);
      if (result.user) {
        await handleUserApproval(result.user);
      } else {
        setDisplayError('Invalid 2FA code. Please try again.');
      }
    } catch (err) {
      setDisplayError('2FA verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUserApproval = async (user) => {
    switch (user.approval_status) {
      case 'approved':
        navigate('/dashboard', { replace: true });
        break;
      case 'pending_initial':
        setDisplayError('Account Pending Initial Approval - Your account is awaiting review by an admin.');
        break;
      case 'pending_final':
        setDisplayError('Pending Final Approval - Super admin review required. Estimated wait time: 24-48 hours.');
        break;
      case 'rejected':
        setDisplayError('Account Rejected - Your application was not approved. Please contact support.');
        break;
      case 'frozen':
        setDisplayError('Account Frozen - Security hold detected. Please verify your identity or contact support.');
        break;
      default:
        setDisplayError('Invalid account status');
    }
  };
  
  return (
    <div className={`login-container ${theme}`} data-theme={theme}>
      {/* Dynamic background */}
      <div className="login-background">
        <div className={`bg-gradient ${theme}`}></div>
        <div className="bg-pattern"></div>
      </div>
      
      <div className="login-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="login-card"
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
                <UserGroupIcon className="logo-icon" />
                <span className="logo-text">Estate<span>Tax</span></span>
              </div>
            </motion.div>
            <h1 className="title">Welcome back</h1>
            <p className="subtitle">
              Sign in to manage your estate tax portfolio
            </p>
          </div>
          
          {/* ERROR DISPLAY */}
          {displayError && (
            <div style={{
              background: 'rgba(220, 38, 38, 0.1)',
              color: '#ef4444',
              borderLeft: '4px solid #ef4444',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              wordBreak: 'break-word'
            }}>
              {displayError}
            </div>
          )}
          
          {/* Magic Link Success */}
          {magicLinkSent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="success-message"
            >
              <CheckBadgeIcon className="icon" />
              <div>
                <strong>Magic link sent!</strong>
                <p>Check your email for a secure sign-in link.</p>
              </div>
            </motion.div>
          )}
          
          {/* Login Form */}
          {!show2FA ? (
            <>
              {!showPasswordless ? (
                <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
                  <div className="form-group">
                    <label className="form-label">
                      <EnvelopeIcon className="input-icon" />
                      Email address
                    </label>
                    <input
                      type="email"
                      className={`form-input ${errors.email ? 'error' : ''} ${touchedFields.email && !errors.email ? 'valid' : ''}`}
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
                    {errors.email && touchedFields.email && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="error-text"
                      >
                        {errors.email.message}
                      </motion.span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <KeyIcon className="input-icon" />
                      Password
                    </label>
                    <div className="password-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`form-input ${errors.password ? 'error' : ''}`}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        {...register('password', {
                          required: 'Password is required',
                          onChange: (e) => {
                            setValue('password', e.target.value, { shouldValidate: true });
                          }
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="password-toggle"
                      >
                        {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="error-text"
                      >
                        {errors.password.message}
                      </motion.span>
                    )}
                  </div>
                  
                  <div className="form-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        {...register('rememberMe')}
                      />
                      <span>Remember me</span>
                    </label>
                    
                    <Link to="/forgot-password" className="forgot-link">
                      Forgot password?
                    </Link>
                  </div>
                  
                  {cooldownTime > 0 && (
                    <div className="cooldown-warning">
                      <ArrowPathIcon className="icon spin" />
                      <span>Too many attempts. Try again in {cooldownTime}s</span>
                    </div>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="submit-btn"
                    disabled={loading || cooldownTime > 0}
                  >
                    {loading ? (
                      <div className="spinner"></div>
                    ) : (
                      <>
                        Sign in
                        <ArrowRightIcon className="btn-icon" />
                      </>
                    )}
                  </motion.button>
                </form>
              ) : (
                <div className="passwordless-section">
                  <h3>Passwordless Login</h3>
                  <p>We'll email you a secure sign-in link</p>
                  <div className="magic-link-form">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={emailValue}
                      onChange={(e) => {
                        setValue('email', e.target.value, { shouldValidate: true });
                      }}
                      className={`form-input ${errors.email ? 'error' : ''}`}
                    />
                    <button
                      onClick={handleMagicLink}
                      disabled={loading || !emailValue || errors.email}
                      className="submit-btn secondary"
                    >
                      {loading ? <div className="spinner"></div> : 'Send magic link'}
                    </button>
                  </div>
                  {errors.email && (
                    <span className="error-text">{errors.email.message}</span>
                  )}
                </div>
              )}
              
              {/* Email Suggestion */}
              {suggestedEmail && !show2FA && !showPasswordless && !errors.email && emailValue && emailValue.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="suggestion-message"
                >
                  <EnvelopeIcon className="icon" />
                  <span>Did you mean <strong>{suggestedEmail}</strong>?</span>
                  <button
                    onClick={() => {
                      setValue('email', suggestedEmail, { shouldValidate: true });
                      trigger('email');
                    }}
                    className="suggestion-btn"
                  >
                    Use instead
                  </button>
                </motion.div>
              )}
              
              {/* Divider */}
              <div className="divider">
                <span>or</span>
              </div>
              
              {/* Toggle Passwordless */}
              <div className="auth-toggle">
                <button
                  onClick={() => setShowPasswordless(!showPasswordless)}
                  className="toggle-link"
                >
                  {showPasswordless ? '← Back to password login' : 'Sign in with magic link →'}
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handle2FASubmit} className="twofa-form">
              <div className="twofa-header">
                <ShieldCheckIcon className="twofa-icon" />
                <h3>Two-Factor Authentication</h3>
                <p>Enter the 6-digit code from your authenticator app</p>
              </div>
              
              <div className="otp-input-group">
                <input
                  type="text"
                  maxLength="6"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="otp-input"
                  placeholder="000000"
                  autoFocus
                />
              </div>
              
              <button
                type="submit"
                className="submit-btn"
                disabled={loading || twoFactorCode.length !== 6}
              >
                {loading ? <div className="spinner"></div> : 'Verify'}
              </button>
              
              <button
                type="button"
                onClick={() => setShow2FA(false)}
                className="back-link"
              >
                ← Back to login
              </button>
            </form>
          )}
          
          {/* Sign Up Link */}
          <div className="signup-prompt">
            <span>Don't have an account?</span>
            <Link to="/register" className="signup-link">
              Create account
              <ArrowRightIcon className="link-icon" />
            </Link>
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
        
        .login-container {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: var(--bg-primary);
          transition: background 0.3s ease;
        }
        
        .login-background {
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
        
        .login-wrapper {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(1rem, 5vw, 2rem);
        }
        
        .login-card {
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
        
        .success-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem);
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border-left: 4px solid #22c55e;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
          font-size: clamp(0.75rem, 3vw, 0.875rem);
        }
        
        .suggestion-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem);
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border-left: 4px solid #f59e0b;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
          font-size: clamp(0.75rem, 3vw, 0.875rem);
        }
        
        .suggestion-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: #f59e0b;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
        }
        
        .login-form, .twofa-form {
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
        
        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: clamp(0.75rem, 3vw, 0.875rem);
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          color: var(--text-primary);
        }
        
        .forgot-link {
          color: var(--gradient-start);
          text-decoration: none;
          font-weight: 500;
        }
        
        .cooldown-warning {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: rgba(220, 38, 38, 0.1);
          color: #ef4444;
          border-radius: 0.5rem;
          font-size: 0.75rem;
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
        
        .divider {
          text-align: center;
          position: relative;
          margin: 1.5rem 0;
        }
        
        .divider::before,
        .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: calc(50% - 30px);
          height: 1px;
          background: var(--border-color);
        }
        
        .divider::before {
          left: 0;
        }
        
        .divider::after {
          right: 0;
        }
        
        .divider span {
          background: var(--card-bg);
          padding: 0 1rem;
          color: var(--text-secondary);
          font-size: 0.75rem;
        }
        
        .auth-toggle {
          text-align: center;
          margin-top: 0.5rem;
        }
        
        .toggle-link {
          background: none;
          border: none;
          color: var(--gradient-start);
          font-size: clamp(0.75rem, 3vw, 0.875rem);
          cursor: pointer;
          text-decoration: underline;
        }
        
        .twofa-header {
          text-align: center;
        }
        
        .twofa-header h3 {
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        
        .twofa-header p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        
        .twofa-icon {
          width: 3rem;
          height: 3rem;
          color: var(--gradient-start);
          margin: 0 auto 1rem;
        }
        
        .otp-input-group {
          display: flex;
          justify-content: center;
        }
        
        .otp-input {
          width: 200px;
          text-align: center;
          font-size: clamp(1.5rem, 5vw, 2rem);
          letter-spacing: 0.5rem;
          padding: 0.75rem;
          border: 2px solid var(--border-color);
          border-radius: 0.75rem;
          background: var(--input-bg);
          color: var(--text-primary);
        }
        
        .back-link {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .signup-prompt {
          text-align: center;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
          font-size: clamp(0.75rem, 3vw, 0.875rem);
          color: var(--text-secondary);
        }
        
        .signup-link {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--gradient-start);
          text-decoration: none;
          font-weight: 600;
          margin-left: 0.5rem;
        }
        
        .link-icon {
          width: 0.875rem;
          height: 0.875rem;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .shake {
          animation: shake 0.3s ease-in-out;
        }
        
        .passwordless-section h3 {
          font-size: clamp(1.125rem, 4vw, 1.25rem);
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        
        .passwordless-section p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        
        .magic-link-form {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }
        
        .magic-link-form .form-input {
          flex: 1;
          min-width: 150px;
        }
        
        .submit-btn.secondary {
          background: #48bb78;
        }
        
        @media (min-width: 641px) and (max-width: 1024px) {
          .login-card {
            max-width: 480px;
          }
        }
        
        @media (min-width: 1025px) {
          .login-card {
            max-width: 480px;
          }
          
          .login-card:hover {
            transform: translateY(-5px);
            transition: transform 0.3s ease;
          }
        }
        
        @media (max-width: 640px) and (orientation: landscape) {
          .login-wrapper {
            padding: 1rem;
          }
          
          .login-card {
            padding: 1rem;
          }
          
          .brand-section {
            margin-bottom: 1rem;
          }
          
          .logo-wrapper {
            margin-bottom: 0.5rem;
          }
        }
        
        @media (min-resolution: 192dpi) {
          .bg-pattern {
            background-size: 30px 30px;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .login-card,
          .submit-btn,
          .theme-toggle {
            transition: none;
          }
          
          .spin {
            animation: none;
          }
          
          .shake {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

// Wrap the component with ThemeProvider
const LoginWithTheme = (props) => (
  <ThemeProvider>
    <Login {...props} />
  </ThemeProvider>
);

export default LoginWithTheme;