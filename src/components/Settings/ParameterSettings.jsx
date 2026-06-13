import React from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

const ParameterSettings = () => {
  return (
    <div className="placeholder-tab">
      <Cog6ToothIcon className="placeholder-icon" />
      <h3>Other Parameters</h3>
      <p>Configure currency settings, rounding rules, decimal places, and other system parameters.</p>
      <button className="btn-primary" onClick={() => alert('System Parameters configuration coming soon!')}>
        Configure System Parameters
      </button>
      <style>{`
        .placeholder-tab {
          text-align: center;
          padding: 3rem;
        }
        .placeholder-icon {
          width: 4rem;
          height: 4rem;
          margin: 0 auto 1rem;
          color: var(--text-tertiary);
          opacity: 0.5;
        }
        .placeholder-tab h3 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .placeholder-tab p {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default ParameterSettings;