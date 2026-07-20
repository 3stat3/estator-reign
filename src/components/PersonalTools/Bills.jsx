// src/components/PersonalTools/Bills.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  CreditCardIcon,
  ClockIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Modal from './Modal';
import BillPaymentModal from './BillPaymentModal';

const Bills = ({ finance, setActiveView }) => {
  const {
    bills,
    loading,
    addBill,
    updateBill,
    deleteBill,
    recordBillPayment,
    loadAllData,
  } = finance;

  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [billForm, setBillForm] = useState({
    name: '',
    category: '',
    amount: '',
    due_day: 1,
    frequency: 'monthly',
    active: true,
    notes: ''
  });

  const expenseCategories = [
    'Food', 'Housing', 'Transportation', 'Utilities',
    'Healthcare', 'Entertainment', 'Shopping', 'Education',
    'Insurance', 'Debt Payment', 'Savings', 'Investments',
    'Gifts & Donations', 'Personal Care', 'Subscriptions'
  ];

  const frequencies = ['monthly', 'quarterly', 'annually', 'weekly'];

  const openAdd = () => {
    setEditingItem(null);
    setBillForm({
      name: '',
      category: '',
      amount: '',
      due_day: 1,
      frequency: 'monthly',
      active: true,
      notes: ''
    });
    setShowModal(true);
  };

  const openEdit = (bill) => {
    setEditingItem(bill);
    setBillForm({
      name: bill.name || '',
      category: bill.category || '',
      amount: bill.amount ? bill.amount.toString() : '',
      due_day: bill.due_day || 1,
      frequency: bill.frequency || 'monthly',
      active: bill.active !== undefined ? bill.active : true,
      notes: bill.notes || ''
    });
    setShowModal(true);
  };

  const openPaymentModal = (bill) => {
    setSelectedBill(bill);
    setShowPaymentModal(true);
  };

  const handlePayment = async (paymentData) => {
    setIsProcessing(true);
    const result = await recordBillPayment(paymentData);
    setIsProcessing(false);

    if (result.success) {
      toast.success('Payment recorded successfully! ✅');
      setShowPaymentModal(false);
      loadAllData();
    } else {
      toast.error(result.error || 'Failed to record payment ❌');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(billForm.amount);
    const due_day = parseInt(billForm.due_day);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount ❌');
      return;
    }
    
    if (isNaN(due_day) || due_day < 1 || due_day > 31) {
      toast.error('Please enter a valid due day (1-31) ❌');
      return;
    }

    const data = {
      name: billForm.name.trim(),
      category: billForm.category,
      amount: amount,
      due_day: due_day,
      frequency: billForm.frequency,
      active: billForm.active !== undefined ? billForm.active : true,
      notes: billForm.notes || '',
      updated_at: new Date().toISOString()
    };

    const toastId = toast.loading(editingItem ? 'Updating bill...' : 'Adding bill...');

    let result;
    if (editingItem) {
      result = await updateBill(editingItem.id, data);
    } else {
      result = await addBill(data);
    }

    toast.dismiss(toastId);

    if (result.success) {
      toast.success(editingItem ? 'Bill updated successfully! ✅' : 'Bill added successfully! ✅');
      setShowModal(false);
      loadAllData();
    } else {
      toast.error(result.error || 'Failed to save bill ❌');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    const toastId = toast.loading('Deleting bill...');
    const result = await deleteBill(id);
    toast.dismiss(toastId);

    if (result.success) {
      toast.success('Bill deleted successfully! 🗑️');
      loadAllData();
    } else {
      toast.error(result.error || 'Failed to delete bill ❌');
    }
  };

  // src/components/PersonalTools/Bills.jsx
  // The viewBillTransactions function should be:

  const viewBillTransactions = (bill) => {
    if (setActiveView) {
      // Pass the bill data as filter
      setActiveView('transactions', { 
        name: bill.name, 
        category: bill.category 
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="finance-bills-view"
    >
      <div className="finance-view-header">
        <h2>Bills Tracker</h2>
        <button className="finance-add-btn" onClick={openAdd}>
          <PlusCircleIcon className="finance-add-btn-icon" />
          Add Bill
        </button>
      </div>

      <div className="finance-bills-grid">
        {bills.map((bill) => (
          <div key={bill.id} className="finance-bill-item">
            <div className="finance-bill-header">
              <h3>{bill.name}</h3>
              <span className={`finance-bill-status ${bill.active ? 'active' : 'inactive'}`}>
                {bill.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="finance-bill-details">
              <div className="finance-bill-detail">
                <span>Category</span>
                <span>{bill.category}</span>
              </div>
              <div className="finance-bill-detail">
                <span>Amount</span>
                <span>₱{bill.amount.toLocaleString()}</span>
              </div>
              <div className="finance-bill-detail">
                <span>Due Day</span>
                <span>Day {bill.due_day}</span>
              </div>
              <div className="finance-bill-detail">
                <span>Frequency</span>
                <span>{bill.frequency}</span>
              </div>
              {bill.notes && (
                <div className="finance-bill-detail">
                  <span>Notes</span>
                  <span>{bill.notes}</span>
                </div>
              )}
            </div>
            <div className="finance-bill-actions">
              <button 
                className="finance-action-btn pay" 
                onClick={() => openPaymentModal(bill)}
                title="Record Payment"
              >
                <CreditCardIcon className="finance-action-icon" />
              </button>
              <button 
                className="finance-action-btn transactions" 
                onClick={() => viewBillTransactions(bill)}
                title="View Transactions for this bill"
              >
                <DocumentTextIcon className="finance-action-icon" />
              </button>
              <button className="finance-action-btn edit" onClick={() => openEdit(bill)}>
                <PencilSquareIcon className="finance-action-icon" />
              </button>
              <button className="finance-action-btn delete" onClick={() => handleDelete(bill.id)}>
                <TrashIcon className="finance-action-icon" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {bills.length === 0 && (
        <div className="finance-placeholder">
          <p>No bills added. Click "Add Bill" to start tracking.</p>
        </div>
      )}

      {loading && <div className="finance-loading">Loading...</div>}

      {/* Add/Edit Bill Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Bill' : 'Add Bill'}
      >
        <form onSubmit={handleSubmit}>
          <div className="finance-form-group">
            <label>Bill Name</label>
            <input
              type="text"
              placeholder="Enter bill name"
              value={billForm.name}
              onChange={(e) => setBillForm({ ...billForm, name: e.target.value })}
              required
            />
          </div>
          <div className="finance-form-group">
            <label>Category</label>
            <select
              value={billForm.category}
              onChange={(e) => setBillForm({ ...billForm, category: e.target.value })}
              required
            >
              <option value="">Select category</option>
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="finance-form-row">
            <div className="finance-form-group">
              <label>Amount (₱)</label>
              <input
                type="number"
                placeholder="0.00"
                value={billForm.amount}
                onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="finance-form-group">
              <label>Due Day</label>
              <input
                type="number"
                min="1"
                max="31"
                value={billForm.due_day}
                onChange={(e) => setBillForm({ ...billForm, due_day: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
          </div>
          <div className="finance-form-group">
            <label>Frequency</label>
            <select
              value={billForm.frequency}
              onChange={(e) => setBillForm({ ...billForm, frequency: e.target.value })}
              required
            >
              {frequencies.map(freq => (
                <option key={freq} value={freq}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="finance-form-group">
            <label>Notes (optional)</label>
            <input
              type="text"
              placeholder="Additional notes..."
              value={billForm.notes}
              onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
            />
          </div>
          <div className="finance-modal-footer">
            <button type="button" className="finance-modal-cancel" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="finance-modal-submit">
              {editingItem ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <BillPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bill={selectedBill}
        onPay={handlePayment}
        isProcessing={isProcessing}
      />

      <style>{`
        .finance-bills-view {
          width: 100%;
        }

        .finance-view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .finance-view-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .finance-add-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .finance-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.3);
        }

        .finance-add-btn-icon {
          width: 1.125rem;
          height: 1.125rem;
        }

        .finance-bills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1rem;
        }

        .finance-bill-item {
          background: var(--card-bg, #ffffff);
          border-radius: 0.75rem;
          padding: 1.25rem;
          border: 1px solid var(--border-color, #e2e8f0);
          position: relative;
          transition: all 0.2s;
        }

        .finance-bill-item:hover {
          box-shadow: var(--shadow-md);
        }

        .finance-bill-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .finance-bill-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .finance-bill-status {
          font-size: 0.75rem;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-weight: 500;
        }

        .finance-bill-status.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .finance-bill-status.inactive {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .finance-bill-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .finance-bill-detail {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .finance-bill-detail span:first-child {
          color: var(--text-secondary, #64748b);
        }

        .finance-bill-detail span:last-child {
          color: var(--text-primary, #0f172a);
          font-weight: 500;
        }

        .finance-bill-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
          border-top: 1px solid var(--border-color, #e2e8f0);
          padding-top: 0.75rem;
        }

        .finance-action-btn {
          padding: 0.4rem;
          background: none;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .finance-action-btn.pay:hover {
          background: rgba(16, 185, 129, 0.1);
        }

        .finance-action-btn.pay:hover .finance-action-icon {
          color: #10b981;
        }

        .finance-action-btn.transactions:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        .finance-action-btn.transactions:hover .finance-action-icon {
          color: #3b82f6;
        }

        .finance-action-btn.edit:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        .finance-action-btn.delete:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .finance-action-icon {
          width: 1rem;
          height: 1rem;
          color: var(--text-secondary, #64748b);
        }

        .finance-action-btn.edit:hover .finance-action-icon {
          color: #3b82f6;
        }

        .finance-action-btn.delete:hover .finance-action-icon {
          color: #ef4444;
        }

        .finance-placeholder {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary, #64748b);
        }

        .finance-loading {
          text-align: center;
          padding: 1rem;
          color: var(--text-secondary, #64748b);
        }

        .finance-form-group {
          margin-bottom: 1rem;
        }

        .finance-form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary, #0f172a);
          margin-bottom: 0.25rem;
        }

        .finance-form-group input,
        .finance-form-group select {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-primary, #0f172a);
          background: var(--bg-primary, #f8fafc);
          transition: border-color 0.2s;
        }

        .finance-form-group input:focus,
        .finance-form-group select:focus {
          outline: none;
          border-color: var(--gradient-start, #667eea);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .finance-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .finance-modal-footer {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color, #e2e8f0);
          margin-top: 1rem;
        }

        .finance-modal-cancel {
          padding: 0.5rem 1.25rem;
          background: var(--bg-primary, #f1f5f9);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary, #0f172a);
          cursor: pointer;
          transition: background 0.2s;
        }

        .finance-modal-cancel:hover {
          background: var(--hover-bg, #e2e8f0);
        }

        .finance-modal-submit {
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

        .finance-modal-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.3);
        }

        .finance-modal-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .finance-view-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .finance-bills-grid {
            grid-template-columns: 1fr;
          }

          .finance-form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Bills;