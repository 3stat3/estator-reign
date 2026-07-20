// src/components/PersonalTools/Chart.jsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';

// Colors for charts
export const CHART_COLORS = {
  income: '#10b981',
  expense: '#ef4444',
  savings: '#3b82f6',
  budget: '#8b5cf6',
  categories: [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#22d3ee',
    '#a855f7', '#34d399', '#fbbf24', '#f87171', '#c084fc',
    '#f472b6', '#2dd4bf', '#fb923c', '#818cf8', '#67e8f9'
  ]
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label, currency = '₱' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="chart-tooltip-item" style={{ color: entry.color }}>
            {entry.name}: {currency}{entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Bar Chart Component
export const IncomeExpenseBarChart = ({ data, height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e2e8f0)" />
        <XAxis dataKey="month" stroke="var(--text-secondary, #64748b)" />
        <YAxis stroke="var(--text-secondary, #64748b)" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="income" fill={CHART_COLORS.income} name="Income" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" fill={CHART_COLORS.expense} name="Expenses" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Pie Chart Component
export const CategoryPieChart = ({ data, height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS.categories[index % CHART_COLORS.categories.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Line Chart Component
export const CashFlowLineChart = ({ data, height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e2e8f0)" />
        <XAxis dataKey="month" stroke="var(--text-secondary, #64748b)" />
        <YAxis stroke="var(--text-secondary, #64748b)" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="cashFlow" stroke={CHART_COLORS.savings} name="Cash Flow" strokeWidth={2} />
        <Area type="monotone" dataKey="cashFlow" fill={CHART_COLORS.savings} fillOpacity={0.1} />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Budget vs Actual Chart
export const BudgetBarChart = ({ data, height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e2e8f0)" />
        <XAxis type="number" stroke="var(--text-secondary, #64748b)" />
        <YAxis dataKey="category" type="category" stroke="var(--text-secondary, #64748b)" width={100} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="budget" fill={CHART_COLORS.budget} name="Budget" radius={[0, 4, 4, 0]} />
        <Bar dataKey="actual" fill={CHART_COLORS.expense} name="Actual" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Combo Chart (Income + Expenses + Cash Flow)
export const ComboChart = ({ data, height = 350 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e2e8f0)" />
        <XAxis dataKey="month" stroke="var(--text-secondary, #64748b)" />
        <YAxis stroke="var(--text-secondary, #64748b)" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="income" barSize={20} fill={CHART_COLORS.income} name="Income" />
        <Bar dataKey="expenses" barSize={20} fill={CHART_COLORS.expense} name="Expenses" />
        <Line type="monotone" dataKey="cashFlow" stroke={CHART_COLORS.savings} name="Cash Flow" strokeWidth={3} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Chart Container with title
export const ChartContainer = ({ title, children, className = '' }) => {
  return (
    <div className={`chart-container ${className}`}>
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="chart-content">{children}</div>
      <style>{`
        .chart-container {
          background: var(--card-bg, #ffffff);
          border-radius: 0.75rem;
          padding: 1.25rem;
          border: 1px solid var(--border-color, #e2e8f0);
          height: 100%;
        }
        
        .chart-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin-bottom: 1rem;
        }
        
        .chart-content {
          width: 100%;
          height: 100%;
        }
        
        .chart-tooltip {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .chart-tooltip-label {
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
        }
        
        .chart-tooltip-item {
          font-size: 0.8125rem;
          margin: 0.125rem 0;
        }
        
        @media (max-width: 768px) {
          .chart-container {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};