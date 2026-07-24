// src/components/PersonalTools/useFinance.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../../supabase';

export const useFinance = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [bills, setBills] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Helper: Get month range
  const getMonthRange = (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  };

  // Helper: Format date for Supabase
  const formatDate = (date) => date.toISOString().split('T')[0];

  // Helper: Get month string (YYYY-MM)
  const getMonthString = (date) => {
    return date.toISOString().split('T')[0].slice(0, 7);
  };

  // ========== TRANSACTIONS ==========
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { start, end } = getMonthRange(selectedMonth);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', formatDate(start))
        .lte('date', formatDate(end))
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user, selectedMonth]);

  const addTransaction = async (transaction) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ 
          ...transaction, 
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      setTransactions(prev => [data, ...prev]);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (id, updates) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setTransactions(prev => prev.map(t => t.id === id ? data : t));
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== BUDGETS ==========
  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    try {
      const monthStr = getMonthString(selectedMonth);
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', `${monthStr}-01`);

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      // Silent fail
    }
  }, [user, selectedMonth]);

  const setBudget = async (category, amount) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const monthStr = getMonthString(selectedMonth);
      const { data, error } = await supabase
        .from('budgets')
        .upsert({
          user_id: user.id,
          category,
          amount,
          month: `${monthStr}-01`,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      await fetchBudgets();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteBudget = async (category) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const monthStr = getMonthString(selectedMonth);
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('user_id', user.id)
        .eq('category', category)
        .eq('month', `${monthStr}-01`);

      if (error) throw error;
      setBudgets(prev => prev.filter(b => b.category !== category));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ========== BILLS ==========
  const fetchBills = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('due_day', { ascending: true });

      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      // Silent fail
    }
  }, [user]);

  const addBill = async (bill) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bills')
        .insert([{ 
          ...bill, 
          user_id: user.id,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      setBills(prev => [...prev, data]);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateBill = async (id, updates) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bills')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setBills(prev => prev.map(b => b.id === id ? data : b));
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteBill = async (id) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bills')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setBills(prev => prev.filter(b => b.id !== id));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== BILL PAYMENTS ==========

  const fetchBillPayments = useCallback(async (billId) => {
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from('bill_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('bill_id', billId)
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }, [user]);

  const recordBillPayment = async (paymentData) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', paymentData.bill_id)
        .single();

      if (billError) throw billError;

      const { data: payment, error: paymentError } = await supabase
        .from('bill_payments')
        .insert([{
          bill_id: paymentData.bill_id,
          user_id: user.id,
          due_date: paymentData.due_date || paymentData.paid_date,
          paid_date: paymentData.paid_date,
          amount_paid: paymentData.amount_paid,
          status: paymentData.status || 'paid',
          notes: paymentData.notes || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

      const transactionData = {
        date: paymentData.paid_date || new Date().toISOString().split('T')[0],
        description: `${bill.name} Payment`,
        category: bill.category || 'Bills',
        type: 'expense',
        amount: paymentData.amount_paid,
        is_bill: true,
        bill_id: paymentData.bill_id,
        notes: paymentData.notes || `Payment for ${bill.name}`,
        user_id: user.id
      };

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert([{
          ...transactionData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (txError) throw txError;

      const { error: updateError } = await supabase
        .from('bill_payments')
        .update({ transaction_id: transaction.id })
        .eq('id', payment.id);

      if (updateError) throw updateError;

      await loadAllData();
      return { success: true, data: { payment, transaction } };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getBillPaymentHistory = useCallback(async (billId) => {
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from('bill_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('bill_id', billId)
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }, [user]);

  const deleteBillPayment = async (paymentId) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const { data: payment, error: getError } = await supabase
        .from('bill_payments')
        .select('transaction_id')
        .eq('id', paymentId)
        .single();

      if (getError) throw getError;

      if (payment?.transaction_id) {
        const { error: txError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', payment.transaction_id)
          .eq('user_id', user.id);

        if (txError) throw txError;
      }

      const { error } = await supabase
        .from('bill_payments')
        .delete()
        .eq('id', paymentId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadAllData();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingBillsWithStatus = useCallback(async () => {
    if (!user) return [];
    
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    try {
      const { data: activeBills, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true);

      if (error) throw error;

      const billsWithStatus = await Promise.all(
        activeBills.map(async (bill) => {
          const { data: payments, error: pError } = await supabase
            .from('bill_payments')
            .select('*')
            .eq('bill_id', bill.id)
            .eq('user_id', user.id)
            .order('due_date', { ascending: false })
            .limit(1);

          if (pError) throw pError;

          const { data: allPayments, error: allError } = await supabase
            .from('bill_payments')
            .select('*')
            .eq('bill_id', bill.id)
            .eq('user_id', user.id)
            .order('due_date', { ascending: false });

          if (allError) throw allError;

          let dueDate = new Date(currentYear, currentMonth, bill.due_day);
          if (bill.due_day < currentDay) {
            dueDate = new Date(currentYear, currentMonth + 1, bill.due_day);
          }

          const latestPayment = payments?.[0] || null;
          const isPaid = latestPayment && 
            new Date(latestPayment.due_date).getMonth() === currentMonth &&
            new Date(latestPayment.due_date).getFullYear() === currentYear;

          let status = 'unpaid';
          let paidAmount = 0;
          let difference = bill.amount;

          if (isPaid && latestPayment) {
            paidAmount = latestPayment.amount_paid;
            difference = bill.amount - paidAmount;
            
            if (difference === 0) {
              status = 'paid_exact';
            } else if (difference < 0) {
              status = 'overpaid';
            } else {
              status = 'underpaid';
            }
          } else if (dueDate < today) {
            status = 'overdue';
          } else {
            status = 'upcoming';
          }

          return {
            ...bill,
            dueDate,
            status,
            paidAmount,
            difference,
            isPaid,
            latestPayment,
            allPayments: allPayments || [],
            paymentCount: allPayments?.length || 0,
            isOverdue: status === 'overdue',
            isUpcoming: status === 'upcoming',
            isPaidExact: status === 'paid_exact',
            isOverpaid: status === 'overpaid',
            isUnderpaid: status === 'underpaid'
          };
        })
      );

      return billsWithStatus.sort((a, b) => {
        const order = { overdue: 0, upcoming: 1, paid_exact: 2, overpaid: 3, underpaid: 4, unpaid: 5 };
        return (order[a.status] || 5) - (order[b.status] || 5);
      });

    } catch (error) {
      return [];
    }
  }, [user]);

  const getBillStatusSummary = useCallback((bill) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let dueDate = new Date(currentYear, currentMonth, bill.due_day);
    if (bill.due_day < currentDay) {
      dueDate = new Date(currentYear, currentMonth + 1, bill.due_day);
    }

    const isPaid = bill.latestPayment && 
      new Date(bill.latestPayment.due_date).getMonth() === currentMonth &&
      new Date(bill.latestPayment.due_date).getFullYear() === currentYear;

    let status = 'unpaid';
    let amountPaid = 0;
    let difference = bill.amount;

    if (isPaid && bill.latestPayment) {
      amountPaid = bill.latestPayment.amount_paid;
      difference = bill.amount - amountPaid;
      
      if (difference === 0) {
        status = 'paid_exact';
      } else if (difference < 0) {
        status = 'overpaid';
      } else {
        status = 'underpaid';
      }
    } else if (dueDate < today) {
      status = 'overdue';
    }

    return {
      dueDate,
      status,
      amountPaid,
      difference,
      isPaid,
      isOverdue: status === 'overdue',
      isPaidExact: status === 'paid_exact',
      isOverpaid: status === 'overpaid',
      isUnderpaid: status === 'underpaid'
    };
  }, []);

  // ========== LOANS ==========
  const fetchLoans = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      // Silent fail
    }
  }, [user]);

  const addLoan = async (loan) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loans')
        .insert([{ 
          ...loan, 
          user_id: user.id,
          total_paid: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      setLoans(prev => [data, ...prev]);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateLoan = async (id, updates) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loans')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setLoans(prev => prev.map(l => l.id === id ? data : l));
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteLoan = async (id) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setLoans(prev => prev.filter(l => l.id !== id));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== LOAN PAYMENTS ==========
  const recordLoanPayment = async (paymentData) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', paymentData.loan_id)
        .single();

      if (loanError) {
        throw new Error(`Loan fetch error: ${loanError.message}`);
      }

      const paymentRecord = {
        loan_id: paymentData.loan_id,
        user_id: user.id,
        payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
        amount_paid: parseFloat(paymentData.amount_paid),
        status: paymentData.status || 'paid',
        notes: paymentData.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: payment, error: paymentError } = await supabase
        .from('loan_payments')
        .insert([paymentRecord])
        .select()
        .single();

      if (paymentError) {
        throw new Error(`Payment insert error: ${paymentError.message}`);
      }

      const newTotalPaid = (loan.total_paid || 0) + parseFloat(paymentData.amount_paid);

      const { error: updateError } = await supabase
        .from('loans')
        .update({ 
          total_paid: newTotalPaid,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentData.loan_id);

      if (updateError) {
        // Silent fail for update
      }

      try {
        const transactionData = {
          date: paymentData.payment_date || new Date().toISOString().split('T')[0],
          description: `${loan.name} Payment`,
          category: 'Loan Payment',
          type: 'expense',
          amount: parseFloat(paymentData.amount_paid),
          is_bill: false,
          notes: paymentData.notes || `Payment for ${loan.name}`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: transaction, error: txError } = await supabase
          .from('transactions')
          .insert([transactionData])
          .select()
          .single();

        if (!txError) {
          await supabase
            .from('loan_payments')
            .update({ transaction_id: transaction.id })
            .eq('id', payment.id);
        }
      } catch (txError) {
        // Silent fail for transaction creation
      }

      if (newTotalPaid >= loan.total_amount) {
        await supabase
          .from('loans')
          .update({ 
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentData.loan_id);
      }

      await loadAllData();
      return { success: true, data: { payment } };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== DELETE LOAN PAYMENT ==========
  const deleteLoanPayment = async (paymentId) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      const { data: payment, error: getError } = await supabase
        .from('loan_payments')
        .select('loan_id, transaction_id, amount_paid')
        .eq('id', paymentId)
        .single();

      if (getError) throw getError;

      if (payment?.transaction_id) {
        await supabase
          .from('transactions')
          .delete()
          .eq('id', payment.transaction_id)
          .eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('loan_payments')
        .delete()
        .eq('id', paymentId)
        .eq('user_id', user.id);

      if (error) throw error;

      const { data: allPayments, error: sumError } = await supabase
        .from('loan_payments')
        .select('amount_paid')
        .eq('loan_id', payment.loan_id)
        .eq('user_id', user.id);

      if (sumError) throw sumError;

      const newTotalPaid = allPayments.reduce((sum, p) => sum + p.amount_paid, 0);

      await supabase
        .from('loans')
        .update({ 
          total_paid: newTotalPaid,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.loan_id)
        .eq('user_id', user.id);

      if (newTotalPaid === 0) {
        await supabase
          .from('loans')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.loan_id)
          .eq('user_id', user.id);
      }

      await loadAllData();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== COMPUTED DATA ==========
  const getMonthlyIncome = useCallback(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getMonthlyExpenses = useCallback(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getNetCashFlow = useCallback(() => {
    return getMonthlyIncome() - getMonthlyExpenses();
  }, [getMonthlyIncome, getMonthlyExpenses]);

  const getSavingsRate = useCallback(() => {
    const income = getMonthlyIncome();
    if (income === 0) return 0;
    return (getNetCashFlow() / income) * 100;
  }, [getMonthlyIncome, getNetCashFlow]);

  const getBudgetStatus = useCallback(() => {
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const remaining = budget.amount - spent;
      const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      let status = 'good';
      if (percentUsed >= 100) status = 'danger';
      else if (percentUsed >= 85) status = 'warning';
      
      return {
        ...budget,
        spent,
        remaining,
        percentUsed,
        status
      };
    });
  }, [budgets, transactions]);

  const getUpcomingBills = useCallback(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return bills
      .map(bill => {
        let dueDate = new Date(currentYear, currentMonth, bill.due_day);
        if (bill.due_day < currentDay) {
          dueDate = new Date(currentYear, currentMonth + 1, bill.due_day);
        }
        return { ...bill, dueDate };
      })
      .sort((a, b) => a.dueDate - b.dueDate)
      .slice(0, 5);
  }, [bills]);

  // ========== LOAD DATA ==========
  const loadAllData = useCallback(async () => {
    await Promise.all([
      fetchTransactions(),
      fetchBudgets(),
      fetchBills(),
      fetchLoans()
    ]);
  }, [fetchTransactions, fetchBudgets, fetchBills, fetchLoans]);

  // Auto-load data when user or month changes
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, selectedMonth]);

  return {
    // State
    transactions,
    budgets,
    bills,
    loans,
    loading,
    selectedMonth,
    setSelectedMonth,
    
    // Transaction CRUD
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Budget CRUD
    fetchBudgets,
    setBudget,
    deleteBudget,
    
    // Bill CRUD
    fetchBills,
    addBill,
    updateBill,
    deleteBill,
    
    // Bill Payment CRUD
    fetchBillPayments,
    recordBillPayment,
    getBillPaymentHistory,
    deleteBillPayment,
    getUpcomingBillsWithStatus,
    getBillStatusSummary,
    
    // Loan CRUD
    fetchLoans,
    addLoan,
    updateLoan,
    deleteLoan,
    recordLoanPayment,
    deleteLoanPayment,
    
    // Computed data
    getMonthlyIncome,
    getMonthlyExpenses,
    getNetCashFlow,
    getSavingsRate,
    getBudgetStatus,
    getUpcomingBills,
    
    // Utilities
    loadAllData
  };
};