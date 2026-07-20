// src/components/PersonalTools/Reports.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import ExcelExport from './ExcelExport';
import { ChartContainer, CategoryPieChart, CHART_COLORS } from './Chart';

const Reports = ({ finance }) => {
  const {
    transactions,
    loading,
    getMonthlyIncome,
    getMonthlyExpenses,
    getSavingsRate,
    loadAllData,
  } = finance;

  const [categoryData, setCategoryData] = useState([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState([]);
  const [incomeExpenseData, setIncomeExpenseData] = useState([]);

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

  // Prepare chart data
  useEffect(() => {
    // Get last 6 months of data
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        monthNum: d.getMonth() + 1,
      });
    }

    // Group transactions by month
    const monthlyData = months.map((m) => {
      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === m.year && tDate.getMonth() + 1 === m.monthNum;
      });

      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: m.month,
        income,
        expenses,
        cashFlow: income - expenses,
      };
    });

    setMonthlyTrendData(monthlyData);

    // Income vs Expenses data for the year
    const currentYear = new Date().getFullYear();
    const yearMonths = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(currentYear, i, 1);
      yearMonths.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year: currentYear,
        monthNum: i + 1,
      });
    }

    const yearData = yearMonths.map((m) => {
      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === m.year && tDate.getMonth() + 1 === m.monthNum;
      });

      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: m.month,
        income,
        expenses,
      };
    });

    setIncomeExpenseData(yearData);

    // Category data for pie chart
    const pieData = Object.entries(categorySpending)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    setCategoryData(pieData);
  }, [transactions]);

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

      {/* Summary Cards */}
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

      {/* Charts Section */}
      <div className="finance-report-charts">
        <div className="finance-chart-row">
          <ChartContainer title="Income vs Expenses (Year)">
            <div className="chart-wrapper">
              {incomeExpenseData.some(d => d.income > 0 || d.expenses > 0) ? (
                <div className="chart-bar-container">
                  {incomeExpenseData.map((item, index) => (
                    <div key={index} className="chart-bar-group">
                      <div className="chart-bar-label">{item.month}</div>
                      <div className="chart-bar-wrapper">
                        <div 
                          className="chart-bar income-bar"
                          style={{ 
                            height: `${Math.min((item.income / Math.max(...incomeExpenseData.map(d => d.income + d.expenses), 1)) * 100, 100)}%`,
                            background: CHART_COLORS.income
                          }}
                          title={`Income: ₱${item.income.toLocaleString()}`}
                        />
                        <div 
                          className="chart-bar expense-bar"
                          style={{ 
                            height: `${Math.min((item.expenses / Math.max(...incomeExpenseData.map(d => d.income + d.expenses), 1)) * 100, 100)}%`,
                            background: CHART_COLORS.expense
                          }}
                          title={`Expenses: ₱${item.expenses.toLocaleString()}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="chart-empty-state">
                  <p>No transaction data available</p>
                </div>
              )}
            </div>
          </ChartContainer>
        </div>

        <div className="finance-chart-row two-col">
          <ChartContainer title="Spending by Category">
            {categoryData.length > 0 ? (
              <CategoryPieChart data={categoryData} height={300} />
            ) : (
              <div className="chart-empty-state">
                <p>No expense data available</p>
              </div>
            )}
          </ChartContainer>

          <ChartContainer title="Monthly Cash Flow Trend">
            <div className="chart-wrapper">
              {monthlyTrendData.some(d => d.cashFlow !== 0) ? (
                <div className="chart-line-container">
                  {monthlyTrendData.map((item, index) => (
                    <div key={index} className="chart-line-point">
                      <div 
                        className="chart-line-bar"
                        style={{ 
                          height: `${Math.min(Math.abs(item.cashFlow) / Math.max(...monthlyTrendData.map(d => Math.abs(d.cashFlow)), 1) * 100, 100)}%`,
                          background: item.cashFlow >= 0 ? CHART_COLORS.income : CHART_COLORS.expense
                        }}
                      />
                      <div className="chart-line-label">
                        {item.month}
                      </div>
                      <div className="chart-line-value" style={{ color: item.cashFlow >= 0 ? CHART_COLORS.income : CHART_COLORS.expense }}>
                        ₱{item.cashFlow.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="chart-empty-state">
                  <p>No cash flow data available</p>
                </div>
              )}
            </div>
          </ChartContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      {sortedCategories.length > 0 && (
        <div className="finance-report-categories">
          <h3>Spending by Category (Details)</h3>
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
                <span className="finance-category-percent">
                  {((amount / monthlyExpenses) * 100).toFixed(1)}%
                </span>
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

        /* Charts Section */
        .finance-report-charts {
          margin-bottom: 1.5rem;
        }

        .finance-chart-row {
          margin-bottom: 1.5rem;
        }

        .finance-chart-row.two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .chart-wrapper {
          height: 280px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 1rem 0;
          width: 100%;
        }

        /* Bar Chart */
        .chart-bar-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          width: 100%;
          height: 100%;
          gap: 0.5rem;
        }

        .chart-bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          flex: 1;
          min-width: 30px;
        }

        .chart-bar-label {
          font-size: 0.7rem;
          color: var(--text-secondary, #64748b);
          margin-top: 0.5rem;
          font-weight: 500;
        }

        .chart-bar-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 90%;
          width: 100%;
          justify-content: center;
        }

        .chart-bar {
          width: 18px;
          border-radius: 3px 3px 0 0;
          min-height: 4px;
          transition: height 0.6s ease;
          position: relative;
        }

        .chart-bar.income-bar {
          background: ${CHART_COLORS.income};
        }

        .chart-bar.expense-bar {
          background: ${CHART_COLORS.expense};
        }

        .chart-bar:hover {
          opacity: 0.8;
        }

        /* Line Chart */
        .chart-line-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          width: 100%;
          height: 100%;
          gap: 0.5rem;
        }

        .chart-line-point {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          flex: 1;
        }

        .chart-line-bar {
          width: 6px;
          border-radius: 3px 3px 0 0;
          min-height: 2px;
          transition: height 0.6s ease;
        }

        .chart-line-label {
          font-size: 0.7rem;
          color: var(--text-secondary, #64748b);
          margin-top: 0.5rem;
        }

        .chart-line-value {
          font-size: 0.6rem;
          font-weight: 600;
          margin-top: 0.25rem;
        }

        .chart-empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          color: var(--text-secondary, #64748b);
          font-size: 0.875rem;
        }

        /* Category List */
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

        .finance-category-percent {
          min-width: 60px;
          text-align: right;
          font-size: 0.75rem;
          color: var(--text-secondary, #64748b);
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

        @media (max-width: 1024px) {
          .chart-bar {
            width: 14px;
          }
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

          .finance-chart-row.two-col {
            grid-template-columns: 1fr;
          }

          .finance-category-row {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .finance-category-row span:first-child {
            min-width: 80px;
          }

          .chart-bar {
            width: 12px;
          }

          .chart-bar-label {
            font-size: 0.6rem;
          }
        }

        @media (max-width: 480px) {
          .finance-report-summary {
            grid-template-columns: 1fr;
          }

          .chart-bar {
            width: 10px;
          }

          .chart-line-value {
            font-size: 0.5rem;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Reports;