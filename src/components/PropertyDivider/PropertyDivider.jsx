// src/components/PropertyDivider/PropertyDivider.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PersonManager from './modules/PersonManager';

const PropertyDivider = ({ darkMode = false }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [appState, setAppState] = useState({
    persons: [],
    properties: [],
    decedentId: null,
    estateType: 'intestate',
    will: null,
    divisionResults: null
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
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

  const renderModule = () => {
    switch(currentStep) {
      case 1:
        return (
          <PersonManager 
            darkMode={darkMode}
            persons={appState.persons}
            onUpdate={(data) => setAppState({...appState, persons: data})}
          />
        );
      case 2:
        return (
          <div className="pd-placeholder">
            <div className="pd-placeholder-icon">🏠</div>
            <h2>Property Manager</h2>
            <p>Add and classify properties for estate division</p>
            <div className="pd-placeholder-stats">
              📦 <span className="pd-badge">{appState.properties.length}</span> properties
            </div>
            <p className="pd-coming-soon">⏳ Property management will be implemented after PersonManager</p>
          </div>
        );
      case 3:
        return (
          <div className="pd-placeholder">
            <div className="pd-placeholder-icon">⚖️</div>
            <h2>Division Engine</h2>
            <p>Estate division will be calculated here</p>
            <div className="pd-placeholder-stats">
              👥 <span className="pd-badge">{appState.persons.length}</span> persons &nbsp;·&nbsp; 🏠 <span className="pd-badge">{appState.properties.length}</span> properties
            </div>
            <p className="pd-coming-soon">⏳ Coming soon: Philippine succession law implementation</p>
          </div>
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
        }

        .pd-logo-text {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.5px;
        }

        .pd-logo-subtext {
          font-size: 11px;
          color: var(--text-secondary);
          margin: 0;
          font-weight: 400;
        }

        .pd-version {
          padding: 2px 10px;
          border-radius: 6px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          font-size: 11px;
          color: var(--text-secondary);
        }

        /* Stepper - now inline with navbar */
        .pd-stepper {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          overflow: auto;
          padding: 4px 0;
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
        }

        .pd-step-circle.completed {
          background: #667eea;
          color: #ffffff;
          cursor: pointer;
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
        }

        .pd-module-wrapper {
          height: 100%;
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
        }

        .pd-footer-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pd-footer-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pd-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
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
        }

        .pd-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pd-btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #ffffff;
        }

        .pd-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .pd-btn-secondary {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .pd-btn-secondary:hover:not(:disabled) {
          background: var(--border-color);
        }

        /* Placeholder */
        .pd-placeholder {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }

        .pd-placeholder-icon {
          font-size: 56px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .pd-placeholder h2 {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 6px 0;
        }

        .pd-placeholder p {
          font-size: 15px;
          color: var(--text-secondary);
          margin: 0 0 20px 0;
        }

        .pd-placeholder-stats {
          padding: 10px 20px;
          border-radius: 8px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          font-size: 13px;
          color: var(--text-secondary);
        }

        .pd-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 16px;
          background: var(--bg-primary);
          color: #667eea;
          font-size: 12px;
          font-weight: 500;
          margin: 0 4px;
        }

        .pd-coming-soon {
          margin-top: 14px;
          font-size: 12px;
          color: var(--text-secondary);
          opacity: 0.7;
        }

        /* Dark mode overrides */
        .dark .pd-badge-married {
          background: #1a2a3a;
          color: #60a5fa;
        }

        /* Responsive */
        @media (max-width: 992px) {
          .pd-navbar {
            padding: 10px 16px;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .pd-navbar-left {
            justify-content: space-between;
          }

          .pd-stepper {
            justify-content: center;
          }

          .pd-content {
            padding: 16px;
          }

          .pd-footer {
            padding: 10px 16px;
            flex-wrap: wrap;
            gap: 8px;
          }
        }

        @media (max-width: 768px) {
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
          }

          .pd-content {
            padding: 12px;
          }
          
          .pd-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .pd-footer-left {
            justify-content: center;
          }

          .pd-footer-right {
            justify-content: center;
          }

          .pd-btn {
            padding: 6px 16px;
            font-size: 12px;
          }
          
          .pd-progress-bar {
            width: 80px;
          }
          
          .pd-progress {
            font-size: 11px;
          }
          
          .pd-placeholder h2 {
            font-size: 18px;
          }
          
          .pd-placeholder-icon {
            font-size: 40px;
          }
        }

        @media (max-width: 480px) {
          .pd-navbar {
            padding: 8px 12px;
          }

          .pd-navbar-left {
            gap: 8px;
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
            font-size: 10px;
            padding: 2px 8px;
          }

          .pd-step-circle {
            width: 22px;
            height: 22px;
            font-size: 10px;
          }

          .pd-step-connector {
            width: 12px;
          }

          .pd-content {
            padding: 8px;
          }

          .pd-footer {
            padding: 8px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default PropertyDivider;