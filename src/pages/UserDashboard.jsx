import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import EstateTaxCalculator from '../components/EstateTaxCalculator/EstateTaxCalculator';
import TaxHelpers from '../components/TaxHelpers/TaxHelpers';
import ONNETeLATracker from '../components/HelpfulTools/ONNETeLATracker';
import PropertyDivider from "../components/PropertyDivider/PropertyDivider";
import TaxSettings from '../components/Settings/TaxSettings';
import InterestCalculator from '../components/HelpfulTools/InterestCalculator';
import {
  CalculatorIcon,
  UserGroupIcon,
  UserIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  Squares2X2Icon,
  CheckBadgeIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  ChartPieIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('propertydivider');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEstateTaxMenu, setShowEstateTaxMenu] = useState(false);
  const [showHelpfulToolsMenu, setShowHelpfulToolsMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [showDisabledWarning, setShowDisabledWarning] = useState(false);
  const [disabledFeatureName, setDisabledFeatureName] = useState('');

  const estateTaxDropdownRef = useRef(null);
  const helpfulToolsDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const menuButtonRef = useRef(null);

  const { isEnabled: calculatorEnabled, loading: calcLoading } = useFeatureAccess('tax_calculator');
  const { isEnabled: dividerEnabled, loading: dividerLoading } = useFeatureAccess('property_divider');
  const { isEnabled: helpersEnabled, loading: helpersLoading } = useFeatureAccess('tax_helpers');

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
      const width = window.innerWidth;
      const mobile = width <= 768;
      const tablet = width <= 1024 && width > 768;
      setIsMobile(mobile);
      setIsTablet(tablet);
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
      if (mobileMenuOpen && 
          !e.target.closest('.mobile-menu-container') && 
          !e.target.closest('.mobile-menu-toggle')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu, showNotifications, showEstateTaxMenu, showHelpfulToolsMenu, mobileMenuOpen]);

  // Check if current active tab is disabled, show warning
  useEffect(() => {
    const featureMap = {
      calculator: { enabled: calculatorEnabled, name: 'Estate Tax Calculator' },
      propertydivider: { enabled: dividerEnabled, name: 'Property Divider' },
      taxhelpers: { enabled: helpersEnabled, name: 'Tax Helpers' }
    };

    const currentFeature = featureMap[activeTab];
    if (currentFeature && !currentFeature.enabled) {
      setShowDisabledWarning(true);
      setDisabledFeatureName(currentFeature.name);
    } else {
      setShowDisabledWarning(false);
      setDisabledFeatureName('');
    }
  }, [activeTab, calculatorEnabled, dividerEnabled, helpersEnabled]);

  const handleFeatureClick = (item) => {
    setShowEstateTaxMenu(false);
    
    if (item.enabled) {
      setActiveTab(item.id);
      setShowDisabledWarning(false);
      setDisabledFeatureName('');
    } else {
      setActiveTab(item.id);
      setShowDisabledWarning(true);
      setDisabledFeatureName(item.label);
      
      setTimeout(() => {
        setShowDisabledWarning(false);
      }, 4000);
    }
  };

  // Estate Tax sub-menu items
  const estateTaxItems = [
    { id: 'calculator', label: 'Tax Calculator', icon: CalculatorIcon, enabled: calculatorEnabled },
    { id: 'propertydivider', label: 'Property Divider', icon: UserGroupIcon, enabled: dividerEnabled },
    { id: 'taxhelpers', label: 'Tax Helpers', icon: ClipboardDocumentCheckIcon, enabled: helpersEnabled },
  ];

  // Revenuer Tools sub-menu items
  const helpfulToolsItems = [
    { id: 'onnet-tracker', label: 'ONNET and eLA Tracker', icon: ChartPieIcon },
    { id: 'interest-calculator', label: 'Interest Calculator', icon: CalculatorIcon },
    { id: 'tool2', label: 'Tool 2', icon: WrenchScrewdriverIcon },
    { id: 'tool3', label: 'Tool 3', icon: WrenchScrewdriverIcon },
  ];

  // All navigation items for mobile menu
  const allNavItems = [
    ...estateTaxItems.map(item => ({ ...item, isEstateTax: true })),
    ...helpfulToolsItems.map(item => ({ ...item, isHelpfulTool: true }))
  ];

  const MaintenanceMessage = ({ featureName }) => (
    <motion.div 
      className="maintenance-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="maintenance-icon">
        <LockClosedIcon />
      </div>
      <h2>Feature Temporarily Unavailable</h2>
      <p>The <strong>{featureName}</strong> is currently <strong>under maintenance or being upgraded</strong>.</p>
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
      <button 
        className="maintenance-back-btn"
        onClick={() => {
          const firstEnabled = estateTaxItems.find(item => item.enabled);
          if (firstEnabled) {
            setActiveTab(firstEnabled.id);
            setShowDisabledWarning(false);
            setDisabledFeatureName('');
          }
        }}
      >
        Go to Available Features
      </button>
    </motion.div>
  );

  const DisabledFeatureToast = ({ featureName, onClose }) => (
    <motion.div 
      className="disabled-feature-toast"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
    >
      <div className="toast-content">
        <ExclamationTriangleIcon />
        <div>
          <strong>{featureName}</strong> is currently disabled by the administrator.
        </div>
      </div>
      <button className="toast-close" onClick={onClose}>
        <XMarkIcon />
      </button>
    </motion.div>
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
            className="property-divider-container-full"
          >
            <PropertyDivider />
          </motion.div>
        );

      case 'taxhelpers':
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
      <AnimatePresence>
        {showDisabledWarning && (
          <DisabledFeatureToast 
            featureName={disabledFeatureName}
            onClose={() => setShowDisabledWarning(false)}
          />
        )}
      </AnimatePresence>

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

          {/* Desktop Navigation - Hidden on mobile/tablet */}
          <div className={`nav-tabs desktop-nav ${isMobile || isTablet ? 'hidden' : ''}`}>
            {/* Estate Tax Dropdown Menu */}
            <div className="estate-tax-menu-container" ref={estateTaxDropdownRef}>
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
                        className={`dropdown-item-nav ${activeTab === item.id ? 'active' : ''} ${!item.enabled ? 'disabled-item' : ''}`}
                        onClick={() => handleFeatureClick(item)}
                      >
                        <item.icon className="dropdown-item-icon" />
                        <span>{item.label}</span>
                        {!item.enabled && <LockClosedIcon className="lock-icon-dropdown" />}
                        {activeTab === item.id && item.enabled && (
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
          </div>

          {/* Tablet Navigation - Icon only with dropdowns */}
          <div className={`nav-tabs tablet-nav ${isMobile ? 'hidden' : isTablet ? '' : 'hidden'}`}>
            <div className="estate-tax-menu-container" ref={estateTaxDropdownRef}>
              <button
                className={`nav-tab dropdown-trigger ${estateTaxItems.some(item => item.id === activeTab) ? 'active' : ''}`}
                onClick={() => setShowEstateTaxMenu(!showEstateTaxMenu)}
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
                        className={`dropdown-item-nav ${activeTab === item.id ? 'active' : ''} ${!item.enabled ? 'disabled-item' : ''}`}
                        onClick={() => {
                          handleFeatureClick(item);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <item.icon className="dropdown-item-icon" />
                        <span>{item.label}</span>
                        {!item.enabled && <LockClosedIcon className="lock-icon-dropdown" />}
                        {activeTab === item.id && item.enabled && (
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
                onClick={() => setShowHelpfulToolsMenu(!showHelpfulToolsMenu)}
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
          </div>

          {/* Mobile Menu Toggle */}
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

        {/* Mobile Menu */}
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
                {allNavItems.map((item) => {
                  const isEstateTax = estateTaxItems.some(e => e.id === item.id);
                  const isHelpfulTool = helpfulToolsItems.some(h => h.id === item.id);
                  const enabled = isEstateTax ? estateTaxItems.find(e => e.id === item.id)?.enabled : true;
                  
                  return (
                    <button
                      key={item.id}
                      className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''} ${!enabled ? 'disabled-item' : ''}`}
                      onClick={() => {
                        if (isEstateTax) {
                          handleFeatureClick({ ...item, enabled });
                        } else {
                          setActiveTab(item.id);
                        }
                        setMobileMenuOpen(false);
                      }}
                    >
                      <item.icon className="mobile-nav-icon" />
                      <span>{item.label}</span>
                      {!enabled && <LockClosedIcon className="lock-icon-mobile" />}
                      {activeTab === item.id && (
                        <CheckBadgeIcon className="mobile-nav-check" />
                      )}
                    </button>
                  );
                })}
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
          position: relative;
          overflow-x: hidden;
        }

        .disabled-feature-toast {
          position: fixed;
          top: 90px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 0.75rem;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          min-width: 320px;
          max-width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }

        [data-theme="dark"] .disabled-feature-toast {
          background: #1e293b;
          border-color: #f59e0b;
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .toast-content svg {
          width: 1.5rem;
          height: 1.5rem;
          color: #f59e0b;
          flex-shrink: 0;
        }

        .toast-content div {
          color: #92400e;
          font-size: 0.875rem;
        }

        .toast-content strong {
          font-weight: 600;
        }

        [data-theme="dark"] .toast-content div {
          color: #fcd34d;
        }

        .toast-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          color: #92400e;
          transition: transform 0.2s;
        }

        .toast-close:hover {
          transform: scale(1.1);
        }

        [data-theme="dark"] .toast-close {
          color: #fcd34d;
        }

        .toast-close svg {
          width: 1.25rem;
          height: 1.25rem;
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

        .dropdown-item-nav.disabled-item {
          opacity: 0.6;
          cursor: pointer;
        }

        .dropdown-item-nav.disabled-item:hover {
          background: rgba(245, 158, 11, 0.1);
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

        .dashboard-main {
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 0;
        }

        .calculator-container-wrapper {
          width: 100%;
          padding: 1.5rem;
        }

        .content-card {
          background: var(--card-bg);
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          overflow: hidden;
          margin: 1.5rem;
        }

        .content-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          background: var(--bg-secondary);
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

        .maintenance-back-btn {
          margin-top: 1.5rem;
          padding: 0.625rem 1.5rem;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .maintenance-back-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

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

        .mobile-nav-item.disabled-item {
          opacity: 0.6;
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

        .lock-icon-mobile {
          width: 0.875rem;
          height: 0.875rem;
          margin-left: auto;
          color: #f59e0b;
          flex-shrink: 0;
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

          .disabled-feature-toast {
            min-width: 280px;
            top: 80px;
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
            padding: 0;
          }
          
          .content-header {
            flex-direction: column;
            align-items: flex-start;
            padding: 1rem;
          }

          .maintenance-card {
            padding: 2rem 1.5rem;
            margin: 1rem;
          }

          .property-divider-container-full {
            height: calc(100vh - 60px);
          }

          .calculator-container-wrapper {
            padding: 1rem;
          }

          .content-card {
            margin: 1rem;
          }

          .tablet-nav {
            display: none !important;
          }

          .mobile-menu-toggle {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }

          .mobile-menu-inner {
            grid-template-columns: 1fr;
          }

          .disabled-feature-toast {
            min-width: 90%;
            top: 75px;
            padding: 0.75rem 1rem;
          }

          .toast-content div {
            font-size: 0.813rem;
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
            padding: 0;
          }

          .content-title {
            font-size: 1.25rem;
          }

          .property-divider-container {
            height: calc(100vh - 56px);
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

          .property-divider-container {
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

export default UserDashboard;