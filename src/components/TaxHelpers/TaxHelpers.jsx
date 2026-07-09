import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ZonalValueLocator from './ZonalValueLocator';
import RequirementReminders from './RequirementReminders';
import {
  MapPinIcon,
  BellIcon,
  SparklesIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const TaxHelpers = () => {
  const [activeHelper, setActiveHelper] = useState('zonal');
  const [isHovered, setIsHovered] = useState(null);

  const helpers = [
    {
      id: 'zonal',
      label: 'Zonal Value Locator',
      icon: MapPinIcon,
      description: 'Find property zonal values',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      lightColor: 'rgba(16, 185, 129, 0.12)'
    },
    {
      id: 'requirements',
      label: 'Requirement Reminders',
      icon: BellIcon,
      description: 'Track tax deadlines & requirements',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      lightColor: 'rgba(245, 158, 11, 0.12)'
    }
  ];

  const renderContent = () => {
    switch (activeHelper) {
      case 'zonal':
        return <ZonalValueLocator />;
      case 'requirements':
        return <RequirementReminders />;
      default:
        return null;
    }
  };

  const getActiveHelper = () => {
    return helpers.find(h => h.id === activeHelper);
  };

  const activeHelperData = getActiveHelper();

  return (
    <div className="tax-helpers-container">
      {/* Compact Header */}
      <div className="tax-helpers-header">
        <div className="header-left">
          <div className="header-top">
            <div className="header-badge">
              <SparklesIcon className="badge-icon" />
              <span>Tools</span>
            </div>
            <h2 className="tax-helpers-title">Tax Helpers</h2>
          </div>
          <p className="tax-helpers-description">
            Zonal values · Requirement tracking
          </p>
        </div>
        <div className="header-right">
          <div className="active-indicator">
            <span className="indicator-dot" style={{ backgroundColor: activeHelperData?.color }}></span>
            <span className="indicator-text">{activeHelperData?.label}</span>
          </div>
        </div>
      </div>

      {/* Compact Tab Navigation */}
      <div className="helpers-tabs">
        {helpers.map((helper) => (
          <motion.button
            key={helper.id}
            className={`helper-tab ${activeHelper === helper.id ? 'active' : ''}`}
            onClick={() => setActiveHelper(helper.id)}
            onMouseEnter={() => setIsHovered(helper.id)}
            onMouseLeave={() => setIsHovered(null)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <div 
              className="helper-tab-icon"
              style={{ 
                backgroundColor: activeHelper === helper.id 
                  ? helper.color 
                  : isHovered === helper.id 
                    ? helper.lightColor 
                    : 'transparent',
                color: activeHelper === helper.id ? 'white' : helper.color
              }}
            >
              <helper.icon 
                style={{ 
                  width: '1.125rem',
                  height: '1.125rem'
                }} 
              />
            </div>
            <span className="helper-tab-label">{helper.label}</span>
            {activeHelper === helper.id && (
              <motion.div 
                className="helper-tab-indicator"
                layoutId="activeHelper"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <ChevronRightIcon className="helper-tab-arrow" />
          </motion.button>
        ))}
      </div>

      {/* Content Area */}
      <div className="helpers-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeHelper}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ 
              duration: 0.25,
              ease: 'easeInOut'
            }}
            className="content-wrapper"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <style jsx>{`
        .tax-helpers-container {
          background: var(--card-bg);
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        /* ===== HEADER ===== */
        .tax-helpers-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          background: var(--bg-secondary);
        }

        .header-left {
          flex: 1;
          min-width: 180px;
        }

        .header-top {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.125rem;
        }

        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.125rem 0.625rem;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
          border-radius: 2rem;
          font-size: 0.6rem;
          font-weight: 700;
          color: #667eea;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .badge-icon {
          width: 0.75rem;
          height: 0.75rem;
        }

        .tax-helpers-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin: 0;
        }

        .tax-helpers-description {
          color: var(--text-secondary);
          font-size: 0.75rem;
          line-height: 1.4;
          margin: 0;
          opacity: 0.8;
        }

        .header-right {
          flex-shrink: 0;
        }

        .active-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: var(--bg-primary);
          border-radius: 2rem;
          border: 1px solid var(--border-color);
        }

        .indicator-dot {
          width: 0.375rem;
          height: 0.375rem;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }

        .indicator-text {
          font-size: 0.688rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        /* ===== TABS - COMPACT ===== */
        .helpers-tabs {
          display: flex;
          gap: 0.25rem;
          padding: 0.625rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
          flex-wrap: wrap;
        }

        .helper-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.875rem 0.375rem 0.625rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          font-family: inherit;
          flex-shrink: 0;
        }

        .helper-tab:hover {
          background: var(--hover-bg);
        }

        .helper-tab.active {
          background: var(--hover-bg);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
        }

        .helper-tab-icon {
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .helper-tab-label {
          font-size: 0.813rem;
          font-weight: 500;
          color: var(--text-secondary);
          transition: color 0.2s ease;
          white-space: nowrap;
        }

        .helper-tab.active .helper-tab-label {
          color: var(--text-primary);
          font-weight: 600;
        }

        .helper-tab:hover .helper-tab-label {
          color: var(--text-primary);
        }

        .helper-tab-arrow {
          width: 0.875rem;
          height: 0.875rem;
          color: var(--text-tertiary);
          opacity: 0;
          transition: all 0.25s ease;
          flex-shrink: 0;
        }

        .helper-tab.active .helper-tab-arrow {
          opacity: 1;
          color: var(--text-secondary);
        }

        .helper-tab:hover .helper-tab-arrow {
          opacity: 0.5;
        }

        .helper-tab-indicator {
          position: absolute;
          bottom: -0.125rem;
          left: 10%;
          right: 10%;
          height: 2px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 2px 2px 0 0;
        }

        /* ===== CONTENT ===== */
        .helpers-content {
          padding: 1.25rem 1.5rem;
          background: var(--bg-primary);
        }

        .content-wrapper {
          min-height: 180px;
        }

        /* ===== DARK MODE ===== */
        [data-theme="dark"] .tax-helpers-container {
          border-color: var(--border-color);
        }

        [data-theme="dark"] .helper-tab.active {
          background: rgba(255, 255, 255, 0.04);
        }

        [data-theme="dark"] .helper-tab:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        [data-theme="dark"] .active-indicator {
          background: var(--bg-secondary);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .header-badge {
          background: rgba(102, 126, 234, 0.15);
        }

        /* ===== RESPONSIVE ===== */

        /* Tablet & Desktop */
        @media (min-width: 768px) {
          .helpers-tabs {
            padding: 0.5rem 1.5rem;
            gap: 0.375rem;
          }

          .helper-tab {
            padding: 0.5rem 1.25rem 0.5rem 0.875rem;
          }

          .helper-tab-icon {
            width: 2rem;
            height: 2rem;
          }

          .helper-tab-label {
            font-size: 0.875rem;
          }

          .helper-tab-arrow {
            display: block;
          }
        }

        /* Desktop Large */
        @media (min-width: 1200px) {
          .helpers-tabs {
            padding: 0.625rem 2rem;
            gap: 0.5rem;
          }

          .helper-tab {
            padding: 0.625rem 1.5rem 0.625rem 1rem;
          }

          .helper-tab-icon {
            width: 2.125rem;
            height: 2.125rem;
          }

          .helper-tab-icon svg {
            width: 1.25rem !important;
            height: 1.25rem !important;
          }

          .tax-helpers-title {
            font-size: 1.375rem;
          }
        }

        /* Mobile */
        @media (max-width: 767px) {
          .tax-helpers-header {
            padding: 0.75rem 1rem;
            flex-direction: column;
            align-items: stretch;
          }

          .header-top {
            flex-wrap: wrap;
          }

          .header-right {
            width: 100%;
          }

          .active-indicator {
            justify-content: center;
            width: 100%;
            padding: 0.25rem 0.625rem;
          }

          .tax-helpers-title {
            font-size: 1.125rem;
          }

          .tax-helpers-description {
            font-size: 0.688rem;
          }

          .helpers-tabs {
            padding: 0.5rem 0.75rem;
            gap: 0.25rem;
            overflow-x: auto;
            flex-wrap: nowrap;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }

          .helpers-tabs::-webkit-scrollbar {
            display: none;
          }

          .helper-tab {
            padding: 0.375rem 0.75rem 0.375rem 0.625rem;
            flex-shrink: 0;
          }

          .helper-tab-icon {
            width: 1.5rem;
            height: 1.5rem;
          }

          .helper-tab-icon svg {
            width: 0.875rem !important;
            height: 0.875rem !important;
          }

          .helper-tab-label {
            font-size: 0.75rem;
          }

          .helper-tab-arrow {
            display: none;
          }

          .helpers-content {
            padding: 0.875rem 0.75rem;
          }

          .header-badge {
            font-size: 0.55rem;
            padding: 0.1rem 0.5rem;
          }

          .badge-icon {
            width: 0.625rem;
            height: 0.625rem;
          }

          .indicator-text {
            font-size: 0.625rem;
          }
        }

        /* Small Mobile */
        @media (max-width: 480px) {
          .helpers-tabs {
            padding: 0.375rem 0.5rem;
            gap: 0.125rem;
          }

          .helper-tab {
            padding: 0.25rem 0.5rem 0.25rem 0.375rem;
          }

          .helper-tab-icon {
            width: 1.25rem;
            height: 1.25rem;
          }

          .helper-tab-icon svg {
            width: 0.75rem !important;
            height: 0.75rem !important;
          }

          .helper-tab-label {
            font-size: 0.688rem;
          }

          .helpers-content {
            padding: 0.625rem 0.5rem;
          }

          .tax-helpers-header {
            padding: 0.625rem 0.75rem;
          }

          .tax-helpers-title {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TaxHelpers;