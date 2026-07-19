// src/components/PersonalTools/Modal.jsx
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="finance-modal-overlay" onClick={onClose}>
      <div className="finance-modal" onClick={(e) => e.stopPropagation()}>
        <div className="finance-modal-header">
          <h3>{title}</h3>
          <button className="finance-modal-close" onClick={onClose}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="finance-modal-body">
          {children}
        </div>
      </div>

      <style>{`
        .finance-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
        }

        .finance-modal {
          background: var(--card-bg, #ffffff);
          border-radius: 1rem;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .finance-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .finance-modal-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .finance-modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary, #64748b);
          padding: 0.25rem;
          border-radius: 0.375rem;
          transition: background 0.2s;
        }

        .finance-modal-close:hover {
          background: var(--hover-bg, #f1f5f9);
        }

        .finance-modal-body {
          padding: 1.5rem;
        }

        @media (max-width: 480px) {
          .finance-modal {
            margin: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Modal;