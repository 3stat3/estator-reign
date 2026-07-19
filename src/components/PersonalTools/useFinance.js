// src/components/PersonalTools/useFinance.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../../supabase';

export const useFinance = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [bills, setBills] = useState([]);
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
      console.error('Error fetching transactions:', error);
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
      console.error('Error adding transaction:', error);
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
      console.error('Error updating transaction:', error);
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
      console.error('Error deleting transaction:', error);
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
      console.error('Error fetching budgets:', error);
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
      console.error('Error setting budget:', error);
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
      console.error('Error deleting budget:', error);
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
      console.error('Error fetching bills:', error);
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
      console.error('Error adding bill:', error);
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
      console.error('Error updating bill:', error);
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
      console.error('Error deleting bill:', error);
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
      console.error('Error fetching bill payments:', error);
      return [];
    }
  }, [user]);

  const recordBillPayment = async (paymentData) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      // 1. Get the bill details
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', paymentData.bill_id)
        .single();

      if (billError) throw billError;

      // 2. Insert payment record
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

      // 3. Create a transaction for this payment
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

      // 4. Update the payment record with transaction_id
      const { error: updateError } = await supabase
        .from('bill_payments')
        .update({ transaction_id: transaction.id })
        .eq('id', payment.id);

      if (updateError) throw updateError;

      // 5. Refresh data
      await loadAllData();

      return { success: true, data: { payment, transaction } };
    } catch (error) {
      console.error('Error recording bill payment:', error);
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
      console.error('Error fetching bill payment history:', error);
      return [];
    }
  }, [user]);

  const deleteBillPayment = async (paymentId) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    try {
      // Get the payment to find the transaction_id
      const { data: payment, error: getError } = await supabase
        .from('bill_payments')
        .select('transaction_id')
        .eq('id', paymentId)
        .single();

      if (getError) throw getError;

      // Delete the associated transaction if exists
      if (payment?.transaction_id) {
        const { error: txError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', payment.transaction_id)
          .eq('user_id', user.id);

        if (txError) throw txError;
      }

      // Delete the payment
      const { error } = await supabase
        .from('bill_payments')
        .delete()
        .eq('id', paymentId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadAllData();
      return { success: true };
    } catch (error) {
      console.error('Error deleting bill payment:', error);
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
      // Get all active bills
      const { data: activeBills, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true);

      if (error) throw error;

      // For each bill, get the latest payment
      const billsWithStatus = await Promise.all(
        activeBills.map(async (bill) => {
          // Get latest payment for this bill
          const { data: payments, error: pError } = await supabase
            .from('bill_payments')
            .select('*')
            .eq('bill_id', bill.id)
            .eq('user_id', user.id)
            .order('due_date', { ascending: false })
            .limit(1);

          if (pError) throw pError;

          // Get all payments for this bill
          const { data: allPayments, error: allError } = await supabase
            .from('bill_payments')
            .select('*')
            .eq('bill_id', bill.id)
            .eq('user_id', user.id)
            .order('due_date', { ascending: false });

          if (allError) throw allError;

          // Calculate due date for this month
          let dueDate = new Date(currentYear, currentMonth, bill.due_day);
          if (bill.due_day < currentDay) {
            dueDate = new Date(currentYear, currentMonth + 1, bill.due_day);
          }

          // Determine if paid this month
          const latestPayment = payments?.[0] || null;
          const isPaid = latestPayment && 
            new Date(latestPayment.due_date).getMonth() === currentMonth &&
            new Date(latestPayment.due_date).getFullYear() === currentYear;

          // Calculate over/under payment
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

      // Sort: Overdue first, then upcoming, then paid
      return billsWithStatus.sort((a, b) => {
        const order = { overdue: 0, upcoming: 1, paid_exact: 2, overpaid: 3, underpaid: 4, unpaid: 5 };
        return (order[a.status] || 5) - (order[b.status] || 5);
      });

    } catch (error) {
      console.error('Error fetching bills with status:', error);
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

    // Check if paid this month (simplified)
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
      fetchBills()
    ]);
  }, [fetchTransactions, fetchBudgets, fetchBills]);

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