import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalculatorIcon,
  UserGroupIcon,
  LockClosedIcon,
  LockOpenIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../../supabase';

const FeatureToggles = () => {
  const [features, setFeatures] = useState({
    tax_calculator: { enabled: true, name: 'Estate Tax Calculator', icon: CalculatorIcon },
    property_divider: { enabled: true, name: 'Property Divider', icon: UserGroupIcon }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('setting_key', ['feature_tax_calculator', 'feature_property_divider']);

      if (error) throw error;

      if (data && data.length > 0) {
        data.forEach(setting => {
          if (setting.setting_key === 'feature_tax_calculator') {
            setFeatures(prev => ({
              ...prev,
              tax_calculator: { ...prev.tax_calculator, enabled: setting.setting_value === 'enabled' }
            }));
          }
          if (setting.setting_key === 'feature_property_divider') {
            setFeatures(prev => ({
              ...prev,
              property_divider: { ...prev.property_divider, enabled: setting.setting_value === 'enabled' }
            }));
          }
        });
      }
    } catch (err) {
      console.error('Error loading features:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureKey) => {
    setSaving(true);
    setMessage(null);
    
    const newEnabled = !features[featureKey].enabled;
    const newValue = newEnabled ? 'enabled' : 'disabled';
    
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: `feature_${featureKey}`,
          setting_value: newValue,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      setFeatures(prev => ({
        ...prev,
        [featureKey]: { ...prev[featureKey], enabled: newEnabled }
      }));

      setMessage({
        type: 'success',
        text: `${features[featureKey].name} has been ${newEnabled ? 'unlocked' : 'locked'} successfully.`
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error toggling feature:', err);
      setMessage({
        type: 'error',
        text: 'Failed to update feature status. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading feature settings...</p>
      </div>
    );
  }

  return (
    <div className="feature-toggles">
      <div className="toggles-header">
        <div className="header-left">
          <Cog6ToothIcon />
          <div>
            <h2>Feature Toggles</h2>
            <p>Control which features are available to Regular Users</p>
          </div>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`message-banner ${message.type}`}
        >
          {message.type === 'success' ? <CheckCircleIcon /> : <ExclamationTriangleIcon />}
          <span>{message.text}</span>
        </motion.div>
      )}

      <div className="toggles-grid">
        {Object.entries(features).map(([key, feature]) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={key}
              className={`toggle-card ${feature.enabled ? 'enabled' : 'disabled'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="toggle-header">
                <div className="toggle-icon">
                  <Icon />
                </div>
                <div className="toggle-info">
                  <h3>{feature.name}</h3>
                  <p className="feature-status">
                    {feature.enabled ? (
                      <span className="status-badge unlocked">Unlocked</span>
                    ) : (
                      <span className="status-badge locked">Locked</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="toggle-description">
                {feature.enabled ? (
                  <p>Users can access and use this feature.</p>
                ) : (
                  <p>Users cannot access this feature. They will see a maintenance message.</p>
                )}
              </div>

              <button
                className={`toggle-btn ${feature.enabled ? 'lock' : 'unlock'}`}
                onClick={() => toggleFeature(key)}
                disabled={saving}
              >
                {feature.enabled ? (
                  <>
                    <LockClosedIcon />
                    Lock Feature
                  </>
                ) : (
                  <>
                    <LockOpenIcon />
                    Unlock Feature
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      <style>{`
        .feature-toggles {
          padding: 1.5rem;
        }

        .toggles-header {
          margin-bottom: 2rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-left svg {
          width: 2rem;
          height: 2rem;
          color: var(--gradient-start);
        }

        .header-left h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
        }

        .header-left p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0;
        }

        .message-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .message-banner.success {
          background: rgba(16, 185, 129, 0.1);
          border-left: 3px solid #10b981;
          color: #10b981;
        }

        .message-banner.error {
          background: rgba(239, 68, 68, 0.1);
          border-left: 3px solid #ef4444;
          color: #ef4444;
        }

        .message-banner svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .toggles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .toggle-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 1rem;
          padding: 1.5rem;
          transition: all 0.3s;
        }

        .toggle-card.enabled {
          border-left: 4px solid #10b981;
        }

        .toggle-card.disabled {
          border-left: 4px solid #ef4444;
          opacity: 0.8;
        }

        .toggle-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .toggle-icon {
          width: 3rem;
          height: 3rem;
          background: var(--bg-secondary);
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toggle-icon svg {
          width: 1.5rem;
          height: 1.5rem;
          color: var(--gradient-start);
        }

        .toggle-info h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
        }

        .status-badge {
          display: inline-flex;
          padding: 0.25rem 0.625rem;
          border-radius: 2rem;
          font-size: 0.688rem;
          font-weight: 600;
        }

        .status-badge.unlocked {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .status-badge.locked {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .toggle-description {
          margin-bottom: 1.5rem;
        }

        .toggle-description p {
          color: var(--text-secondary);
          font-size: 0.813rem;
          margin: 0;
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.625rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-btn.lock {
          background: #ef4444;
          color: white;
        }

        .toggle-btn.lock:hover {
          background: #dc2626;
        }

        .toggle-btn.unlock {
          background: #10b981;
          color: white;
        }

        .toggle-btn.unlock:hover {
          background: #059669;
        }

        .toggle-btn svg {
          width: 1rem;
          height: 1rem;
        }

        .toggle-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          gap: 1rem;
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

        @media (max-width: 768px) {
          .toggles-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default FeatureToggles;