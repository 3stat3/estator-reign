// src/components/PersonalTools/LoanPaymentModal.jsx
import React, { useState } from 'react';
import { XMarkIcon, BanknotesIcon, CalendarIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const LoanPaymentModal = ({ isOpen, onClose, loan, onPay, isProcessing }) => {
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: '',
    paid_date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'paid'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentForm.amount_paid);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const remaining = (loan?.total_amount || 0) - (loan?.total_paid || 0);
    if (amount > remaining) {
      toast.error(`Amount exceeds remaining balance of ₱${remaining.toLocaleString()}`);
      return;
    }

    const data = {
      loan_id: loan.id,
      payment_date: paymentForm.paid_date,
      amount_paid: amount,
      status: paymentForm.status,
      notes: paymentForm.notes,
    };

    await onPay(data);
  };

  const remainingBalance = (loan?.total_amount || 0) - (loan?.total_paid || 0);
  const progress = loan?.total_amount > 0 ? ((loan?.total_paid || 0) / loan?.total_amount) * 100 : 0;
  const isFullyPaid = remainingBalance === 0;

  return (
    <div className="payment-modal-overlay" onClick={() => onClose()}>
      <div className="payment-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-modal-header">
          <div className="payment-modal-title">
            <BanknotesIcon className="payment-modal-icon" />
            <div>
              <h3>Record Payment</h3>
              <p className="payment-modal-subtitle">{loan?.name}</p>
            </div>
          </div>
          <button className="payment-modal-close" onClick={onClose}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="payment-modal-body">
          {/* Loan Summary Cards */}
          <div className="payment-summary-grid">
            <div className="payment-summary-card">
              <div className="payment-summary-label">Total Loan</div>
              <div className="payment-summary-value">₱{loan?.total_amount?.toLocaleString()}</div>
            </div>
            <div className="payment-summary-card success">
              <div className="payment-summary-label">Total Paid</div>
              <div className="payment-summary-value">₱{loan?.total_paid?.toLocaleString() || '0'}</div>
            </div>
            <div className="payment-summary-card danger">
              <div className="payment-summary-label">Remaining</div>
              <div className="payment-summary-value">₱{remainingBalance.toLocaleString()}</div>
            </div>
            <div className="payment-summary-card progress-card">
              <div className="payment-summary-label">Progress</div>
              <div className="payment-summary-value">{progress.toFixed(0)}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="payment-progress-section">
            <div className="payment-progress-track">
              <div
                className={`payment-progress-fill ${isFullyPaid ? 'completed' : ''}`}
                style={{ 
                  width: `${Math.min(progress, 100)}%`,
                }}
              />
            </div>
            {isFullyPaid && (
              <div className="payment-progress-badge">
                <CheckCircleIcon className="payment-progress-badge-icon" />
                Fully Paid
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Amount Input */}
            <div className="payment-form-group">
              <label>
                Amount to Pay
                <span className="payment-form-required">*</span>
              </label>
              <div className="payment-input-wrapper">
                <span className="payment-input-prefix">₱</span>
                <input
                  type="number"
                  placeholder={`0.00`}
                  value={paymentForm.amount_paid}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                  required
                  min="0"
                  max={remainingBalance}
                  step="0.01"
                  className="payment-input"
                />
              </div>
              <small className="payment-hint">
                Maximum: ₱{remainingBalance.toLocaleString()}
              </small>
            </div>

            {/* Date Input */}
            <div className="payment-form-group">
              <label>
                Payment Date
                <span className="payment-form-required">*</span>
              </label>
              <div className="payment-input-wrapper">
                <CalendarIcon className="payment-input-icon" />
                <input
                  type="date"
                  value={paymentForm.paid_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paid_date: e.target.value })}
                  required
                  className="payment-input with-icon"
                />
              </div>
            </div>

            {/* Status Select */}
            <div className="payment-form-group">
              <label>Status</label>
              <select
                value={paymentForm.status}
                onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                className="payment-select"
                required
              >
                <option value="paid">✅ Paid</option>
                <option value="pending">⏳ Pending</option>
                <option value="overdue">⚠️ Overdue</option>
              </select>
            </div>

            {/* Notes Input */}
            <div className="payment-form-group">
              <label>Notes (optional)</label>
              <input
                type="text"
                placeholder="Payment method, reference number, etc."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="payment-input"
              />
            </div>

            {/* Payment Preview */}
            {paymentForm.amount_paid && !isNaN(parseFloat(paymentForm.amount_paid)) && (
              <div className="payment-preview">
                {(() => {
                  const amount = parseFloat(paymentForm.amount_paid);
                  const remainingAfter = remainingBalance - amount;
                  if (remainingAfter === 0) {
                    return (
                      <div className="payment-preview-complete">
                        <CheckCircleIcon className="payment-preview-icon" />
                        <span>🎉 Loan will be fully paid!</span>
                      </div>
                    );
                  } else if (remainingAfter < 0) {
                    return (
                      <div className="payment-preview-over">
                        <ExclamationCircleIcon className="payment-preview-icon" />
                        <span>Amount exceeds remaining balance by ₱{Math.abs(remainingAfter).toFixed(2)}</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="payment-preview-remaining">
                        <span>Remaining after payment: <strong>₱{remainingAfter.toFixed(2)}</strong></span>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            {/* Actions */}
            <div className="payment-modal-footer">
              <button type="button" className="payment-modal-cancel" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="payment-modal-submit" 
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="payment-spinner">Processing...</span>
                ) : (
                  'Record Payment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        /* ===== MODAL OVERLAY ===== */
        .payment-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 1.5rem;
          animation: paymentFadeIn 0.25s ease;
        }

        @keyframes paymentFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes paymentSlideUp {
          from { transform: translateY(30px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .payment-modal-container {
          background: var(--card-bg, #ffffff);
          border-radius: 1.25rem;
          max-width: 500px;
          width: 100%;
          max-height: 95vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
          animation: paymentSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }

        .dark .payment-modal-container {
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
        }

        /* ===== HEADER ===== */
        .payment-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          flex-shrink: 0;
        }

        .payment-modal-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .payment-modal-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: var(--gradient-start, #667eea);
          background: rgba(102, 126, 234, 0.1);
          padding: 0.5rem;
          border-radius: 0.5rem;
        }

        .payment-modal-title h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin: 0;
          line-height: 1.2;
        }

        .payment-modal-subtitle {
          font-size: 0.8rem;
          color: var(--text-secondary, #64748b);
          margin: 0;
        }

        .payment-modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary, #64748b);
          padding: 0.4rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .payment-modal-close:hover {
          background: var(--hover-bg, #f1f5f9);
          color: var(--text-primary, #0f172a);
        }

        .payment-modal-close svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        /* ===== BODY ===== */
        .payment-modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        /* ===== SUMMARY CARDS ===== */
        .payment-summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .payment-summary-card {
          background: var(--bg-primary, #f8fafc);
          border-radius: 0.625rem;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color, #e2e8f0);
          transition: all 0.2s;
        }

        .dark .payment-summary-card {
          background: var(--bg-secondary, #1e293b);
        }

        .payment-summary-card.success {
          border-color: rgba(16, 185, 129, 0.3);
          background: rgba(16, 185, 129, 0.05);
        }

        .payment-summary-card.danger {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.05);
        }

        .payment-summary-card.progress-card {
          border-color: rgba(102, 126, 234, 0.3);
          background: rgba(102, 126, 234, 0.05);
        }

        .payment-summary-label {
          font-size: 0.65rem;
          font-weight: 500;
          color: var(--text-secondary, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .payment-summary-value {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          margin-top: 0.125rem;
        }

        .payment-summary-card.success .payment-summary-value {
          color: #10b981;
        }

        .payment-summary-card.danger .payment-summary-value {
          color: #ef4444;
        }

        .payment-summary-card.progress-card .payment-summary-value {
          color: var(--gradient-start, #667eea);
        }

        /* ===== PROGRESS ===== */
        .payment-progress-section {
          margin-bottom: 1.25rem;
          position: relative;
        }

        .payment-progress-track {
          width: 100%;
          height: 6px;
          background: var(--bg-primary, #f1f5f9);
          border-radius: 6px;
          overflow: hidden;
        }

        .payment-progress-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
        }

        .payment-progress-fill.completed {
          background: linear-gradient(90deg, #10b981, #34d399);
        }

        .payment-progress-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          margin-top: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .payment-progress-badge-icon {
          width: 0.875rem;
          height: 0.875rem;
        }

        /* ===== FORM ===== */
        .payment-form-group {
          margin-bottom: 1rem;
        }

        .payment-form-group label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin-bottom: 0.25rem;
        }

        .payment-form-required {
          color: #ef4444;
          margin-left: 0.125rem;
        }

        .payment-input-wrapper {
          position: relative;
        }

        .payment-input-prefix {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          font-size: 0.875rem;
        }

        .payment-input {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: 1.5px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-primary, #0f172a);
          background: var(--bg-primary, #f8fafc);
          transition: all 0.2s;
          font-weight: 500;
        }

        .payment-input:focus {
          outline: none;
          border-color: var(--gradient-start, #667eea);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          background: var(--card-bg, #ffffff);
        }

        .payment-input.with-icon {
          padding-left: 2.25rem;
        }

        .payment-input-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1rem;
          height: 1rem;
          color: var(--text-tertiary, #94a3b8);
        }

        .payment-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .payment-select {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: 1.5px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-primary, #0f172a);
          background: var(--bg-primary, #f8fafc);
          transition: all 0.2s;
          appearance: none;
          cursor: pointer;
        }

        .payment-select:focus {
          outline: none;
          border-color: var(--gradient-start, #667eea);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .payment-hint {
          display: block;
          font-size: 0.7rem;
          color: var(--text-secondary, #64748b);
          margin-top: 0.25rem;
        }

        /* ===== PREVIEW ===== */
        .payment-preview {
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          text-align: center;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .payment-preview-complete {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #10b981;
          background: rgba(16, 185, 129, 0.08);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
        }

        .payment-preview-over {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
        }

        .payment-preview-remaining {
          color: var(--text-secondary, #64748b);
          background: var(--bg-primary, #f1f5f9);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
        }

        .payment-preview-remaining strong {
          color: var(--text-primary, #0f172a);
        }

        .payment-preview-icon {
          width: 1.125rem;
          height: 1.125rem;
        }

        /* ===== FOOTER ===== */
        .payment-modal-footer {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color, #e2e8f0);
          margin-top: 0.5rem;
        }

        .payment-modal-cancel {
          padding: 0.5rem 1.25rem;
          background: var(--bg-primary, #f1f5f9);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary, #0f172a);
          cursor: pointer;
          transition: all 0.2s;
        }

        .payment-modal-cancel:hover {
          background: var(--hover-bg, #e2e8f0);
        }

        .payment-modal-submit {
          padding: 0.5rem 1.5rem;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 120px;
        }

        .payment-modal-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);
        }

        .payment-modal-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .payment-spinner {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .payment-spinner::after {
          content: '';
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spinnerRotate 0.6s linear infinite;
        }

        @keyframes spinnerRotate {
          to { transform: rotate(360deg); }
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .payment-modal-overlay {
            padding: 0.5rem;
          }

          .payment-modal-container {
            max-width: 100%;
            margin: 0.5rem;
            max-height: 95vh;
            border-radius: 1rem;
          }

          .payment-summary-grid {
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }

          .payment-summary-card {
            padding: 0.5rem 0.75rem;
          }

          .payment-summary-value {
            font-size: 0.9rem;
          }

          .payment-modal-body {
            padding: 1rem;
          }

          .payment-modal-header {
            padding: 0.75rem 1rem;
          }

          .payment-modal-header h3 {
            font-size: 1rem;
          }

          .payment-modal-footer {
            flex-direction: column;
          }

          .payment-modal-footer button {
            width: 100%;
            justify-content: center;
          }

          .payment-modal-submit {
            min-width: auto;
          }

          .payment-preview {
            font-size: 0.8rem;
          }

          .payment-preview-complete,
          .payment-preview-over,
          .payment-preview-remaining {
            padding: 0.4rem 0.75rem;
          }
        }

        @media (max-width: 380px) {
          .payment-summary-grid {
            grid-template-columns: 1fr 1fr;
          }

          .payment-form-group label {
            font-size: 0.75rem;
          }

          .payment-input {
            font-size: 0.8rem;
            padding: 0.5rem 0.6rem;
          }

          .payment-select {
            font-size: 0.8rem;
            padding: 0.5rem 0.6rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LoanPaymentModal;