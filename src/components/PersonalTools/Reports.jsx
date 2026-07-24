// src/components/PersonalTools/Reports.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  BanknotesIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { ChartContainer, CategoryPieChart, CHART_COLORS } from './Chart';

const Reports = ({ finance }) => {
  const {
    transactions,
    budgets,
    bills,
    loans,
    selectedMonth,
    loading,
    getMonthlyIncome,
    getMonthlyExpenses,
    getNetCashFlow,
    getSavingsRate,
    getBudgetStatus,
    loadAllData,
  } = finance;

  const [categoryData, setCategoryData] = useState([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState([]);
  const [incomeExpenseData, setIncomeExpenseData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const monthlyIncome = getMonthlyIncome();
  const monthlyExpenses = getMonthlyExpenses();
  const netCashFlow = getNetCashFlow();
  const savingsRate = getSavingsRate();
  const budgetStatus = getBudgetStatus();

  // Loan calculations
  const totalLoanAmount = loans.reduce((sum, l) => sum + l.total_amount, 0);
  const totalPaidLoans = loans.reduce((sum, l) => sum + (l.total_paid || 0), 0);
  const totalRemainingLoans = totalLoanAmount - totalPaidLoans;
  const activeLoans = loans.filter(l => l.status === 'active').length;
  const paidLoans = loans.filter(l => l.status === 'paid').length;

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

  // Get yearly summary data
  const getYearlySummary = (year) => {
    const yearTxs = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === year;
    });
    const income = yearTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = yearTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, netFlow: income - expenses, total: yearTxs.length };
  };

  const currentYearSummary = getYearlySummary(selectedYear);
  const previousYearSummary = getYearlySummary(selectedYear - 1);

  // Get monthly data for a specific year
  const getMonthlyDataForYear = (year) => {
    const months = [];
    for (let m = 0; m < 12; m++) {
      const monthTxs = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === m;
      });
      const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      months.push({
        month: new Date(year, m).toLocaleString('default', { month: 'short' }),
        income,
        expenses,
        netFlow: income - expenses,
      });
    }
    return months;
  };

  const yearlyData = getMonthlyDataForYear(selectedYear);

  // ==================== EXPORT FUNCTIONS ====================

  // 1. Export Monthly Report (Premium)
  const exportMonthlyReport = async () => {
    try {
      const toastId = toast.loading('Generating premium Excel report...');

      const monthLabel = selectedMonth.toLocaleString('default', { 
        month: 'long', 
        year: 'numeric' 
      });

      const now = new Date();
      const generatedDate = now.toLocaleString('default', { 
        month: 'long', 
        day: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true 
      });

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Personal Finance Tracker';
      workbook.created = new Date();

      const COLORS = {
        primary: '667eea',
        success: '10b981',
        danger: 'ef4444',
        warning: 'f59e0b',
        info: '3b82f6',
        white: 'ffffff',
        lightBg: 'f8fafc',
        border: 'e2e8f0',
        mediumText: '64748b',
        lightText: '94a3b8',
      };

      // ===== SHEET 1: SUMMARY =====
      const summarySheet = workbook.addWorksheet('Summary', {
        properties: { tabColor: { argb: COLORS.primary } }
      });

      summarySheet.getColumn(1).width = 5;
      summarySheet.getColumn(2).width = 30;
      summarySheet.getColumn(3).width = 20;
      summarySheet.getColumn(4).width = 20;
      summarySheet.getColumn(5).width = 15;

      // Header
      const headerRow1 = summarySheet.getRow(2);
      headerRow1.getCell(2).value = '💰 PERSONAL FINANCE TRACKER';
      headerRow1.getCell(2).font = { name: 'Arial', size: 22, bold: true, color: { argb: COLORS.primary } };
      headerRow1.height = 35;
      summarySheet.mergeCells(`B${headerRow1.number}:E${headerRow1.number}`);

      const headerRow2 = summarySheet.getRow(3);
      headerRow2.getCell(2).value = 'Professional Financial Report';
      headerRow2.getCell(2).font = { name: 'Arial', size: 14, color: { argb: COLORS.mediumText } };
      summarySheet.mergeCells(`B${headerRow2.number}:E${headerRow2.number}`);

      summarySheet.getRow(4).height = 10;

      // Report Info
      const infoRow1 = summarySheet.getRow(6);
      infoRow1.getCell(2).value = 'Report Period:';
      infoRow1.getCell(2).font = { name: 'Arial', size: 11, bold: true };
      infoRow1.getCell(3).value = monthLabel;
      infoRow1.getCell(3).font = { name: 'Arial', size: 11, color: { argb: COLORS.primary } };
      summarySheet.mergeCells(`B${infoRow1.number}:C${infoRow1.number}`);

      const infoRow2 = summarySheet.getRow(7);
      infoRow2.getCell(2).value = 'Generated:';
      infoRow2.getCell(2).font = { name: 'Arial', size: 11, bold: true };
      infoRow2.getCell(3).value = generatedDate;
      infoRow2.getCell(3).font = { name: 'Arial', size: 11 };

      summarySheet.getRow(9).height = 15;

      // KPI Headers
      const kpiHeader = summarySheet.getRow(11);
      kpiHeader.getCell(2).value = '📊 KEY PERFORMANCE INDICATORS';
      kpiHeader.getCell(2).font = { name: 'Arial', size: 14, bold: true, color: { argb: COLORS.primary } };
      summarySheet.mergeCells(`B${kpiHeader.number}:E${kpiHeader.number}`);

      const kpiHeaderRow = summarySheet.getRow(13);
      const kpiHeaders = ['Metric', 'Value', 'Status', 'Change'];
      const kpiHeaderCells = ['B', 'C', 'D', 'E'];
      kpiHeaders.forEach((header, index) => {
        const cell = kpiHeaderRow.getCell(kpiHeaderCells[index]);
        cell.value = header;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: COLORS.white } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // KPI Data
      const kpiData = [
        ['Monthly Income', monthlyIncome, '↑ Income', '+5%'],
        ['Monthly Expenses', monthlyExpenses, '↓ Expense', '-3%'],
        ['Net Cash Flow', netCashFlow, netCashFlow >= 0 ? '✅ Surplus' : '⚠️ Deficit', ''],
        ['Savings Rate', `${savingsRate.toFixed(1)}%`, savingsRate >= 20 ? '✅ Good' : '⚠️ Needs Improvement', ''],
        ['Total Transactions', transactions.length, '', ''],
        ['Active Bills', bills.length, '', ''],
        ['Total Loans', loans.length, '', ''],
      ];

      kpiData.forEach((row, index) => {
        const rowNum = 14 + index;
        const dataRow = summarySheet.getRow(rowNum);
        
        dataRow.getCell('B').value = row[0];
        dataRow.getCell('B').font = { name: 'Arial', size: 11 };
        
        const valueCell = dataRow.getCell('C');
        if (typeof row[1] === 'number') {
          valueCell.value = row[1];
          valueCell.numFmt = '#,##0.00';
        } else {
          valueCell.value = row[1];
        }
        valueCell.font = { name: 'Arial', size: 11, bold: true };
        valueCell.alignment = { horizontal: 'right' };
        
        dataRow.getCell('D').value = row[2];
        dataRow.getCell('D').font = { name: 'Arial', size: 10 };
        dataRow.getCell('D').alignment = { horizontal: 'center' };
        
        dataRow.getCell('E').value = row[3];
        dataRow.getCell('E').font = { name: 'Arial', size: 10 };
        dataRow.getCell('E').alignment = { horizontal: 'center' };
        
        ['B', 'C', 'D', 'E'].forEach(col => {
          const cell = dataRow.getCell(col);
          cell.border = {
            bottom: { style: 'thin', color: { argb: COLORS.border } },
            left: { style: 'thin', color: { argb: COLORS.border } },
            right: { style: 'thin', color: { argb: COLORS.border } }
          };
          if (index % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBg } };
          }
        });
      });

      // ===== SHEET 2: TRANSACTIONS =====
      const txSheet = workbook.addWorksheet('Transactions', {
        properties: { tabColor: { argb: COLORS.info } }
      });

      txSheet.getColumn(1).width = 15;
      txSheet.getColumn(2).width = 30;
      txSheet.getColumn(3).width = 20;
      txSheet.getColumn(4).width = 12;
      txSheet.getColumn(5).width = 15;
      txSheet.getColumn(6).width = 25;

      const txHeader = txSheet.getRow(1);
      txHeader.getCell(1).value = '📝 TRANSACTION HISTORY';
      txHeader.getCell(1).font = { name: 'Arial', size: 18, bold: true, color: { argb: COLORS.primary } };
      txSheet.mergeCells(`A${txHeader.number}:F${txHeader.number}`);
      txHeader.height = 30;

      const txHeaders = ['Date', 'Description', 'Category', 'Type', 'Amount (₱)', 'Notes'];
      const txHeaderRow = txSheet.getRow(3);
      txHeaders.forEach((header, index) => {
        const cell = txHeaderRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: COLORS.white } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.info } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      transactions.forEach((tx, index) => {
        const rowNum = 4 + index;
        const row = txSheet.getRow(rowNum);
        
        row.getCell(1).value = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        row.getCell(1).font = { name: 'Arial', size: 10 };
        row.getCell(2).value = tx.description;
        row.getCell(2).font = { name: 'Arial', size: 10 };
        row.getCell(3).value = tx.category;
        row.getCell(3).font = { name: 'Arial', size: 10 };
        row.getCell(4).value = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
        row.getCell(4).font = { name: 'Arial', size: 10, bold: true, color: { argb: tx.type === 'income' ? COLORS.success : COLORS.danger } };
        row.getCell(4).alignment = { horizontal: 'center' };
        row.getCell(5).value = tx.amount;
        row.getCell(5).numFmt = '#,##0.00';
        row.getCell(5).font = { name: 'Arial', size: 10, bold: true, color: { argb: tx.type === 'income' ? COLORS.success : COLORS.danger } };
        row.getCell(5).alignment = { horizontal: 'right' };
        row.getCell(6).value = tx.notes || '';
        row.getCell(6).font = { name: 'Arial', size: 10 };
        
        ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
          const cell = row.getCell(col);
          cell.border = {
            bottom: { style: 'thin', color: { argb: COLORS.border } },
            left: { style: 'thin', color: { argb: COLORS.border } },
            right: { style: 'thin', color: { argb: COLORS.border } }
          };
          if (index % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBg } };
          }
        });
      });

      // ===== SHEET 3: BUDGETS =====
      const budgetSheet = workbook.addWorksheet('Budgets', {
        properties: { tabColor: { argb: COLORS.warning } }
      });

      budgetSheet.getColumn(1).width = 20;
      budgetSheet.getColumn(2).width = 18;
      budgetSheet.getColumn(3).width = 18;
      budgetSheet.getColumn(4).width = 18;
      budgetSheet.getColumn(5).width = 12;
      budgetSheet.getColumn(6).width = 15;
      budgetSheet.getColumn(7).width = 30;

      const bHeader = budgetSheet.getRow(1);
      bHeader.getCell(1).value = '💰 BUDGET TRACKING DETAILS';
      bHeader.getCell(1).font = { name: 'Arial', size: 18, bold: true, color: { argb: COLORS.primary } };
      budgetSheet.mergeCells(`A${bHeader.number}:G${bHeader.number}`);
      bHeader.height = 30;

      const bHeaders = ['Category', 'Monthly Budget', 'Actual Spent', 'Remaining', 'Used %', 'Status', 'Recommendation'];
      const bHeaderRow = budgetSheet.getRow(3);
      bHeaders.forEach((header, index) => {
        const cell = bHeaderRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLORS.white } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.warning } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      budgetStatus.forEach((budget, index) => {
        const rowNum = 4 + index;
        const row = budgetSheet.getRow(rowNum);
        
        let recommendation = '';
        if (budget.status === 'good') recommendation = 'Keep it up! 🎯';
        else if (budget.status === 'warning') recommendation = 'Consider reducing spending ⚠️';
        else recommendation = 'Review and adjust budget immediately 🚨';

        row.getCell(1).value = budget.category;
        row.getCell(2).value = budget.amount;
        row.getCell(2).numFmt = '#,##0.00';
        row.getCell(3).value = budget.spent;
        row.getCell(3).numFmt = '#,##0.00';
        row.getCell(4).value = budget.remaining;
        row.getCell(4).numFmt = '#,##0.00';
        row.getCell(5).value = `${budget.percentUsed.toFixed(0)}%`;
        row.getCell(5).alignment = { horizontal: 'center' };
        row.getCell(6).value = budget.status.charAt(0).toUpperCase() + budget.status.slice(1);
        row.getCell(6).alignment = { horizontal: 'center' };
        row.getCell(7).value = recommendation;

        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
          const cell = row.getCell(col);
          cell.font = { name: 'Arial', size: 10 };
          cell.border = {
            bottom: { style: 'thin', color: { argb: COLORS.border } },
            left: { style: 'thin', color: { argb: COLORS.border } },
            right: { style: 'thin', color: { argb: COLORS.border } }
          };
          if (index % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBg } };
          }
        });
      });

      // ===== SHEET 4: BILLS =====
      const billsSheet = workbook.addWorksheet('Bills', {
        properties: { tabColor: { argb: COLORS.success } }
      });

      billsSheet.getColumn(1).width = 25;
      billsSheet.getColumn(2).width = 20;
      billsSheet.getColumn(3).width = 15;
      billsSheet.getColumn(4).width = 12;
      billsSheet.getColumn(5).width = 12;
      billsSheet.getColumn(6).width = 15;
      billsSheet.getColumn(7).width = 15;

      const billsHeader = billsSheet.getRow(1);
      billsHeader.getCell(1).value = '📅 BILLS TRACKER';
      billsHeader.getCell(1).font = { name: 'Arial', size: 18, bold: true, color: { argb: COLORS.primary } };
      billsSheet.mergeCells(`A${billsHeader.number}:G${billsHeader.number}`);
      billsHeader.height = 30;

      const billsHeaders = ['Bill Name', 'Category', 'Amount (₱)', 'Due Day', 'Frequency', 'Status', 'Next Due'];
      const billsHeaderRow = billsSheet.getRow(3);
      billsHeaders.forEach((header, index) => {
        const cell = billsHeaderRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLORS.white } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.success } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      const today = new Date();
      bills.forEach((bill, index) => {
        const rowNum = 4 + index;
        const row = billsSheet.getRow(rowNum);
        
        let nextDue = new Date(today.getFullYear(), today.getMonth(), bill.due_day);
        if (nextDue < today) {
          nextDue = new Date(today.getFullYear(), today.getMonth() + 1, bill.due_day);
        }

        row.getCell(1).value = bill.name;
        row.getCell(2).value = bill.category;
        row.getCell(3).value = bill.amount;
        row.getCell(3).numFmt = '#,##0.00';
        row.getCell(3).alignment = { horizontal: 'right' };
        row.getCell(4).value = `Day ${bill.due_day}`;
        row.getCell(4).alignment = { horizontal: 'center' };
        row.getCell(5).value = bill.frequency.charAt(0).toUpperCase() + bill.frequency.slice(1);
        row.getCell(5).alignment = { horizontal: 'center' };
        row.getCell(6).value = bill.active ? '✅ Active' : '❌ Inactive';
        row.getCell(6).alignment = { horizontal: 'center' };
        row.getCell(7).value = nextDue.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        row.getCell(7).alignment = { horizontal: 'center' };

        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
          const cell = row.getCell(col);
          cell.font = { name: 'Arial', size: 10 };
          cell.border = {
            bottom: { style: 'thin', color: { argb: COLORS.border } },
            left: { style: 'thin', color: { argb: COLORS.border } },
            right: { style: 'thin', color: { argb: COLORS.border } }
          };
          if (index % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBg } };
          }
        });
      });

      // ===== SHEET 5: LOANS =====
      if (loans.length > 0) {
        const loansSheet = workbook.addWorksheet('Loans', {
          properties: { tabColor: { argb: '8b5cf6' } }
        });

        loansSheet.getColumn(1).width = 25;
        loansSheet.getColumn(2).width = 20;
        loansSheet.getColumn(3).width = 18;
        loansSheet.getColumn(4).width = 18;
        loansSheet.getColumn(5).width = 18;
        loansSheet.getColumn(6).width = 15;
        loansSheet.getColumn(7).width = 15;
        loansSheet.getColumn(8).width = 12;

        const lHeader = loansSheet.getRow(1);
        lHeader.getCell(1).value = '🏦 LOANS TRACKER';
        lHeader.getCell(1).font = { name: 'Arial', size: 18, bold: true, color: { argb: '8b5cf6' } };
        loansSheet.mergeCells(`A${lHeader.number}:H${lHeader.number}`);
        lHeader.height = 30;

        const lHeaders = ['Loan Name', 'Category', 'Total Amount', 'Paid', 'Remaining', 'Interest Rate', 'Status', 'Progress'];
        const lHeaderRow = loansSheet.getRow(3);
        lHeaders.forEach((header, index) => {
          const cell = lHeaderRow.getCell(index + 1);
          cell.value = header;
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLORS.white } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8b5cf6' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        loans.forEach((loan, index) => {
          const rowNum = 4 + index;
          const row = loansSheet.getRow(rowNum);
          
          const paid = loan.total_paid || 0;
          const remaining = loan.total_amount - paid;
          const progress = loan.total_amount > 0 ? ((paid / loan.total_amount) * 100).toFixed(0) : 0;

          row.getCell(1).value = loan.name;
          row.getCell(2).value = loan.category;
          row.getCell(3).value = loan.total_amount;
          row.getCell(3).numFmt = '#,##0.00';
          row.getCell(3).alignment = { horizontal: 'right' };
          row.getCell(4).value = paid;
          row.getCell(4).numFmt = '#,##0.00';
          row.getCell(4).alignment = { horizontal: 'right' };
          row.getCell(5).value = remaining;
          row.getCell(5).numFmt = '#,##0.00';
          row.getCell(5).alignment = { horizontal: 'right' };
          row.getCell(6).value = loan.interest_rate > 0 ? `${loan.interest_rate}%` : '-';
          row.getCell(6).alignment = { horizontal: 'center' };
          row.getCell(7).value = loan.status.charAt(0).toUpperCase() + loan.status.slice(1);
          row.getCell(7).alignment = { horizontal: 'center' };
          row.getCell(8).value = `${progress}%`;
          row.getCell(8).alignment = { horizontal: 'center' };

          ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
            const cell = row.getCell(col);
            cell.font = { name: 'Arial', size: 10 };
            cell.border = {
              bottom: { style: 'thin', color: { argb: COLORS.border } },
              left: { style: 'thin', color: { argb: COLORS.border } },
              right: { style: 'thin', color: { argb: COLORS.border } }
            };
            if (index % 2 === 0) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBg } };
            }
          });
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `Finance_Report_${monthLabel.replace(' ', '_')}.xlsx`;
      saveAs(blob, fileName);

      toast.dismiss(toastId);
      toast.success(`Premium Excel report downloaded! 📊✨`);
    } catch (error) {
      toast.error('Failed to generate Excel report ❌');
      console.error('Excel export error:', error);
    }
  };

  // 2. Export Annual Report
  const exportAnnualReport = async () => {
    try {
      const toastId = toast.loading(`Generating annual report for ${selectedYear}...`);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Personal Finance Tracker';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Annual Report', {
        properties: { tabColor: { argb: '667eea' } }
      });

      sheet.getColumn(1).width = 5;
      sheet.getColumn(2).width = 25;
      sheet.getColumn(3).width = 18;
      sheet.getColumn(4).width = 18;
      sheet.getColumn(5).width = 18;
      sheet.getColumn(6).width = 15;

      // Header
      const headerRow = sheet.getRow(2);
      headerRow.getCell(2).value = `📊 ANNUAL FINANCIAL REPORT - ${selectedYear}`;
      headerRow.getCell(2).font = { name: 'Arial', size: 20, bold: true, color: { argb: '667eea' } };
      sheet.mergeCells(`B${headerRow.number}:F${headerRow.number}`);
      headerRow.height = 35;

      // Summary
      sheet.getRow(4).getCell(2).value = 'Annual Summary';
      sheet.getRow(4).getCell(2).font = { name: 'Arial', size: 14, bold: true };

      const summaryData = [
        ['Total Income', currentYearSummary.income],
        ['Total Expenses', currentYearSummary.expenses],
        ['Net Cash Flow', currentYearSummary.netFlow],
        ['Total Transactions', currentYearSummary.total],
      ];

      summaryData.forEach((row, index) => {
        const rowNum = 6 + index;
        const dataRow = sheet.getRow(rowNum);
        dataRow.getCell(2).value = row[0];
        dataRow.getCell(2).font = { name: 'Arial', size: 11, bold: true };
        dataRow.getCell(3).value = row[1];
        dataRow.getCell(3).numFmt = '#,##0.00';
        dataRow.getCell(3).font = { name: 'Arial', size: 11 };
      });

      // Monthly breakdown
      sheet.getRow(12).getCell(2).value = 'Monthly Breakdown';
      sheet.getRow(12).getCell(2).font = { name: 'Arial', size: 14, bold: true };

      const headers = ['Month', 'Income', 'Expenses', 'Net Flow', 'Transactions'];
      const headerRow2 = sheet.getRow(14);
      headers.forEach((header, index) => {
        const cell = headerRow2.getCell(index + 2);
        cell.value = header;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'ffffff' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '667eea' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      yearlyData.forEach((data, index) => {
        const rowNum = 15 + index;
        const row = sheet.getRow(rowNum);
        row.getCell(2).value = data.month;
        row.getCell(3).value = data.income;
        row.getCell(3).numFmt = '#,##0.00';
        row.getCell(4).value = data.expenses;
        row.getCell(4).numFmt = '#,##0.00';
        row.getCell(5).value = data.netFlow;
        row.getCell(5).numFmt = '#,##0.00';
        row.getCell(6).value = transactions.filter(t => {
          const date = new Date(t.date);
          return date.getFullYear() === selectedYear && date.getMonth() === index;
        }).length;
        
        // Alternate row colors
        if (index % 2 === 0) {
          ['B', 'C', 'D', 'E', 'F'].forEach(col => {
            row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'f8fafc' } };
          });
        }
      });

      // Footer
      const footerRow = sheet.getRow(sheet.rowCount + 2);
      footerRow.getCell(2).value = '📈 Generated by Personal Finance Tracker';
      footerRow.getCell(2).font = { name: 'Arial', size: 10, color: { argb: '64748b' } };
      sheet.mergeCells(`B${footerRow.number}:F${footerRow.number}`);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Annual_Report_${selectedYear}.xlsx`);

      toast.dismiss(toastId);
      toast.success(`Annual report for ${selectedYear} downloaded! 📊✨`);
    } catch (error) {
      toast.error('Failed to generate annual report ❌');
      console.error('Annual report error:', error);
    }
  };

  // 3. Export Two-Year Comparison Report
  const exportComparisonReport = async () => {
    try {
      const year1 = selectedYear - 1;
      const year2 = selectedYear;
      const toastId = toast.loading(`Generating comparison report for ${year1} vs ${year2}...`);

      // Get data for both years
      const getYearData = (year) => {
        const txs = transactions.filter(t => new Date(t.date).getFullYear() === year);
        const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { income, expenses, netFlow: income - expenses, total: txs.length };
      };

      const data1 = getYearData(year1);
      const data2 = getYearData(year2);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Personal Finance Tracker';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Comparison', {
        properties: { tabColor: { argb: '8b5cf6' } }
      });

      sheet.getColumn(1).width = 5;
      sheet.getColumn(2).width = 25;
      sheet.getColumn(3).width = 18;
      sheet.getColumn(4).width = 18;
      sheet.getColumn(5).width = 18;
      sheet.getColumn(6).width = 18;

      // Header
      const headerRow = sheet.getRow(2);
      headerRow.getCell(2).value = `📊 YEAR COMPARISON: ${year1} vs ${year2}`;
      headerRow.getCell(2).font = { name: 'Arial', size: 18, bold: true, color: { argb: '8b5cf6' } };
      sheet.mergeCells(`B${headerRow.number}:F${headerRow.number}`);
      headerRow.height = 35;

      // Comparison table
      const headerRow2 = sheet.getRow(4);
      const headers = ['Metric', year1, year2, 'Change', '% Change'];
      headers.forEach((header, index) => {
        const cell = headerRow2.getCell(index + 2);
        cell.value = header;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'ffffff' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8b5cf6' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      const metrics = [
        ['Total Income', data1.income, data2.income],
        ['Total Expenses', data1.expenses, data2.expenses],
        ['Net Cash Flow', data1.netFlow, data2.netFlow],
        ['Transactions', data1.total, data2.total],
      ];

      metrics.forEach((row, index) => {
        const rowNum = 5 + index;
        const dataRow = sheet.getRow(rowNum);
        dataRow.getCell(2).value = row[0];
        dataRow.getCell(2).font = { name: 'Arial', size: 11, bold: true };
        
        dataRow.getCell(3).value = row[1];
        dataRow.getCell(3).numFmt = '#,##0.00';
        dataRow.getCell(4).value = row[2];
        dataRow.getCell(4).numFmt = '#,##0.00';
        
        const change = row[2] - row[1];
        dataRow.getCell(5).value = change;
        dataRow.getCell(5).numFmt = '#,##0.00';
        
        const percentChange = row[1] !== 0 ? ((change / Math.abs(row[1])) * 100) : 0;
        dataRow.getCell(6).value = percentChange;
        dataRow.getCell(6).numFmt = '0.00"%";-0.00"%";0.00"%"';

        // Color coding
        const isPositive = change >= 0;
        const isExpense = row[0] === 'Total Expenses';
        const isGood = isExpense ? !isPositive : isPositive;
        const color = isGood ? '10b981' : 'ef4444';
        dataRow.getCell(5).font = { name: 'Arial', size: 11, color: { argb: color } };
        dataRow.getCell(6).font = { name: 'Arial', size: 11, color: { argb: color } };
      });

      // Monthly comparison
      const monthlyData1 = getMonthlyDataForYear(year1);
      const monthlyData2 = getMonthlyDataForYear(year2);

      sheet.getRow(12).getCell(2).value = 'Monthly Comparison - Net Cash Flow';
      sheet.getRow(12).getCell(2).font = { name: 'Arial', size: 14, bold: true };

      const monthHeaders = ['Month', year1, year2, 'Difference'];
      const monthHeaderRow = sheet.getRow(14);
      monthHeaders.forEach((header, index) => {
        const cell = monthHeaderRow.getCell(index + 2);
        cell.value = header;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'ffffff' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8b5cf6' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      monthlyData1.forEach((data, index) => {
        const rowNum = 15 + index;
        const row = sheet.getRow(rowNum);
        const month2Data = monthlyData2[index] || { netFlow: 0 };
        const diff = data.netFlow - month2Data.netFlow;
        
        row.getCell(2).value = data.month;
        row.getCell(3).value = data.netFlow;
        row.getCell(3).numFmt = '#,##0.00';
        row.getCell(4).value = month2Data.netFlow;
        row.getCell(4).numFmt = '#,##0.00';
        row.getCell(5).value = diff;
        row.getCell(5).numFmt = '#,##0.00';
        
        if (index % 2 === 0) {
          ['B', 'C', 'D', 'E'].forEach(col => {
            row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'f8fafc' } };
          });
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Comparison_${year1}_vs_${year2}.xlsx`);

      toast.dismiss(toastId);
      toast.success(`Comparison report downloaded! 📊✨`);
    } catch (error) {
      toast.error('Failed to generate comparison report ❌');
      console.error('Comparison report error:', error);
    }
  };

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
        <div>
          <h2>Financial Reports</h2>
          <p className="finance-view-subtitle">Comprehensive financial analysis and insights</p>
        </div>
        <div className="finance-header-actions">
          <button className="finance-add-btn" onClick={loadAllData}>
            <ArrowPathIcon className="finance-add-btn-icon" />
            Refresh Data
          </button>
          <div className="finance-export-group">
            <button 
              className="finance-export-btn monthly" 
              onClick={exportMonthlyReport}
              title="Export Monthly Premium Report"
            >
              <DocumentArrowDownIcon className="finance-export-icon" />
              Monthly
            </button>
            <button 
              className="finance-export-btn annual" 
              onClick={exportAnnualReport}
              title="Export Annual Report"
            >
              <DocumentArrowDownIcon className="finance-export-icon" />
              Annual
            </button>
            <button 
              className="finance-export-btn comparison" 
              onClick={exportComparisonReport}
              title="Export Two-Year Comparison"
            >
              <DocumentArrowDownIcon className="finance-export-icon" />
              Compare
            </button>
          </div>
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

      {/* Loan Summary Section */}
      {loans.length > 0 && (
        <div className="finance-report-loan-summary">
          <div className="finance-report-loan-header">
            <BanknotesIcon className="finance-report-loan-icon" />
            <h3>Loan Summary</h3>
          </div>
          <div className="finance-report-loan-grid">
            <div className="finance-report-loan-item">
              <span className="loan-report-label">Total Loans</span>
              <span className="loan-report-value">{loans.length}</span>
              <span className="loan-report-sub">Active: {activeLoans} | Paid: {paidLoans}</span>
            </div>
            <div className="finance-report-loan-item">
              <span className="loan-report-label">Total Amount</span>
              <span className="loan-report-value amount">₱{totalLoanAmount.toLocaleString()}</span>
            </div>
            <div className="finance-report-loan-item">
              <span className="loan-report-label">Total Paid</span>
              <span className="loan-report-value paid">₱{totalPaidLoans.toLocaleString()}</span>
            </div>
            <div className="finance-report-loan-item">
              <span className="loan-report-label">Remaining</span>
              <span className="loan-report-value remaining">₱{totalRemainingLoans.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

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

      {/* Annual Report Section */}
      <div className="finance-report-annual-section">
        <div className="finance-report-annual-header">
          <h3>📊 Annual Report - {selectedYear}</h3>
          <div className="finance-year-selector">
            <button 
              className="finance-year-btn"
              onClick={() => setSelectedYear(prev => prev - 1)}
            >
              ◀
            </button>
            <span className="finance-year-display">{selectedYear}</span>
            <button 
              className="finance-year-btn"
              onClick={() => setSelectedYear(prev => prev + 1)}
              disabled={selectedYear >= new Date().getFullYear()}
            >
              ▶
            </button>
          </div>
        </div>

        <div className="finance-annual-summary-grid">
          <div className="finance-annual-card">
            <span className="annual-label">Total Income</span>
            <span className="annual-value income">₱{currentYearSummary.income.toLocaleString()}</span>
          </div>
          <div className="finance-annual-card">
            <span className="annual-label">Total Expenses</span>
            <span className="annual-value expense">₱{currentYearSummary.expenses.toLocaleString()}</span>
          </div>
          <div className="finance-annual-card">
            <span className="annual-label">Net Cash Flow</span>
            <span className={`annual-value ${currentYearSummary.netFlow >= 0 ? 'positive' : 'negative'}`}>
              ₱{currentYearSummary.netFlow.toLocaleString()}
            </span>
          </div>
          <div className="finance-annual-card">
            <span className="annual-label">Transactions</span>
            <span className="annual-value">{currentYearSummary.total}</span>
          </div>
        </div>

        {/* Year Comparison Summary */}
        <div className="finance-comparison-section">
          <h4>📈 {selectedYear - 1} vs {selectedYear} Comparison</h4>
          <div className="finance-comparison-grid">
            <div className="finance-comparison-item">
              <span className="comparison-label">Income Change</span>
              <span className={`comparison-value ${currentYearSummary.income >= previousYearSummary.income ? 'positive' : 'negative'}`}>
                {previousYearSummary.income > 0 
                  ? `${((currentYearSummary.income - previousYearSummary.income) / previousYearSummary.income * 100).toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>
            <div className="finance-comparison-item">
              <span className="comparison-label">Expense Change</span>
              <span className={`comparison-value ${currentYearSummary.expenses <= previousYearSummary.expenses ? 'positive' : 'negative'}`}>
                {previousYearSummary.expenses > 0
                  ? `${((currentYearSummary.expenses - previousYearSummary.expenses) / previousYearSummary.expenses * 100).toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>
            <div className="finance-comparison-item">
              <span className="comparison-label">Net Flow Change</span>
              <span className={`comparison-value ${currentYearSummary.netFlow >= previousYearSummary.netFlow ? 'positive' : 'negative'}`}>
                {previousYearSummary.netFlow !== 0
                  ? `${((currentYearSummary.netFlow - previousYearSummary.netFlow) / Math.abs(previousYearSummary.netFlow) * 100).toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Breakdown for Selected Year */}
        <div className="finance-monthly-breakdown">
          <h4>Monthly Breakdown - {selectedYear}</h4>
          <div className="finance-monthly-grid">
            {yearlyData.map((item, index) => (
              <div key={index} className="finance-monthly-item">
                <span className="month-label">{item.month}</span>
                <div className="month-values">
                  <span className="month-income">₱{item.income.toLocaleString()}</span>
                  <span className="month-expense">₱{item.expenses.toLocaleString()}</span>
                  <span className={`month-net ${item.netFlow >= 0 ? 'positive' : 'negative'}`}>
                    ₱{item.netFlow.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
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

      {loading && <div className="finance-loading">Loading...</div>}

      <style>{`
        .finance-reports-view {
          width: 100%;
        }

        .finance-view-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .finance-view-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin: 0;
        }

        .finance-view-subtitle {
          font-size: 0.875rem;
          color: var(--text-secondary, #64748b);
          margin-top: 0.25rem;
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

        .finance-export-group {
          display: flex;
          gap: 0.5rem;
        }

        .finance-export-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.625rem 1rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: white;
        }

        .finance-export-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        }

        .finance-export-btn.monthly {
          background: #217346;
        }

        .finance-export-btn.monthly:hover {
          background: #1a5c38;
        }

        .finance-export-btn.annual {
          background: #667eea;
        }

        .finance-export-btn.annual:hover {
          background: #5a67d8;
        }

        .finance-export-btn.comparison {
          background: #8b5cf6;
        }

        .finance-export-btn.comparison:hover {
          background: #7c3aed;
        }

        .finance-export-icon {
          width: 1rem;
          height: 1rem;
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
          transition: all 0.2s;
        }

        .finance-report-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
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

        /* Loan Summary */
        .finance-report-loan-summary {
          background: var(--card-bg, #ffffff);
          border-radius: 0.75rem;
          padding: 1.25rem;
          border: 1px solid var(--border-color, #e2e8f0);
          margin-bottom: 1.5rem;
          transition: all 0.2s;
        }

        .finance-report-loan-summary:hover {
          box-shadow: var(--shadow-md);
        }

        .finance-report-loan-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .finance-report-loan-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: var(--gradient-start, #667eea);
        }

        .finance-report-loan-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin: 0;
        }

        .finance-report-loan-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .finance-report-loan-item {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .loan-report-label {
          font-size: 0.65rem;
          color: var(--text-secondary, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }

        .loan-report-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
        }

        .loan-report-value.amount {
          color: var(--gradient-start, #667eea);
        }

        .loan-report-value.paid {
          color: #10b981;
        }

        .loan-report-value.remaining {
          color: #ef4444;
        }

        .loan-report-sub {
          font-size: 0.7rem;
          color: var(--text-secondary, #64748b);
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

        /* Annual Report Section */
        .finance-report-annual-section {
          background: var(--card-bg, #ffffff);
          border-radius: 0.75rem;
          padding: 1.25rem;
          border: 1px solid var(--border-color, #e2e8f0);
          margin-bottom: 1.5rem;
        }

        .finance-report-annual-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .finance-report-annual-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin: 0;
        }

        .finance-year-selector {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .finance-year-btn {
          padding: 0.25rem 0.75rem;
          border: 1px solid var(--border-color, #e2e8f0);
          background: var(--bg-primary, #f8fafc);
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .finance-year-btn:hover:not(:disabled) {
          background: var(--gradient-start, #667eea);
          color: white;
          border-color: var(--gradient-start, #667eea);
        }

        .finance-year-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .finance-year-display {
          font-weight: 600;
          font-size: 1.1rem;
          min-width: 60px;
          text-align: center;
          color: var(--text-primary, #0f172a);
        }

        .finance-annual-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .finance-annual-card {
          background: var(--bg-primary, #f8fafc);
          border-radius: 0.5rem;
          padding: 0.75rem;
          text-align: center;
        }

        .annual-label {
          display: block;
          font-size: 0.7rem;
          color: var(--text-secondary, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }

        .annual-value {
          display: block;
          font-size: 1.1rem;
          font-weight: 700;
          margin-top: 0.25rem;
          color: var(--text-primary, #0f172a);
        }

        .annual-value.income {
          color: #10b981;
        }

        .annual-value.expense {
          color: #ef4444;
        }

        .annual-value.positive {
          color: #10b981;
        }

        .annual-value.negative {
          color: #ef4444;
        }

        .finance-comparison-section {
          background: var(--bg-primary, #f8fafc);
          border-radius: 0.5rem;
          padding: 0.75rem;
          margin-bottom: 1rem;
        }

        .finance-comparison-section h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin: 0 0 0.5rem 0;
        }

        .finance-comparison-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.5rem;
        }

        .finance-comparison-item {
          text-align: center;
        }

        .comparison-label {
          display: block;
          font-size: 0.65rem;
          color: var(--text-secondary, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }

        .comparison-value {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          margin-top: 0.125rem;
        }

        .comparison-value.positive {
          color: #10b981;
        }

        .comparison-value.negative {
          color: #ef4444;
        }

        .finance-monthly-breakdown h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin: 0 0 0.5rem 0;
        }

        .finance-monthly-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 0.5rem;
        }

        .finance-monthly-item {
          background: var(--bg-primary, #f8fafc);
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .month-label {
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--text-primary, #0f172a);
          min-width: 40px;
        }

        .month-values {
          display: flex;
          gap: 0.5rem;
          font-size: 0.7rem;
        }

        .month-income {
          color: #10b981;
          font-weight: 500;
        }

        .month-expense {
          color: #ef4444;
          font-weight: 500;
        }

        .month-net {
          font-weight: 600;
        }

        .month-net.positive {
          color: #10b981;
        }

        .month-net.negative {
          color: #ef4444;
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

          .finance-export-group {
            width: 100%;
            flex-direction: column;
          }

          .finance-export-btn {
            width: 100%;
            justify-content: center;
          }

          .finance-report-summary {
            grid-template-columns: 1fr 1fr;
          }

          .finance-report-loan-grid {
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

          .finance-monthly-grid {
            grid-template-columns: 1fr 1fr;
          }

          .finance-annual-summary-grid {
            grid-template-columns: 1fr 1fr;
          }

          .finance-comparison-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .finance-report-summary {
            grid-template-columns: 1fr;
          }

          .finance-report-loan-grid {
            grid-template-columns: 1fr;
          }

          .chart-bar {
            width: 10px;
          }

          .chart-line-value {
            font-size: 0.5rem;
          }

          .finance-monthly-grid {
            grid-template-columns: 1fr;
          }

          .finance-annual-summary-grid {
            grid-template-columns: 1fr;
          }

          .finance-report-annual-header {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }

          .finance-year-selector {
            justify-content: center;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Reports;