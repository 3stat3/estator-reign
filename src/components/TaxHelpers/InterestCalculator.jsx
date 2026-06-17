import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalculatorIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ScaleIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const InterestCalculator = () => {
  const [formData, setFormData] = useState({
    baseTaxDue: '',
    transactionDate: '',
    dueDate: '',
    paymentDate: ''
  });
  
  const [result, setResult] = useState(null);
  const [daysLate, setDaysLate] = useState(null);
  const [applicableRate, setApplicableRate] = useState(null);
  const [rateLabel, setRateLabel] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  const TRAIN_CUTOFF_DATE = new Date('2018-01-01');

  // Format number with commas
  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    const num = value.replace(/,/g, '');
    if (isNaN(num)) return value;
    const parts = num.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // Handle input change with comma formatting
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'baseTaxDue') {
      // Remove commas for storage
      const cleanValue = value.replace(/,/g, '');
      if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
        setFormData(prev => ({ ...prev, [name]: cleanValue }));
        setDisplayValue(formatNumberWithCommas(cleanValue));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setResult(null);
  };

  // Handle blur to ensure proper formatting
  const handleBlur = () => {
    if (formData.baseTaxDue) {
      setDisplayValue(formatNumberWithCommas(formData.baseTaxDue));
    }
  };

  // Handle focus to show raw value
  const handleFocus = () => {
    if (formData.baseTaxDue) {
      setDisplayValue(formData.baseTaxDue);
    }
  };

  // Determine applicable interest rate
  useEffect(() => {
    if (formData.transactionDate) {
      const transactionDate = new Date(formData.transactionDate);
      if (transactionDate < TRAIN_CUTOFF_DATE) {
        setApplicableRate(20);
        setRateLabel('Pre-TRAIN Law');
      } else {
        setApplicableRate(12);
        setRateLabel('Post-TRAIN Law');
      }
    } else {
      setApplicableRate(null);
      setRateLabel('');
    }
  }, [formData.transactionDate]);

  // Calculate days late
  useEffect(() => {
    if (formData.dueDate && formData.paymentDate) {
      const due = new Date(formData.dueDate);
      const payment = new Date(formData.paymentDate);
      
      if (payment > due) {
        const diffTime = Math.abs(payment - due);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysLate(diffDays);
      } else if (payment <= due) {
        setDaysLate(0);
      } else {
        setDaysLate(null);
      }
    } else {
      setDaysLate(null);
    }
  }, [formData.dueDate, formData.paymentDate]);

  // Auto-calculate
  useEffect(() => {
    if (
      formData.baseTaxDue && 
      formData.transactionDate &&
      formData.dueDate && 
      formData.paymentDate && 
      applicableRate !== null &&
      daysLate !== null &&
      daysLate > 0
    ) {
      calculateInterest();
    } else {
      setResult(null);
    }
  }, [formData.baseTaxDue, formData.transactionDate, formData.dueDate, formData.paymentDate, applicableRate, daysLate]);

  const calculateInterest = useCallback(() => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const base = parseFloat(formData.baseTaxDue) || 0;
      const rate = applicableRate || 12;
      const days = daysLate || 0;
      
      const interest = (base * (rate / 100) * days) / 365;
      
      setResult({
        baseAmount: base,
        interest: interest,
        daysLate: days,
        rate: rate,
        rateLabel: rateLabel,
        transactionDate: formData.transactionDate,
        dueDate: formData.dueDate,
        paymentDate: formData.paymentDate
      });
      
      setIsCalculating(false);
    }, 300);
  }, [formData.baseTaxDue, formData.transactionDate, formData.dueDate, formData.paymentDate, applicableRate, daysLate, rateLabel]);

  const formatCurrency = (amount) => {
    if (isNaN(amount) || amount === 0) return '₱0.00';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (isNaN(num) || num === 0) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const isPreTrain = (date) => {
    if (!date) return false;
    return new Date(date) < TRAIN_CUTOFF_DATE;
  };

  const isAllFieldsFilled = () => {
    return formData.baseTaxDue && 
           formData.transactionDate && 
           formData.dueDate && 
           formData.paymentDate;
  };

  return (
    <div className="interest-calculator">
      {/* Header */}
      <div className="calculator-header">
        <div className="header-left">
          <div className="header-title-group">
            <div className="icon-wrapper">
              <CalculatorIcon className="header-icon" />
            </div>
            <div>
              <h3>Interest Calculator</h3>
              <p>Auto-calculates tax interest using TRAIN Law rates</p>
            </div>
          </div>
        </div>
        <div className="header-badge">
          <span className={`badge ${isAllFieldsFilled() && daysLate > 0 ? 'active' : ''}`}>
            <span className="badge-dot"></span>
            {isAllFieldsFilled() && daysLate > 0 ? 'Auto-Calculating' : 'Awaiting Input'}
          </span>
        </div>
      </div>

      <div className="calculator-grid">
        {/* Left Column - Form */}
        <div className="calculator-form">
          <div className="form-group">
            <label htmlFor="transactionDate">
              <CalendarIcon className="input-icon" />
              Transaction Date
            </label>
            <input
              type="date"
              id="transactionDate"
              name="transactionDate"
              value={formData.transactionDate}
              onChange={handleInputChange}
              max={getTodayDate()}
              className="form-input"
              required
            />
            {formData.transactionDate && (
              <div className={`rate-indicator ${isPreTrain(formData.transactionDate) ? 'pre-train' : 'post-train'}`}>
                <span className="rate-indicator-dot"></span>
                {isPreTrain(formData.transactionDate) 
                  ? 'Pre-TRAIN Law — 20% rate applies'
                  : 'Post-TRAIN Law — 12% rate applies'}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="baseTaxDue">
              <CurrencyDollarIcon className="input-icon" />
              Base Tax Due
            </label>
            <input
              type="text"
              id="baseTaxDue"
              name="baseTaxDue"
              value={displayValue || formData.baseTaxDue}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="₱0.00"
              className="form-input currency-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dueDate">
                <CalendarIcon className="input-icon" />
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                max={getTodayDate()}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentDate">
                <CalendarIcon className="input-icon" />
                Payment Date
              </label>
              <input
                type="date"
                id="paymentDate"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Days Late Display */}
          <AnimatePresence mode="wait">
            {daysLate !== null && (
              <motion.div 
                key="daysLate"
                className={`days-late-display ${daysLate > 0 ? 'late' : 'on-time'}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ClockIcon className="days-icon" />
                <span>
                  {daysLate === 0 ? (
                    '✅ Payment is on time — No interest due'
                  ) : (
                    `⏰ ${formatNumber(daysLate)} day${daysLate > 1 ? 's' : ''} late`
                  )}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Applicable Interest Rate */}
          <div className="form-group rate-group">
            <label>
              <ScaleIcon className="input-icon" />
              Applicable Interest Rate
            </label>
            <div className="rate-display">
              <div className="rate-value">
                <span className="rate-number">
                  {applicableRate !== null ? `${applicableRate}%` : '—'}
                </span>
                <span className="rate-label">{rateLabel}</span>
              </div>
              <div className="rate-options">
                <span className="rate-option pre-train">
                  <span className="dot"></span>
                  20% Pre-TRAIN
                </span>
                <span className="rate-option post-train">
                  <span className="dot"></span>
                  12% Post-TRAIN
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="calculator-results">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="results-card"
              >
                {/* Results Header */}
                <div className="results-header">
                  <div className="results-icon-wrapper">
                    <CheckCircleIcon className="success-icon" />
                  </div>
                  <div>
                    <h4>Calculation Results</h4>
                    <p>Interest computed based on provided dates</p>
                  </div>
                </div>

                {/* Date Details */}
                <div className="results-grid">
                  <div className="result-detail">
                    <span className="detail-label">Transaction Date</span>
                    <span className="detail-value">{formatDate(result.transactionDate)}</span>
                  </div>
                  <div className="result-detail">
                    <span className="detail-label">Due Date</span>
                    <span className="detail-value">{formatDate(result.dueDate)}</span>
                  </div>
                  <div className="result-detail">
                    <span className="detail-label">Payment Date</span>
                    <span className="detail-value">{formatDate(result.paymentDate)}</span>
                  </div>
                  <div className="result-detail highlight">
                    <span className="detail-label">Days Late</span>
                    <span className="detail-value days">{formatNumber(result.daysLate)} days</span>
                  </div>
                </div>

                <div className="result-divider"></div>

                {/* Financial Results */}
                <div className="result-items">
                  <div className="result-item">
                    <span className="result-label">Base Tax Due</span>
                    <span className="result-value">{formatCurrency(result.baseAmount)}</span>
                  </div>

                  <div className="result-item">
                    <span className="result-label">Applicable Rate</span>
                    <span className="result-value">
                      <span className="rate-tag" style={{
                        backgroundColor: result.rate === 20 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: result.rate === 20 ? '#ef4444' : '#10b981'
                      }}>
                        {result.rate}% ({result.rateLabel})
                      </span>
                    </span>
                  </div>

                  <div className="result-divider"></div>

                  {/* Total Interest - Main Result */}
                  <div className="result-item total-interest">
                    <span className="result-label">
                      <ChartBarIcon className="interest-icon" />
                      Total Interest
                    </span>
                    <span className="result-value interest-amount">
                      {formatCurrency(result.interest)}
                    </span>
                  </div>
                </div>

                {/* Formula */}
                <div className="result-formula">
                  <ExclamationTriangleIcon className="formula-icon" />
                  <span>
                    {formatCurrency(result.baseAmount)} × {result.rate}% × {formatNumber(result.daysLate)} days ÷ 365
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="results-placeholder"
              >
                <div className="placeholder-icon-wrapper">
                  <SparklesIcon className="placeholder-icon" />
                </div>
                <h4>Ready to Calculate</h4>
                <p>
                  Fill in all fields above. Interest auto-calculates 
                  when all information is provided.
                </p>
                {daysLate === 0 && formData.dueDate && formData.paymentDate && (
                  <div className="placeholder-note">
                    <CheckCircleIcon className="note-icon" />
                    <span>Payment is on time — no interest due</span>
                  </div>
                )}
                {formData.transactionDate && applicableRate !== null && (
                  <div className="placeholder-note rate-note">
                    <ScaleIcon className="note-icon" />
                    <span>Rate: {applicableRate}% ({rateLabel})</span>
                  </div>
                )}
                {isAllFieldsFilled() && daysLate === 0 && (
                  <div className="placeholder-note success-note">
                    <CheckCircleIcon className="note-icon" />
                    <span>✅ No interest — paid on time</span>
                  </div>
                )}
                {!isAllFieldsFilled() && (
                  <div className="placeholder-hint">
                    <span>Complete all fields to see results</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .interest-calculator {
          background: var(--card-bg);
          border-radius: 0.75rem;
        }

        /* ===== HEADER ===== */
        .calculator-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .header-title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .icon-wrapper {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.625rem;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.05));
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .header-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #3b82f6;
        }

        .header-title-group h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.125rem 0;
        }

        .header-title-group p {
          color: var(--text-secondary);
          font-size: 0.75rem;
          margin: 0;
        }

        .header-badge {
          flex-shrink: 0;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
          font-size: 0.688rem;
          font-weight: 500;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          transition: all 0.3s ease;
        }

        .badge.active {
          background: rgba(16, 185, 129, 0.08);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.15);
        }

        .badge-dot {
          width: 0.375rem;
          height: 0.375rem;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s ease-in-out infinite;
        }

        .badge.active .badge-dot {
          background: #10b981;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* ===== GRID ===== */
        .calculator-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .calculator-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* ===== FORM ===== */
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.813rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .input-icon {
          width: 0.875rem;
          height: 0.875rem;
          color: var(--text-tertiary);
        }

        .form-input {
          padding: 0.625rem 0.875rem;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: all 0.2s;
          width: 100%;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
        }

        .form-input::placeholder {
          color: var(--text-tertiary);
        }

        .currency-input {
          font-weight: 500;
          font-size: 1rem;
        }

        .currency-input:focus {
          font-weight: 600;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        /* ===== RATE INDICATOR ===== */
        .rate-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.625rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          margin-top: 0.125rem;
        }

        .rate-indicator.pre-train {
          background: rgba(239, 68, 68, 0.06);
          color: #ef4444;
        }

        .rate-indicator.post-train {
          background: rgba(16, 185, 129, 0.06);
          color: #10b981;
        }

        .rate-indicator-dot {
          width: 0.375rem;
          height: 0.375rem;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }

        /* ===== RATE GROUP ===== */
        .rate-group {
          background: var(--bg-primary);
          border-radius: 0.5rem;
          padding: 0.875rem 1rem;
          border: 1px solid var(--border-color);
        }

        .rate-group label {
          color: var(--text-secondary) !important;
          font-size: 0.75rem !important;
          margin-bottom: 0.25rem;
        }

        .rate-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .rate-value {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .rate-number {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .rate-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .rate-options {
          display: flex;
          gap: 0.5rem;
        }

        .rate-option {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.625rem;
          font-weight: 500;
          padding: 0.125rem 0.5rem;
          border-radius: 2rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
        }

        .rate-option .dot {
          width: 0.375rem;
          height: 0.375rem;
          border-radius: 50%;
        }

        .rate-option.pre-train .dot {
          background: #ef4444;
        }

        .rate-option.post-train .dot {
          background: #10b981;
        }

        .rate-option.pre-train {
          color: #ef4444;
        }

        .rate-option.post-train {
          color: #10b981;
        }

        /* ===== DAYS LATE ===== */
        .days-late-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.813rem;
          font-weight: 500;
          overflow: hidden;
        }

        .days-late-display.late {
          background: rgba(239, 68, 68, 0.06);
          color: #ef4444;
        }

        .days-late-display.on-time {
          background: rgba(16, 185, 129, 0.06);
          color: #10b981;
        }

        .days-icon {
          width: 1rem;
          height: 1rem;
          flex-shrink: 0;
        }

        /* ===== RESULTS ===== */
        .calculator-results {
          display: flex;
          align-items: stretch;
        }

        .results-card {
          flex: 1;
          padding: 1.25rem;
          background: var(--bg-secondary);
          border-radius: 0.75rem;
          border: 1px solid var(--border-color);
        }

        .results-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .results-icon-wrapper {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.5rem;
          background: rgba(16, 185, 129, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .success-icon {
          width: 1.125rem;
          height: 1.125rem;
          color: #10b981;
        }

        .results-header h4 {
          font-size: 0.938rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.125rem 0;
        }

        .results-header p {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .results-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .result-detail {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          padding: 0.375rem 0.5rem;
          border-radius: 0.375rem;
        }

        .result-detail.highlight {
          grid-column: span 2;
          background: rgba(59, 130, 246, 0.04);
        }

        .detail-label {
          font-size: 0.625rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detail-value {
          font-size: 0.813rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .detail-value.days {
          font-weight: 600;
          color: #ef4444;
        }

        .result-divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.5rem 0;
        }

        .result-items {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.375rem 0;
        }

        .result-label {
          font-size: 0.813rem;
          color: var(--text-secondary);
        }

        .result-value {
          font-size: 0.813rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .rate-tag {
          padding: 0.125rem 0.5rem;
          border-radius: 2rem;
          font-size: 0.688rem;
          font-weight: 600;
        }

        .result-item.total-interest {
          padding: 0.625rem 0 0.375rem 0;
          border-top: 2px solid var(--border-color);
          margin-top: 0.25rem;
        }

        .result-item.total-interest .result-label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .interest-icon {
          width: 0.875rem;
          height: 0.875rem;
          color: #f59e0b;
        }

        .result-value.interest-amount {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f59e0b;
        }

        .result-formula {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: rgba(245, 158, 11, 0.04);
          border-radius: 0.375rem;
          font-size: 0.688rem;
          color: var(--text-secondary);
          border: 1px solid rgba(245, 158, 11, 0.08);
        }

        .formula-icon {
          width: 0.875rem;
          height: 0.875rem;
          color: #f59e0b;
          flex-shrink: 0;
        }

        /* ===== PLACEHOLDER ===== */
        .results-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          text-align: center;
          background: var(--bg-secondary);
          border-radius: 0.75rem;
          border: 1px dashed var(--border-color);
          gap: 0.375rem;
        }

        .placeholder-icon-wrapper {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 50%;
          background: var(--bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.25rem;
        }

        .placeholder-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: var(--text-tertiary);
        }

        .results-placeholder h4 {
          font-size: 0.938rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .results-placeholder p {
          color: var(--text-secondary);
          font-size: 0.813rem;
          max-width: 260px;
          margin: 0;
        }

        .placeholder-note {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(16, 185, 129, 0.06);
          border-radius: 0.375rem;
          font-size: 0.75rem;
          color: #10b981;
          width: 100%;
          justify-content: center;
          border: 1px solid rgba(16, 185, 129, 0.08);
        }

        .placeholder-note.rate-note {
          background: rgba(59, 130, 246, 0.06);
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.08);
        }

        .placeholder-note.success-note {
          background: rgba(16, 185, 129, 0.08);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.12);
        }

        .placeholder-hint {
          margin-top: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: var(--bg-primary);
          border-radius: 0.375rem;
          font-size: 0.688rem;
          color: var(--text-tertiary);
          border: 1px solid var(--border-color);
          width: 100%;
          text-align: center;
        }

        .note-icon {
          width: 0.875rem;
          height: 0.875rem;
          flex-shrink: 0;
        }

        /* ===== DARK MODE ===== */
        [data-theme="dark"] .rate-group {
          background: var(--bg-secondary);
        }

        [data-theme="dark"] .results-placeholder {
          border-color: var(--border-color);
        }

        [data-theme="dark"] .result-detail.highlight {
          background: rgba(59, 130, 246, 0.06);
        }

        [data-theme="dark"] .badge.active {
          background: rgba(16, 185, 129, 0.12);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          .calculator-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
        }

        @media (max-width: 768px) {
          .interest-calculator {
            padding: 0.5rem;
          }

          .calculator-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .rate-display {
            flex-direction: column;
            align-items: stretch;
          }

          .rate-options {
            justify-content: center;
          }

          .results-grid {
            grid-template-columns: 1fr;
          }

          .result-detail.highlight {
            grid-column: span 1;
          }

          .results-card {
            padding: 1rem;
          }

          .badge {
            font-size: 0.625rem;
          }
        }

        @media (max-width: 480px) {
          .header-title-group {
            flex-direction: column;
            align-items: flex-start;
          }

          .icon-wrapper {
            width: 2rem;
            height: 2rem;
          }

          .header-title-group h3 {
            font-size: 1rem;
          }

          .results-placeholder {
            padding: 1.5rem 1rem;
          }

          .rate-options {
            flex-direction: column;
            align-items: center;
          }

          .result-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.125rem;
          }

          .result-item.total-interest {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }

          .result-value.interest-amount {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
};

export default InterestCalculator;