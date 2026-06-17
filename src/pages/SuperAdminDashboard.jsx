import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyDivider from "../components/PropertyDivider/PropertyDivider";
import EstateTaxCalculator from '../components/EstateTaxCalculator/EstateTaxCalculator';
import TaxSettings from '../components/Settings/TaxSettings';
import TaxHelpers from '../components/TaxHelpers/TaxHelpers'; // NEW IMPORT
import {
  CalculatorIcon,
  UserGroupIcon,
  UsersIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  UserPlusIcon,
  KeyIcon,
  PencilIcon,
  TrashIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  Cog6ToothIcon,
  ClipboardDocumentCheckIcon // NEW ICON for Tax Helpers
} from '@heroicons/react/24/outline';
import UserManagement from '../components/Admin/UserManagement';
import FeatureToggles from '../components/Admin/FeatureToggles';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('calculator');
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
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
    { id: 'taxhelpers', label: 'Tax Helpers', icon: ClipboardDocumentCheckIcon }, // NEW TAB
    { id: 'usermanagement', label: 'User Management', icon: UsersIcon },
    { id: 'calculations', label: 'Calculations', icon: DocumentTextIcon },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheckIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'taxsettings', label: 'Tax Settings', icon: Cog6ToothIcon },
    { id: 'featuretoggles', label: 'Feature Toggles', icon: Cog6ToothIcon },
  ];

  const stats = {
    totalUsers: 124,
    pendingApprovals: 8,
    activeCases: 45,
    totalCalculations: 892
  };

  const notifications = [
    { id: 1, title: 'New user registration', message: 'John Doe requested account approval', time: '5 min ago', read: false },
    { id: 2, title: 'Tax calculation', message: 'New estate tax calculation submitted', time: '1 hour ago', read: false },
    { id: 3, title: 'System update', message: 'Database backup completed', time: '3 hours ago', read: true },
  ];

  const renderStatsCards = () => (
    <div className="stats-grid">
      <motion.div 
        className="stat-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ y: -4 }}
      >
        <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
          <UsersIcon className="stat-icon" style={{ color: '#3b82f6' }} />
        </div>
        <div className="stat-info">
          <h3 className="stat-value">{stats.totalUsers}</h3>
          <p className="stat-label">Total Users</p>
        </div>
        <div className="stat-trend positive">
          <ArrowTrendingUpIcon className="trend-icon" />
          <span>+12%</span>
        </div>
      </motion.div>

      <motion.div 
        className="stat-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ y: -4 }}
      >
        <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
          <ClockIcon className="stat-icon" style={{ color: '#f59e0b' }} />
        </div>
        <div className="stat-info">
          <h3 className="stat-value">{stats.pendingApprovals}</h3>
          <p className="stat-label">Pending Approvals</p>
        </div>
        <div className="stat-trend warning">
          <ExclamationTriangleIcon className="trend-icon" />
          <span>Action needed</span>
        </div>
      </motion.div>

      <motion.div 
        className="stat-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ y: -4 }}
      >
        <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
          <DocumentTextIcon className="stat-icon" style={{ color: '#10b981' }} />
        </div>
        <div className="stat-info">
          <h3 className="stat-value">{stats.activeCases}</h3>
          <p className="stat-label">Active Cases</p>
        </div>
        <div className="stat-trend positive">
          <ArrowTrendingUpIcon className="trend-icon" />
          <span>+8%</span>
        </div>
      </motion.div>

      <motion.div 
        className="stat-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ y: -4 }}
      >
        <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
          <CalculatorIcon className="stat-icon" style={{ color: '#8b5cf6' }} />
        </div>
        <div className="stat-info">
          <h3 className="stat-value">{stats.totalCalculations}</h3>
          <p className="stat-label">Calculations</p>
        </div>
        <div className="stat-trend positive">
          <ArrowTrendingUpIcon className="trend-icon" />
          <span>+23%</span>
        </div>
      </motion.div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'calculator':
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

      case 'usermanagement':
        return (
          <motion.div
            key="usermanagement"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="content-card"
          >
            <UserManagement 
              currentAdminRole="super_admin"
              onUserUpdate={(updatedUser) => {
                console.log('User updated:', updatedUser);
              }}
            />
          </motion.div>
        );

      case 'calculations':
        return (
          <motion.div
            key="calculations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="content-card"
          >
            <div className="content-header">
              <div>
                <h2 className="content-title">Calculation History</h2>
                <p className="content-description">
                  View and analyze all estate tax calculations across the platform
                </p>
              </div>
            </div>
            <div className="placeholder-content">
              <DocumentTextIcon className="placeholder-icon" />
              <h3>Calculation History Module</h3>
              <p>Comprehensive calculation history with advanced filtering and export capabilities coming soon.</p>
            </div>
          </motion.div>
        );

      case 'audit':
        return (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="content-card"
          >
            <div className="content-header">
              <div>
                <h2 className="content-title">Audit Trail</h2>
                <p className="content-description">
                  Complete system audit log tracking all user actions and changes
                </p>
              </div>
            </div>
            <div className="placeholder-content">
              <ShieldCheckIcon className="placeholder-icon" />
              <h3>Real-time Audit Logs</h3>
              <p>Comprehensive audit trail with user filtering and export options will be available soon.</p>
            </div>
          </motion.div>
        );

      case 'analytics':
        return (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="content-card"
          >
            <div className="content-header">
              <div>
                <h2 className="content-title">Analytics Dashboard</h2>
                <p className="content-description">
                  Platform insights, user engagement, and tax calculation trends
                </p>
              </div>
            </div>
            {renderStatsCards()}
            <div className="placeholder-content" style={{ marginTop: '1rem' }}>
              <ChartBarIcon className="placeholder-icon" />
              <h3>Advanced Analytics Coming Soon</h3>
              <p>Detailed analytics with charts, trends, and predictive insights.</p>
            </div>
          </motion.div>
        );

      case 'taxsettings':
        return (
          <motion.div
            key="taxsettings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="content-card"
          >
            <TaxSettings />
          </motion.div>
        );

      case 'featuretoggles':
        return (
          <motion.div
            key="featuretoggles"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="content-card"
          >
            <FeatureToggles />
          </motion.div>
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
              <span className="logo-text">Estate<span>Tax</span></span>
            </div>
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
                      <button className="mark-all">Mark all as read</button>
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
                  {user?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="user-name-nav">{user?.email?.split('@')[0] || 'Admin'}</span>
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
                        <div className="user-avatar-dropdown">{user?.email?.[0]?.toUpperCase() || 'A'}</div>
                        <div>
                          <p className="user-name-dropdown">{user?.email?.split('@')[0] || 'Admin'}</p>
                          <p className="user-email-dropdown">{user?.email || 'admin@estatetax.com'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item">
                      <HomeIcon />
                      Dashboard
                    </button>
                    <button className="dropdown-item">
                      <Cog6ToothIcon />
                      Settings
                    </button>
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

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: var(--card-bg);
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid var(--border-color);
          transition: all 0.3s;
          cursor: pointer;
        }

        .stat-card:hover {
          box-shadow: var(--shadow-lg);
        }

        .stat-icon-wrapper {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon {
          width: 1.75rem;
          height: 1.75rem;
        }

        .stat-info {
          flex: 1;
        }

        .stat-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.25rem 0.5rem;
          border-radius: 2rem;
        }

        .stat-trend.positive {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .stat-trend.warning {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .trend-icon {
          width: 0.875rem;
          height: 0.875rem;
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

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .btn-icon {
          width: 1rem;
          height: 1rem;
        }

        .placeholder-content {
          padding: 4rem 2rem;
          text-align: center;
        }

        .placeholder-icon {
          width: 5rem;
          height: 5rem;
          margin: 0 auto 1.5rem;
          color: var(--text-tertiary);
          opacity: 0.5;
        }

        .placeholder-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .placeholder-content p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .property-divider-container {
          background: var(--card-bg);
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          overflow: hidden;
          height: calc(100vh - 140px);
          display: flex;
          flex-direction: column;
        }

        .property-divider-wrapper {
          flex: 1;
          overflow: hidden;
        }

        .search-section {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .search-wrapper {
          flex: 1;
          position: relative;
        }

        .search-wrapper .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1.25rem;
          height: 1.25rem;
          color: var(--text-tertiary);
        }

        .search-wrapper .search-input {
          width: 100%;
          padding: 0.625rem 1rem 0.625rem 2.75rem;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: var(--hover-bg);
        }

        .filter-chevron {
          width: 1rem;
          height: 1rem;
          transition: transform 0.2s;
        }

        .filter-chevron.rotated {
          transform: rotate(180deg);
        }

        .users-table-container {
          overflow-x: auto;
          padding: 1.5rem;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
        }

        .users-table th {
          text-align: left;
          padding: 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-color);
        }

        .users-table td {
          padding: 1rem 0.75rem;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .user-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .user-email {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .role-badge, .status-badge {
          display: inline-flex;
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .role-badge.admin {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .role-badge.officer {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .status-badge.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .status-badge.pending {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          color: var(--text-secondary);
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }

        .action-btn-icon svg {
          width: 1.125rem;
          height: 1.125rem;
        }

        .action-btn-icon:hover {
          color: var(--gradient-start);
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
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .content-header {
            flex-direction: column;
            align-items: flex-start;
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

export default SuperAdminDashboard;