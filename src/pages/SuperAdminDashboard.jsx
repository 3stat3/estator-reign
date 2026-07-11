import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyDivider from "../components/PropertyDivider/PropertyDivider";
import EstateTaxCalculator from '../components/EstateTaxCalculator/EstateTaxCalculator';
import TaxSettings from '../components/Settings/TaxSettings';
import TaxHelpers from '../components/TaxHelpers/TaxHelpers';
import ONNETeLATracker from '../components/HelpfulTools/ONNETeLATracker';
import InterestCalculator from '../components/HelpfulTools/InterestCalculator';
import {
  CalculatorIcon,
  UserGroupIcon,
  UsersIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  Cog6ToothIcon,
  ClipboardDocumentCheckIcon,
  Squares2X2Icon,
  WrenchScrewdriverIcon,
  ChartPieIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import UserManagement from '../components/Admin/UserManagement';
import FeatureToggles from '../components/Admin/FeatureToggles';

const SuperAdminDashboard = () => {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const [activeTab, setActiveTab] = useState('calculator');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEstateTaxMenu, setShowEstateTaxMenu] = useState(false);
  const [showHelpfulToolsMenu, setShowHelpfulToolsMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const estateTaxDropdownRef = useRef(null);
  const helpfulToolsDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width <= 768;
      const tablet = width <= 1024 && width > 768;
      setIsMobile(mobile);
      setIsTablet(tablet);
      // Close mobile menu on resize to desktop
      if (!mobile && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

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
      if (mobileMenuOpen) {
        // Only close if clicking outside AND not on the toggle button
        const isInsideMobileMenu = e.target.closest('.mobile-menu-container');
        const isToggleButton = e.target.closest('.mobile-menu-toggle');
        if (!isInsideMobileMenu && !isToggleButton) {
          setMobileMenuOpen(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu, showNotifications, showEstateTaxMenu, showHelpfulToolsMenu, mobileMenuOpen]);

  // Estate Tax sub-menu items
  const estateTaxItems = [
    { id: 'calculator', label: 'Tax Calculator', icon: CalculatorIcon },
    { id: 'propertydivider', label: 'Property Divider', icon: UserGroupIcon },
    { id: 'taxhelpers', label: 'Tax Helpers', icon: ClipboardDocumentCheckIcon },
    { id: 'taxsettings', label: 'Estate Tax Settings', icon: Cog6ToothIcon },
  ];

  // Revenuer Tools sub-menu items
  const helpfulToolsItems = [
    { id: 'onnet-tracker', label: 'ONNET & eLA Tracker', icon: ChartPieIcon },
    { id: 'interest-calculator', label: 'Interest Calculator', icon: CalculatorIcon },
    { id: 'tool3', label: 'Tool 3', icon: WrenchScrewdriverIcon },
  ];

  // Other navigation items
  const otherTabs = [
    { id: 'usermanagement', label: 'User Management', icon: UsersIcon },
    { id: 'calculations', label: 'Calculations', icon: DocumentTextIcon },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheckIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'featuretoggles', label: 'Feature Toggles', icon: Cog6ToothIcon },
  ];

  // All navigation items for mobile menu
  const allNavItems = [
    ...estateTaxItems,
    ...helpfulToolsItems,
    ...otherTabs
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
            className="property-divider-container-full"
          >
            <PropertyDivider />
          </motion.div>
        );

      case 'taxhelpers':
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

      case 'onnet-tracker':
        return (
          <motion.div
            key="onnet-tracker"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="content-card"
          >
            <ONNETeLATracker />
          </motion.div>
        );

      case 'interest-calculator':
        return (
          <motion.div
            key="interest-calculator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="content-card"
          >
            <InterestCalculator />
          </motion.div>
        );

      case 'tool3':
        return (
          <motion.div
            key="tool3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="content-card"
          >
            <div className="content-header">
              <div>
                <h2 className="content-title">Tool 3</h2>
                <p className="content-description">
                  Coming soon...
                </p>
              </div>
            </div>
            <div className="placeholder-content">
              <WrenchScrewdriverIcon className="placeholder-icon" />
              <h3>Tool 3</h3>
              <p>This tool is currently under development.</p>
            </div>
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
              onUserUpdate={() => {}}
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
    <div className={`dashboard-container ${darkMode ? 'dark' : 'light'}`} data-theme={darkMode ? 'dark' : 'light'}>
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

          {/* Desktop Navigation - Hidden on mobile/tablet */}
          <div className={`nav-tabs desktop-nav ${isMobile || isTablet ? 'hidden' : ''}`}>
            <div className="estate-tax-menu-container" ref={estateTaxDropdownRef}>
              <button
                className={`nav-tab dropdown-trigger ${estateTaxItems.some(item => item.id === activeTab) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEstateTaxMenu(!showEstateTaxMenu);
                  setShowHelpfulToolsMenu(false);
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
                  >
                    {estateTaxItems.map((item) => (
                      <button
                        key={item.id}
                        className={`dropdown-item-nav ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowEstateTaxMenu(false);
                        }}
                      >
                        <item.icon className="dropdown-item-icon" />
                        <span>{item.label}</span>
                        {activeTab === item.id && (
                          <CheckBadgeIcon className="dropdown-item-check" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Helpful Tools Dropdown */}
            <div className="helpful-tools-menu-container" ref={helpfulToolsDropdownRef}>
              <button
                className={`nav-tab dropdown-trigger ${helpfulToolsItems.some(item => item.id === activeTab) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHelpfulToolsMenu(!showHelpfulToolsMenu);
                  setShowEstateTaxMenu(false);
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
                  >
                    {helpfulToolsItems.map((item) => (
                      <button
                        key={item.id}
                        className={`dropdown-item-nav ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowHelpfulToolsMenu(false);
                        }}
                      >
                        <item.icon className="dropdown-item-icon" />
                        <span>{item.label}</span>
                        {activeTab === item.id && (
                          <CheckBadgeIcon className="dropdown-item-check" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {otherTabs.map((tab) => (
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

          {/* Tablet Navigation - Icon only with dropdowns (hidden on mobile) */}
          <div className={`nav-tabs tablet-nav ${isMobile ? 'hidden' : isTablet ? '' : 'hidden'}`}>
            <div className="estate-tax-menu-container" ref={estateTaxDropdownRef}>
              <button
                className={`nav-tab dropdown-trigger ${estateTaxItems.some(item => item.id === activeTab) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEstateTaxMenu(!showEstateTaxMenu);
                  setShowHelpfulToolsMenu(false);
                }}
              >
                <Squares2X2Icon className="tab-icon" />
                <ChevronDownIcon className={`dropdown-chevron ${showEstateTaxMenu ? 'rotated' : ''}`} />
                {estateTaxItems.some(item => item.id === activeTab) && (
                  <motion.div className="tab-indicator" layoutId="activeTab" />
                )}
              </button>
              
              <AnimatePresence>
                {showEstateTaxMenu && (
                  <motion.div
                    className="dropdown-menu tablet-dropdown-menu"
                    initial={{ opacity: 0, y: -5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    {estateTaxItems.map((item) => (
                      <button
                        key={item.id}
                        className={`dropdown-item-nav ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowEstateTaxMenu(false);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <item.icon className="dropdown-item-icon" />
                        <span>{item.label}</span>
                        {activeTab === item.id && (
                          <CheckBadgeIcon className="dropdown-item-check" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="helpful-tools-menu-container" ref={helpfulToolsDropdownRef}>
              <button
                className={`nav-tab dropdown-trigger ${helpfulToolsItems.some(item => item.id === activeTab) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHelpfulToolsMenu(!showHelpfulToolsMenu);
                  setShowEstateTaxMenu(false);
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
                    className="dropdown-menu tablet-dropdown-menu"
                    initial={{ opacity: 0, y: -5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    {helpfulToolsItems.map((item) => (
                      <button
                        key={item.id}
                        className={`dropdown-item-nav ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowHelpfulToolsMenu(false);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <item.icon className="dropdown-item-icon" />
                        <span>{item.label}</span>
                        {activeTab === item.id && (
                          <CheckBadgeIcon className="dropdown-item-check" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {otherTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                title={tab.label}
              >
                <tab.icon className="tab-icon" />
                {activeTab === tab.id && <motion.div className="tab-indicator" layoutId="activeTab" />}
              </button>
            ))}
          </div>

          {/* Mobile Menu Toggle - Always visible on mobile */}
          <button 
            ref={menuButtonRef}
            className={`mobile-menu-toggle ${isMobile ? '' : 'hidden'}`}
            onClick={(e) => {
              e.stopPropagation();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <XMarkIcon /> : <Bars3Icon />}
          </button>

          <div className="nav-actions">
            <button className="icon-btn" onClick={toggleDarkMode} aria-label="Toggle dark mode">
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
            
            <div className="notifications-container">
              <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)} aria-label="Notifications">
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
              <button className="user-menu-btn" onClick={() => setShowUserMenu(!showUserMenu)} aria-label="User menu">
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

        {/* Mobile Menu - Only on mobile */}
        <AnimatePresence>
          {mobileMenuOpen && isMobile && (
            <motion.div 
              className="mobile-menu-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mobile-menu-inner">
                {allNavItems.map((item) => (
                  <button
                    key={item.id}
                    className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <item.icon className="mobile-nav-icon" />
                    <span>{item.label}</span>
                    {activeTab === item.id && (
                      <CheckBadgeIcon className="mobile-nav-check" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

        .dark {
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
          overflow-x: hidden;
        }

        .dashboard-nav {
          background: var(--nav-bg);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 1000;
          overflow: visible !important;
        }

        .nav-container {
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
          gap: 0.5rem;
          overflow: visible !important;
          position: relative;
          min-height: 70px;
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
          gap: 0.25rem;
          overflow: visible !important;
          scrollbar-width: none;
          position: relative;
          min-width: 0;
          padding: 0 0.25rem;
          flex-wrap: nowrap;
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

        .tablet-nav {
          display: none !important;
        }

        .nav-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
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
          flex-shrink: 0;
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

        .estate-tax-menu-container,
        .helpful-tools-menu-container {
          position: relative;
          display: inline-block;
          flex-shrink: 0;
          overflow: visible !important;
          z-index: 10;
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
          flex-shrink: 0;
        }

        .dropdown-chevron.rotated {
          transform: rotate(180deg);
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

        .tablet-dropdown-menu {
          left: 50% !important;
          transform: translateX(-50%) !important;
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

        .dropdown-item-icon {
          width: 1.25rem;
          height: 1.25rem;
          flex-shrink: 0;
        }

        .dropdown-item-check {
          width: 1rem;
          height: 1rem;
          margin-left: auto;
          color: var(--gradient-start);
          flex-shrink: 0;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
          min-width: 18px;
          text-align: center;
          line-height: 1.2;
        }

        .notifications-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          width: 340px;
          max-width: 90vw;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          box-shadow: var(--shadow-lg);
          z-index: 100;
          max-height: 80vh;
          overflow-y: auto;
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
          flex-shrink: 0;
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
          max-width: 90vw;
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
          flex-shrink: 0;
        }

        .user-name-dropdown {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-email-dropdown {
          font-size: 0.75rem;
          color: var(--text-secondary);
          word-break: break-all;
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

        .notification-item {
          padding: 0.75rem 1rem;
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

        .notification-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .notification-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .notification-message {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .notification-time {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .mark-all {
          background: none;
          border: none;
          color: var(--gradient-start);
          font-size: 0.75rem;
          cursor: pointer;
          padding: 0;
        }

        .mark-all:hover {
          text-decoration: underline;
        }

        /* Mobile Menu Toggle */
        .mobile-menu-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-primary);
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .mobile-menu-toggle:hover {
          background: var(--hover-bg);
        }

        .mobile-menu-toggle svg {
          width: 1.5rem;
          height: 1.5rem;
        }

        .mobile-menu-toggle.hidden {
          display: none !important;
        }

        /* Mobile Menu Container */
        .mobile-menu-container {
          background: var(--nav-bg);
          border-top: 1px solid var(--border-color);
          overflow: hidden;
          max-height: calc(100vh - 70px);
          overflow-y: auto;
        }

        .mobile-menu-inner {
          padding: 0.5rem 1rem 1rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.25rem;
        }

        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }

        .mobile-nav-item:hover {
          background: var(--hover-bg);
          color: var(--text-primary);
        }

        .mobile-nav-item.active {
          background: rgba(102, 126, 234, 0.1);
          color: var(--gradient-start);
        }

        .mobile-nav-icon {
          width: 1.25rem;
          height: 1.25rem;
          flex-shrink: 0;
        }

        .mobile-nav-check {
          width: 1rem;
          height: 1rem;
          margin-left: auto;
          color: var(--gradient-start);
          flex-shrink: 0;
        }

        .dashboard-main {
          max-width: 1600px;
          margin: 0 auto;
          padding: 1.5rem;
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
          min-width: 0;
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
          flex-shrink: 0;
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

        .property-divider-container-full {
          background: var(--card-bg);
          border-radius: 0;
          border: none;
          overflow: hidden;
          height: calc(100vh - 70px);
          display: flex;
          flex-direction: column;
          margin: 0;
          padding: 0;
        }

        .dashboard-main:has(.property-divider-container-full) {
          padding: 0;
          max-width: 100%;
        }

        /* ===== RESPONSIVE STYLES ===== */

        /* Tablet */
        @media (max-width: 1024px) {
          .desktop-nav {
            display: none !important;
          }

          .tablet-nav {
            display: flex !important;
          }

          .tablet-nav .nav-tab {
            padding: 0.5rem 0.5rem;
          }

          .tablet-nav .nav-tab span {
            display: none;
          }

          .user-name-nav {
            display: none;
          }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .nav-container {
            padding: 0 0.75rem;
            gap: 0.25rem;
            height: 60px;
            min-height: 60px;
          }
          
          .dashboard-main {
            padding: 0.75rem;
          }
          
          .dashboard-main:has(.property-divider-container-full) {
            padding: 0;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .content-header {
            flex-direction: column;
            align-items: flex-start;
            padding: 1rem;
          }

          .property-divider-container-full {
            height: calc(100vh - 60px);
          }

          .mobile-menu-inner {
            grid-template-columns: 1fr;
          }

          .notifications-dropdown {
            width: 280px;
            max-width: 85vw;
            right: -2rem;
          }

          .user-dropdown {
            width: 240px;
            max-width: 85vw;
            right: -1rem;
          }

          /* Hide tablet nav on mobile */
          .tablet-nav {
            display: none !important;
          }

          /* Show mobile toggle on mobile */
          .mobile-menu-toggle {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
        }

        /* Small phones */
        @media (max-width: 480px) {
          .nav-container {
            padding: 0 0.5rem;
            gap: 0.25rem;
            height: 56px;
            min-height: 56px;
          }

          .logo-text {
            font-size: 1rem;
          }

          .logo-icon {
            width: 1.5rem;
            height: 1.5rem;
          }

          .icon-btn {
            padding: 0.375rem;
          }

          .icon-btn svg {
            width: 1rem;
            height: 1rem;
          }

          .user-avatar-small {
            width: 1.75rem;
            height: 1.75rem;
            font-size: 0.75rem;
          }

          .dashboard-main {
            padding: 0.5rem;
          }

          .stat-card {
            padding: 1rem;
            gap: 0.75rem;
          }

          .stat-value {
            font-size: 1.5rem;
          }

          .stat-icon-wrapper {
            width: 2.75rem;
            height: 2.75rem;
          }

          .stat-icon {
            width: 1.25rem;
            height: 1.25rem;
          }

          .content-title {
            font-size: 1.25rem;
          }

          .placeholder-content {
            padding: 2rem 1rem;
          }

          .placeholder-icon {
            width: 3rem;
            height: 3rem;
          }

          .notifications-dropdown {
            width: 260px;
            max-width: 85vw;
            right: -3rem;
          }

          .user-dropdown {
            width: 220px;
            max-width: 85vw;
            right: -2rem;
          }

          .mobile-menu-inner {
            padding: 0.5rem;
            gap: 0.15rem;
          }

          .mobile-nav-item {
            padding: 0.625rem 0.75rem;
            font-size: 0.8125rem;
          }

          .property-divider-container-full {
            height: calc(100vh - 56px);
          }
        }

        /* Very small phones */
        @media (max-width: 380px) {
          .nav-container {
            padding: 0 0.25rem;
            height: 52px;
            min-height: 52px;
          }

          .nav-actions {
            gap: 0.25rem;
          }

          .notifications-dropdown {
            width: 240px;
            right: -4rem;
          }

          .user-dropdown {
            width: 200px;
            right: -3rem;
          }

          .logo-text {
            font-size: 0.875rem;
          }

          .logo-icon {
            width: 1.25rem;
            height: 1.25rem;
          }
        }

        /* Landscape phones */
        @media (max-height: 500px) and (orientation: landscape) {
          .nav-container {
            height: 48px;
            min-height: 48px;
          }

          .property-divider-container-full {
            height: calc(100vh - 48px);
          }

          .logo-text {
            font-size: 0.875rem;
          }

          .logo-icon {
            width: 1.25rem;
            height: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SuperAdminDashboard;