import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRightIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

// Theme Context
const ThemeContext = React.createContext();
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

const WelcomePage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <ShieldCheckIcon className="feature-icon" />,
      title: 'Secure Estate Management',
      description: 'Bank-grade security for your estate tax planning and portfolio management.'
    },
    {
      icon: <ChartBarIcon className="feature-icon" />,
      title: 'Real-time Analytics',
      description: 'Monitor your estate tax positions with live updates and comprehensive reports.'
    },
    {
      icon: <DocumentTextIcon className="feature-icon" />,
      title: 'Smart Documentation',
      description: 'Automated document generation and filing for estate tax compliance.'
    },
    {
      icon: <ClockIcon className="feature-icon" />,
      title: '24/7 Access',
      description: 'Manage your estate portfolio anytime, anywhere with mobile-optimized access.'
    }
  ];

  const handleGetStarted = () => {
    // Set flag that user came from welcome
    sessionStorage.setItem('cameFromWelcome', 'true');
    // Navigate to dashboard with replace to prevent going back
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className={`welcome-container ${theme}`} data-theme={theme}>
      {/* Background */}
      <div className="welcome-background">
        <div className={`bg-gradient ${theme}`}></div>
        <div className="bg-pattern"></div>
      </div>

      {/* Content */}
      <div className="welcome-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ duration: 0.6 }}
          className="welcome-card"
        >
          {/* Theme Toggle */}
          <div className="theme-toggle-wrapper">
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>

          {/* User Greeting */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="user-greeting"
          >
            <UserCircleIcon className="user-icon" />
            <div className="greeting-text">
              <span className="welcome-badge">Welcome back!</span>
              <h2 className="user-name">{user?.name || user?.email || 'User'}</h2>
            </div>
          </motion.div>

          {/* Logo & Header */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="logo-section"
          >
            <div className="logo">
              <UserGroupIcon className="logo-icon" />
              <span className="logo-text">Estate<span>Tax</span></span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="header-section"
          >
            <h1 className="main-title">
              Welcome to EstateTax
              <span className="highlight">Pro</span>
            </h1>
            <p className="subtitle">
              Your comprehensive estate tax management platform
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="features-grid"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (index * 0.1), duration: 0.5 }}
                className="feature-card"
              >
                <div className="feature-icon-wrapper">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Get Started Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="action-section"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetStarted}
              className="get-started-btn"
            >
              <span>Go to Dashboard</span>
              <ArrowRightIcon className="btn-icon" />
            </motion.button>
            
            <p className="skip-text">
              <CheckCircleIcon className="check-icon" />
              Your estate tax portfolio is ready
            </p>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        /* CSS Variables for Themes */
        .welcome-container {
          --bg-primary: #ffffff;
          --bg-secondary: #f7fafc;
          --text-primary: #1a202c;
          --text-secondary: #718096;
          --border-color: #e2e8f0;
          --card-bg: #ffffff;
          --hover-bg: #f7fafc;
          --shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          --gradient-start: #667eea;
          --gradient-end: #764ba2;
        }
        
        .welcome-container[data-theme="dark"] {
          --bg-primary: #0a0e27;
          --bg-secondary: #1a1f3a;
          --text-primary: #e2e8f0;
          --text-secondary: #94a3b8;
          --border-color: #2d3748;
          --card-bg: #1a1f3a;
          --hover-bg: #2d3748;
          --shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          --gradient-start: #4c51bf;
          --gradient-end: #5b3a8a;
        }
        
        .welcome-container {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: var(--bg-primary);
          transition: background 0.3s ease;
        }
        
        .welcome-background {
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
        
        .welcome-wrapper {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(1rem, 5vw, 2rem);
        }
        
        .welcome-card {
          max-width: min(900px, 100%);
          width: 100%;
          background: var(--card-bg);
          border-radius: clamp(1.5rem, 4vw, 2rem);
          padding: clamp(2rem, 5vw, 3rem);
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
        
        .user-greeting {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: clamp(1.5rem, 4vw, 2rem);
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 1rem;
          border: 1px solid var(--border-color);
        }
        
        .user-icon {
          width: clamp(2.5rem, 6vw, 3.5rem);
          height: clamp(2.5rem, 6vw, 3.5rem);
          color: var(--gradient-start);
          flex-shrink: 0;
        }
        
        .greeting-text {
          flex: 1;
        }
        
        .welcome-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--gradient-start);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .user-name {
          font-size: clamp(1.25rem, 4vw, 1.75rem);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        
        .logo-section {
          text-align: center;
          margin-bottom: clamp(1rem, 3vw, 1.5rem);
        }
        
        .logo {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: clamp(1.5rem, 5vw, 2rem);
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .logo-icon {
          width: clamp(2rem, 5vw, 2.5rem);
          height: clamp(2rem, 5vw, 2.5rem);
          color: var(--gradient-start);
        }
        
        .logo-text span {
          color: var(--gradient-start);
        }
        
        .header-section {
          text-align: center;
          margin-bottom: clamp(2rem, 5vw, 3rem);
        }
        
        .main-title {
          font-size: clamp(2rem, 6vw, 3rem);
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }
        
        .highlight {
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .subtitle {
          color: var(--text-secondary);
          font-size: clamp(1rem, 3vw, 1.25rem);
          max-width: 600px;
          margin: 0 auto;
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: clamp(1rem, 2vw, 1.5rem);
          margin-bottom: clamp(2rem, 5vw, 3rem);
        }
        
        .feature-card {
          padding: clamp(1rem, 2vw, 1.5rem);
          background: var(--bg-secondary);
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          transition: all 0.3s ease;
          text-align: center;
        }
        
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border-color: var(--gradient-start);
        }
        
        .feature-icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: clamp(3rem, 6vw, 3.5rem);
          height: clamp(3rem, 6vw, 3.5rem);
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          border-radius: 1rem;
          margin-bottom: 0.75rem;
        }
        
        .feature-icon {
          width: clamp(1.25rem, 2.5vw, 1.5rem);
          height: clamp(1.25rem, 2.5vw, 1.5rem);
          color: white;
        }
        
        .feature-title {
          font-size: clamp(0.875rem, 2vw, 1rem);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        
        .feature-description {
          font-size: clamp(0.75rem, 1.5vw, 0.875rem);
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }
        
        .action-section {
          text-align: center;
        }
        
        .get-started-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2.5rem);
          background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: clamp(1rem, 2.5vw, 1.125rem);
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 10px 25px -5px rgba(76, 81, 191, 0.3);
        }
        
        .get-started-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px -5px rgba(76, 81, 191, 0.4);
        }
        
        .get-started-btn:active {
          transform: translateY(0);
        }
        
        .btn-icon {
          width: 1.25rem;
          height: 1.25rem;
          transition: transform 0.2s;
        }
        
        .get-started-btn:hover .btn-icon {
          transform: translateX(4px);
        }
        
        .skip-text {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .check-icon {
          width: 1rem;
          height: 1rem;
          color: #22c55e;
        }
        
        @media (max-width: 640px) {
          .welcome-card {
            padding: 1.5rem;
          }
          
          .features-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .user-greeting {
            flex-direction: column;
            text-align: center;
          }
        }
        
        @media (max-width: 480px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .welcome-card,
          .feature-card,
          .get-started-btn,
          .theme-toggle {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

// Wrap the component with ThemeProvider
const WelcomePageWithTheme = (props) => (
  <ThemeProvider>
    <WelcomePage {...props} />
  </ThemeProvider>
);

export default WelcomePageWithTheme;