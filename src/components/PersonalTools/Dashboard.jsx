// src/components/PersonalTools/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  CalendarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  ChartContainer,
  IncomeExpenseBarChart,
  CategoryPieChart,
  CashFlowLineChart,
  CHART_COLORS,
} from './Chart';

const Dashboard = ({ finance, setActiveView }) => {
  const {
    transactions,
    loading,
    getMonthlyIncome,
    getMonthlyExpenses,
    getNetCashFlow,
    getSavingsRate,
    getBudgetStatus,
    getUpcomingBills,
    getUpcomingBillsWithStatus,
    loadAllData,
  } = finance;

  const [billsWithStatus, setBillsWithStatus] = useState([]);
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const monthlyIncome = getMonthlyIncome();
  const monthlyExpenses = getMonthlyExpenses();
  const netCashFlow = getNetCashFlow();
  const savingsRate = getSavingsRate();
  const budgetStatus = getBudgetStatus();
  const upcomingBills = getUpcomingBills();
  const recentTransactions = transactions.slice(0, 5);

  // Load bills with status
  useEffect(() => {
    const loadBillsWithStatus = async () => {
      setIsLoadingBills(true);
      const result = await getUpcomingBillsWithStatus();
      setBillsWithStatus(result);
      setIsLoadingBills(false);
    };
    loadBillsWithStatus();
  }, [getUpcomingBillsWithStatus]);

  // Prepare chart data
  useEffect(() => {
    // Get last 6 months of data
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        key: monthKey,
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

    setChartData(monthlyData);

    // Prepare category data for pie chart (current month)
    const currentMonthTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      const now = new Date();
      return tDate.getMonth() === now.getMonth() && 
             tDate.getFullYear() === now.getFullYear() &&
             t.type === 'expense';
    });

    const categoryTotals = currentMonthTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    const pieData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Show top 8 categories

    setCategoryData(pieData);
  }, [transactions]);

  // Get bills that are overdue
  const overdueBills = billsWithStatus.filter((b) => b.isOverdue);

  // Get status icon for bill
  const getBillStatusIcon = (bill) => {
    if (bill.isPaidExact) {
      return <CheckCircleIcon className="bill-status-icon paid-exact" />;
    } else if (bill.isOverpaid) {
      return <ExclamationCircleIcon className="bill-status-icon overpaid" />;
    } else if (bill.isUnderpaid) {
      return <ExclamationCircleIcon className="bill-status-icon underpaid" />;
    } else if (bill.isOverdue) {
      return <XCircleIcon className="bill-status-icon overdue" />;
    } else {
      return <ClockIcon className="bill-status-icon upcoming" />;
    }
  };

  // Get status color for bill
  const getBillStatusColor = (bill) => {
    if (bill.isPaidExact) return '#10b981';
    if (bill.isOverpaid) return '#f59e0b';
    if (bill.isUnderpaid) return '#ef4444';
    if (bill.isOverdue) return '#ef4444';
    return '#3b82f6';
  };

  // Get status label for bill
  const getBillStatusLabel = (bill) => {
    if (bill.isPaidExact) return '✅ Paid (exact)';
    if (bill.isOverpaid) return `⚠️ Overpaid by ₱${Math.abs(bill.difference).toFixed(0)}`;
    if (bill.isUnderpaid) return `⚠️ Underpaid by ₱${bill.difference.toFixed(0)}`;
    if (bill.isOverdue) return '🔴 Overdue';
    return '🟡 Upcoming';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="finance-dashboard"
    >
      {/* Stats Cards */}
      <div className="finance-stats-grid">
        <div className="finance-stat-card">
          <div className="finance-stat-header">
            <span className="finance-stat-label">Monthly Income</span>
            <span className="finance-stat-icon income">₱</span>
          </div>
          <div className="finance-stat-value">₱{monthlyIncome.toLocaleString()}</div>
          <div className="finance-stat-change positive">
            <ArrowTrendingUpIcon className="finance-stat-trend-icon" />
            <span>This month</span>
          </div>
        </div>

        <div className="finance-stat-card">
          <div className="finance-stat-header">
            <span className="finance-stat-label">Monthly Expenses</span>
            <span className="finance-stat-icon expense">₱</span>
          </div>
          <div className="finance-stat-value">₱{monthlyExpenses.toLocaleString()}</div>
          <div className="finance-stat-change negative">
            <ArrowTrendingDownIcon className="finance-stat-trend-icon" />
            <span>This month</span>
          </div>
        </div>

        <div className="finance-stat-card">
          <div className="finance-stat-header">
            <span className="finance-stat-label">Net Cash Flow</span>
            <span className={`finance-stat-icon ${netCashFlow >= 0 ? 'income' : 'expense'}`}>₱</span>
          </div>
          <div className="finance-stat-value">₱{netCashFlow.toLocaleString()}</div>
          <div className={`finance-stat-change ${netCashFlow >= 0 ? 'positive' : 'negative'}`}>
            {netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
          </div>
        </div>

        <div className="finance-stat-card">
          <div className="finance-stat-header">
            <span className="finance-stat-label">Savings Rate</span>
            <span className="finance-stat-icon savings">%</span>
          </div>
          <div className="finance-stat-value">{savingsRate.toFixed(1)}%</div>
          <div className={`finance-stat-change ${savingsRate >= 20 ? 'positive' : 'negative'}`}>
            {savingsRate >= 20 ? 'Good' : 'Needs improvement'}
          </div>
        </div>
      </div>

      {/* Overdue Bills Alert */}
      {overdueBills.length > 0 && (
        <div className="finance-alert overdue-alert">
          <div className="finance-alert-header">
            <XCircleIcon className="finance-alert-icon" />
            <span className="finance-alert-title">Overdue Bills</span>
            <span className="finance-alert-count">{overdueBills.length}</span>
          </div>
          <div className="finance-alert-list">
            {overdueBills.slice(0, 3).map((bill) => (
              <div key={bill.id} className="finance-alert-item">
                <span>{bill.name}</span>
                <span className="finance-alert-amount">₱{bill.amount.toLocaleString()}</span>
                <span className="finance-alert-days">
                  Due {bill.dueDate.toLocaleDateString()}
                </span>
              </div>
            ))}
            {overdueBills.length > 3 && (
              <button 
                className="finance-alert-view-all"
                onClick={() => setActiveView('bills')}
              >
                + {overdueBills.length - 3} more overdue
              </button>
            )}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="finance-charts-grid">
        <ChartContainer title="Income vs Expenses">
          <IncomeExpenseBarChart data={chartData} height={280} />
        </ChartContainer>

        <ChartContainer title="Spending by Category">
          {categoryData.length > 0 ? (
            <CategoryPieChart data={categoryData} height={280} />
          ) : (
            <div className="chart-empty-state">
              <p>No expense data for this month</p>
              <p className="chart-empty-sub">Add some expenses to see the breakdown</p>
            </div>
          )}
        </ChartContainer>
      </div>

      <div className="finance-charts-grid single">
        <ChartContainer title="Cash Flow Trend">
          <CashFlowLineChart data={chartData} height={280} />
        </ChartContainer>
      </div>

      {/* Budget Progress Summary */}
      {budgetStatus.length > 0 && (
        <div className="finance-savings-rate">
          <div className="finance-savings-rate-header">
            <span>Budget Summary</span>
            <span className="finance-savings-rate-value">
              {budgetStatus.filter((b) => b.status === 'good').length} / {budgetStatus.length} on track
            </span>
          </div>
          <div className="finance-budget-summary">
            {budgetStatus.slice(0, 4).map((budget) => (
              <div key={budget.category} className="finance-budget-mini">
                <div className="finance-budget-mini-header">
                  <span>{budget.category}</span>
                  <span>₱{budget.spent.toFixed(0)} / ₱{budget.amount.toFixed(0)}</span>
                </div>
                <div className="finance-progress-bar">
                  <div
                    className={`finance-progress-fill ${budget.status}`}
                    style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bills Overview */}
      {billsWithStatus.length > 0 && (
        <div className="finance-recent-transactions">
          <div className="finance-section-header">
            <h3>Bills Overview</h3>
            <button className="finance-view-all-btn" onClick={() => setActiveView('bills')}>
              View All
            </button>
          </div>
          <div className="finance-bills-status-list">
            {billsWithStatus.slice(0, 5).map((bill) => (
              <div key={bill.id} className="finance-bill-status-item">
                <div className="finance-bill-status-info">
                  <div className="finance-bill-status-name">
                    {getBillStatusIcon(bill)}
                    <span>{bill.name}</span>
                  </div>
                  <span className="finance-bill-status-category">{bill.category}</span>
                </div>
                <div className="finance-bill-status-right">
                  <span 
                    className="finance-bill-status-label"
                    style={{ color: getBillStatusColor(bill) }}
                  >
                    {getBillStatusLabel(bill)}
                  </span>
                  <span className="finance-bill-status-amount">
                    ₱{bill.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="finance-recent-transactions">
          <div className="finance-section-header">
            <h3>Recent Transactions</h3>
            <button className="finance-view-all-btn" onClick={() => setActiveView('transactions')}>
              View All
            </button>
          </div>
          <div className="finance-transactions-list">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="finance-transaction-item">
                <div className="finance-transaction-info">
                  <div className="finance-transaction-date">{transaction.date}</div>
                  <div className="finance-transaction-details">
                    <span className="finance-transaction-description">{transaction.description}</span>
                    <span className="finance-transaction-category">{transaction.category}</span>
                  </div>
                </div>
                <div className={`finance-transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}₱{transaction.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="finance-quick-actions">
        <button className="finance-quick-action-btn primary" onClick={() => setActiveView('transactions')}>
          <PlusCircleIcon className="finance-quick-action-icon" />
          Add Transaction
        </button>
        <button className="finance-quick-action-btn secondary" onClick={() => setActiveView('budget')}>
          <PencilSquareIcon className="finance-quick-action-icon" />
          Set Budget
        </button>
        <button className="finance-quick-action-btn secondary" onClick={() => setActiveView('bills')}>
          <CalendarIcon className="finance-quick-action-icon" />
          Manage Bills
        </button>
        <button className="finance-quick-action-btn secondary" onClick={loadAllData}>
          <ArrowPathIcon className="finance-quick-action-icon" />
          Refresh
        </button>
      </div>

      {loading && <div className="finance-loading">Loading...</div>}

      <style>{`
        .finance-dashboard {
          width: 100%;
        }

        .finance-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .finance-stat-card {
          background: var(--card-bg, #ffffff);
          border-radius: 0.75rem;
          padding: 1.25rem;
          border: 1px solid var(--border-color, #e2e8f0);
          transition: all 0.2s;
        }

        .finance-stat-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .finance-stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .finance-stat-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .finance-stat-icon {
          font-size: 1rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
        }

        .finance-stat-icon.income {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .finance-stat-icon.expense {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .finance-stat-icon.savings {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .finance-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          margin-bottom: 0.5rem;
        }

        .finance-stat-change {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .finance-stat-change.positive {
          color: #10b981;
        }

        .finance-stat-change.negative {
          color: #ef4444;
        }

        .finance-stat-trend-icon {
          width: 0.875rem;
          height: 0.875rem;
        }

        /* Charts Grid */
        .finance-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .finance-charts-grid.single {
          grid-template-columns: 1fr;
          max-width: 70%;
          margin-left: auto;
          margin-right: auto;
        }

        .chart-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--text-secondary, #64748b);
        }

        .chart-empty-state p {
          font-size: 0.875rem;
          margin: 0.25rem 0;
        }

        .chart-empty-sub {
          font-size: 0.75rem;
          color: var(--text-tertiary, #94a3b8);
        }

        /* Overdue Alert */
        .finance-alert {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          margin-bottom: 1.5rem;
        }

        .dark .finance-alert {
          background: #450a0a;
          border-color: #7f1d1d;
        }

        .finance-alert-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .finance-alert-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #ef4444;
        }

        .finance-alert-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #991b1b;
        }

        .dark .finance-alert-title {
          color: #fca5a5;
        }

        .finance-alert-count {
          margin-left: auto;
          background: #ef4444;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
        }

        .finance-alert-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .finance-alert-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: #991b1b;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          background: rgba(239, 68, 68, 0.05);
        }

        .dark .finance-alert-item {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.1);
        }

        .finance-alert-amount {
          font-weight: 600;
        }

        .finance-alert-days {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .finance-alert-view-all {
          background: none;
          border: none;
          color: #ef4444;
          font-size: 0.75rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          text-align: left;
        }

        .dark .finance-alert-view-all {
          color: #f87171;
        }

        .finance-alert-view-all:hover {
          text-decoration: underline;
        }

        /* Bills Status List */
        .finance-bills-status-list {
          padding: 0.5rem 0;
        }

        .finance-bill-status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.625rem 1.25rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          transition: background 0.2s;
        }

        .finance-bill-status-item:hover {
          background: var(--hover-bg, #f1f5f9);
        }

        .finance-bill-status-item:last-child {
          border-bottom: none;
        }

        .finance-bill-status-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .finance-bill-status-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary, #0f172a);
        }

        .bill-status-icon {
          width: 1rem;
          height: 1rem;
        }

        .bill-status-icon.paid-exact {
          color: #10b981;
        }

        .bill-status-icon.overpaid {
          color: #f59e0b;
        }

        .bill-status-icon.underpaid {
          color: #ef4444;
        }

        .bill-status-icon.overdue {
          color: #ef4444;
        }

        .bill-status-icon.upcoming {
          color: #3b82f6;
        }

        .finance-bill-status-category {
          font-size: 0.75rem;
          color: var(--text-secondary, #64748b);
        }

        .finance-bill-status-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .finance-bill-status-label {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .finance-bill-status-amount {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          min-width: 80px;
          text-align: right;
        }

        .finance-savings-rate {
          background: var(--card-bg, #ffffff);
          border-radius: 0.75rem;
          padding: 1.25rem;
          border: 1px solid var(--border-color, #e2e8f0);
          margin-bottom: 1.5rem;
        }

        .finance-savings-rate-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary, #64748b);
        }

        .finance-savings-rate-value {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
        }

        .finance-budget-summary {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .finance-budget-mini {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .finance-budget-mini-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: var(--text-primary, #0f172a);
        }

        .finance-progress-bar {
          width: 100%;
          height: 6px;
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

        .finance-recent-transactions {
          background: var(--card-bg, #ffffff);
          border-radius: 0.75rem;
          border: 1px solid var(--border-color, #e2e8f0);
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .finance-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .finance-section-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .finance-view-all-btn {
          background: none;
          border: none;
          color: var(--gradient-start, #667eea);
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          transition: background 0.2s;
        }

        .finance-view-all-btn:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .finance-transactions-list {
          padding: 0.5rem 0;
        }

        .finance-transaction-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          transition: background 0.2s;
        }

        .finance-transaction-item:hover {
          background: var(--hover-bg, #f1f5f9);
        }

        .finance-transaction-item:last-child {
          border-bottom: none;
        }

        .finance-transaction-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .finance-transaction-date {
          font-size: 0.75rem;
          color: var(--text-secondary, #64748b);
          min-width: 80px;
        }

        .finance-transaction-details {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .finance-transaction-description {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary, #0f172a);
        }

        .finance-transaction-category {
          font-size: 0.75rem;
          color: var(--text-secondary, #64748b);
        }

        .finance-transaction-amount {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .finance-transaction-amount.income {
          color: #10b981;
        }

        .finance-transaction-amount.expense {
          color: #ef4444;
        }

        .finance-quick-actions {
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

        .finance-quick-action-btn.primary {
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          color: white;
        }

        .finance-quick-action-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.3);
        }

        .finance-quick-action-btn.secondary {
          background: var(--bg-primary, #f1f5f9);
          color: var(--text-primary, #0f172a);
        }

        .finance-quick-action-btn.secondary:hover {
          background: var(--hover-bg, #e2e8f0);
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
          .finance-charts-grid.single {
            max-width: 85%;
          }
        }

        @media (max-width: 768px) {
          .finance-stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .finance-charts-grid {
            grid-template-columns: 1fr;
          }

          .finance-charts-grid.single {
            max-width: 100%;
          }

          .finance-bill-status-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .finance-bill-status-right {
            width: 100%;
            justify-content: space-between;
          }

          .finance-quick-actions {
            flex-direction: column;
          }

          .finance-quick-action-btn {
            justify-content: center;
          }

          .finance-transaction-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .finance-transaction-info {
            width: 100%;
          }

          .finance-alert-item {
            flex-wrap: wrap;
            gap: 0.25rem;
          }
        }

        @media (max-width: 480px) {
          .finance-stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Dashboard;