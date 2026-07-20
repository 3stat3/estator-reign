// src/components/PersonalTools/Transactions.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import Modal from './Modal';

const Transactions = ({ finance, filterBill = null, clearFilter = null }) => {
  const {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    loadAllData,
  } = finance;

  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    type: 'expense',
    amount: '',
  });

  // Bulk states
  const [bulkItems, setBulkItems] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bulkTab, setBulkTab] = useState('add');
  const fileInputRef = useRef(null);

  // Apply filter when coming from Bills
  useEffect(() => {
    if (filterBill) {
      setFilterCategory(filterBill.category || 'all');
      setSearchQuery(filterBill.name || '');
    }
  }, [filterBill]);

  const expenseCategories = [
    'Food', 'Housing', 'Transportation', 'Utilities',
    'Healthcare', 'Entertainment', 'Shopping', 'Education',
    'Insurance', 'Debt Payment', 'Savings', 'Investments',
    'Gifts & Donations', 'Personal Care', 'Subscriptions'
  ];

  const incomeCategories = [
    'Salary', 'Side Hustle', 'Investment Income', 'Rental Income'
  ];

  const allCategories = [...incomeCategories, ...expenseCategories];

  const isFiltered = filterBill !== null;

  // ========== SINGLE TRANSACTION CRUD ==========
  const openAdd = () => {
    setEditingItem(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: '',
      type: 'expense',
      amount: '',
    });
    setShowModal(true);
  };

  const openEdit = (transaction) => {
    setEditingItem(transaction);
    setFormData({
      date: transaction.date,
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      amount: transaction.amount.toString(),
    });
    setShowModal(true);
  };

  const openBulkModal = () => {
    const initialRows = [
      {
        id: Date.now() + Math.random(),
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        type: 'expense',
        amount: '',
        notes: '',
        isValid: false,
      },
      {
        id: Date.now() + Math.random() + 1,
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        type: 'expense',
        amount: '',
        notes: '',
        isValid: false,
      },
    ];
    setBulkItems(initialRows);
    setBulkErrors([]);
    setUploadProgress(0);
    setBulkTab('add');
    setShowBulkModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...formData, amount: parseFloat(formData.amount) };

    const toastId = toast.loading(editingItem ? 'Updating transaction...' : 'Adding transaction...');

    let result;
    if (editingItem) {
      result = await updateTransaction(editingItem.id, data);
    } else {
      result = await addTransaction(data);
    }

    toast.dismiss(toastId);

    if (result.success) {
      toast.success(editingItem ? 'Transaction updated successfully! ✅' : 'Transaction added successfully! ✅');
      setShowModal(false);
      loadAllData();
    } else {
      toast.error(result.error || 'Failed to save transaction ❌');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    const toastId = toast.loading('Deleting transaction...');
    const result = await deleteTransaction(id);
    toast.dismiss(toastId);

    if (result.success) {
      toast.success('Transaction deleted successfully! 🗑️');
      loadAllData();
    } else {
      toast.error(result.error || 'Failed to delete transaction ❌');
    }
  };

  // ========== BULK ADD FUNCTIONS ==========

  const addBulkRow = () => {
    const newRow = {
      id: Date.now() + Math.random(),
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: '',
      type: 'expense',
      amount: '',
      notes: '',
      isValid: false,
    };
    setBulkItems([...bulkItems, newRow]);
  };

  const updateBulkRow = (id, field, value) => {
    setBulkItems(items => {
      const updatedItems = items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          updated.isValid = validateRow(updated);
          return updated;
        }
        return item;
      });

      const lastRow = updatedItems[updatedItems.length - 1];
      if (lastRow && lastRow.isValid) {
        const newRow = {
          id: Date.now() + Math.random(),
          date: new Date().toISOString().split('T')[0],
          description: '',
          category: '',
          type: 'expense',
          amount: '',
          notes: '',
          isValid: false,
        };
        return [...updatedItems, newRow];
      }

      return updatedItems;
    });
  };

  const removeBulkRow = (id) => {
    if (bulkItems.length <= 1) {
      toast.error('You need at least one row!');
      return;
    }
    setBulkItems(items => items.filter(item => item.id !== id));
  };

  const clearBulkRows = () => {
    if (bulkItems.length > 0 && !confirm('Clear all rows?')) return;
    setBulkItems([]);
    setBulkErrors([]);
  };

  const validateRow = (row) => {
    const errors = [];
    if (!row.date) errors.push('Date is required');
    if (!row.description || row.description.trim() === '') errors.push('Description is required');
    if (!row.category) errors.push('Category is required');
    if (!row.type) errors.push('Type is required');
    if (!row.amount || isNaN(parseFloat(row.amount)) || parseFloat(row.amount) <= 0) {
      errors.push('Amount must be a positive number');
    }
    return errors.length === 0;
  };

  const handleBulkSubmit = async () => {
    const validItems = bulkItems.filter(item => 
      item.description.trim() !== '' || 
      item.category !== '' || 
      item.amount !== ''
    );

    if (validItems.length === 0) {
      toast.error('No transactions to add. Please add at least one transaction. ❌');
      return;
    }

    const invalidRows = validItems.filter(item => !validateRow(item));
    if (invalidRows.length > 0) {
      toast.error(`Please fix ${invalidRows.length} invalid row(s) before submitting ❌`);
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    const totalItems = validItems.length;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < totalItems; i++) {
      const item = validItems[i];
      const data = {
        date: item.date,
        description: item.description,
        category: item.category,
        type: item.type,
        amount: parseFloat(item.amount),
        notes: item.notes || '',
      };

      const result = await addTransaction(data);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        console.error(`Error adding row ${i + 1}:`, result.error);
      }

      setUploadProgress(Math.round(((i + 1) / totalItems) * 100));
    }

    setIsProcessing(false);

    if (successCount > 0) {
      toast.success(`✅ ${successCount} transactions added successfully!`);
      if (errorCount > 0) {
        toast.error(`⚠️ ${errorCount} transactions failed to add.`);
      }
      setShowBulkModal(false);
      loadAllData();
    } else {
      toast.error('❌ Failed to add any transactions. Please check your data.');
    }
  };

  // ========== BULK UPLOAD FUNCTIONS ==========

  const downloadTemplate = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Notes'];
    const sampleRow = ['2026-07-19', 'Sample Transaction', 'Food', 'expense', '1000.00', 'Optional notes'];
    const sampleRow2 = ['2026-07-19', 'Sample Income', 'Salary', 'income', '50000.00', ''];

    const csvContent = [
      headers.join(','),
      sampleRow.join(','),
      sampleRow2.join(','),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Template downloaded! 📥');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error('File is empty or invalid ❌');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const expectedHeaders = ['date', 'description', 'category', 'type', 'amount', 'notes'];
        
        const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          toast.error(`Missing columns: ${missingHeaders.join(', ')} ❌`);
          return;
        }

        const parsedItems = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          const newItem = {
            id: Date.now() + Math.random() + i,
            date: row.date || new Date().toISOString().split('T')[0],
            description: row.description || '',
            category: row.category || '',
            type: (row.type || 'expense').toLowerCase(),
            amount: row.amount || '',
            notes: row.notes || '',
            isValid: false,
          };

          const isValid = validateRow(newItem);
          newItem.isValid = isValid;

          if (!isValid) {
            errors.push({ row: i + 1, data: newItem });
          }

          parsedItems.push(newItem);
        }

        if (parsedItems.length === 0) {
          toast.error('No valid data found in file ❌');
          return;
        }

        setBulkItems(parsedItems);
        if (errors.length > 0) {
          toast.warning(`⚠️ ${errors.length} rows have validation issues. Please review them.`);
        } else {
          toast.success(`✅ ${parsedItems.length} transactions loaded from file!`);
        }
      } catch (error) {
        toast.error('Failed to parse file. Please check the format. ❌');
        console.error('File parse error:', error);
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  // ========== FILTER TRANSACTIONS ==========
  const getFilteredTransactions = () => {
    let filtered = transactions;
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }
    return filtered;
  };

  const filtered = getFilteredTransactions();

  // ========== RENDER: BULK MODAL ==========
  const renderBulkModal = () => {
    if (!showBulkModal) return null;

    const nonEmptyRows = bulkItems.filter(item => 
      item.description.trim() !== '' || 
      item.category !== '' || 
      item.amount !== ''
    );
    const isValid = nonEmptyRows.every(item => validateRow(item));
    const hasItems = nonEmptyRows.length > 0;

    return (
      <div className="bulk-modal-overlay" onClick={() => setShowBulkModal(false)}>
        <div className="bulk-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="bulk-modal-header">
            <h3>Bulk Add Transactions</h3>
            <button className="bulk-modal-close" onClick={() => setShowBulkModal(false)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="bulk-modal-body">
            <div className="bulk-tabs">
              <button
                className={`bulk-tab ${bulkTab === 'add' ? 'active' : ''}`}
                onClick={() => setBulkTab('add')}
              >
                <PlusIcon className="bulk-tab-icon" />
                Manual Add
              </button>
              <button
                className={`bulk-tab ${bulkTab === 'upload' ? 'active' : ''}`}
                onClick={() => setBulkTab('upload')}
              >
                <ArrowUpTrayIcon className="bulk-tab-icon" />
                Upload CSV
              </button>
            </div>

            {bulkTab === 'add' ? (
              <>
                <div className="bulk-actions">
                  <button className="bulk-add-row-btn" onClick={addBulkRow}>
                    <PlusCircleIcon className="bulk-add-row-icon" />
                    Add Row
                  </button>
                  {bulkItems.length > 0 && (
                    <button className="bulk-clear-btn" onClick={clearBulkRows}>
                      <XMarkIcon className="bulk-clear-icon" />
                      Clear All
                    </button>
                  )}
                </div>

                <div className="bulk-table-container">
                  <table className="bulk-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Amount (₱)</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkItems.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="bulk-empty">
                            <p>No transactions added yet.</p>
                            <p className="bulk-empty-sub">Click "Add Row" to start adding transactions.</p>
                          </td>
                        </tr>
                      ) : (
                        bulkItems.map((item, index) => {
                          const isValidRow = validateRow(item);
                          const isEmpty = item.description.trim() === '' && 
                                         item.category === '' && 
                                         item.amount === '';
                          const showStatus = !isEmpty;
                          return (
                            <tr key={item.id} className={!isValidRow && !isEmpty ? 'bulk-row-invalid' : ''}>
                              <td>{index + 1}</td>
                              <td>
                                <input
                                  type="date"
                                  value={item.date}
                                  onChange={(e) => updateBulkRow(item.id, 'date', e.target.value)}
                                  className="bulk-input date-input"
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  placeholder="Description"
                                  value={item.description}
                                  onChange={(e) => updateBulkRow(item.id, 'description', e.target.value)}
                                  className="bulk-input"
                                />
                              </td>
                              <td>
                                <select
                                  value={item.category}
                                  onChange={(e) => updateBulkRow(item.id, 'category', e.target.value)}
                                  className="bulk-select"
                                >
                                  <option value="">Select</option>
                                  {allCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <select
                                  value={item.type}
                                  onChange={(e) => updateBulkRow(item.id, 'type', e.target.value)}
                                  className={`bulk-select type-select ${item.type}`}
                                >
                                  <option value="expense">Expense</option>
                                  <option value="income">Income</option>
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  value={item.amount}
                                  onChange={(e) => updateBulkRow(item.id, 'amount', e.target.value)}
                                  className="bulk-input amount-input"
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td>
                                {showStatus && isValidRow && (
                                  <CheckCircleIcon className="bulk-status valid" />
                                )}
                                {showStatus && !isValidRow && (
                                  <ExclamationTriangleIcon className="bulk-status invalid" />
                                )}
                                {!showStatus && (
                                  <span className="bulk-status-empty">-</span>
                                )}
                              </td>
                              <td>
                                <button
                                  className="bulk-remove-btn"
                                  onClick={() => removeBulkRow(item.id)}
                                >
                                  <XMarkIcon className="bulk-remove-icon" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {bulkItems.length > 0 && (
                  <div className="bulk-summary">
                    <span>Total: {bulkItems.length} row(s)</span>
                    <span className={isValid && hasItems ? 'text-success' : 'text-warning'}>
                      {hasItems && isValid ? '✅ All rows valid' : hasItems ? '⚠️ Some rows need attention' : 'Add transactions to submit'}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="bulk-upload-section">
                <div className="bulk-upload-area">
                  <ArrowUpTrayIcon className="bulk-upload-icon" />
                  <p className="bulk-upload-text">Upload CSV file to import transactions</p>
                  <p className="bulk-upload-subtext">Supports .csv files with columns: Date, Description, Category, Type, Amount, Notes</p>
                  <div className="bulk-upload-actions">
                    <button className="bulk-template-btn" onClick={downloadTemplate}>
                      <ArrowDownTrayIcon className="bulk-template-icon" />
                      Download Template
                    </button>
                    <label className="bulk-upload-btn">
                      <ArrowUpTrayIcon className="bulk-upload-btn-icon" />
                      Choose File
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv"
                        hidden
                      />
                    </label>
                  </div>
                </div>

                {bulkItems.length > 0 && (
                  <div className="bulk-upload-preview">
                    <h4>Preview ({bulkItems.length} rows loaded)</h4>
                    <div className="bulk-upload-preview-table">
                      <table className="bulk-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkItems.slice(0, 10).map((item, index) => {
                            const isValidRow = validateRow(item);
                            return (
                              <tr key={item.id} className={!isValidRow ? 'bulk-row-invalid' : ''}>
                                <td>{index + 1}</td>
                                <td>{item.date}</td>
                                <td>{item.description}</td>
                                <td>{item.category}</td>
                                <td>
                                  <span className={`bulk-type-badge ${item.type}`}>
                                    {item.type}
                                  </span>
                                </td>
                                <td>₱{item.amount || '0.00'}</td>
                                <td>
                                  {isValidRow ? (
                                    <CheckCircleIcon className="bulk-status valid" />
                                  ) : (
                                    <ExclamationTriangleIcon className="bulk-status invalid" />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {bulkItems.length > 10 && (
                        <p className="bulk-more-rows">... and {bulkItems.length - 10} more rows</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bulk-upload-notes">
                  <h4>📝 Notes:</h4>
                  <ul>
                    <li>Date format: YYYY-MM-DD (e.g., 2026-07-19)</li>
                    <li>Type must be: "income" or "expense" (lowercase)</li>
                    <li>Amount: numbers only (e.g., 1000.00)</li>
                    <li>Category must match existing categories</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="bulk-modal-footer">
              <button type="button" className="bulk-modal-cancel" onClick={() => setShowBulkModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="bulk-modal-submit"
                onClick={handleBulkSubmit}
                disabled={!hasItems || !isValid || isProcessing}
              >
                {isProcessing ? (
                  <>Processing... {uploadProgress}%</>
                ) : (
                  `${bulkTab === 'add' ? 'Add' : 'Import'} ${bulkItems.filter(item => 
                    item.description.trim() !== '' || 
                    item.category !== '' || 
                    item.amount !== ''
                  ).length} Transaction(s)`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="finance-transactions-view"
    >
      <div className="finance-view-header">
        <h2>Transactions</h2>
        <div className="finance-header-actions">
          <button className="finance-add-btn bulk" onClick={openBulkModal}>
            <ArrowUpTrayIcon className="finance-add-btn-icon" />
            Bulk Add
          </button>
          <button className="finance-add-btn" onClick={openAdd}>
            <PlusCircleIcon className="finance-add-btn-icon" />
            Add Transaction
          </button>
        </div>
      </div>

      <div className="finance-transactions-filters">
        <div className="finance-search-box">
          <MagnifyingGlassIcon className="finance-search-icon" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {isFiltered && (
          <div className="finance-filter-badge">
            <span>🔍 Filtering: {filterBill?.name}</span>
            <button 
              className="finance-filter-clear" 
              onClick={clearFilter}
              title="Clear filter"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="finance-filter-actions">
          <select
            className="finance-filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            className="finance-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      </div>

      <div className="finance-transactions-table-container">
        <table className="finance-transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.date}</td>
                <td>{transaction.description}</td>
                <td><span className="finance-category-badge">{transaction.category}</span></td>
                <td>
                  <span className={`finance-type-badge ${transaction.type}`}>
                    {transaction.type}
                  </span>
                </td>
                <td className={`finance-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}₱{transaction.amount.toLocaleString()}
                </td>
                <td>
                  <div className="finance-actions-cell">
                    <button className="finance-action-btn edit" onClick={() => openEdit(transaction)}>
                      <PencilSquareIcon className="finance-action-icon" />
                    </button>
                    <button className="finance-action-btn delete" onClick={() => handleDelete(transaction.id)}>
                      <TrashIcon className="finance-action-icon" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="finance-table-footer">
        <span>Showing {filtered.length} transactions</span>
      </div>

      {loading && <div className="finance-loading">Loading...</div>}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Transaction' : 'Add Transaction'}
      >
        <form onSubmit={handleSubmit}>
          <div className="finance-form-group">
            <label>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div className="finance-form-group">
            <label>Description</label>
            <input
              type="text"
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div className="finance-form-row">
            <div className="finance-form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {formData.type === 'income'
                  ? incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                  : expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                }
              </select>
            </div>
            <div className="finance-form-group">
              <label>Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, category: '' })}
                required
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>
          <div className="finance-form-group">
            <label>Amount (₱)</label>
            <input
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
              {editingItem ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      {renderBulkModal()}

      <style>{`
        .finance-transactions-view {
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

        .finance-add-btn.bulk {
          background: #217346;
        }

        .finance-add-btn.bulk:hover {
          background: #1a5c38;
          box-shadow: 0 4px 6px -1px rgba(33, 115, 70, 0.3);
        }

        .finance-add-btn-icon {
          width: 1.125rem;
          height: 1.125rem;
        }

        .finance-transactions-filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .finance-filter-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid var(--gradient-start);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: var(--gradient-start);
        }

        .finance-filter-clear {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 0.125rem;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .finance-filter-clear:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .finance-search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          min-width: 200px;
          background: var(--bg-primary, #f1f5f9);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color, #e2e8f0);
        }

        .finance-search-box input {
          background: none;
          border: none;
          outline: none;
          flex: 1;
          font-size: 0.875rem;
          color: var(--text-primary, #0f172a);
        }

        .finance-search-box input::placeholder {
          color: var(--text-tertiary, #94a3b8);
        }

        .finance-search-icon {
          width: 1rem;
          height: 1rem;
          color: var(--text-tertiary, #94a3b8);
        }

        .finance-filter-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .finance-filter-select {
          padding: 0.5rem 0.75rem;
          background: var(--bg-primary, #f1f5f9);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-primary, #0f172a);
          cursor: pointer;
        }

        .finance-transactions-table-container {
          background: var(--card-bg, #ffffff);
          border-radius: 0.75rem;
          border: 1px solid var(--border-color, #e2e8f0);
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .finance-transactions-table {
          width: 100%;
          border-collapse: collapse;
        }

        .finance-transactions-table th {
          text-align: left;
          padding: 0.75rem 1.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary, #64748b);
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          background: var(--bg-primary, #f8fafc);
        }

        .finance-transactions-table td {
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          font-size: 0.875rem;
        }

        .finance-transactions-table tr:hover {
          background: var(--hover-bg, #f1f5f9);
        }

        .finance-category-badge {
          display: inline-block;
          padding: 0.25rem 0.625rem;
          background: rgba(102, 126, 234, 0.1);
          color: var(--gradient-start, #667eea);
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .finance-type-badge {
          display: inline-block;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .finance-type-badge.income {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .finance-type-badge.expense {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .finance-amount.income {
          color: #10b981;
          font-weight: 600;
        }

        .finance-amount.expense {
          color: #ef4444;
          font-weight: 600;
        }

        .finance-actions-cell {
          display: flex;
          gap: 0.25rem;
        }

        .finance-action-btn {
          padding: 0.25rem;
          background: none;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: background 0.2s;
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

        .finance-table-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.25rem;
          font-size: 0.875rem;
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

        /* Bulk Modal Styles */
        .bulk-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 1.5rem;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .bulk-modal-container {
          background: var(--card-bg, #ffffff);
          border-radius: 1.25rem;
          max-width: 950px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.25s ease;
          overflow: hidden;
        }

        .bulk-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          flex-shrink: 0;
        }

        .bulk-modal-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin: 0;
        }

        .bulk-modal-close {
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

        .bulk-modal-close:hover {
          background: var(--hover-bg, #f1f5f9);
          color: var(--text-primary, #0f172a);
        }

        .bulk-modal-close svg {
          width: 1.5rem;
          height: 1.5rem;
        }

        .bulk-modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .bulk-modal-footer {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-color, #e2e8f0);
          flex-shrink: 0;
        }

        .bulk-modal-cancel {
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

        .bulk-modal-cancel:hover {
          background: var(--hover-bg, #e2e8f0);
        }

        .bulk-modal-submit {
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

        .bulk-modal-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .bulk-modal-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .bulk-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          padding-bottom: 0.5rem;
        }

        .bulk-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          color: var(--text-secondary, #64748b);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .bulk-tab:hover {
          background: var(--hover-bg, #f1f5f9);
          color: var(--text-primary, #0f172a);
        }

        .bulk-tab.active {
          background: rgba(102, 126, 234, 0.1);
          color: var(--gradient-start, #667eea);
        }

        .bulk-tab-icon {
          width: 1.125rem;
          height: 1.125rem;
        }

        .bulk-actions {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .bulk-add-row-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--bg-primary, #f1f5f9);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-primary, #0f172a);
        }

        .bulk-add-row-btn:hover {
          background: var(--hover-bg, #e2e8f0);
        }

        .bulk-add-row-icon {
          width: 1rem;
          height: 1rem;
        }

        .bulk-clear-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          color: #ef4444;
        }

        .bulk-clear-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .bulk-clear-icon {
          width: 1rem;
          height: 1rem;
        }

        .bulk-table-container {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
        }

        .bulk-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .bulk-table thead {
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .bulk-table th {
          padding: 0.5rem 0.5rem;
          text-align: left;
          background: var(--bg-primary, #f8fafc);
          border-bottom: 2px solid var(--border-color, #e2e8f0);
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .bulk-table td {
          padding: 0.25rem 0.5rem;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          vertical-align: middle;
        }

        .bulk-row-invalid {
          background: rgba(239, 68, 68, 0.05);
        }

        .bulk-row-invalid td {
          border-bottom-color: rgba(239, 68, 68, 0.2);
        }

        .bulk-input {
          width: 100%;
          padding: 0.25rem 0.5rem;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.25rem;
          font-size: 0.875rem;
          background: var(--bg-primary, #f8fafc);
          color: var(--text-primary, #0f172a);
          transition: border-color 0.2s;
          min-width: 60px;
        }

        .bulk-input:focus {
          outline: none;
          border-color: var(--gradient-start, #667eea);
        }

        .bulk-input.date-input {
          min-width: 100px;
        }

        .bulk-input.amount-input {
          min-width: 80px;
          text-align: right;
        }

        .bulk-select {
          width: 100%;
          padding: 0.25rem 0.5rem;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.25rem;
          font-size: 0.875rem;
          background: var(--bg-primary, #f8fafc);
          color: var(--text-primary, #0f172a);
          min-width: 80px;
        }

        .bulk-select:focus {
          outline: none;
          border-color: var(--gradient-start, #667eea);
        }

        .bulk-select.type-select.income {
          border-color: #10b981;
        }

        .bulk-select.type-select.expense {
          border-color: #ef4444;
        }

        .bulk-status {
          width: 1.25rem;
          height: 1.25rem;
        }

        .bulk-status.valid {
          color: #10b981;
        }

        .bulk-status.invalid {
          color: #ef4444;
        }

        .bulk-status-empty {
          color: var(--text-tertiary, #94a3b8);
        }

        .bulk-remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: background 0.2s;
        }

        .bulk-remove-btn:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .bulk-remove-icon {
          width: 1rem;
          height: 1rem;
          color: #ef4444;
        }

        .bulk-empty {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary, #64748b);
        }

        .bulk-empty-sub {
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .bulk-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-top: 1px solid var(--border-color, #e2e8f0);
          margin-top: 0.75rem;
          font-size: 0.875rem;
          color: var(--text-secondary, #64748b);
        }

        .text-success {
          color: #10b981;
        }

        .text-warning {
          color: #f59e0b;
        }

        .bulk-upload-section {
          padding: 0.5rem 0;
        }

        .bulk-upload-area {
          border: 2px dashed var(--border-color, #e2e8f0);
          border-radius: 0.75rem;
          padding: 2rem;
          text-align: center;
          transition: all 0.2s;
        }

        .bulk-upload-area:hover {
          border-color: var(--gradient-start, #667eea);
          background: rgba(102, 126, 234, 0.02);
        }

        .bulk-upload-icon {
          width: 3rem;
          height: 3rem;
          color: var(--text-tertiary, #94a3b8);
          margin: 0 auto 0.75rem;
        }

        .bulk-upload-text {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-primary, #0f172a);
          margin-bottom: 0.25rem;
        }

        .bulk-upload-subtext {
          font-size: 0.875rem;
          color: var(--text-secondary, #64748b);
          margin-bottom: 1.25rem;
        }

        .bulk-upload-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .bulk-template-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--bg-primary, #f1f5f9);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-primary, #0f172a);
        }

        .bulk-template-btn:hover {
          background: var(--hover-bg, #e2e8f0);
        }

        .bulk-template-icon {
          width: 1rem;
          height: 1rem;
        }

        .bulk-upload-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--gradient-start);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .bulk-upload-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.3);
        }

        .bulk-upload-btn-icon {
          width: 1rem;
          height: 1rem;
        }

        .bulk-upload-preview {
          margin-top: 1.5rem;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 0.75rem;
          padding: 1rem;
        }

        .bulk-upload-preview h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin-bottom: 0.75rem;
        }

        .bulk-upload-preview-table {
          max-height: 200px;
          overflow-y: auto;
        }

        .bulk-type-badge {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .bulk-type-badge.income {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .bulk-type-badge.expense {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .bulk-more-rows {
          text-align: center;
          padding: 0.5rem;
          color: var(--text-secondary, #64748b);
          font-size: 0.875rem;
        }

        .bulk-upload-notes {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(102, 126, 234, 0.05);
          border-radius: 0.5rem;
          border: 1px solid rgba(102, 126, 234, 0.1);
        }

        .bulk-upload-notes h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin-bottom: 0.5rem;
        }

        .bulk-upload-notes ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .bulk-upload-notes li {
          font-size: 0.8125rem;
          color: var(--text-secondary, #64748b);
          padding: 0.125rem 0;
          position: relative;
          padding-left: 1.25rem;
        }

        .bulk-upload-notes li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--gradient-start, #667eea);
        }

        @media (max-width: 768px) {
          .finance-view-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .finance-header-actions {
            width: 100%;
          }

          .finance-header-actions button {
            flex: 1;
            justify-content: center;
          }

          .finance-transactions-filters {
            flex-direction: column;
          }

          .finance-search-box {
            min-width: auto;
          }

          .finance-transactions-table-container {
            overflow-x: auto;
          }

          .finance-transactions-table {
            min-width: 600px;
          }

          .finance-form-row {
            grid-template-columns: 1fr;
          }

          .bulk-modal-container {
            max-width: 100%;
            margin: 0.5rem;
            max-height: 95vh;
          }

          .bulk-table-container {
            max-height: 300px;
          }

          .bulk-table {
            font-size: 0.75rem;
          }

          .bulk-table th,
          .bulk-table td {
            padding: 0.25rem 0.25rem;
          }

          .bulk-input,
          .bulk-select {
            font-size: 0.75rem;
            min-width: 40px;
          }

          .bulk-input.date-input {
            min-width: 80px;
          }

          .bulk-input.amount-input {
            min-width: 60px;
          }

          .bulk-upload-area {
            padding: 1rem;
          }

          .bulk-modal-overlay {
            padding: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .bulk-upload-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .bulk-upload-actions button,
          .bulk-upload-actions label {
            justify-content: center;
          }

          .bulk-tabs {
            flex-direction: column;
            gap: 0.25rem;
          }

          .bulk-modal-body {
            padding: 0.75rem;
          }

          .bulk-modal-header {
            padding: 0.75rem 1rem;
          }

          .bulk-modal-header h3 {
            font-size: 1rem;
          }

          .bulk-modal-footer {
            padding: 0.75rem 1rem;
            flex-direction: column;
          }

          .bulk-modal-footer button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Transactions;