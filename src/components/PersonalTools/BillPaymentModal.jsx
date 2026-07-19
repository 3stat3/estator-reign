// src/components/PersonalTools/BillPaymentModal.jsx
import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const BillPaymentModal = ({ isOpen, onClose, bill, onPay, isProcessing }) => {
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
      toast.error('Please enter a valid amount ❌');
      return;
    }

    // Check if amount differs from bill amount
    const difference = bill?.amount - amount;
    if (difference !== 0) {
      if (difference < 0) {
        toast.error(`⚠️ You're overpaying by ₱${Math.abs(difference).toFixed(2)}`);
      } else {
        toast.error(`⚠️ You're underpaying by ₱${difference.toFixed(2)}`);
      }
    }

    const data = {
      bill_id: bill.id,
      due_date: paymentForm.paid_date,
      paid_date: paymentForm.paid_date,
      amount_paid: amount,
      status: paymentForm.status,
      notes: paymentForm.notes,
    };

    await onPay(data);
  };

  return (
    <div className="payment-modal-overlay" onClick={() => onClose()}>
      <div className="payment-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h3>Pay Bill: {bill?.name}</h3>
          <button className="payment-modal-close" onClick={onClose}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="payment-modal-body">
          {/* Bill Summary */}
          <div className="payment-bill-summary">
            <div className="payment-summary-item">
              <span>Bill Amount</span>
              <span className="payment-summary-value">₱{bill?.amount?.toLocaleString()}</span>
            </div>
            <div className="payment-summary-item">
              <span>Due Day</span>
              <span className="payment-summary-value">Day {bill?.due_day}</span>
            </div>
            <div className="payment-summary-item">
              <span>Frequency</span>
              <span className="payment-summary-value">{bill?.frequency}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="payment-form-group">
              <label>Amount Paid (₱)</label>
              <input
                type="number"
                placeholder={`${bill?.amount}`}
                value={paymentForm.amount_paid}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                required
                min="0"
                step="0.01"
              />
              <small className="payment-hint">
                Bill amount: ₱{bill?.amount?.toLocaleString()}
              </small>
            </div>

            <div className="payment-form-group">
              <label>Paid Date</label>
              <input
                type="date"
                value={paymentForm.paid_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, paid_date: e.target.value })}
                required
              />
            </div>

            <div className="payment-form-group">
              <label>Status</label>
              <select
                value={paymentForm.status}
                onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                required
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div className="payment-form-group">
              <label>Notes (optional)</label>
              <input
                type="text"
                placeholder="Payment method, reference number, etc."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              />
            </div>

            <div className="payment-summary-difference">
              {paymentForm.amount_paid && !isNaN(parseFloat(paymentForm.amount_paid)) && (
                <>
                  {(() => {
                    const diff = bill?.amount - parseFloat(paymentForm.amount_paid);
                    if (diff === 0) {
                      return <span className="diff-exact">✅ Exact amount paid</span>;
                    } else if (diff < 0) {
                      return <span className="diff-over">⚠️ Overpaid by ₱{Math.abs(diff).toFixed(2)}</span>;
                    } else {
                      return <span className="diff-under">⚠️ Underpaid by ₱{diff.toFixed(2)}</span>;
                    }
                  })()}
                </>
              )}
            </div>

            <div className="payment-modal-footer">
              <button type="button" className="payment-modal-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="payment-modal-submit" disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        /* ===== PAYMENT MODAL OVERLAY ===== */
        .payment-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 1.5rem;
          animation: paymentFadeIn 0.2s ease;
        }

        @keyframes paymentFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes paymentSlideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .payment-modal-container {
          background: var(--card-bg, #ffffff);
          border-radius: 1.25rem;
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
          animation: paymentSlideUp 0.25s ease;
          overflow: hidden;
        }

        .payment-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          flex-shrink: 0;
        }

        .payment-modal-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
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
          width: 1.5rem;
          height: 1.5rem;
        }

        .payment-modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .payment-bill-summary {
          background: var(--bg-primary, #f1f5f9);
          border-radius: 0.75rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.5rem;
        }

        .payment-summary-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .payment-summary-item span:first-child {
          font-size: 0.75rem;
          color: var(--text-secondary, #64748b);
          font-weight: 500;
        }

        .payment-summary-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .payment-form-group {
          margin-bottom: 1rem;
        }

        .payment-form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary, #0f172a);
          margin-bottom: 0.25rem;
        }

        .payment-form-group input,
        .payment-form-group select {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-primary, #0f172a);
          background: var(--bg-primary, #f8fafc);
          transition: border-color 0.2s;
        }

        .payment-form-group input:focus,
        .payment-form-group select:focus {
          outline: none;
          border-color: var(--gradient-start, #667eea);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .payment-hint {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary, #64748b);
          margin-top: 0.25rem;
        }

        .payment-summary-difference {
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          text-align: center;
          font-weight: 500;
        }

        .diff-exact {
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          display: block;
        }

        .diff-over {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          display: block;
        }

        .diff-under {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          display: block;
        }

        .payment-modal-footer {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color, #e2e8f0);
          margin-top: 1rem;
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
          padding: 0.5rem 1.25rem;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .payment-modal-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .payment-modal-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .payment-modal-overlay {
            padding: 0.5rem;
          }

          .payment-modal-container {
            max-width: 100%;
            margin: 0.5rem;
            max-height: 95vh;
          }

          .payment-bill-summary {
            grid-template-columns: 1fr;
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
        }
      `}</style>
    </div>
  );
};

export default BillPaymentModal;