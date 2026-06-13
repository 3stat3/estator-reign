import React, { useState } from 'react';
import {
  Cog6ToothIcon,
  CalculatorIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import TaxRateSettings from './TaxRateSettings';
import DeductionSettings from './DeductionSettings';
import PenaltySettings from './PenaltySettings';
import ExemptionSettings from './ExemptionSettings';
import ParameterSettings from './ParameterSettings';

const SETTINGS_TABS = [
  { id: 'taxRates', label: 'Tax Rates', icon: CalculatorIcon, component: TaxRateSettings },
  { id: 'deductions', label: 'Deduction Rules', icon: ChartBarIcon, component: DeductionSettings },
  { id: 'penalties', label: 'Penalty Rules', icon: ExclamationTriangleIcon, component: PenaltySettings },
  { id: 'exemptions', label: 'Exemption Rules', icon: ShieldCheckIcon, component: ExemptionSettings },
  { id: 'parameters', label: 'Other Parameters', icon: Cog6ToothIcon, component: ParameterSettings }
];

const TaxSettings = () => {
  const [activeTab, setActiveTab] = useState('taxRates');
  const ActiveComponent = SETTINGS_TABS.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="tax-settings">
      <div className="settings-header">
        <div className="header-left">
          <Cog6ToothIcon className="settings-icon" />
          <div>
            <h2>Tax Settings</h2>
            <p className="settings-description">
              Configure tax rates, deduction rules, penalties, and other parameters
            </p>
          </div>
        </div>
      </div>

      <div className="settings-tabs">
        {SETTINGS_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="settings-tab-content">
        <ActiveComponent />
      </div>

      <style>{`
        .tax-settings {
          padding: 1rem;
        }

        @media (min-width: 768px) {
          .tax-settings {
            padding: 1.5rem;
          }
        }

        .settings-header {
          display: flex;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .settings-icon {
          width: 1.75rem;
          height: 1.75rem;
          color: var(--gradient-start);
        }

        @media (min-width: 768px) {
          .settings-icon {
            width: 2rem;
            height: 2rem;
          }
        }

        .settings-header h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        @media (min-width: 768px) {
          .settings-header h2 {
            font-size: 1.25rem;
          }
        }

        .settings-description {
          color: var(--text-secondary);
          font-size: 0.75rem;
          margin: 0.25rem 0 0 0;
        }

        @media (min-width: 768px) {
          .settings-description {
            font-size: 0.875rem;
          }
        }

        .settings-tabs {
          display: flex;
          gap: 0.5rem;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .settings-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .settings-tab:hover {
          background: var(--hover-bg);
          color: var(--text-primary);
        }

        .settings-tab.active {
          background: rgba(102, 126, 234, 0.1);
          color: var(--gradient-start);
        }

        .settings-tab-content {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default TaxSettings;