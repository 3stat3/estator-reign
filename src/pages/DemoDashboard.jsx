import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyDivider from "../components/PropertyDivider/PropertyDivider";
import EstateTaxCalculator from '../components/EstateTaxCalculator/EstateTaxCalculator';
import PersonalFinanceTracker from '../components/PersonalTools/PersonalFinanceTracker';  // <-- FIXED IMPORT
import {
  CalculatorIcon,
  UserGroupIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  EyeIcon,
  ChartPieIcon,
  WrenchScrewdriverIcon,
  Squares2X2Icon,
  WalletIcon  // <-- Added for Finance Tracker icon
} from '@heroicons/react/24/outline';

const DemoDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('finance'); // Set Finance Tracker as default
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showEstateTaxMenu, setShowEstateTaxMenu] = useState(false);
  const [showHelpfulToolsMenu, setShowHelpfulToolsMenu] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showUserMenu && !e.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      if (showNotifications && !e.target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
      if (showEstateTaxMenu && !e.target.closest('.estate-tax-menu-container')) {
        setShowEstateTaxMenu(false);
      }
      if (showHelpfulToolsMenu && !e.target.closest('.helpful-tools-menu-container')) {
        setShowHelpfulToolsMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu, showNotifications, showEstateTaxMenu, showHelpfulToolsMenu]);

  // Estate Tax sub-menu items (all locked in demo)
  const estateTaxItems = [
    { id: 'calculator', label: 'Tax Calculator', icon: CalculatorIcon, locked: true },
    { id: 'propertydivider', label: 'Property Divider', icon: UserGroupIcon, locked: true },
    { id: 'taxhelpers', label: 'Tax Helpers', icon: WrenchScrewdriverIcon, locked: true },
  ];

  // Helpful Tools items (all locked in demo)
  const helpfulToolsItems = [
    { id: 'onnet-tracker', label: 'ONNET & eLA Tracker', icon: ChartPieIcon, locked: true },
    { id: 'interest-calculator', label: 'Interest Calculator', icon: CalculatorIcon, locked: true },
    { id: 'vanishing-deduction', label: 'Vanishing Deduction', icon: WrenchScrewdriverIcon, locked: true },
  ];

  const notifications = [
    { id: 1, title: 'Demo Mode - View Only', message: 'You can see all features but cannot interact. Full access after admin approval.', time: 'Just now', read: false },
    { id: 2, title: 'Finance Tracker Available', message: 'Track your personal finances in demo mode.', time: '2 min ago', read: false },
  ];

  // Wrapper component that disables all interactive elements
  const DemoWrapper = ({ children }) => {
    return (
      <div className="demo-content">
        {children}
      </div>
    );
  };

  // Locked feature component
  const LockedFeature = ({ featureName }) => (
    <motion.div 
      className="locked-feature-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="locked-icon">
        <LockClosedIcon />
      </div>
      <h2>Feature Locked</h2>
      <p>The <strong>{featureName}</strong> is not available in demo mode.</p>
      <div className="locked-details">
        <ExclamationTriangleIcon />
        <div>
          <strong>Why is this locked?</strong>
          <p>This feature requires full account approval from an administrator.</p>
        </div>
      </div>
      <div className="locked-estimate">
        <p>Please wait for admin approval to access all features.</p>
      </div>
    </motion.div>
  );

  const renderContent = () => {
    // Finance Tracker - Fully accessible
    if (activeTab === 'finance') {
      return (
        <motion.div
          key="finance"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="finance-tracker-wrapper"
        >
          <div className="finance-tracker-header">
            <h2>💰 Personal Finance Tracker</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track your income, expenses, and savings
            </p>
          </div>
          <PersonalFinanceTracker />  {/* <-- Using the correct component */}
        </motion.div>
      );
    }

    // All other features are locked
    const featureNames = {
      calculator: 'Estate Tax Calculator',
      propertydivider: 'Property Divider',
      taxhelpers: 'Tax Helpers',
      'onnet-tracker': 'ONNET & eLA Tracker',
      'interest-calculator': 'Interest Calculator',
      'vanishing-deduction': 'Vanishing Deduction'
    };

    return (
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <LockedFeature featureName={featureNames[activeTab] || 'Feature'} />
      </motion.div>
    );
  };

  return (
    <div className={`dashboard-container ${theme}`} data-theme={theme}>
      {/* Top Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="logo">
              <svg className="logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="logo-text">Estator<span>Reign</span></span>
            </div>
            <div className="demo-badge-nav">DEMO MODE</div>
          </div>

          {/* Desktop Navigation */}
          <div className={`nav-tabs desktop-nav ${isMobile ? 'hidden' : ''}`}>
            {/* Estate Tax Dropdown Menu - All locked */}
            <div className="estate-tax-menu-container">
              <button
                className={`nav-tab dropdown-trigger ${estateTaxItems.some(item => item.id === activeTab) ? 'active' : ''}`}
                onClick={() => setShowEstateTaxMenu(!showEstateTaxMenu)}
                onMouseEnter={() => setShowEstateTaxMenu(true)}
                onMouseLeave={() => {
                  setTimeout(() => {
                    if (!document.querySelector('.estate-tax-menu-container .dropdown-menu:hover')) {
                      setShowEstateTaxMenu(false);
                    }
                  }, 150);
                }}
              >
                <Squares2X2Icon className="tab-icon" />
                <span>Estate Tax Services</span>
                <ChevronDownIcon className={`dropdown-chevron ${showEstateTaxMenu ? 'rotated' : ''}`} />
                {estateTaxItems.some(item => item.id === activeTab) && (
                  <motion.div className="tab-indicator" layoutId="activeTab" />
                )}
              </button>
              
              <AnimatePresence>
                {showEstateTaxMenu && (
                  <motion.div
                    className="dropdown-menu"
                    initial={{ opacity: 0, y: -5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    onMouseEnter={() => setShowEstateTaxMenu(true)}
                    onMouseLeave={() => setShowEstateTaxMenu(false)}
                  >
                    {estateTaxItems.map((item) => (
                      <button
                        key={item.id}
                        className={`dropdown-item-nav ${activeTab === item.id ? 'active' : ''} locked-item`}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowEstateTaxMenu(false);
                        }}
                      >
                        <item.icon className="dropdown-item-icon" />
                        <span>{item.label}</span>
                        <LockClosedIcon className="lock-icon-dropdown" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Helpful Tools Dropdown - All locked */}
            <div className="helpful-tools-menu-container">
              <button
                className={`nav-tab dropdown-trigger ${helpfulToolsItems.some(item => item.id === activeTab) ? 'active' : ''}`}
                onClick={() => setShowHelpfulToolsMenu(!showHelpfulToolsMenu)}
                onMouseEnter={() => setShowHelpfulToolsMenu(true)}
                onMouseLeave={() => {
                  setTimeout(() => {
                    if (!document.querySelector('.helpful-tools-menu-container .dropdown-menu:hover')) {
                      setShowHelpfulToolsMenu(false);
                    }
                  }, 150);
                }}
              >
                <WrenchScrewdriverIcon className="tab-icon" />
                <span>Revenuer Tools</span>
                <ChevronDownIcon className={`dropdown-chevron ${showHelpfulToolsMenu ? 'rotated' : ''}`} />
                {helpfulToolsItems.some(item => item.id === activeTab) && (
                  <motion.div className="tab-indicator" layoutId="activeTab" />
                )}
              </button>
              
              <AnimatePresence>
                {showHelpfulToolsMenu && (
                  <motion.div
                    className="dropdown-menu"
                    initial={{ opacity: 0, y: -5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    onMouseEnter={() => setShowHelpfulToolsMenu(true)}
                    onMouseLeave={() => setShowHelpfulToolsMenu(false)}
                  >
                    {helpfulToolsItems.map((item) => (
                      <button
                        key={item.id}
                        className={`dropdown-item-nav ${activeTab === item.id ? 'active' : ''} locked-item`}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowHelpfulToolsMenu(false);
                        }}
                      >
                        <item.icon className="dropdown-item-icon" />
                        <span>{item.label}</span>
                        <LockClosedIcon className="lock-icon-dropdown" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Finance Tracker - Fully accessible */}
            <button
              onClick={() => setActiveTab('finance')}
              className={`nav-tab ${activeTab === 'finance' ? 'active' : ''}`}
            >
              <WalletIcon className="tab-icon" />
              <span>Finance Tracker</span>
              {activeTab === 'finance' && (
                <motion.div className="tab-indicator" layoutId="activeTab" />
              )}
            </button>
          </div>

          {/* Mobile Navigation - Simplified */}
          <div className={`nav-tabs mobile-nav ${isMobile ? '' : 'hidden'}`}>
            <button
              onClick={() => setActiveTab('finance')}
              className={`nav-tab ${activeTab === 'finance' ? 'active' : ''}`}
            >
              <WalletIcon className="tab-icon" />
              <span>Finance</span>
              {activeTab === 'finance' && (
                <motion.div className="tab-indicator" layoutId="activeTabMobile" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`nav-tab ${activeTab === 'calculator' ? 'active' : ''}`}
            >
              <LockClosedIcon className="tab-icon" />
              <span>Locked</span>
            </button>
          </div>

          <div className="nav-actions">
            <button className="icon-btn" onClick={toggleTheme}>
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            
            <div className="notifications-container">
              <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <BellIcon />
                <span className="notification-badge">2</span>
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="notifications-dropdown"
                  >
                    <div className="dropdown-header">
                      <h3>Notifications</h3>
                    </div>
                    {notifications.map(notif => (
                      <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                        <div className="notification-content">
                          <p className="notification-title">{notif.title}</p>
                          <p className="notification-message">{notif.message}</p>
                          <span className="notification-time">{notif.time}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="user-menu-container">
              <button className="user-menu-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar-small">
                  {user?.email?.[0]?.toUpperCase() || 'D'}
                </div>
                <span className="user-name-nav">{user?.email?.split('@')[0] || 'Demo'}</span>
                <ChevronDownIcon className="chevron-icon" />
              </button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="user-dropdown"
                  >
                    <div className="dropdown-header">
                      <div className="user-info-dropdown">
                        <div className="user-avatar-dropdown">{user?.email?.[0]?.toUpperCase() || 'D'}</div>
                        <div>
                          <p className="user-name-dropdown">{user?.email?.split('@')[0] || 'Demo User'}</p>
                          <p className="user-email-dropdown">{user?.email || 'demo@estatorreign.com'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item disabled">
                      <LockClosedIcon />
                      Demo Mode - View Only
                    </div>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout" onClick={logout}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Global Demo Banner */}
      <div className="global-demo-banner">
        <div className="banner-content">
          <EyeIcon className="banner-icon" />
          <div className="banner-text">
            <strong>Demo Account - View Only Mode</strong>
            <p>Your account is awaiting administrator approval. You can preview all features but cannot submit or save any data. Full access will be granted once approved.</p>
          </div>
          <div className="banner-status">
            <LockClosedIcon />
            <span>Pending Approval</span>
          </div>
        </div>
      </div>

      <main className="dashboard-main">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --bg-primary: #f8fafc;
          --bg-secondary: #ffffff;
          --text-primary: #0f172a;
          --text-secondary: #64748b;
          --text-tertiary: #94a3b8;
          --border-color: #e2e8f0;
          --card-bg: #ffffff;
          --nav-bg: #ffffff;
          --hover-bg: #f1f5f9;
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          --gradient-start: #667eea;
          --gradient-end: #764ba2;
        }

        [data-theme="dark"] {
          --bg-primary: #0f172a;
          --bg-secondary: #1e293b;
          --text-primary: #f1f5f9;
          --text-secondary: #94a3b8;
          --text-tertiary: #64748b;
          --border-color: #334155;
          --card-bg: #1e293b;
          --nav-bg: #1e293b;
          --hover-bg: #334155;
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }

        .dashboard-container {
          min-height: 100vh;
          background: var(--bg-primary);
          transition: all 0.3s ease;
        }

        .dashboard-nav {
          background: var(--nav-bg);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 50;
          overflow: visible !important;
        }

        .nav-container {
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
          gap: 1rem;
          overflow: visible !important;
          position: relative;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .logo-icon {
          width: 1.75rem;
          height: 1.75rem;
          color: var(--gradient-start);
        }

        .logo-text span {
          color: var(--gradient-start);
        }

        .demo-badge-nav {
          background: #f59e0b;
          color: #92400e;
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
          font-size: 0.7rem;
          font-weight: 600;
        }

        [data-theme="dark"] .demo-badge-nav {
          background: rgba(245, 158, 11, 0.2);
          color: #fde68a;
        }

        .nav-tabs {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          overflow: visible !important;
          scrollbar-width: none;
          position: relative;
        }

        .nav-tabs::-webkit-scrollbar {
          display: none;
        }

        .nav-tabs.hidden {
          display: none !important;
        }

        .desktop-nav {
          display: flex !important;
        }

        .mobile-nav {
          display: none !important;
        }

        .nav-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          white-space: nowrap;
          z-index: 1;
          flex-shrink: 0;
        }

        .nav-tab:hover {
          background: var(--hover-bg);
          color: var(--text-primary);
        }

        .nav-tab.active {
          color: var(--gradient-start);
          background: rgba(102, 126, 234, 0.1);
        }

        .tab-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .tab-indicator {
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          border-radius: 2px;
        }

        .dropdown-trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dropdown-chevron {
          width: 1rem;
          height: 1rem;
          transition: transform 0.2s ease;
        }

        .dropdown-chevron.rotated {
          transform: rotate(180deg);
        }

        .estate-tax-menu-container,
        .helpful-tools-menu-container {
          position: relative;
          display: inline-block;
          flex-shrink: 0;
          overflow: visible !important;
          z-index: 10;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          min-width: 220px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          padding: 0.5rem;
          z-index: 99999 !important;
          overflow: visible !important;
          display: block !important;
        }

        .dropdown-item-nav {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.625rem 0.875rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          text-align: left;
        }

        .dropdown-item-nav:hover {
          background: var(--hover-bg);
          color: var(--text-primary);
        }

        .dropdown-item-nav.active {
          background: rgba(102, 126, 234, 0.1);
          color: var(--gradient-start);
        }

        .dropdown-item-nav.locked-item {
          opacity: 0.7;
        }

        .dropdown-item-nav.locked-item:hover {
          background: rgba(245, 158, 11, 0.1);
        }

        .dropdown-item-icon {
          width: 1.25rem;
          height: 1.25rem;
          flex-shrink: 0;
        }

        .lock-icon-dropdown {
          width: 0.875rem;
          height: 0.875rem;
          margin-left: auto;
          color: #f59e0b;
          flex-shrink: 0;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .icon-btn {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          padding: 0.5rem;
          cursor: pointer;
          color: var(--text-primary);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .icon-btn svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .icon-btn:hover {
          background: var(--hover-bg);
          transform: translateY(-1px);
        }

        .notifications-container {
          position: relative;
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
        }

        .notifications-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          width: 340px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          box-shadow: var(--shadow-lg);
          z-index: 100;
        }

        .notification-item {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: background 0.2s;
        }

        .notification-item:hover {
          background: var(--hover-bg);
        }

        .notification-item.unread {
          background: rgba(102, 126, 234, 0.05);
        }

        .notification-title {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .notification-message {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .notification-time {
          font-size: 0.625rem;
          color: var(--text-tertiary);
        }

        .user-menu-container {
          position: relative;
          z-index: 10;
        }

        .user-menu-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          transition: background 0.2s;
        }

        .user-menu-btn:hover {
          background: var(--hover-bg);
        }

        .user-avatar-small {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .user-name-nav {
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .chevron-icon {
          width: 1rem;
          height: 1rem;
          color: var(--text-tertiary);
        }

        .user-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          width: 280px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          box-shadow: var(--shadow-lg);
          z-index: 100;
        }

        .dropdown-header {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .dropdown-header h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-info-dropdown {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar-dropdown {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 1rem;
        }

        .user-name-dropdown {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-email-dropdown {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .dropdown-divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.5rem 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: background 0.2s;
        }

        .dropdown-item svg {
          width: 1.25rem;
          height: 1.25rem;
          color: var(--text-secondary);
        }

        .dropdown-item:hover {
          background: var(--hover-bg);
        }

        .dropdown-item.disabled {
          opacity: 0.6;
          cursor: default;
          background: rgba(245, 158, 11, 0.1);
        }

        .dropdown-item.disabled:hover {
          background: rgba(245, 158, 11, 0.1);
        }

        .dropdown-item.logout {
          color: #ef4444;
        }

        .dropdown-item.logout svg {
          color: #ef4444;
        }

        .dashboard-main {
          max-width: 1600px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        .global-demo-banner {
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .banner-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #fef3c7, #fffbeb);
          border-radius: 0.75rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        [data-theme="dark"] .banner-content {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
        }

        .banner-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: #f59e0b;
          flex-shrink: 0;
        }

        .banner-text {
          flex: 1;
        }

        .banner-text strong {
          display: block;
          color: #92400e;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .banner-text p {
          color: #92400e;
          font-size: 0.813rem;
        }

        [data-theme="dark"] .banner-text strong,
        [data-theme="dark"] .banner-text p {
          color: #fde68a;
        }

        .banner-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f59e0b;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .banner-status svg {
          width: 1rem;
          height: 1rem;
        }

        .finance-tracker-wrapper {
          background: var(--card-bg);
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          padding: 1.5rem;
          margin-top: 0.5rem;
        }

        .finance-tracker-header {
          margin-bottom: 1.5rem;
        }

        .finance-tracker-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .finance-tracker-header p {
          color: var(--text-secondary);
        }

        .locked-feature-card {
          background: var(--card-bg);
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          padding: 3rem 2rem;
          text-align: center;
          max-width: 550px;
          margin: 0 auto;
        }

        .locked-icon {
          width: 5rem;
          height: 5rem;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .locked-icon svg {
          width: 2.5rem;
          height: 2.5rem;
          color: #f59e0b;
        }

        .locked-feature-card h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .locked-feature-card p {
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .locked-details {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background: var(--bg-secondary);
          padding: 1rem;
          border-radius: 0.75rem;
          margin: 1.5rem 0;
          text-align: left;
          border: 1px solid var(--border-color);
        }

        .locked-details svg {
          width: 1.25rem;
          height: 1.25rem;
          color: #f59e0b;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .locked-details strong {
          display: block;
          color: var(--text-primary);
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .locked-details p {
          color: var(--text-secondary);
          font-size: 0.813rem;
          margin: 0;
        }

        .locked-estimate {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .locked-estimate p {
          color: var(--text-tertiary);
          font-size: 0.75rem;
          margin: 0;
        }

        .demo-content {
          position: relative;
          opacity: 0.9;
        }

        .demo-content input,
        .demo-content select,
        .demo-content textarea,
        .demo-content button:not(.theme-toggle):not(.nav-tab):not(.icon-btn):not(.user-menu-btn):not(.filter-btn):not(.view-btn),
        .demo-content [role="button"],
        .demo-content .btn,
        .demo-content .action-btn-icon,
        .demo-content .modal-btn {
          pointer-events: none !important;
          cursor: not-allowed !important;
          opacity: 0.7;
          filter: grayscale(0.1);
        }

        @media (max-width: 1024px) {
          .nav-tabs {
            gap: 0.25rem;
          }
          
          .nav-tab span {
            display: none;
          }
          
          .nav-tab {
            padding: 0.5rem;
          }
        }

        @media (max-width: 768px) {
          .nav-container {
            padding: 0 1rem;
            gap: 0.5rem;
          }

          .desktop-nav {
            display: none !important;
          }

          .mobile-nav {
            display: flex !important;
          }
          
          .user-name-nav {
            display: none;
          }
          
          .dashboard-main {
            padding: 1rem;
          }

          .global-demo-banner {
            padding: 0 1rem;
          }

          .banner-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .banner-status {
            align-self: flex-start;
          }

          .finance-tracker-wrapper {
            padding: 1rem;
          }

          .locked-feature-card {
            padding: 2rem 1.5rem;
            margin: 1rem 0;
          }
        }

        @media (max-width: 640px) {
          .nav-brand .logo-text {
            display: none;
          }

          .finance-tracker-header h2 {
            font-size: 1.25rem;
          }

          .nav-tab {
            padding: 0.4rem 0.6rem;
            font-size: 0.75rem;
          }

          .notifications-dropdown {
            width: 280px;
            right: -2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DemoDashboard;