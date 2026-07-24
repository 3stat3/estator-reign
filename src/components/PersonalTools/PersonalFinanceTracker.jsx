// src/components/PersonalTools/PersonalFinanceTracker.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import {
  WalletIcon,
  ChartBarIcon,
  HomeIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon,
  BanknotesIcon, // Add this for Loans
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from './useFinance';
import Dashboard from './Dashboard';
import Transactions from './Transactions';
import Budget from './Budget';
import Bills from './Bills';
import Reports from './Reports';
import Loans from './Loans'; // New import

const PersonalFinanceTracker = () => {
  const { user, darkMode, toggleDarkMode } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [filterBill, setFilterBill] = useState(null);

  const finance = useFinance();
  const { selectedMonth, setSelectedMonth } = finance;

  // Navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'transactions', label: 'Transactions', icon: DocumentTextIcon },
    { id: 'budget', label: 'Budget', icon: WalletIcon },
    { id: 'bills', label: 'Bills', icon: CalendarIcon },
    { id: 'loans', label: 'Loans', icon: BanknotesIcon }, // New tab
    { id: 'reports', label: 'Reports', icon: ChartBarIcon },
  ];

  // Month navigation handlers
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  // Handle navigation with filter
  const handleNavigate = (view, filter = null) => {
    setActiveView(view);
    setFilterBill(filter);
  };

  // Format month for display
  const formatMonth = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const isCurrentMonth = () => {
    const today = new Date();
    return today.getMonth() === selectedMonth.getMonth() &&
           today.getFullYear() === selectedMonth.getFullYear();
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard finance={finance} setActiveView={setActiveView} />;
      case 'transactions':
        return <Transactions finance={finance} filterBill={filterBill} clearFilter={() => setFilterBill(null)} />;
      case 'budget':
        return <Budget finance={finance} />;
      case 'bills':
        return <Bills finance={finance} setActiveView={handleNavigate} />;
      case 'loans':
        return <Loans finance={finance} setActiveView={handleNavigate} />;
      case 'reports':
        return <Reports finance={finance} />;
      default:
        return <Dashboard finance={finance} setActiveView={setActiveView} />;
    }
  };

  return (
    <div className={`personal-finance-tracker ${darkMode ? 'dark' : 'light'}`}>
      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: darkMode ? '#1e293b' : '#ffffff',
            color: darkMode ? '#f1f5f9' : '#0f172a',
            border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
            borderRadius: '0.75rem',
            padding: '1rem',
          },
          success: {
            icon: '✅',
            style: {
              borderLeft: '4px solid #10b981',
            },
          },
          error: {
            icon: '❌',
            style: {
              borderLeft: '4px solid #ef4444',
            },
          },
          loading: {
            style: {
              borderLeft: '4px solid #f59e0b',
            },
          },
        }}
      />

      {/* Sidebar Navigation */}
      <div className="finance-sidebar">
        <div className="finance-sidebar-header">
          <WalletIcon className="finance-sidebar-logo" />
          <span>Finance Tracker</span>
          <button 
            className="finance-dark-mode-toggle" 
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <SunIcon className="finance-dark-mode-icon" />
            ) : (
              <MoonIcon className="finance-dark-mode-icon" />
            )}
          </button>
        </div>
        <nav className="finance-sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`finance-nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveView(item.id);
                setFilterBill(null);
              }}
            >
              <item.icon className="finance-nav-icon" />
              <span>{item.label}</span>
              {activeView === item.id && (
                <div className="finance-nav-indicator" />
              )}
            </button>
          ))}
        </nav>
        <div className="finance-sidebar-footer">
          <div className="finance-sidebar-user">
            <div className="finance-user-avatar">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="finance-user-name">{user?.email?.split('@')[0] || 'User'}</div>
              <div className="finance-user-email">{user?.email || 'user@example.com'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="finance-main-content">
        {/* Month Selector Header */}
        <div className="finance-header">
          <h1 className="finance-page-title">
            {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
          </h1>
          <div className="finance-header-actions">
            <div className="finance-month-selector">
              <button 
                className="finance-month-btn"
                onClick={goToPreviousMonth}
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="finance-month-icon" />
              </button>
              <button 
                className="finance-month-label"
                onClick={goToCurrentMonth}
                title="Go to current month"
              >
                {formatMonth(selectedMonth)}
                {!isCurrentMonth() && (
                  <span className="finance-month-badge">Go to today</span>
                )}
              </button>
              <button 
                className="finance-month-btn"
                onClick={goToNextMonth}
                aria-label="Next month"
              >
                <ChevronRightIcon className="finance-month-icon" />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="finance-content-wrapper"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <style>{`
        .personal-finance-tracker {
          display: flex;
          min-height: calc(100vh - 70px);
          background: var(--bg-primary, #f8fafc);
          color: var(--text-primary, #0f172a);
          position: relative;
          transition: background 0.3s ease, color 0.3s ease;
        }

        /* Dark Mode Variables */
        .personal-finance-tracker.dark {
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
          --gradient-start: #818cf8;
          --gradient-end: #6366f1;
        }

        /* Light Mode Variables */
        .personal-finance-tracker.light {
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

        /* Sidebar */
        .finance-sidebar {
          width: 240px;
          background: var(--card-bg, #ffffff);
          border-right: 1px solid var(--border-color, #e2e8f0);
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: calc(100vh - 70px);
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        .finance-sidebar-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0 0.5rem 1.5rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          margin-bottom: 1.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          transition: border-color 0.3s ease;
        }

        .finance-sidebar-logo {
          width: 1.5rem;
          height: 1.5rem;
          color: var(--gradient-start, #667eea);
        }

        .finance-dark-mode-toggle {
          margin-left: auto;
          background: var(--bg-primary, #f1f5f9);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
          padding: 0.375rem;
          cursor: pointer;
          color: var(--text-primary, #0f172a);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .finance-dark-mode-toggle:hover {
          background: var(--hover-bg, #e2e8f0);
          transform: scale(1.05);
        }

        .finance-dark-mode-icon {
          width: 1.125rem;
          height: 1.125rem;
        }

        .finance-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }

        .finance-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.875rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          color: var(--text-secondary, #64748b);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          position: relative;
          width: 100%;
          text-align: left;
        }

        .finance-nav-item:hover {
          background: var(--hover-bg, #f1f5f9);
          color: var(--text-primary, #0f172a);
        }

        .finance-nav-item.active {
          background: rgba(102, 126, 234, 0.1);
          color: var(--gradient-start, #667eea);
        }

        .finance-nav-icon {
          width: 1.25rem;
          height: 1.25rem;
          flex-shrink: 0;
        }

        .finance-nav-indicator {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 24px;
          background: var(--gradient-start, #667eea);
          border-radius: 3px;
        }

        .finance-sidebar-footer {
          border-top: 1px solid var(--border-color, #e2e8f0);
          padding-top: 1rem;
          transition: border-color 0.3s ease;
        }

        .finance-sidebar-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
        }

        .finance-user-avatar {
          width: 2.25rem;
          height: 2.25rem;
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

        .finance-user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .finance-user-email {
          font-size: 0.75rem;
          color: var(--text-secondary, #64748b);
          word-break: break-all;
        }

        /* Main Content */
        .finance-main-content {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          max-height: calc(100vh - 70px);
          background: var(--bg-primary, #f8fafc);
          transition: background 0.3s ease;
        }

        .finance-content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Header with Month Selector */
        .finance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .finance-page-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin: 0;
        }

        .finance-header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .finance-month-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.75rem;
          padding: 0.25rem;
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        .finance-month-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          color: var(--text-secondary, #64748b);
          transition: all 0.2s;
        }

        .finance-month-btn:hover {
          background: var(--hover-bg, #f1f5f9);
          color: var(--text-primary, #0f172a);
        }

        .finance-month-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .finance-month-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.25rem 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          transition: all 0.2s;
          border-radius: 0.5rem;
          min-width: 120px;
        }

        .finance-month-label:hover {
          background: var(--hover-bg, #f1f5f9);
        }

        .finance-month-badge {
          font-size: 0.625rem;
          font-weight: 400;
          color: var(--gradient-start, #667eea);
          background: rgba(102, 126, 234, 0.1);
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          margin-top: 0.125rem;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .finance-sidebar {
            width: 200px;
          }
        }

        @media (max-width: 768px) {
          .personal-finance-tracker {
            flex-direction: column;
          }

          .finance-sidebar {
            width: 100%;
            height: auto;
            position: relative;
            padding: 0.75rem 1rem;
            border-right: none;
            border-bottom: 1px solid var(--border-color, #e2e8f0);
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .finance-sidebar-header {
            border-bottom: none;
            padding: 0;
            margin: 0;
            gap: 0.5rem;
          }

          .finance-sidebar-nav {
            flex-direction: row;
            gap: 0.25rem;
            flex: 1;
            overflow-x: auto;
            padding: 0 0.5rem;
          }

          .finance-nav-item {
            padding: 0.5rem 0.75rem;
            white-space: nowrap;
          }

          .finance-nav-item span {
            display: none;
          }

          .finance-nav-indicator {
            display: none;
          }

          .finance-sidebar-footer {
            display: none;
          }

          .finance-main-content {
            padding: 1rem;
            max-height: none;
          }

          .finance-header {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }

          .finance-page-title {
            text-align: center;
          }

          .finance-header-actions {
            justify-content: center;
          }

          .finance-month-selector {
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .finance-main-content {
            padding: 0.75rem;
          }

          .finance-month-label {
            min-width: 80px;
            font-size: 0.75rem;
          }

          .finance-month-badge {
            font-size: 0.5rem;
          }

          .finance-header-actions {
            flex-direction: column;
            width: 100%;
          }

          .finance-month-selector {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default PersonalFinanceTracker;