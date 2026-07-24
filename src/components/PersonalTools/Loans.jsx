// src/components/PersonalTools/Loans.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../../../supabase';
import {
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  CreditCardIcon,
  DocumentTextIcon,
  XMarkIcon,
  BanknotesIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import LoanPaymentModal from './LoanPaymentModal';

const Loans = ({ finance, setActiveView }) => {
  const {
    loans,
    loading,
    addLoan,
    updateLoan,
    deleteLoan,
    recordLoanPayment,
    deleteLoanPayment,
    loadAllData,
  } = finance;

  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loanForm, setLoanForm] = useState({
    name: '',
    category: '',
    total_amount: '',
    interest_rate: '',
    term_months: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    payment_frequency: 'monthly',
    monthly_payment: '',
    status: 'active',
    notes: ''
  });

  const loanCategories = [
    'Housing Loan',
    'Car Loan',
    'Personal Loan',
    'Business Loan',
    'Student Loan',
    'Credit Card',
    'Pawnshop',
    'Other'
  ];

  const frequencies = ['monthly', 'quarterly', 'annually', 'weekly', 'no schedule'];

  const openAdd = () => {
    setEditingItem(null);
    setLoanForm({
      name: '',
      category: '',
      total_amount: '',
      interest_rate: '',
      term_months: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      payment_frequency: 'monthly',
      monthly_payment: '',
      status: 'active',
      notes: ''
    });
    setShowModal(true);
  };

  const openEdit = (loan) => {
    setEditingItem(loan);
    setLoanForm({
      name: loan.name || '',
      category: loan.category || '',
      total_amount: loan.total_amount ? loan.total_amount.toString() : '',
      interest_rate: loan.interest_rate ? loan.interest_rate.toString() : '',
      term_months: loan.term_months ? loan.term_months.toString() : '',
      start_date: loan.start_date || new Date().toISOString().split('T')[0],
      end_date: loan.end_date || '',
      payment_frequency: loan.payment_frequency || 'monthly',
      monthly_payment: loan.monthly_payment ? loan.monthly_payment.toString() : '',
      status: loan.status || 'active',
      notes: loan.notes || ''
    });
    setShowModal(true);
  };

  const openPaymentModal = (loan) => {
    setSelectedLoan(loan);
    setShowPaymentModal(true);
  };

  const openHistoryModal = async (loan) => {
    setSelectedLoan(loan);
    setIsLoadingHistory(true);
    setShowHistoryModal(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_id', loan.id)
        .eq('user_id', userId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPaymentHistory(data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to load payment history ❌');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handlePayment = async (paymentData) => {
    setIsProcessing(true);
    const result = await recordLoanPayment(paymentData);
    setIsProcessing(false);

    if (result.success) {
      toast.success('Loan payment recorded successfully! ✅');
      setShowPaymentModal(false);
      loadAllData();
    } else {
      toast.error(result.error || 'Failed to record payment ❌');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('Are you sure you want to delete this payment? This will also delete the associated transaction.')) return;

    const toastId = toast.loading('Deleting payment...');
    const result = await deleteLoanPayment(paymentId);
    toast.dismiss(toastId);

    if (result.success) {
      toast.success('Payment deleted successfully! 🗑️');
      if (selectedLoan) {
        await openHistoryModal(selectedLoan);
      }
      loadAllData();
    } else {
      toast.error(result.error || 'Failed to delete payment ❌');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const total_amount = parseFloat(loanForm.total_amount);
    const interest_rate = parseFloat(loanForm.interest_rate);
    const term_months = loanForm.term_months ? parseInt(loanForm.term_months) : null;
    const monthly_payment = parseFloat(loanForm.monthly_payment);
    
    if (isNaN(total_amount) || total_amount <= 0) {
      toast.error('Please enter a valid total amount');
      return;
    }
    
    if (term_months !== null && term_months < 1) {
      toast.error('Please enter a valid term (at least 1 month)');
      return;
    }

    const data = {
      name: loanForm.name.trim(),
      category: loanForm.category,
      total_amount: total_amount,
      interest_rate: interest_rate || 0,
      term_months: term_months,
      start_date: loanForm.start_date,
      end_date: loanForm.end_date || null,
      payment_frequency: loanForm.payment_frequency,
      monthly_payment: monthly_payment || 0,
      status: loanForm.status,
      notes: loanForm.notes || '',
      updated_at: new Date().toISOString()
    };

    const toastId = toast.loading(editingItem ? 'Updating loan...' : 'Adding loan...');

    let result;
    if (editingItem) {
      result = await updateLoan(editingItem.id, data);
    } else {
      result = await addLoan(data);
    }

    toast.dismiss(toastId);

    if (result.success) {
      toast.success(editingItem ? 'Loan updated successfully! ✅' : 'Loan added successfully! ✅');
      setShowModal(false);
      loadAllData();
    } else {
      toast.error(result.error || 'Failed to save loan');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this loan?')) return;

    const toastId = toast.loading('Deleting loan...');
    const result = await deleteLoan(id);
    toast.dismiss(toastId);

    if (result.success) {
      toast.success('Loan deleted successfully! 🗑️');
      loadAllData();
    } else {
      toast.error(result.error || 'Failed to delete loan');
    }
  };

  const viewLoanTransactions = (loan) => {
    if (setActiveView) {
      setActiveView('transactions', { 
        name: loan.name, 
        category: 'Loan Payment' 
      });
    }
  };

  const getProgress = (loan) => {
    if (!loan.total_amount || loan.total_amount === 0) return 0;
    const paid = loan.total_paid || 0;
    return Math.min((paid / loan.total_amount) * 100, 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#3b82f6';
      case 'paid':
        return '#10b981';
      case 'defaulted':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <span className="status-dot active" />;
      case 'paid':
        return <span className="status-dot paid" />;
      case 'defaulted':
        return <span className="status-dot defaulted" />;
      default:
        return <span className="status-dot" />;
    }
  };

  const formatCurrency = (amount) => {
    return `₱${amount?.toLocaleString() || '0'}`;
  };

  const getFrequencyDisplay = (frequency) => {
    if (frequency === 'no schedule') return 'No Schedule (Pay Anytime)';
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  const renderHistoryModal = () => {
    if (!showHistoryModal) return null;

    const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount_paid, 0);

    return (
      <div className="history-modal-overlay" onClick={() => setShowHistoryModal(false)}>
        <div className="history-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="history-modal-header">
            <h3>Payment History - {selectedLoan?.name}</h3>
            <button className="history-modal-close" onClick={() => setShowHistoryModal(false)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="history-modal-body">
            {isLoadingHistory ? (
              <div className="history-loading">Loading payment history...</div>
            ) : paymentHistory.length === 0 ? (
              <div className="history-empty">
                <BanknotesIcon className="history-empty-icon" />
                <p>No payments recorded for this loan yet.</p>
              </div>
            ) : (
              <div className="history-list">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Payment Date</th>
                      <th>Amount Paid</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment) => {
                      let statusColor = '#10b981';
                      let statusText = 'Paid';
                      if (payment.status === 'pending') {
                        statusColor = '#f59e0b';
                        statusText = 'Pending';
                      } else if (payment.status === 'overdue') {
                        statusColor = '#ef4444';
                        statusText = 'Overdue';
                      }
                      return (
                        <tr key={payment.id}>
                          <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                          <td>₱{payment.amount_paid.toLocaleString()}</td>
                          <td style={{ color: statusColor, fontWeight: 500 }}>{statusText}</td>
                          <td>{payment.notes || '-'}</td>
                          <td>
                            <button 
                              className="history-delete-btn"
                              onClick={() => handleDeletePayment(payment.id)}
                              title="Delete this payment"
                            >
                              <TrashIcon className="history-delete-icon" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="history-summary">
              <span>Total Payments: {paymentHistory.length}</span>
              <span>Total Paid: ₱{totalPaid.toLocaleString()}</span>
            </div>
            <div className="history-modal-footer">
              <button className="history-modal-close-btn" onClick={() => setShowHistoryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Add/Edit Loan Modal
  const renderLoanModal = () => {
    if (!showModal) return null;

    return (
      <div className="loan-modal-overlay" onClick={() => setShowModal(false)}>
        <div className="loan-modal-container" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="loan-modal-header">
            <div className="loan-modal-title">
              <BanknotesIcon className="loan-modal-icon" />
              <div>
                <h3>{editingItem ? 'Edit Loan' : 'Add New Loan'}</h3>
                <p className="loan-modal-subtitle">
                  {editingItem ? 'Update your loan details' : 'Enter the loan information below'}
                </p>
              </div>
            </div>
            <button className="loan-modal-close" onClick={() => setShowModal(false)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="loan-modal-body">
            <form onSubmit={handleSubmit}>
              {/* Loan Name */}
              <div className="loan-form-group">
                <label>
                  Loan Name
                  <span className="loan-form-required">*</span>
                </label>
                <div className="loan-input-wrapper">
                  <TagIcon className="loan-input-icon" />
                  <input
                    type="text"
                    placeholder="e.g., Car Loan, Housing Loan"
                    value={loanForm.name}
                    onChange={(e) => setLoanForm({ ...loanForm, name: e.target.value })}
                    required
                    className="loan-input with-icon"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="loan-form-group">
                <label>
                  Category
                  <span className="loan-form-required">*</span>
                </label>
                <select
                  value={loanForm.category}
                  onChange={(e) => setLoanForm({ ...loanForm, category: e.target.value })}
                  required
                  className="loan-select"
                >
                  <option value="">Select category</option>
                  {loanCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Amount & Interest Row */}
              <div className="loan-form-row">
                <div className="loan-form-group">
                  <label>
                    Total Amount
                    <span className="loan-form-required">*</span>
                  </label>
                  <div className="loan-input-wrapper">
                    <BanknotesIcon className="loan-input-icon" />
                    <input
                      type="number"
                      placeholder="0.00"
                      value={loanForm.total_amount}
                      onChange={(e) => setLoanForm({ ...loanForm, total_amount: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      className="loan-input with-icon"
                    />
                  </div>
                </div>
                <div className="loan-form-group">
                  <label>Interest Rate (%)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={loanForm.interest_rate}
                    onChange={(e) => setLoanForm({ ...loanForm, interest_rate: e.target.value })}
                    min="0"
                    step="0.01"
                    className="loan-input"
                  />
                </div>
              </div>

              {/* Term & Monthly Payment Row */}
              <div className="loan-form-row">
                <div className="loan-form-group">
                  <label>Term (months)</label>
                  <input
                    type="number"
                    placeholder="Leave blank for no schedule"
                    value={loanForm.term_months}
                    onChange={(e) => setLoanForm({ ...loanForm, term_months: e.target.value })}
                    min="1"
                    className="loan-input"
                  />
                  <small className="loan-form-hint">Leave empty for pay anytime</small>
                </div>
                <div className="loan-form-group">
                  <label>Monthly Payment</label>
                  <div className="loan-input-wrapper">
                    <BanknotesIcon className="loan-input-icon" />
                    <input
                      type="number"
                      placeholder="0.00"
                      value={loanForm.monthly_payment}
                      onChange={(e) => setLoanForm({ ...loanForm, monthly_payment: e.target.value })}
                      min="0"
                      step="0.01"
                      className="loan-input with-icon"
                    />
                  </div>
                </div>
              </div>

              {/* Dates Row */}
              <div className="loan-form-row">
                <div className="loan-form-group">
                  <label>
                    Start Date
                    <span className="loan-form-required">*</span>
                  </label>
                  <div className="loan-input-wrapper">
                    <CalendarIcon className="loan-input-icon" />
                    <input
                      type="date"
                      value={loanForm.start_date}
                      onChange={(e) => setLoanForm({ ...loanForm, start_date: e.target.value })}
                      required
                      className="loan-input with-icon"
                    />
                  </div>
                </div>
                <div className="loan-form-group">
                  <label>End Date</label>
                  <div className="loan-input-wrapper">
                    <CalendarIcon className="loan-input-icon" />
                    <input
                      type="date"
                      value={loanForm.end_date}
                      onChange={(e) => setLoanForm({ ...loanForm, end_date: e.target.value })}
                      className="loan-input with-icon"
                    />
                  </div>
                </div>
              </div>

              {/* Frequency & Status Row */}
              <div className="loan-form-row">
                <div className="loan-form-group">
                  <label>
                    Payment Frequency
                    <span className="loan-form-required">*</span>
                  </label>
                  <select
                    value={loanForm.payment_frequency}
                    onChange={(e) => setLoanForm({ ...loanForm, payment_frequency: e.target.value })}
                    required
                    className="loan-select"
                  >
                    {frequencies.map(freq => (
                      <option key={freq} value={freq}>
                        {freq === 'no schedule' ? 'No Schedule (Pay Anytime)' : freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="loan-form-group">
                  <label>
                    Status
                    <span className="loan-form-required">*</span>
                  </label>
                  <select
                    value={loanForm.status}
                    onChange={(e) => setLoanForm({ ...loanForm, status: e.target.value })}
                    required
                    className="loan-select"
                  >
                    <option value="active">Active</option>
                    <option value="paid">Paid</option>
                    <option value="defaulted">Defaulted</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="loan-form-group">
                <label>Notes (optional)</label>
                <input
                  type="text"
                  placeholder="Additional notes about this loan..."
                  value={loanForm.notes}
                  onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                  className="loan-input"
                />
              </div>

              {/* Footer */}
              <div className="loan-modal-footer">
                <button type="button" className="loan-modal-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="loan-modal-submit">
                  {editingItem ? 'Update Loan' : 'Add Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Summary stats
  const totalLoans = loans.length;
  const totalLoanAmount = loans.reduce((sum, l) => sum + l.total_amount, 0);
  const totalPaidAll = loans.reduce((sum, l) => sum + (l.total_paid || 0), 0);
  const totalRemaining = totalLoanAmount - totalPaidAll;
  const activeLoans = loans.filter(l => l.status === 'active').length;
  const paidLoans = loans.filter(l => l.status === 'paid').length;
  const defaultedLoans = loans.filter(l => l.status === 'defaulted').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="finance-loans-view"
    >
      {/* Header */}
      <div className="finance-view-header">
        <div>
          <h2>Loans Tracker</h2>
          <p className="finance-view-subtitle">Manage and track all your loans in one place</p>
        </div>
        <button className="finance-add-btn" onClick={openAdd}>
          <PlusCircleIcon className="finance-add-btn-icon" />
          Add Loan
        </button>
      </div>

      {/* Summary Stats */}
      {loans.length > 0 && (
        <div className="finance-loans-stats">
          <div className="finance-stat-card-mini">
            <div className="finance-stat-mini-icon loans-total">
              <BanknotesIcon className="stat-mini-svg" />
            </div>
            <div>
              <p className="stat-mini-label">Total Loans</p>
              <p className="stat-mini-value">{totalLoans}</p>
            </div>
          </div>
          <div className="finance-stat-card-mini">
            <div className="finance-stat-mini-icon active">
              <CheckCircleIcon className="stat-mini-svg" />
            </div>
            <div>
              <p className="stat-mini-label">Active</p>
              <p className="stat-mini-value">{activeLoans}</p>
            </div>
          </div>
          <div className="finance-stat-card-mini">
            <div className="finance-stat-mini-icon paid">
              <CheckCircleIcon className="stat-mini-svg" />
            </div>
            <div>
              <p className="stat-mini-label">Paid</p>
              <p className="stat-mini-value">{paidLoans}</p>
            </div>
          </div>
          <div className="finance-stat-card-mini">
            <div className="finance-stat-mini-icon amount">
              <ArrowTrendingDownIcon className="stat-mini-svg" />
            </div>
            <div>
              <p className="stat-mini-label">Total Remaining</p>
              <p className="stat-mini-value">{formatCurrency(totalRemaining)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loans Grid */}
      <div className="finance-loans-grid">
        {loans.map((loan) => {
          const progress = getProgress(loan);
          const statusColor = getStatusColor(loan.status);
          const totalPaid = loan.total_paid || 0;
          const remaining = loan.total_amount - totalPaid;
          const isNoSchedule = loan.payment_frequency === 'no schedule';

          return (
            <motion.div 
              key={loan.id} 
              className="finance-loan-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -4 }}
            >
              <div className="finance-loan-header">
                <div className="finance-loan-title">
                  <div className="finance-loan-icon-wrapper">
                    <BanknotesIcon className="finance-loan-icon" />
                  </div>
                  <div>
                    <h3>{loan.name}</h3>
                    <span className="finance-loan-category">{loan.category}</span>
                  </div>
                </div>
                <span 
                  className={`finance-loan-status ${loan.status}`}
                  style={{ borderColor: statusColor }}
                >
                  {getStatusIcon(loan.status)}
                  {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                </span>
              </div>

              <div className="finance-loan-details">
                <div className="finance-loan-detail-row">
                  <div className="finance-loan-detail-item">
                    <span className="detail-label">Total Amount</span>
                    <span className="detail-value amount">{formatCurrency(loan.total_amount)}</span>
                  </div>
                  <div className="finance-loan-detail-item">
                    <span className="detail-label">Paid</span>
                    <span className="detail-value paid">{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="finance-loan-detail-item">
                    <span className="detail-label">Remaining</span>
                    <span className="detail-value remaining">{formatCurrency(remaining)}</span>
                  </div>
                </div>

                {loan.interest_rate > 0 && (
                  <div className="finance-loan-detail-row small">
                    <div className="finance-loan-detail-item">
                      <span className="detail-label">Interest Rate</span>
                      <span className="detail-value">{loan.interest_rate}%</span>
                    </div>
                    {loan.monthly_payment > 0 && (
                      <div className="finance-loan-detail-item">
                        <span className="detail-label">Monthly Payment</span>
                        <span className="detail-value">{formatCurrency(loan.monthly_payment)}</span>
                      </div>
                    )}
                    <div className="finance-loan-detail-item">
                      <span className="detail-label">Frequency</span>
                      <span className="detail-value">{getFrequencyDisplay(loan.payment_frequency)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="finance-loan-progress">
                <div className="finance-loan-progress-header">
                  <span>Repayment Progress</span>
                  <span className="progress-percentage">{progress.toFixed(0)}%</span>
                </div>
                <div className="finance-progress-bar-track">
                  <div
                    className={`finance-progress-fill ${progress >= 100 ? 'completed' : ''}`}
                    style={{ 
                      width: `${Math.min(progress, 100)}%`,
                      background: progress >= 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))'
                    }}
                  />
                </div>
              </div>

              <div className="finance-loan-actions">
                <button 
                  className="finance-action-btn pay" 
                  onClick={() => openPaymentModal(loan)}
                  title="Record Payment"
                >
                  <CreditCardIcon className="finance-action-icon" />
                  <span>Pay</span>
                </button>
                <button 
                  className="finance-action-btn history" 
                  onClick={() => openHistoryModal(loan)}
                  title="View Payment History"
                >
                  <ClockIcon className="finance-action-icon" />
                  <span>History</span>
                </button>
                <button 
                  className="finance-action-btn transactions" 
                  onClick={() => viewLoanTransactions(loan)}
                  title="View Transactions"
                >
                  <DocumentTextIcon className="finance-action-icon" />
                  <span>View Tx</span>
                </button>
                <button className="finance-action-btn edit" onClick={() => openEdit(loan)}>
                  <PencilSquareIcon className="finance-action-icon" />
                  <span>Edit</span>
                </button>
                <button className="finance-action-btn delete" onClick={() => handleDelete(loan.id)}>
                  <TrashIcon className="finance-action-icon" />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {loans.length === 0 && (
        <div className="finance-placeholder">
          <BanknotesIcon className="placeholder-icon" />
          <h3>No loans added yet</h3>
          <p>Click "Add Loan" to start tracking your loans.</p>
        </div>
      )}

      {loading && <div className="finance-loading">Loading...</div>}

      {/* Loan Modal */}
      {renderLoanModal()}

      {/* Payment Modal */}
      <LoanPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        loan={selectedLoan}
        onPay={handlePayment}
        isProcessing={isProcessing}
      />

      {/* History Modal */}
      {renderHistoryModal()}

      <style>{`
        .finance-loans-view {
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
          white-space: nowrap;
        }

        .finance-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .finance-add-btn-icon {
          width: 1.125rem;
          height: 1.125rem;
        }

        /* Stats */
        .finance-loans-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .finance-stat-card-mini {
          background: var(--card-bg, #ffffff);
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          border: 1px solid var(--border-color, #e2e8f0);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.2s;
        }

        .finance-stat-card-mini:hover {
          box-shadow: var(--shadow-md);
        }

        .finance-stat-mini-icon {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 0.625rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .finance-stat-mini-icon.loans-total {
          background: rgba(102, 126, 234, 0.1);
        }

        .finance-stat-mini-icon.active {
          background: rgba(59, 130, 246, 0.1);
        }

        .finance-stat-mini-icon.paid {
          background: rgba(16, 185, 129, 0.1);
        }

        .finance-stat-mini-icon.amount {
          background: rgba(239, 68, 68, 0.1);
        }

        .stat-mini-svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .finance-stat-mini-icon.loans-total .stat-mini-svg {
          color: #667eea;
        }

        .finance-stat-mini-icon.active .stat-mini-svg {
          color: #3b82f6;
        }

        .finance-stat-mini-icon.paid .stat-mini-svg {
          color: #10b981;
        }

        .finance-stat-mini-icon.amount .stat-mini-svg {
          color: #ef4444;
        }

        .stat-mini-label {
          font-size: 0.75rem;
          color: var(--text-secondary, #64748b);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-mini-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          line-height: 1.2;
        }

        /* Loans Grid */
        .finance-loans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 1.25rem;
        }

        .finance-loan-item {
          background: var(--card-bg, #ffffff);
          border-radius: 1rem;
          padding: 1.25rem;
          border: 1px solid var(--border-color, #e2e8f0);
          transition: all 0.3s;
          position: relative;
        }

        .finance-loan-item:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
        }

        .dark .finance-loan-item:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }

        .finance-loan-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .finance-loan-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .finance-loan-icon-wrapper {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.625rem;
          background: rgba(102, 126, 234, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .finance-loan-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: var(--gradient-start, #667eea);
        }

        .finance-loan-title h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin: 0;
        }

        .finance-loan-category {
          font-size: 0.75rem;
          color: var(--text-secondary, #64748b);
        }

        .finance-loan-status {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          border: 2px solid;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        .finance-loan-status.active {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.08);
        }

        .finance-loan-status.paid {
          color: #10b981;
          background: rgba(16, 185, 129, 0.08);
        }

        .finance-loan-status.defaulted {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }

        .status-dot {
          width: 0.4rem;
          height: 0.4rem;
          border-radius: 50%;
          display: inline-block;
        }

        .status-dot.active {
          background: #3b82f6;
        }

        .status-dot.paid {
          background: #10b981;
        }

        .status-dot.defaulted {
          background: #ef4444;
        }

        /* Loan Details */
        .finance-loan-details {
          margin-bottom: 1rem;
        }

        .finance-loan-detail-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .finance-loan-detail-row.small {
          grid-template-columns: 1fr 1fr 1fr;
        }

        .finance-loan-detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .detail-label {
          font-size: 0.65rem;
          color: var(--text-secondary, #64748b);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detail-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .detail-value.amount {
          color: var(--gradient-start, #667eea);
        }

        .detail-value.paid {
          color: #10b981;
        }

        .detail-value.remaining {
          color: #ef4444;
        }

        .finance-no-schedule {
          color: #f59e0b !important;
          font-weight: 500 !important;
          font-style: italic;
          font-size: 0.75rem;
        }

        /* Progress Bar */
        .finance-loan-progress {
          margin-bottom: 1rem;
          padding: 0.75rem 0;
          border-top: 1px solid var(--border-color, #e2e8f0);
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .finance-loan-progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-secondary, #64748b);
          margin-bottom: 0.375rem;
        }

        .progress-percentage {
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .finance-progress-bar-track {
          width: 100%;
          height: 6px;
          background: var(--bg-primary, #f1f5f9);
          border-radius: 6px;
          overflow: hidden;
        }

        .finance-progress-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .finance-progress-fill.completed {
          background: linear-gradient(90deg, #10b981, #34d399);
        }

        /* Actions */
        .finance-loan-actions {
          display: flex;
          gap: 0.25rem;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .finance-action-btn {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.6rem;
          background: none;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.7rem;
          font-weight: 500;
          color: var(--text-secondary, #64748b);
        }

        .finance-action-btn span {
          display: none;
        }

        .finance-action-btn:hover span {
          display: inline;
        }

        .finance-action-btn .finance-action-icon {
          width: 0.9rem;
          height: 0.9rem;
          color: var(--text-secondary, #64748b);
        }

        .finance-action-btn.pay:hover {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .finance-action-btn.pay:hover .finance-action-icon {
          color: #10b981;
        }

        .finance-action-btn.history:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .finance-action-btn.history:hover .finance-action-icon {
          color: #3b82f6;
        }

        .finance-action-btn.transactions:hover {
          background: rgba(102, 126, 234, 0.1);
          color: var(--gradient-start, #667eea);
        }

        .finance-action-btn.transactions:hover .finance-action-icon {
          color: var(--gradient-start, #667eea);
        }

        .finance-action-btn.edit:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .finance-action-btn.edit:hover .finance-action-icon {
          color: #3b82f6;
        }

        .finance-action-btn.delete:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .finance-action-btn.delete:hover .finance-action-icon {
          color: #ef4444;
        }

        .finance-placeholder {
          padding: 4rem 2rem;
          text-align: center;
          color: var(--text-secondary, #64748b);
        }

        .placeholder-icon {
          width: 4rem;
          height: 4rem;
          margin: 0 auto 1rem;
          color: var(--text-tertiary, #94a3b8);
          opacity: 0.5;
        }

        .finance-placeholder h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin-bottom: 0.25rem;
        }

        .finance-placeholder p {
          font-size: 0.875rem;
        }

        .finance-loading {
          text-align: center;
          padding: 1rem;
          color: var(--text-secondary, #64748b);
        }

        /* ===== LOAN MODAL ===== */
        .loan-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 1.5rem;
          animation: fadeIn 0.25s ease;
        }

        .loan-modal-container {
          background: var(--card-bg, #ffffff);
          border-radius: 1.25rem;
          max-width: 560px;
          width: 100%;
          max-height: 95vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }

        .dark .loan-modal-container {
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
        }

        .loan-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          flex-shrink: 0;
        }

        .loan-modal-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .loan-modal-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: var(--gradient-start, #667eea);
          background: rgba(102, 126, 234, 0.1);
          padding: 0.5rem;
          border-radius: 0.5rem;
        }

        .loan-modal-title h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin: 0;
          line-height: 1.2;
        }

        .loan-modal-subtitle {
          font-size: 0.8rem;
          color: var(--text-secondary, #64748b);
          margin: 0;
        }

        .loan-modal-close {
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

        .loan-modal-close:hover {
          background: var(--hover-bg, #f1f5f9);
          color: var(--text-primary, #0f172a);
        }

        .loan-modal-close svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .loan-modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .loan-form-group {
          margin-bottom: 1rem;
        }

        .loan-form-group label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin-bottom: 0.25rem;
        }

        .loan-form-required {
          color: #ef4444;
          margin-left: 0.125rem;
        }

        .loan-input-wrapper {
          position: relative;
        }

        .loan-input {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: 1.5px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-primary, #0f172a);
          background: var(--bg-primary, #f8fafc);
          transition: all 0.2s;
        }

        .loan-input:focus {
          outline: none;
          border-color: var(--gradient-start, #667eea);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          background: var(--card-bg, #ffffff);
        }

        .loan-input.with-icon {
          padding-left: 2.25rem;
        }

        .loan-input-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1rem;
          height: 1rem;
          color: var(--text-tertiary, #94a3b8);
        }

        .loan-select {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: 1.5px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-primary, #0f172a);
          background: var(--bg-primary, #f8fafc);
          transition: all 0.2s;
          appearance: none;
          cursor: pointer;
        }

        .loan-select:focus {
          outline: none;
          border-color: var(--gradient-start, #667eea);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .loan-form-hint {
          display: block;
          font-size: 0.7rem;
          color: var(--text-secondary, #64748b);
          margin-top: 0.25rem;
        }

        .loan-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .loan-modal-footer {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color, #e2e8f0);
          margin-top: 0.5rem;
        }

        .loan-modal-cancel {
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

        .loan-modal-cancel:hover {
          background: var(--hover-bg, #e2e8f0);
        }

        .loan-modal-submit {
          padding: 0.5rem 1.5rem;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .loan-modal-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);
        }

        .loan-modal-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ===== HISTORY MODAL ===== */
        .history-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 1.5rem;
          animation: fadeIn 0.2s ease;
        }

        .history-modal-container {
          background: var(--card-bg, #ffffff);
          border-radius: 1.25rem;
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.25s ease;
          overflow: hidden;
        }

        .history-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          flex-shrink: 0;
        }

        .history-modal-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin: 0;
        }

        .history-modal-close {
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

        .history-modal-close:hover {
          background: var(--hover-bg, #f1f5f9);
          color: var(--text-primary, #0f172a);
        }

        .history-modal-close svg {
          width: 1.5rem;
          height: 1.5rem;
        }

        .history-modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .history-list {
          max-height: 350px;
          overflow-y: auto;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
        }

        .history-list::-webkit-scrollbar {
          width: 4px;
        }

        .history-list::-webkit-scrollbar-track {
          background: var(--bg-primary, #f1f5f9);
          border-radius: 2px;
        }

        .history-list::-webkit-scrollbar-thumb {
          background: var(--gradient-start, #667eea);
          border-radius: 2px;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .history-table th {
          padding: 0.5rem 0.75rem;
          text-align: left;
          background: var(--bg-primary, #f8fafc);
          border-bottom: 2px solid var(--border-color, #e2e8f0);
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .history-table td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .history-table tr:hover {
          background: var(--hover-bg, #f1f5f9);
        }

        .history-delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.375rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .history-delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .history-delete-icon {
          width: 1rem;
          height: 1rem;
          color: var(--text-secondary, #64748b);
        }

        .history-delete-btn:hover .history-delete-icon {
          color: #ef4444;
        }

        .history-empty {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary, #64748b);
        }

        .history-empty-icon {
          width: 3rem;
          height: 3rem;
          margin: 0 auto 0.5rem;
          color: var(--text-tertiary, #94a3b8);
        }

        .history-loading {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary, #64748b);
        }

        .history-summary {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          margin-top: 0.75rem;
          border-top: 1px solid var(--border-color, #e2e8f0);
          font-size: 0.875rem;
          color: var(--text-secondary, #64748b);
          font-weight: 500;
        }

        .history-modal-footer {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color, #e2e8f0);
          margin-top: 1rem;
        }

        .history-modal-close-btn {
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

        .history-modal-close-btn:hover {
          background: var(--hover-bg, #e2e8f0);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 992px) {
          .finance-loans-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .finance-view-header {
            flex-direction: column;
            align-items: stretch;
          }

          .finance-loans-grid {
            grid-template-columns: 1fr;
          }

          .loan-form-row {
            grid-template-columns: 1fr;
          }

          .finance-loan-item {
            padding: 1rem;
          }

          .finance-loan-header {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .finance-loan-detail-row {
            grid-template-columns: 1fr 1fr;
          }

          .finance-loan-detail-row.small {
            grid-template-columns: 1fr 1fr;
          }

          .finance-loans-stats {
            grid-template-columns: 1fr 1fr;
          }

          .loan-modal-container {
            max-width: 100%;
            margin: 0.5rem;
            max-height: 95vh;
          }

          .loan-modal-body {
            padding: 1rem;
          }

          .loan-modal-header {
            padding: 0.75rem 1rem;
          }

          .loan-modal-header h3 {
            font-size: 1rem;
          }

          .history-modal-container {
            max-width: 100%;
            margin: 0.5rem;
            max-height: 95vh;
          }

          .history-modal-body {
            padding: 1rem;
          }

          .history-modal-header {
            padding: 0.75rem 1rem;
          }

          .history-modal-header h3 {
            font-size: 1rem;
          }

          .history-table {
            font-size: 0.75rem;
          }

          .history-table th,
          .history-table td {
            padding: 0.3rem 0.4rem;
          }

          .history-modal-footer {
            flex-direction: column;
          }

          .history-modal-footer button {
            width: 100%;
            justify-content: center;
          }

          .finance-action-btn span {
            display: inline;
          }

          .finance-loan-actions {
            gap: 0.15rem;
          }

          .finance-action-btn {
            padding: 0.25rem 0.4rem;
            font-size: 0.65rem;
          }

          .finance-action-btn .finance-action-icon {
            width: 0.8rem;
            height: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .finance-loans-stats {
            grid-template-columns: 1fr;
          }

          .finance-loan-detail-row {
            grid-template-columns: 1fr;
          }

          .finance-loan-detail-row.small {
            grid-template-columns: 1fr;
          }

          .finance-loan-title h3 {
            font-size: 0.95rem;
          }

          .loan-modal-overlay {
            padding: 0.5rem;
          }

          .history-modal-overlay {
            padding: 0.5rem;
          }

          .loan-modal-footer {
            flex-direction: column;
          }

          .loan-modal-footer button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Loans;