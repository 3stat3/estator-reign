import React, { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EnvelopeIcon,
  KeyIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
// REMOVED: import { supabase } from '../../supabase';  <-- THIS IS THE CHANGE

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

// Validation schema
const registerSchema = yup.object().shape({
  username: yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  fullName: yup.string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name too long'),
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required')
    .max(255, 'Email too long'),
  position: yup.string()
    .required('Position is required'),
  positionLevel: yup.string().when('position', {
    is: (position) => {
      const positionsWithLevels = ['Revenue Officer', 'Revenue Specialist', 'Administrative Officer', 'Legal Officer', 'Assessment Officer', 'Collection Officer', 'Taxpayer Service Representative'];
      return positionsWithLevels.includes(position);
    },
    then: (schema) => schema.required('Please select your position level'),
    otherwise: (schema) => schema.notRequired(),
  }),
  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: yup.string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  agreeToS: yup.boolean()
    .oneOf([true], 'You must agree to the Terms of Service'),
  agreePrivacy: yup.boolean()
    .oneOf([true], 'You must agree to the Privacy Policy'),
});

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showToS, setShowToS] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSubLevel, setShowSubLevel] = useState(false);
  const [subLevelOptions, setSubLevelOptions] = useState([]);
  const { theme, toggleTheme } = useTheme();
  const { register: registerUser } = useAuth();  // <-- THIS IS THE CHANGE - renamed to avoid conflict with react-hook-form's register
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, touchedFields, isValid }
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      username: '',
      fullName: '',
      email: '',
      position: '',
      positionLevel: '',
      password: '',
      confirmPassword: '',
      agreeToS: false,
      agreePrivacy: false,
    }
  });

  const passwordValue = watch('password');
  const positionValue = watch('position');

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Password strength calculator
  useEffect(() => {
    if (!passwordValue) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    if (passwordValue.length >= 8) strength++;
    if (passwordValue.length >= 12) strength++;
    if (/[A-Z]/.test(passwordValue)) strength++;
    if (/[0-9]/.test(passwordValue)) strength++;
    if (/[^A-Za-z0-9]/.test(passwordValue)) strength++;
    
    setPasswordStrength(Math.min(strength, 4));
  }, [passwordValue]);

  // Position level mapping
  const getSubLevels = (position) => {
    const levels = {
      'Revenue Officer': ['Revenue Officer I', 'Revenue Officer II', 'Revenue Officer III', 'Revenue Officer IV'],
      'Revenue Specialist': ['Revenue Specialist I', 'Revenue Specialist II', 'Revenue Specialist III', 'Revenue Specialist IV'],
      'Administrative Officer': ['Administrative Officer I', 'Administrative Officer II', 'Administrative Officer III', 'Administrative Officer IV', 'Administrative Officer V'],
      'Legal Officer': ['Legal Officer I', 'Legal Officer II', 'Legal Officer III', 'Legal Officer IV'],
      'Assessment Officer': ['Assessment Officer I', 'Assessment Officer II', 'Assessment Officer III', 'Assessment Officer IV'],
      'Collection Officer': ['Collection Officer I', 'Collection Officer II', 'Collection Officer III', 'Collection Officer IV'],
      'Taxpayer Service Representative': ['Taxpayer Service Representative I', 'Taxpayer Service Representative II', 'Taxpayer Service Representative III'],
    };
    return levels[position] || [];
  };

  // Handle position change
  const handlePositionChange = (e) => {
    const selectedPosition = e.target.value;
    setValue('position', selectedPosition);
    setValue('positionLevel', '');
    
    const levels = getSubLevels(selectedPosition);
    setSubLevelOptions(levels);
    setShowSubLevel(levels.length > 0);
  };

  const getPasswordStrengthColor = () => {
    const colors = ['#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'];
    return colors[passwordStrength];
  };

  const getPasswordStrengthText = () => {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return texts[passwordStrength];
  };

  // ============ THIS IS THE COMPLETE CHANGED onSubmit FUNCTION ============
  const onSubmit = async (data) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Combine position and level if level exists
      let finalPosition = data.position;
      if (data.positionLevel) {
        finalPosition = data.positionLevel;
      }

      console.log('1. Starting registration with:', {
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        position: finalPosition
      });

      // Use the AuthContext register method instead of direct Supabase call
      const result = await registerUser(
        data.email,
        data.password,
        data.username,
        data.fullName,
        finalPosition
      );

      console.log('2. Registration result:', result);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.success) {
        console.log('3. Registration successful!');
        setSuccess('Registration successful! Your account is pending admin approval. You will be notified once approved.');
        setTimeout(() => {
          navigate('/login');
        }, 4000);
      } else {
        throw new Error('Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  // ============ END OF CHANGED onSubmit FUNCTION ============

  // Terms of Service Modal
  const TosModal = () => (
    <div className="modal-overlay" onClick={() => setShowToS(false)}>
      <div className="policy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="policy-header">
          <DocumentTextIcon />
          <h2>Terms of Service - Estator Reign</h2>
          <button className="close-modal" onClick={() => setShowToS(false)}><XMarkIcon /></button>
        </div>
        <div className="policy-body">
          <h3>ESTATOR REIGN - TERMS OF SERVICE</h3>
          
          <h4>1. ACCEPTANCE OF TERMS</h4>
          <p>By accessing and using Estator Reign, you agree to comply with these Terms of Service. If you do not agree, please do not use the system.</p>
          
          <h4>2. AUTHORIZED USE</h4>
          <p>This system is designed for estate tax estimation and property division calculations. It is intended for informational purposes only.</p>
          
          <h4>3. DISCLAIMER OF LIABILITY - IMPORTANT</h4>
          <p><strong>Estator Reign is provided as an ASSISTIVE TOOL ONLY</strong> for estate tax estimation and property division calculations. The computations, suggestions, and outputs generated by this system are for <strong>INFORMATIONAL AND REFERENCE PURPOSES ONLY</strong> and should NOT be considered as:</p>
          <p>- Official tax assessment from the Bureau of Internal Revenue (BIR)<br/>
          - Legal advice from a licensed attorney or tax professional<br/>
          - Final and binding estate valuation<br/>
          - Substitute for professional consultation</p>
          
          <p><strong>YOU ACKNOWLEDGE AND AGREE THAT:</strong><br/>
          1. You are solely responsible for verifying all calculations with official BIR forms and regulations<br/>
          2. You should consult with qualified tax professionals, lawyers, or BIR personnel before making any final decisions<br/>
          3. The creators, developers, and operators of Estator Reign shall NOT be held liable for any:<br/>
          &nbsp;&nbsp;&nbsp;- Direct or indirect damages arising from reliance on the system's outputs<br/>
          &nbsp;&nbsp;&nbsp;- Tax penalties, surcharges, or interest resulting from inaccurate computations<br/>
          &nbsp;&nbsp;&nbsp;- Legal disputes or claims related to estate distribution<br/>
          &nbsp;&nbsp;&nbsp;- Financial losses incurred from using this system<br/>
          4. This tool is an additional reference and NOT the primary basis for estate tax filing</p>
          
          <p><strong>RECOMMENDATION:</strong> Always cross-reference results with:<br/>
          - National Internal Revenue Code (NIRC) provisions<br/>
          - Current BIR revenue regulations and issuances<br/>
          - Professional advice from CPAs, lawyers, or BIR-accredited tax practitioners</p>
          
          <p>By using Estator Reign, you confirm that you understand and accept these limitations of liability.</p>
          
          <h4>4. USER RESPONSIBILITIES</h4>
          <p>- You are responsible for maintaining the confidentiality of your account credentials<br/>
          - You agree to provide accurate and complete information<br/>
          - You agree not to share your account with unauthorized persons<br/>
          - You will immediately report any unauthorized access to system administrators</p>
          
          <h4>5. DATA ACCURACY</h4>
          <p>All estate tax declarations, payments, and related information entered must be truthful and accurate to the best of your knowledge.</p>
          
          <h4>6. SYSTEM USE RESTRICTIONS</h4>
          <p>You may not:<br/>
          - Attempt to bypass system security measures<br/>
          - Access data not intended for your role<br/>
          - Use automated scripts or bots<br/>
          - Intentionally disrupt system operations</p>
          
          <h4>7. DATA PRIVACY</h4>
          <p>Your use is also governed by our Privacy Policy. All personal and tax information is protected under applicable data privacy laws.</p>
          
          <h4>8. MODIFICATIONS</h4>
          <p>We reserve the right to modify these terms at any time. Continued use constitutes acceptance of modified terms.</p>
          
          <h4>9. GOVERNING LAW</h4>
          <p>These terms are governed by the laws of the Republic of the Philippines.</p>
        </div>
        <div className="policy-footer">
          <button className="btn-agree" onClick={() => { setValue('agreeToS', true); setShowToS(false); }}>I Understand and Agree</button>
        </div>
      </div>
    </div>
  );

  // Privacy Policy Modal
  const PrivacyModal = () => (
    <div className="modal-overlay" onClick={() => setShowPrivacy(false)}>
      <div className="policy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="policy-header">
          <ShieldCheckIcon />
          <h2>Privacy Policy - Estator Reign</h2>
          <button className="close-modal" onClick={() => setShowPrivacy(false)}><XMarkIcon /></button>
        </div>
        <div className="policy-body">
          <h3>ESTATOR REIGN - PRIVACY POLICY</h3>
          
          <h4>1. INFORMATION WE COLLECT</h4>
          <p>- Personal information: Name, email, username, position<br/>
          - Authentication data: Login credentials, access logs<br/>
          - Tax-related information: Estate declarations, payment records<br/>
          - System usage data: IP addresses, browser information, access timestamps</p>
          
          <h4>2. HOW WE USE YOUR INFORMATION</h4>
          <p>- To authenticate your identity and authorize access<br/>
          - To process estate tax declarations and payments<br/>
          - To maintain audit trails for compliance<br/>
          - To communicate system updates and notifications<br/>
          - To improve system performance and security</p>
          
          <h4>3. DATA SHARING</h4>
          <p>Your information may be shared with:<br/>
          - Authorized BIR personnel with legitimate need<br/>
          - Government audit agencies as required by law<br/>
          - System administrators for maintenance and security<br/><br/>
          We do NOT sell your personal information to third parties.</p>
          
          <h4>4. DATA RETENTION</h4>
          <p>- Account information: Retained while your account is active<br/>
          - Tax records: Retained as required by Philippine tax laws (typically 10 years)<br/>
          - Access logs: Retained for security auditing (3 years)</p>
          
          <h4>5. DATA SECURITY</h4>
          <p>We implement:<br/>
          - Encryption for sensitive data<br/>
          - Role-based access controls<br/>
          - Regular security audits<br/>
          - Secure data transmission (HTTPS)</p>
          
          <h4>6. YOUR RIGHTS</h4>
          <p>You have the right to:<br/>
          - Access your personal information<br/>
          - Request correction of inaccurate data<br/>
          - Request deletion of your account (subject to legal retention requirements)<br/>
          - File a complaint with the National Privacy Commission</p>
          
          <h4>7. COOKIES AND TRACKING</h4>
          <p>We use essential cookies for authentication and session management. No third-party tracking cookies are used.</p>
          
          <h4>8. CHILDREN'S PRIVACY</h4>
          <p>This system is not intended for persons under 18 years of age.</p>
          
          <h4>9. CONTACT INFORMATION</h4>
          <p>For privacy concerns or data requests, contact:<br/>
          Estator Reign System Administrator<br/>
          estatorreign@gmail.com</p>
          
          <h4>10. POLICY UPDATES</h4>
          <p>We may update this policy periodically. Significant changes will be notified via email or system announcement.</p>
        </div>
        <div className="policy-footer">
          <button className="btn-agree" onClick={() => { setValue('agreePrivacy', true); setShowPrivacy(false); }}>I Understand and Agree</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`register-container ${theme}`} data-theme={theme}>
      <div className="register-background">
        <div className={`bg-gradient ${theme}`}></div>
        <div className="bg-pattern"></div>
      </div>
      
      <div className="register-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="register-card"
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
                <span className="logo-text">Estator<span>Reign</span></span>
              </div>
            </motion.div>
            <h1 className="title">Create Account</h1>
            <p className="subtitle">
              Register for estate tax estimation and property division tool
            </p>
          </div>

          {/* Disclaimer Banner */}
          <div className="disclaimer-banner">
            <ExclamationTriangleIcon />
            <div>
              <strong>Disclaimer:</strong> Estator Reign is an assistive tool only. 
              Always verify calculations with official BIR forms and consult with tax professionals. 
              The developer is not liable for reliance on these computations.
            </div>
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
                {error}
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
                <div>
                  <strong>Registration Successful!</strong>
                  <p>{success}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="register-form" noValidate>
            <div className="form-group">
              <label className="form-label">
                <UserIcon className="input-icon" />
                Username
              </label>
              <input
                type="text"
                className={`form-input ${errors.username ? 'error' : ''} ${touchedFields.username && !errors.username ? 'valid' : ''}`}
                placeholder="johndoe123"
                autoComplete="username"
                autoFocus
                {...register('username')}
              />
              {errors.username && touchedFields.username && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-text">
                  {errors.username.message}
                </motion.span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <UserIcon className="input-icon" />
                Full Name
              </label>
              <input
                type="text"
                className={`form-input ${errors.fullName ? 'error' : ''} ${touchedFields.fullName && !errors.fullName ? 'valid' : ''}`}
                placeholder="Enter your full name"
                autoComplete="name"
                {...register('fullName')}
              />
              {errors.fullName && touchedFields.fullName && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-text">
                  {errors.fullName.message}
                </motion.span>
              )}
            </div>
            
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
                {...register('email')}
              />
              {errors.email && touchedFields.email && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-text">
                  {errors.email.message}
                </motion.span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <BriefcaseIcon className="input-icon" />
                Position / Title
              </label>
              <select
                className={`form-input ${errors.position ? 'error' : ''}`}
                {...register('position')}
                onChange={handlePositionChange}
              >
                <option value="">Select your position</option>
                <option value="Commissioner">Commissioner</option>
                <option value="Deputy Commissioner">Deputy Commissioner</option>
                <option value="Revenue Regional Director">Revenue Regional Director</option>
                <option value="Revenue District Officer">Revenue District Officer</option>
                <option value="Revenue Division Chief">Revenue Division Chief</option>
                <option value="Revenue Section Chief">Revenue Section Chief</option>
                <option value="Revenue Officer">Revenue Officer</option>
                <option value="Revenue Specialist">Revenue Specialist</option>
                <option value="Administrative Officer">Administrative Officer</option>
                <option value="Legal Officer">Legal Officer</option>
                <option value="Assessment Officer">Assessment Officer</option>
                <option value="Collection Officer">Collection Officer</option>
                <option value="Taxpayer Service Representative">Taxpayer Service Representative</option>
                <option value="Other">Other</option>
              </select>
              {errors.position && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-text">
                  {errors.position.message}
                </motion.span>
              )}
            </div>

            {/* Sub-level selection for positions with levels */}
            {showSubLevel && (
              <div className="form-group">
                <label className="form-label">
                  <BriefcaseIcon className="input-icon" />
                  Position Level
                </label>
                <select
                  className={`form-input ${errors.positionLevel ? 'error' : ''}`}
                  {...register('positionLevel')}
                >
                  <option value="">Select your level</option>
                  {subLevelOptions.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                {errors.positionLevel && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-text">
                    {errors.positionLevel.message}
                  </motion.span>
                )}
              </div>
            )}

            {positionValue === 'Other' && (
              <div className="form-group">
                <label className="form-label">
                  <BriefcaseIcon className="input-icon" />
                  Please specify
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your position"
                  onChange={(e) => setValue('position', e.target.value)}
                />
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">
                <KeyIcon className="input-icon" />
                Password
              </label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  {...register('password')}
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
              {passwordValue && passwordValue.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="password-strength"
                >
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{
                        width: `${(passwordStrength + 1) * 20}%`,
                        backgroundColor: getPasswordStrengthColor(),
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </div>
                  <div className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                    Password strength: {getPasswordStrengthText()}
                  </div>
                </motion.div>
              )}
              
              {errors.password && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-text">
                  {errors.password.message}
                </motion.span>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <ShieldCheckIcon className="input-icon" />
                Confirm Password
              </label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm your password"
                  autoComplete="off"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle"
                >
                  {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-text">
                  {errors.confirmPassword.message}
                </motion.span>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="terms-section">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="agreeToS"
                  {...register('agreeToS')}
                />
                <label htmlFor="agreeToS">
                  I agree to the <button type="button" className="link-btn" onClick={() => setShowToS(true)}>Terms of Service</button>
                </label>
              </div>
              {errors.agreeToS && (
                <span className="error-text">{errors.agreeToS.message}</span>
              )}

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="agreePrivacy"
                  {...register('agreePrivacy')}
                />
                <label htmlFor="agreePrivacy">
                  I agree to the <button type="button" className="link-btn" onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
                </label>
              </div>
              {errors.agreePrivacy && (
                <span className="error-text">{errors.agreePrivacy.message}</span>
              )}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="submit-btn"
              disabled={loading || !isValid}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  Create account
                  <ArrowRightIcon className="btn-icon" />
                </>
              )}
            </motion.button>
          </form>
          
          {/* Sign In Link */}
          <div className="signin-prompt">
            <span>Already have an account?</span>
            <Link to="/login" className="signin-link">
              Sign in
              <ArrowRightIcon className="link-icon" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      {showToS && <TosModal />}
      {showPrivacy && <PrivacyModal />}
      
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
        
        .register-container {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: var(--bg-primary);
          transition: background 0.3s ease;
        }
        
        .register-background {
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
        
        .register-wrapper {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(1rem, 5vw, 2rem);
        }
        
        .register-card {
          max-width: min(550px, 100%);
          width: 100%;
          background: var(--card-bg);
          border-radius: clamp(1.5rem, 4vw, 2rem);
          padding: clamp(1.5rem, 5vw, 2.5rem);
          box-shadow: var(--shadow);
          transition: all 0.3s ease;
          position: relative;
        }
        
        /* Theme Toggle */
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
        
        /* Disclaimer Banner */
        .disclaimer-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.875rem;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        [data-theme="dark"] .disclaimer-banner {
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.3);
        }
        
        .disclaimer-banner svg {
          width: 1.25rem;
          height: 1.25rem;
          color: #f59e0b;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        
        .disclaimer-banner div {
          font-size: 0.75rem;
          color: #92400e;
          line-height: 1.4;
        }
        
        [data-theme="dark"] .disclaimer-banner div {
          color: #fde68a;
        }
        
        .disclaimer-banner strong {
          font-weight: 600;
        }
        
        /* Error and Success Messages */
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
        
        .success-message div {
          flex: 1;
        }
        
        .success-message strong {
          display: block;
          margin-bottom: 0.25rem;
        }
        
        .success-message p {
          margin: 0;
          font-size: 0.75rem;
        }
        
        /* Forms */
        .register-form {
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
        
        select.form-input {
          cursor: pointer;
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
        
        /* Password Strength */
        .password-strength {
          margin-top: 0.5rem;
        }
        
        .strength-bar {
          height: 4px;
          background: var(--border-color);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }
        
        .strength-fill {
          height: 100%;
          transition: width 0.3s ease, background-color 0.3s ease;
        }
        
        .strength-text {
          font-size: 0.7rem;
          font-weight: 500;
        }
        
        .error-text {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        
        /* Terms Section */
        .terms-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .checkbox-group input {
          width: 1rem;
          height: 1rem;
          cursor: pointer;
          accent-color: var(--gradient-start);
        }
        
        .checkbox-group label {
          font-size: 0.813rem;
          color: var(--text-secondary);
        }
        
        .link-btn {
          background: none;
          border: none;
          color: var(--gradient-start);
          cursor: pointer;
          font-size: 0.813rem;
          text-decoration: underline;
          padding: 0;
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
        
        /* Sign In Prompt */
        .signin-prompt {
          text-align: center;
          margin-top: 2rem;
          padding-top: 1.5rem;
          font-size: clamp(0.75rem, 3vw, 0.875rem);
          color: var(--text-secondary);
        }
        
        .signin-link {
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
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        
        .policy-modal {
          background: var(--card-bg);
          border-radius: 1rem;
          width: 100%;
          max-width: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .policy-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          position: relative;
        }
        
        .policy-header svg {
          width: 1.5rem;
          height: 1.5rem;
          color: var(--gradient-start);
        }
        
        .policy-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          flex: 1;
        }
        
        .close-modal {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 0.25rem;
        }
        
        .close-modal svg {
          width: 1.25rem;
          height: 1.25rem;
        }
        
        .policy-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }
        
        .policy-body h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 1rem 0;
        }
        
        .policy-body h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 1rem 0 0.5rem 0;
        }
        
        .policy-body p {
          font-size: 0.813rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 0.5rem 0;
        }
        
        .policy-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: flex-end;
        }
        
        .btn-agree {
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          border: none;
          border-radius: 0.5rem;
          color: white;
          cursor: pointer;
        }
        
        /* Responsive Design */
        @media (max-width: 640px) {
          .register-card {
            padding: 1.5rem;
          }
          
          .policy-header {
            padding: 1rem;
          }
          
          .policy-body {
            padding: 1rem;
          }
        }
        
        @media (min-width: 1025px) {
          .register-card:hover {
            transform: translateY(-5px);
            transition: transform 0.3s ease;
          }
        }
        
        @media (max-width: 640px) and (orientation: landscape) {
          .register-wrapper {
            padding: 1rem;
          }
          
          .register-card {
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
          .register-card,
          .submit-btn,
          .theme-toggle {
            transition: none;
          }
          
          .spin {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

// Wrap the component with ThemeProvider
const RegisterWithTheme = (props) => (
  <ThemeProvider>
    <Register {...props} />
  </ThemeProvider>
);

export default RegisterWithTheme;