// src/components/PropertyDivider/PropertyDivider.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PersonManager from './modules/PersonManager';
import PropertyManager from './modules/PropertyManager';
import DivisionEngine from './modules/DivisionEngine';

const PropertyDivider = ({ darkMode = false }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [showClearModal, setShowClearModal] = useState(false);

  const [appState, setAppState] = useState({
    persons: [],
    properties: [],
    decedentId: null,
    estateType: 'intestate',
    will: null,
    divisionResults: null
  });

  const [selectedPersonForProperty, setSelectedPersonForProperty] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const steps = [
    { id: 1, label: 'Add Persons', icon: '👤', module: 'persons' },
    { id: 2, label: 'Add Properties', icon: '🏠', module: 'properties' },
    { id: 3, label: 'Divide Estate', icon: '⚖️', module: 'division' }
  ];

  const canProceed = () => {
    switch(currentStep) {
      case 1: return appState.persons.length > 0;
      case 2: return appState.properties.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'upcoming';
  };

  const handleNext = () => {
    if (currentStep < 3 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClearAll = () => {
    setAppState({
      persons: [],
      properties: [],
      decedentId: null,
      estateType: 'intestate',
      will: null,
      divisionResults: null
    });
    setSelectedPersonForProperty(null);
    setCurrentStep(1);
    setShowClearModal(false);
  };

  const renderModule = () => {
    switch(currentStep) {
      case 1:
        console.log('📦 PropertyDivider - rendering PersonManager with decedentId:', appState.decedentId);
        return (
          <PersonManager 
            darkMode={darkMode}
            persons={appState.persons}
            properties={appState.properties}
            decedentId={appState.decedentId}
            onUpdate={(data) => {
              console.log('📥 PropertyDivider - received persons update:', data.length, 'persons');
              setAppState(prev => ({...prev, persons: data}));
            }}
            onUpdateProperties={(data) => {
              console.log('📥 PropertyDivider - received properties update:', data.length, 'properties');
              setAppState(prev => ({...prev, properties: data}));
            }}
            onUpdateDecedent={(id) => {
              console.log('📤 PropertyDivider - updating decedentId to:', id);
              setAppState(prev => ({...prev, decedentId: id}));
            }}
            onNavigateToPropertyManager={(personId) => {
              console.log('🚀 PropertyDivider - navigating to PropertyManager with personId:', personId);
              setCurrentStep(2);
              setSelectedPersonForProperty(personId);
            }}
          />
        );
      case 2:
        return (
          <PropertyManager 
            darkMode={darkMode}
            properties={appState.properties}
            persons={appState.persons}
            selectedPersonId={selectedPersonForProperty}
            onUpdate={(data) => {
              console.log('📥 PropertyDivider - received property update:', data.length, 'properties');
              setAppState(prev => ({...prev, properties: data}));
            }}
          />
        );
      case 3:
        return (
          <DivisionEngine 
            darkMode={darkMode}
            persons={appState.persons}
            properties={appState.properties}
            propositusId={appState.decedentId}
          />
        );
      default:
        return null;
    }
  };

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="property-divider-wrapper">
      {/* Top Navbar with Steps integrated */}
      <div className="pd-navbar">
        <div className="pd-navbar-left">
          <div className="pd-logo">
            <div className="pd-logo-icon">⚖️</div>
            <div>
              <p className="pd-logo-text">Estate Divider</p>
              <p className="pd-logo-subtext">Philippine Succession System</p>
            </div>
          </div>
          <div className="pd-version">v2.0</div>
        </div>
        
        {/* Steps - now in the navbar on the right */}
        <div className="pd-stepper">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isLast = index === steps.length - 1;
            
            return (
              <div key={step.id} className="pd-step-item">
                <div 
                  className={`pd-step-circle ${status}`}
                  onClick={() => status === 'completed' && setCurrentStep(step.id)}
                  role="button"
                  tabIndex={status === 'completed' ? 0 : -1}
                  aria-label={`Step ${step.id}: ${step.label} ${status === 'completed' ? '(completed, click to navigate)' : ''}`}
                >
                  {status === 'completed' ? '✓' : step.id}
                </div>
                <span className={`pd-step-label ${status}`}>{step.label}</span>
                {!isLast && (
                  <div className={`pd-step-connector ${status === 'completed' ? 'active' : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="pd-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="pd-module-wrapper"
          >
            {renderModule()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="pd-footer">
        <div className="pd-footer-left">
          <div className="pd-progress">
            <span>Step {currentStep}</span>
            <div className="pd-progress-bar">
              <div className="pd-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span>{Math.round(progress)}%</span>
          </div>
          {/* Clear All button in footer */}
          <button 
            className="pd-btn pd-btn-danger" 
            onClick={() => setShowClearModal(true)}
            title="Clear all data and reset the application"
          >
            🗑️ Clear All
          </button>
        </div>
        
        <div className="pd-footer-right">
          <button 
            className="pd-btn pd-btn-secondary"
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            ← Back
          </button>
          
          {currentStep < steps.length ? (
            <button 
              className="pd-btn pd-btn-primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {currentStep === 2 ? 'Calculate →' : 'Next →'}
            </button>
          ) : (
            <button 
              className="pd-btn pd-btn-primary"
              onClick={() => alert('Export functionality coming soon!')}
            >
              📄 Export
            </button>
          )}
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {showClearModal && (
          <motion.div
            className="pd-clear-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowClearModal(false)}
          >
            <motion.div
              className="pd-clear-modal"
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pd-clear-modal-header">
                <div className="pd-clear-modal-icon">⚠️</div>
                <h2 className="pd-clear-modal-title">Clear All Data</h2>
                <button 
                  className="pd-clear-modal-close" 
                  onClick={() => setShowClearModal(false)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="pd-clear-modal-body">
                <p className="pd-clear-modal-message">
                  This action will permanently delete all your data. Are you sure you want to continue?
                </p>
                
                <div className="pd-clear-modal-stats">
                  <div className="pd-clear-stat-item">
                    <span className="pd-clear-stat-icon">👤</span>
                    <div>
                      <span className="pd-clear-stat-label">Persons</span>
                      <span className="pd-clear-stat-value">{appState.persons.length}</span>
                    </div>
                  </div>
                  <div className="pd-clear-stat-item">
                    <span className="pd-clear-stat-icon">🏠</span>
                    <div>
                      <span className="pd-clear-stat-label">Properties</span>
                      <span className="pd-clear-stat-value">{appState.properties.length}</span>
                    </div>
                  </div>
                  <div className="pd-clear-stat-item">
                    <span className="pd-clear-stat-icon">📊</span>
                    <div>
                      <span className="pd-clear-stat-label">Results</span>
                      <span className="pd-clear-stat-value">{appState.divisionResults ? '1' : '0'}</span>
                    </div>
                  </div>
                </div>

                <div className="pd-clear-modal-warning">
                  <span className="pd-clear-warning-icon">🚨</span>
                  <span>This action cannot be undone. All data will be permanently lost.</span>
                </div>
              </div>

              <div className="pd-clear-modal-footer">
                <button 
                  className="pd-btn pd-btn-secondary" 
                  onClick={() => setShowClearModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="pd-btn pd-btn-danger" 
                  onClick={handleClearAll}
                >
                  Yes, Clear Everything
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* Property Divider - Uses Global CSS Variables */
        .property-divider-wrapper {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg-primary);
          color: var(--text-primary);
          transition: background-color 0.3s ease, color 0.3s ease;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow: hidden;
        }

        /* Navbar with integrated steps */
        .pd-navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
          gap: 16px;
          flex-wrap: wrap;
          min-height: 76px;
        }

        .pd-navbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .pd-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pd-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          flex-shrink: 0;
        }

        .pd-logo-text {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .pd-logo-subtext {
          font-size: 11px;
          color: var(--text-secondary);
          margin: 0;
          font-weight: 400;
          line-height: 1.2;
        }

        .pd-version {
          padding: 2px 10px;
          border-radius: 6px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        /* Stepper - now inline with navbar */
        .pd-stepper {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          overflow-x: auto;
          overflow-y: visible;
          padding: 4px 0;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          max-width: 100%;
        }

        .pd-stepper::-webkit-scrollbar {
          display: none;
        }

        .pd-step-item {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .pd-step-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: default;
          background: var(--border-color);
          color: var(--text-secondary);
          user-select: none;
          flex-shrink: 0;
        }

        .pd-step-circle.completed {
          background: #667eea;
          color: #ffffff;
          cursor: pointer;
        }

        .pd-step-circle.completed:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        }

        .pd-step-circle.active {
          background: rgba(102, 126, 234, 0.2);
          color: #667eea;
          border: 2px solid #667eea;
        }

        .pd-step-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: color 0.3s ease;
          white-space: nowrap;
        }

        .pd-step-label.active {
          color: #667eea;
        }

        .pd-step-label.completed {
          color: var(--text-primary);
        }

        .pd-step-connector {
          width: 24px;
          height: 2px;
          background: var(--border-color);
          margin: 0 2px;
          flex-shrink: 0;
        }

        .pd-step-connector.active {
          background: linear-gradient(90deg, #667eea, #764ba2);
        }

        /* Content */
        .pd-content {
          flex: 1;
          padding: 20px 24px;
          overflow: auto;
          background: var(--bg-primary);
          min-height: 0;
        }

        .pd-module-wrapper {
          height: 100%;
          min-height: 200px;
        }

        /* Footer */
        .pd-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-color);
          flex-shrink: 0;
          gap: 12px;
          flex-wrap: wrap;
        }

        .pd-footer-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          min-width: 0;
        }

        .pd-footer-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .pd-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        .pd-progress-bar {
          width: 100px;
          height: 4px;
          border-radius: 2px;
          background: var(--border-color);
          overflow: hidden;
        }

        .pd-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .pd-btn {
          padding: 8px 20px;
          border-radius: 8px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .pd-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .pd-btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #ffffff;
        }

        .pd-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .pd-btn-primary:active:not(:disabled) {
          transform: scale(0.97);
        }

        .pd-btn-secondary {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .pd-btn-secondary:hover:not(:disabled) {
          background: var(--border-color);
        }

        .pd-btn-secondary:active:not(:disabled) {
          transform: scale(0.97);
        }

        /* Danger/Clear button */
        .pd-btn-danger {
          background: #dc2626;
          color: #ffffff;
          border: none;
        }

        .pd-btn-danger:hover {
          background: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        .pd-btn-danger:active {
          transform: scale(0.97);
        }

        /* Clear Modal */
        .pd-clear-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .pd-clear-modal {
          background: var(--card-bg, #ffffff);
          border-radius: 20px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color, #e2e8f0);
          overflow: hidden;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        .pd-clear-modal-header {
          padding: 24px 28px 16px 28px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          position: relative;
          flex-shrink: 0;
        }

        .pd-clear-modal-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .pd-clear-modal-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          margin: 0;
          flex: 1;
          line-height: 1.2;
        }

        .pd-clear-modal-close {
          background: none;
          border: none;
          font-size: 20px;
          color: var(--text-secondary, #64748b);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
          line-height: 1;
          min-width: 36px;
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pd-clear-modal-close:hover {
          background: var(--border-color, #e2e8f0);
        }

        .pd-clear-modal-body {
          padding: 24px 28px;
          overflow-y: auto;
          flex: 1;
        }

        .pd-clear-modal-message {
          font-size: 15px;
          color: var(--text-secondary, #64748b);
          margin: 0 0 20px 0;
          line-height: 1.6;
        }

        .pd-clear-modal-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          margin-bottom: 20px;
        }

        .pd-clear-stat-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: var(--bg-secondary, #f8fafc);
          border-radius: 10px;
          border: 1px solid var(--border-color, #e2e8f0);
          min-width: 0;
        }

        .pd-clear-stat-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .pd-clear-stat-label {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: var(--text-secondary, #64748b);
        }

        .pd-clear-stat-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
        }

        .pd-clear-modal-warning {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(220, 38, 38, 0.06);
          border: 1px solid rgba(220, 38, 38, 0.15);
          border-radius: 10px;
          color: #dc2626;
          font-size: 13px;
          font-weight: 500;
        }

        .pd-clear-warning-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .pd-clear-modal-footer {
          padding: 16px 28px 24px 28px;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          border-top: 1px solid var(--border-color, #e2e8f0);
          background: var(--bg-secondary, #f8fafc);
          flex-shrink: 0;
          flex-wrap: wrap;
        }

        .pd-clear-modal-footer .pd-btn {
          min-width: 100px;
        }

        /* Dark mode overrides */
        .dark .pd-clear-modal-warning {
          background: rgba(220, 38, 38, 0.12);
          border-color: rgba(220, 38, 38, 0.25);
        }

        .dark .pd-clear-stat-item {
          background: var(--bg-secondary, #1e293b);
        }

        /* ===== RESPONSIVE STYLES ===== */

        /* Tablet and below */
        @media (max-width: 1024px) {
          .pd-navbar {
            padding: 10px 16px;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            min-height: auto;
          }

          .pd-navbar-left {
            justify-content: space-between;
            width: 100%;
          }

          .pd-stepper {
            justify-content: center;
            padding: 4px 0;
          }

          .pd-content {
            padding: 16px;
          }

          .pd-footer {
            padding: 10px 16px;
          }
        }

        /* Mobile phones */
        @media (max-width: 768px) {
          .pd-navbar {
            padding: 8px 12px;
            gap: 6px;
          }

          .pd-navbar-left {
            gap: 10px;
          }

          .pd-logo {
            gap: 8px;
          }

          .pd-logo-text {
            font-size: 16px;
          }
          
          .pd-logo-subtext {
            display: none;
          }

          .pd-logo-icon {
            width: 32px;
            height: 32px;
            font-size: 16px;
          }

          .pd-version {
            font-size: 10px;
            padding: 2px 8px;
          }

          .pd-step-circle {
            width: 26px;
            height: 26px;
            font-size: 11px;
          }
          
          .pd-step-label {
            display: none;
          }
          
          .pd-step-connector {
            width: 16px;
            margin: 0 2px;
          }

          .pd-stepper {
            gap: 2px;
            justify-content: center;
          }

          .pd-content {
            padding: 12px;
          }
          
          .pd-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            padding: 10px 12px;
          }

          .pd-footer-left {
            justify-content: center;
            flex-wrap: wrap;
            width: 100%;
          }

          .pd-footer-right {
            justify-content: center;
            width: 100%;
          }

          .pd-btn {
            padding: 6px 16px;
            font-size: 12px;
            min-height: 36px;
            flex: 1;
            max-width: 200px;
          }
          
          .pd-progress-bar {
            width: 80px;
          }
          
          .pd-progress {
            font-size: 11px;
          }

          /* Modal responsive */
          .pd-clear-modal {
            max-width: 100%;
            margin: 0 10px;
            max-height: 95vh;
          }

          .pd-clear-modal-header {
            padding: 16px 20px 12px 20px;
          }

          .pd-clear-modal-body {
            padding: 16px 20px;
          }

          .pd-clear-modal-footer {
            padding: 12px 20px 16px 20px;
            flex-direction: column;
          }

          .pd-clear-modal-footer .pd-btn {
            width: 100%;
            max-width: none;
          }

          .pd-clear-modal-stats {
            grid-template-columns: 1fr;
          }

          .pd-clear-modal-title {
            font-size: 18px;
          }
        }

        /* Small phones */
        @media (max-width: 480px) {
          .pd-navbar {
            padding: 6px 10px;
          }

          .pd-navbar-left {
            gap: 6px;
          }
          
          .pd-logo-icon {
            width: 28px;
            height: 28px;
            font-size: 14px;
          }

          .pd-logo-text {
            font-size: 14px;
          }
          
          .pd-version {
            font-size: 9px;
            padding: 2px 6px;
          }

          .pd-step-circle {
            width: 24px;
            height: 24px;
            font-size: 10px;
          }

          .pd-step-connector {
            width: 10px;
          }

          .pd-content {
            padding: 8px;
          }

          .pd-footer {
            padding: 8px 10px;
          }

          .pd-btn {
            font-size: 11px;
            padding: 5px 12px;
            min-height: 32px;
          }

          .pd-progress {
            font-size: 10px;
          }

          .pd-progress-bar {
            width: 60px;
          }

          /* Modal small screen */
          .pd-clear-modal-header {
            padding: 12px 16px 10px 16px;
          }

          .pd-clear-modal-body {
            padding: 12px 16px;
          }

          .pd-clear-modal-footer {
            padding: 10px 16px 14px 16px;
          }

          .pd-clear-modal-title {
            font-size: 16px;
          }

          .pd-clear-modal-icon {
            font-size: 24px;
          }

          .pd-clear-modal-message {
            font-size: 14px;
          }

          .pd-clear-stat-item {
            padding: 8px 12px;
          }

          .pd-clear-stat-value {
            font-size: 16px;
          }
        }

        /* Very small screens */
        @media (max-width: 360px) {
          .pd-navbar {
            padding: 4px 6px;
          }

          .pd-logo-text {
            font-size: 12px;
          }

          .pd-logo-icon {
            width: 24px;
            height: 24px;
            font-size: 12px;
          }

          .pd-step-circle {
            width: 20px;
            height: 20px;
            font-size: 9px;
          }

          .pd-step-connector {
            width: 8px;
          }

          .pd-content {
            padding: 6px;
          }

          .pd-footer {
            padding: 6px 8px;
          }

          .pd-btn {
            font-size: 10px;
            padding: 4px 10px;
            min-height: 28px;
          }
        }

        /* Landscape phones */
        @media (max-height: 500px) and (orientation: landscape) {
          .pd-navbar {
            padding: 4px 12px;
            min-height: 44px;
          }

          .pd-logo-text {
            font-size: 14px;
          }

          .pd-logo-subtext {
            display: none;
          }

          .pd-logo-icon {
            width: 28px;
            height: 28px;
            font-size: 14px;
          }

          .pd-step-circle {
            width: 22px;
            height: 22px;
            font-size: 10px;
          }

          .pd-step-label {
            display: none;
          }

          .pd-step-connector {
            width: 10px;
          }

          .pd-content {
            padding: 8px 12px;
          }

          .pd-footer {
            padding: 4px 12px;
          }

          .pd-btn {
            padding: 4px 12px;
            font-size: 11px;
            min-height: 28px;
          }
        }
      `}</style>
    </div>
  );
};

export default PropertyDivider;