import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const DeductionSettings = () => {
  return (
    <div className="placeholder-container">
      <ChartBarIcon className="placeholder-icon" />
      <h3>Deduction Rules</h3>
      <p>Deduction rules configuration will be available in the next update.</p>
      <div className="coming-soon-badge">Coming Soon</div>
      
      <style>{`
        .placeholder-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          min-height: 400px;
        }
        
        .placeholder-icon {
          width: 5rem;
          height: 5rem;
          color: var(--text-tertiary);
          opacity: 0.5;
          margin-bottom: 1.5rem;
        }
        
        .placeholder-container h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        
        .placeholder-container p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          max-width: 400px;
          margin-bottom: 1rem;
        }
        
        .coming-soon-badge {
          display: inline-block;
          padding: 0.25rem 1rem;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          color: white;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default DeductionSettings;