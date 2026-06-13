import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyDivider from "../components/PropertyDivider/PropertyDivider";
import EstateTaxCalculator from '../components/EstateTaxCalculator/EstateTaxCalculator';
import {
  CalculatorIcon,
  UserGroupIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const DemoDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('calculator');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu, showNotifications]);

  const tabs = [
    { id: 'calculator', label: 'Tax Calculator', icon: CalculatorIcon },
    { id: 'propertydivider', label: 'Property Divider', icon: UserGroupIcon },
  ];

  const notifications = [
    { id: 1, title: 'Demo Mode - View Only', message: 'You can see all features but cannot interact. Full access after admin approval.', time: 'Just now', read: false },
  ];

  // Wrapper component that disables all interactive elements (no banner inside)
  const DemoWrapper = ({ children }) => {
    return (
      <div className="demo-content">
        {children}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'calculator':
        return (
          <DemoWrapper>
            <EstateTaxCalculator />
          </DemoWrapper>
        );
      case 'propertydivider':
        return (
          <DemoWrapper>
            <PropertyDivider />
          </DemoWrapper>
        );
      default:
        return null;
    }
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

          <div className="nav-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                <tab.icon className="tab-icon" />
                <span>{tab.label}</span>
                {activeTab === tab.id && <motion.div className="tab-indicator" layoutId="activeTab" />}
              </button>
            ))}
          </div>

          <div className="nav-actions">
            <button className="icon-btn" onClick={toggleTheme}>
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            
            <div className="notifications-container">
              <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <BellIcon />
                <span className="notification-badge">1</span>
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

      {/* Only ONE Global Demo Banner */}
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
        }

        .nav-container {
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
          gap: 2rem;
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
          overflow-x: auto;
          scrollbar-width: none;
        }

        .nav-tabs::-webkit-scrollbar {
          display: none;
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

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
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

        /* Global Demo Banner - Only ONE */
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

        /* Demo Content - Disables all interactive elements */
        .demo-content {
          position: relative;
          opacity: 0.9;
        }

        /* Disable all interactive elements inside demo content */
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
            gap: 1rem;
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
        }

        @media (max-width: 640px) {
          .nav-brand .logo-text {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DemoDashboard;