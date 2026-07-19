// src/components/PersonalTools/Reports.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import ExcelExport from './ExcelExport';

const Reports = ({ finance }) => {
  const {
    transactions,
    loading,
    getMonthlyIncome,
    getMonthlyExpenses,
    getSavingsRate,
    loadAllData,
  } = finance;

  const monthlyIncome = getMonthlyIncome();
  const monthlyExpenses = getMonthlyExpenses();
  const savingsRate = getSavingsRate();

  // Group expenses by category
  const categorySpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const sortedCategories = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1]);

  // Generate random colors for categories
  const getColor = (index) => {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#22d3ee'
    ];
    return colors[index % colors.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="finance-reports-view"
    >
      <div className="finance-view-header">
        <h2>Financial Reports</h2>
        <div className="finance-header-actions">
          <button className="finance-add-btn" onClick={loadAllData}>
            <ArrowPathIcon className="finance-add-btn-icon" />
            Refresh Data
          </button>
          <ExcelExport finance={finance} />
        </div>
      </div>

      <div className="finance-report-summary">
        <div className="finance-report-card">
          <h3>Income</h3>
          <p className="finance-report-value">₱{monthlyIncome.toLocaleString()}</p>
        </div>
        <div className="finance-report-card">
          <h3>Expenses</h3>
          <p className="finance-report-value">₱{monthlyExpenses.toLocaleString()}</p>
        </div>
        <div className="finance-report-card">
          <h3>Savings Rate</h3>
          <p className="finance-report-value">{savingsRate.toFixed(1)}%</p>
        </div>
        <div className="finance-report-card">
          <h3>Total Transactions</h3>
          <p className="finance-report-value">{transactions.length}</p>
        </div>
      </div>

      {sortedCategories.length > 0 && (
        <div className="finance-report-categories">
          <h3>Spending by Category</h3>
          <div className="finance-category-list">
            {sortedCategories.map(([category, amount], index) => (
              <div key={category} className="finance-category-row">
                <span>{category}</span>
                <div className="finance-category-bar-wrapper">
                  <div
                    className="finance-category-bar"
                    style={{
                      width: `${Math.min((amount / monthlyExpenses) * 100, 100)}%`,
                      background: getColor(index)
                    }}
                  />
                </div>
                <span>₱{amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="finance-report-actions">
        <ExcelExport finance={finance} />
      </div>

      {loading && <div className="finance-loading">Loading...</div>}

      <style>{`
        .finance-reports-view {
          width: 100%;
        }

        .finance-view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .finance-view-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .finance-header-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
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

        .finance-report-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .finance-report-card {
          background: var(--card-bg, #ffffff);
          border-radius: 0.75rem;
          padding: 1.25rem;
          border: 1px solid var(--border-color, #e2e8f0);
          text-align: center;
        }

        .finance-report-card h3 {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary, #64748b);
          margin-bottom: 0.5rem;
        }

        .finance-report-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
        }

        .finance-report-categories {
          background: var(--card-bg, #ffffff);
          border-radius: 0.75rem;
          padding: 1.25rem;
          border: 1px solid var(--border-color, #e2e8f0);
          margin-bottom: 1.5rem;
        }

        .finance-report-categories h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin-bottom: 1rem;
        }

        .finance-category-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .finance-category-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
        }

        .finance-category-row span:first-child {
          min-width: 120px;
          font-weight: 500;
          color: var(--text-primary, #0f172a);
        }

        .finance-category-row span:last-child {
          min-width: 100px;
          text-align: right;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .finance-category-bar-wrapper {
          flex: 1;
          height: 8px;
          background: var(--bg-primary, #f1f5f9);
          border-radius: 4px;
          overflow: hidden;
        }

        .finance-category-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.6s ease;
        }

        .finance-report-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .finance-quick-action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .finance-quick-action-btn.excel-btn {
          background: #217346;
          color: white;
        }

        .finance-quick-action-btn.excel-btn:hover {
          background: #1a5c38;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(33, 115, 70, 0.3);
        }

        .finance-quick-action-icon {
          width: 1.125rem;
          height: 1.125rem;
        }

        .finance-loading {
          text-align: center;
          padding: 1rem;
          color: var(--text-secondary, #64748b);
        }

        @media (max-width: 768px) {
          .finance-view-header {
            flex-direction: column;
            align-items: stretch;
          }

          .finance-header-actions {
            flex-direction: column;
            width: 100%;
          }

          .finance-header-actions button {
            width: 100%;
            justify-content: center;
          }

          .finance-report-summary {
            grid-template-columns: 1fr 1fr;
          }

          .finance-category-row {
            flex-wrap: wrap;
          }

          .finance-category-row span:first-child {
            min-width: 80px;
          }
        }

        @media (max-width: 480px) {
          .finance-report-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Reports;