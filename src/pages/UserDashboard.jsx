import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyDivider from "../components/PropertyDivider/PropertyDivider";
import EstateTaxCalculator from '../components/EstateTaxCalculator/EstateTaxCalculator';
import TaxHelpers from '../components/TaxHelpers/TaxHelpers'; // NEW IMPORT
import {
  CalculatorIcon,
  UserGroupIcon,
  UserIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon, // NEW ICON for Tax Helpers
  SunIcon,
  MoonIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('calculator');
  const [isMobile, setIsMobile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Feature access hooks
  const { isEnabled: calculatorEnabled, loading: calcLoading } = useFeatureAccess('tax_calculator');
  const { isEnabled: dividerEnabled, loading: dividerLoading } = useFeatureAccess('property_divider');
  const { isEnabled: helpersEnabled, loading: helpersLoading } = useFeatureAccess('tax_helpers'); // NEW

  // Notifications array
  const notifications = [
    { id: 1, title: 'Welcome to Estator Reign', message: 'Start using the Tax Calculator, Property Divider, and Tax Helpers', time: 'Just now', read: false },
  ];

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

  // All tabs - keep them visible but track enabled status
  const allTabs = [
    { id: 'calculator', label: 'Tax Calculator', icon: CalculatorIcon, enabled: calculatorEnabled },
    { id: 'propertydivider', label: 'Property Divider', icon: UserGroupIcon, enabled: dividerEnabled },
    { id: 'taxhelpers', label: 'Tax Helpers', icon: ClipboardDocumentCheckIcon, enabled: helpersEnabled }, // NEW TAB
  ];

  // Maintenance Message Component for locked features
  const MaintenanceMessage = ({ featureName }) => (
    <div className="maintenance-card">
      <div className="maintenance-icon">
        <LockClosedIcon />
      </div>
      <h2>Feature Temporarily Unavailable</h2>
      <p>The {featureName} is currently <strong>under maintenance or being upgraded</strong>.</p>
      <div className="maintenance-details">
        <ExclamationTriangleIcon />
        <div>
          <strong>Why is this happening?</strong>
          <p>Our team is actively working on improvements to provide you with a better experience.</p>
        </div>
      </div>
      <div className="maintenance-estimate">
        <p>Please check back later. Thank you for your patience.</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'calculator':
        if (!calculatorEnabled) return <MaintenanceMessage featureName="Estate Tax Calculator" />;
        return (
          <motion.div
            key="calculator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="calculator-container-wrapper"
          >
            <EstateTaxCalculator />
          </motion.div>
        );

      case 'propertydivider':
        if (!dividerEnabled) return <MaintenanceMessage featureName="Property Divider" />;
        return (
          <motion.div
            key="propertydivider"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="property-divider-container"
          >
            <div className="content-header">
              <div>
                <h2 className="content-title">Property Divider</h2>
                <p className="content-description">
                  Divide properties among heirs based on Philippine estate laws. Add decedents, classify properties (Exclusive/Conjugal), define heirs, and see automatic sqm division.
                </p>
              </div>
            </div>
            <div className="property-divider-wrapper">
              <PropertyDivider />
            </div>
          </motion.div>
        );

      case 'taxhelpers': // NEW CASE
        if (!helpersEnabled) return <MaintenanceMessage featureName="Tax Helpers" />;
        return (
          <motion.div
            key="taxhelpers"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="content-card"
          >
            <TaxHelpers />
          </motion.div>
        );

      case 'profile':
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="content-card"
          >
            <div className="content-header">
              <div>
                <h2 className="content-title">My Profile</h2>
                <p className="content-description">
                  View and manage your account information
                </p>
              </div>
            </div>
            <div className="profile-content">
              <div className="profile-header">
                <div className="profile-avatar-large">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="profile-info">
                  <h3>{user?.email?.split('@')[0] || 'User'}</h3>
                  <p>{user?.email || 'user@example.com'}</p>
                  <p className="profile-role">Role: Regular User</p>
                </div>
              </div>
              <div className="profile-details">
                <div className="detail-item">
                  <span className="detail-label">Member since:</span>
                  <span className="detail-value">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value status-active">Active</span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (calcLoading || dividerLoading || helpersLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

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
          </div>

          <div className="nav-tabs">
            {allTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''} ${!tab.enabled ? 'disabled-tab' : ''}`}
              >
                <tab.icon className="tab-icon" />
                <span>{tab.label}</span>
                {!tab.enabled && <LockClosedIcon className="lock-icon-small" />}
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
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="notification-badge">{notifications.filter(n => !n.read).length}</span>
                )}
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
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="user-name-nav">{user?.email?.split('@')[0] || 'User'}</span>
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
                        <div className="user-avatar-dropdown">{user?.email?.[0]?.toUpperCase() || 'U'}</div>
                        <div>
                          <p className="user-name-dropdown">{user?.email?.split('@')[0] || 'User'}</p>
                          <p className="user-email-dropdown">{user?.email || 'user@estatorreign.com'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    {allTabs.map((tab) => (
                      <button 
                        key={tab.id} 
                        className={`dropdown-item ${!tab.enabled ? 'disabled-item' : ''}`} 
                        onClick={() => tab.enabled && setActiveTab(tab.id)}
                        disabled={!tab.enabled}
                      >
                        <tab.icon />
                        {tab.label}
                        {!tab.enabled && <LockClosedIcon className="lock-icon-dropdown" />}
                      </button>
                    ))}
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout" onClick={logout}>
                      <ArrowRightOnRectangleIcon />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

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

        .nav-tab.disabled-tab {
          opacity: 0.6;
        }

        .lock-icon-small {
          width: 0.75rem;
          height: 0.75rem;
          color: #f59e0b;
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

        .dropdown-item.disabled-item {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dropdown-item.disabled-item:hover {
          background: none;
        }

        .lock-icon-dropdown {
          width: 0.875rem;
          height: 0.875rem;
          margin-left: auto;
          color: #f59e0b;
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

        .calculator-container-wrapper {
          width: 100%;
        }

        .content-card {
          background: var(--card-bg);
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          overflow: hidden;
        }

        .content-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .content-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .content-description {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .property-divider-container {
          background: var(--card-bg);
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          overflow: hidden;
          min-height: calc(100vh - 140px);
          display: flex;
          flex-direction: column;
        }

        .property-divider-wrapper {
          flex: 1;
          overflow: hidden;
        }

        /* Profile Styles */
        .profile-content {
          padding: 1.5rem;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 1.5rem;
        }

        .profile-avatar-large {
          width: 5rem;
          height: 5rem;
          border-radius: 1rem;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 2rem;
          font-weight: 600;
        }

        .profile-info h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .profile-info p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .profile-role {
          color: var(--gradient-start);
        }

        .profile-details {
          background: var(--bg-secondary);
          border-radius: 0.75rem;
          padding: 1rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-color);
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-weight: 500;
          color: var(--text-secondary);
        }

        .detail-value {
          color: var(--text-primary);
        }

        .status-active {
          color: #10b981;
          font-weight: 500;
        }

        /* Maintenance Message */
        .maintenance-card {
          background: var(--card-bg);
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          padding: 3rem 2rem;
          text-align: center;
          max-width: 550px;
          margin: 2rem auto;
        }

        .maintenance-icon {
          width: 5rem;
          height: 5rem;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .maintenance-icon svg {
          width: 2.5rem;
          height: 2.5rem;
          color: #f59e0b;
        }

        .maintenance-card h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .maintenance-card p {
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .maintenance-details {
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

        .maintenance-details svg {
          width: 1.25rem;
          height: 1.25rem;
          color: #f59e0b;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .maintenance-details strong {
          display: block;
          color: var(--text-primary);
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .maintenance-details p {
          color: var(--text-secondary);
          font-size: 0.813rem;
          margin: 0;
        }

        .maintenance-estimate {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .maintenance-estimate p {
          color: var(--text-tertiary);
          font-size: 0.75rem;
          margin: 0;
        }

        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 1rem;
          background: var(--bg-primary);
        }

        .loading-spinner {
          width: 2.5rem;
          height: 2.5rem;
          border: 3px solid var(--border-color);
          border-top-color: var(--gradient-start);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
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
          
          .content-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .profile-header {
            flex-direction: column;
            text-align: center;
          }

          .maintenance-card {
            padding: 2rem 1.5rem;
            margin: 1rem;
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

export default UserDashboard;