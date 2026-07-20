// src/components/PersonalTools/Budget.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PlusCircleIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import Modal from './Modal';
import { ChartContainer, BudgetBarChart, CHART_COLORS } from './Chart';

const Budget = ({ finance }) => {
  const {
    loading,
    setBudget,
    deleteBudget,
    getBudgetStatus,
    loadAllData,
  } = finance;

  const [showModal, setShowModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category: '', amount: '' });

  const expenseCategories = [
    'Food', 'Housing', 'Transportation', 'Utilities',
    'Healthcare', 'Entertainment', 'Shopping', 'Education',
    'Insurance', 'Debt Payment', 'Savings', 'Investments',
    'Gifts & Donations', 'Personal Care', 'Subscriptions'
  ];

  const budgetStatus = getBudgetStatus();

  // Prepare chart data - limit to top categories for cleaner display
  const chartData = budgetStatus
    .map(budget => ({
      category: budget.category.length > 12 ? budget.category.substring(0, 10) + '...' : budget.category,
      budget: budget.amount,
      actual: budget.spent,
    }))
    .slice(0, 8); // Show top 8 categories

  const openAdd = () => {
    setBudgetForm({ category: '', amount: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const toastId = toast.loading('Setting budget...');
    const result = await setBudget(
      budgetForm.category,
      parseFloat(budgetForm.amount)
    );
    toast.dismiss(toastId);

    if (result.success) {
      toast.success(`Budget for ${budgetForm.category} set successfully! ✅`);
      setShowModal(false);
      loadAllData();
    } else {
      toast.error(result.error || 'Failed to set budget ❌');
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`Are you sure you want to delete the budget for ${category}?`)) return;
    
    const toastId = toast.loading('Deleting budget...');
    const result = await deleteBudget(category);
    toast.dismiss(toastId);

    if (result.success) {
      toast.success(`Budget for ${category} deleted! 🗑️`);
      loadAllData();
    } else {
      toast.error(result.error || 'Failed to delete budget ❌');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="finance-budget-view"
    >
      <div className="finance-view-header">
        <h2>Budget Overview</h2>
        <button className="finance-add-btn" onClick={openAdd}>
          <PlusCircleIcon className="finance-add-btn-icon" />
          Set Budget
        </button>
      </div>

      {/* Budget vs Actual Chart - Smaller */}
      {budgetStatus.length > 0 && (
        <div className="finance-budget-chart">
          <ChartContainer title="Budget vs Actual Spending">
            <div className="budget-chart-wrapper">
              <BudgetBarChart data={chartData} height={200} />
            </div>
          </ChartContainer>
        </div>
      )}

      {/* Budget Summary Cards */}
      <div className="finance-budget-grid">
        {budgetStatus.map((budget) => (
          <div key={budget.category} className="finance-budget-item">
            <div className="finance-budget-header">
              <span className="finance-budget-category">{budget.category}</span>
              <span className="finance-budget-amounts">
                ₱{budget.spent.toFixed(0)} / ₱{budget.amount.toFixed(0)}
              </span>
            </div>
            <div className="finance-progress-bar">
              <div
                className={`finance-progress-fill ${budget.status}`}
                style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
              />
            </div>
            <div className="finance-budget-status">
              <span className="finance-budget-remaining">
                {budget.remaining >= 0
                  ? `₱${budget.remaining.toFixed(0)} remaining`
                  : `₱${Math.abs(budget.remaining).toFixed(0)} over`
                }
              </span>
              <span className="finance-budget-percent">{budget.percentUsed.toFixed(0)}% used</span>
              {budget.status === 'good' && <CheckCircleIcon className="finance-budget-status-icon good" />}
              {budget.status === 'warning' && <ExclamationCircleIcon className="finance-budget-status-icon warning" />}
              {budget.status === 'danger' && <ExclamationCircleIcon className="finance-budget-status-icon danger" />}
            </div>
            <button className="finance-budget-delete" onClick={() => handleDelete(budget.category)}>
              <TrashIcon className="finance-action-icon" />
            </button>
          </div>
        ))}
      </div>

      {budgetStatus.length === 0 && (
        <div className="finance-placeholder">
          <p>No budgets set. Click "Set Budget" to get started.</p>
        </div>
      )}

      {loading && <div className="finance-loading">Loading...</div>}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Set Budget"
      >
        <form onSubmit={handleSubmit}>
          <div className="finance-form-group">
            <label>Category</label>
            <select
              value={budgetForm.category}
              onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
              required
            >
              <option value="">Select category</option>
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="finance-form-group">
            <label>Monthly Budget (₱)</label>
            <input
              type="number"
              placeholder="0.00"
              value={budgetForm.amount}
              onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
              required
              min="0"
              step="0.01"
            />
          </div>
          <div className="finance-modal-footer">
            <button type="button" className="finance-modal-cancel" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="finance-modal-submit">
              Save
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .finance-budget-view {
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

        .finance-budget-chart {
          margin-bottom: 1.5rem;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .budget-chart-wrapper {
          height: 200px;
          width: 100%;
        }

        .finance-budget-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .finance-budget-item {
          background: var(--card-bg, #ffffff);
          border-radius: 0.75rem;
          padding: 1.25rem;
          border: 1px solid var(--border-color, #e2e8f0);
          position: relative;
        }

        .finance-budget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .finance-budget-category {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .finance-budget-amounts {
          font-size: 0.875rem;
          color: var(--text-secondary, #64748b);
        }

        .finance-progress-bar {
          width: 100%;
          height: 8px;
          background: var(--bg-primary, #f1f5f9);
          border-radius: 4px;
          overflow: hidden;
        }

        .finance-progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.6s ease;
        }

        .finance-progress-fill.good {
          background: #10b981;
        }

        .finance-progress-fill.warning {
          background: #f59e0b;
        }

        .finance-progress-fill.danger {
          background: #ef4444;
        }

        .finance-budget-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
          font-size: 0.75rem;
        }

        .finance-budget-remaining {
          color: var(--text-secondary, #64748b);
        }

        .finance-budget-percent {
          font-weight: 500;
        }

        .finance-budget-status-icon {
          width: 1rem;
          height: 1rem;
        }

        .finance-budget-status-icon.good {
          color: #10b981;
        }

        .finance-budget-status-icon.warning {
          color: #f59e0b;
        }

        .finance-budget-status-icon.danger {
          color: #ef4444;
        }

        .finance-budget-delete {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.375rem;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .finance-budget-item:hover .finance-budget-delete {
          opacity: 1;
        }

        .finance-budget-delete:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .finance-action-icon {
          width: 1rem;
          height: 1rem;
          color: var(--text-secondary, #64748b);
        }

        .finance-budget-delete:hover .finance-action-icon {
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

        .finance-modal-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.3);
        }

        @media (max-width: 768px) {
          .finance-view-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .finance-budget-grid {
            grid-template-columns: 1fr;
          }

          .finance-budget-chart {
            max-width: 100%;
          }

          .budget-chart-wrapper {
            height: 180px;
          }
        }

        @media (max-width: 480px) {
          .budget-chart-wrapper {
            height: 150px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Budget;