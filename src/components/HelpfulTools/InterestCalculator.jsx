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
  SparklesIcon,
  ArrowsRightLeftIcon,
  DocumentTextIcon
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
  const [crossPeriodDetails, setCrossPeriodDetails] = useState(null);

  const TRAIN_CUTOFF_DATE = new Date('2018-01-01');
  const PRE_TRAIN_RATE = 20;
  const POST_TRAIN_RATE = 12;

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
      const cleanValue = value.replace(/,/g, '');
      if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
        setFormData(prev => ({ ...prev, [name]: cleanValue }));
        setDisplayValue(formatNumberWithCommas(cleanValue));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setResult(null);
    setCrossPeriodDetails(null);
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

  // Calculate days late and detect if period crosses TRAIN cutoff
  useEffect(() => {
    if (formData.dueDate && formData.paymentDate) {
      const due = new Date(formData.dueDate);
      const payment = new Date(formData.paymentDate);
      
      if (payment > due) {
        const diffTime = Math.abs(payment - due);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysLate(diffDays);

        // Check if the late period crosses the TRAIN cutoff
        const periodStart = due;
        const periodEnd = payment;
        const crossesCutoff = periodStart < TRAIN_CUTOFF_DATE && periodEnd >= TRAIN_CUTOFF_DATE;
        
        if (crossesCutoff) {
          // Calculate days before and after cutoff
          const daysBeforeCutoff = Math.max(0, Math.ceil((TRAIN_CUTOFF_DATE - periodStart) / (1000 * 60 * 60 * 24)));
          const daysAfterCutoff = diffDays - daysBeforeCutoff;
          
          setCrossPeriodDetails({
            crossesCutoff: true,
            daysBeforeCutoff,
            daysAfterCutoff,
            preTrainRate: PRE_TRAIN_RATE,
            postTrainRate: POST_TRAIN_RATE
          });
          
          setApplicableRate(null); // Multiple rates apply
          setRateLabel('Mixed (Pre-TRAIN + Post-TRAIN)');
        } else {
          setCrossPeriodDetails(null);
          // Determine rate based on when the due date falls
          if (due < TRAIN_CUTOFF_DATE) {
            setApplicableRate(PRE_TRAIN_RATE);
            setRateLabel('Pre-TRAIN Law');
          } else {
            setApplicableRate(POST_TRAIN_RATE);
            setRateLabel('Post-TRAIN Law');
          }
        }
      } else if (payment <= due) {
        setDaysLate(0);
        setCrossPeriodDetails(null);
        setApplicableRate(null);
        setRateLabel('');
      } else {
        setDaysLate(null);
        setCrossPeriodDetails(null);
        setApplicableRate(null);
        setRateLabel('');
      }
    } else {
      setDaysLate(null);
      setCrossPeriodDetails(null);
      setApplicableRate(null);
      setRateLabel('');
    }
  }, [formData.dueDate, formData.paymentDate]);

  // Auto-calculate
  useEffect(() => {
    if (
      formData.baseTaxDue && 
      formData.dueDate && 
      formData.paymentDate && 
      daysLate !== null &&
      daysLate > 0
    ) {
      calculateInterest();
    } else {
      setResult(null);
    }
  }, [formData.baseTaxDue, formData.dueDate, formData.paymentDate, daysLate, crossPeriodDetails]);

  const calculateInterest = useCallback(() => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const base = parseFloat(formData.baseTaxDue) || 0;
      const days = daysLate || 0;
      
      let interest = 0;
      let breakdown = null;
      
      if (crossPeriodDetails && crossPeriodDetails.crossesCutoff) {
        // Calculate using both rates
        const { daysBeforeCutoff, daysAfterCutoff, preTrainRate, postTrainRate } = crossPeriodDetails;
        
        const preTrainInterest = (base * (preTrainRate / 100) * daysBeforeCutoff) / 365;
        const postTrainInterest = (base * (postTrainRate / 100) * daysAfterCutoff) / 365;
        interest = preTrainInterest + postTrainInterest;
        
        breakdown = {
          preTrain: {
            days: daysBeforeCutoff,
            rate: preTrainRate,
            interest: preTrainInterest,
            percentageOfTotal: (preTrainInterest / interest) * 100
          },
          postTrain: {
            days: daysAfterCutoff,
            rate: postTrainRate,
            interest: postTrainInterest,
            percentageOfTotal: (postTrainInterest / interest) * 100
          }
        };
      } else {
        // Use single rate
        const rate = applicableRate || POST_TRAIN_RATE;
        interest = (base * (rate / 100) * days) / 365;
      }
      
      setResult({
        baseAmount: base,
        interest: interest,
        daysLate: days,
        rate: applicableRate,
        rateLabel: rateLabel,
        transactionDate: formData.transactionDate,
        dueDate: formData.dueDate,
        paymentDate: formData.paymentDate,
        breakdown: breakdown,
        crossPeriod: crossPeriodDetails
      });
      
      setIsCalculating(false);
    }, 300);
  }, [formData.baseTaxDue, formData.dueDate, formData.paymentDate, applicableRate, daysLate, rateLabel, crossPeriodDetails]);

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

  const isAllFieldsFilled = () => {
    return formData.baseTaxDue && 
           formData.dueDate && 
           formData.paymentDate;
  };

  return (
    <div className="interest-calculator-standalone">
      {/* Header */}
      <div className="calculator-header">
        <div className="header-left">
          <div className="header-title-group">
            <div className="icon-wrapper">
              <CalculatorIcon className="header-icon" />
            </div>
            <div>
              <h3>Interest Calculator</h3>
              <p>Auto-calculates tax interest with TRAIN Law transition handling</p>
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

          {/* Cross Period Detection */}
          <AnimatePresence mode="wait">
            {crossPeriodDetails && crossPeriodDetails.crossesCutoff && (
              <motion.div 
                key="crossPeriod"
                className="cross-period-display"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="cross-period-header">
                  <ArrowsRightLeftIcon className="cross-icon" />
                  <span className="cross-period-title">⚠️ Interest Period Crosses TRAIN Law Cutoff</span>
                </div>
                <div className="cross-period-details">
                  <div className="period-breakdown">
                    <span className="period-label">Pre-TRAIN (20%)</span>
                    <span className="period-days">{formatNumber(crossPeriodDetails.daysBeforeCutoff)} days</span>
                  </div>
                  <div className="period-breakdown">
                    <span className="period-label">Post-TRAIN (12%)</span>
                    <span className="period-days">{formatNumber(crossPeriodDetails.daysAfterCutoff)} days</span>
                  </div>
                  <div className="period-total">
                    <span className="period-label">Total</span>
                    <span className="period-days total">{formatNumber(crossPeriodDetails.daysBeforeCutoff + crossPeriodDetails.daysAfterCutoff)} days</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Applicable Interest Rate */}
          <div className="form-group rate-group">
            <label>
              <ScaleIcon className="input-icon" />
              Applicable Interest Rate{applicableRate && ` — ${applicableRate}%`}
            </label>
            <div className="rate-display">
              <div className="rate-value">
                <span className="rate-number">
                  {crossPeriodDetails ? (
                    <span className="mixed-rates">
                      <span className="pre-rate">20%</span>
                      <span className="rate-arrow">→</span>
                      <span className="post-rate">12%</span>
                    </span>
                  ) : (
                    applicableRate !== null ? `${applicableRate}%` : '—'
                  )}
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
                {crossPeriodDetails && (
                  <span className="rate-option mixed">
                    <ArrowsRightLeftIcon className="mixed-icon" />
                    Mixed
                  </span>
                )}
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
                    <p>Interest computed based on applicable rates</p>
                  </div>
                </div>

                {/* Date Details */}
                <div className="results-grid">
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

                {/* Interest Breakdown - Enhanced Version */}
                {result.breakdown && (
                  <>
                    <div className="result-divider"></div>
                    
                    {/* Breakdown Header with Icon */}
                    <div className="breakdown-header-section">
                      <DocumentTextIcon className="breakdown-header-icon" />
                      <span className="breakdown-title">Interest Breakdown</span>
                      <span className="breakdown-subtitle">(Mixed Rates Applied)</span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="breakdown-visual">
                      <div 
                        className="breakdown-bar pre-train-bar" 
                        style={{ width: `${result.breakdown.preTrain.percentageOfTotal}%` }}
                      />
                      <div 
                        className="breakdown-bar post-train-bar" 
                        style={{ width: `${result.breakdown.postTrain.percentageOfTotal}%` }}
                      />
                    </div>
                    <div className="breakdown-labels">
                      <span className="pre-label">Pre-TRAIN {Math.round(result.breakdown.preTrain.percentageOfTotal)}%</span>
                      <span className="post-label">Post-TRAIN {Math.round(result.breakdown.postTrain.percentageOfTotal)}%</span>
                    </div>

                    {/* Detailed Breakdown Items */}
                    <div className="breakdown-items-detailed">
                      {/* Pre-TRAIN Item */}
                      <div className="breakdown-item-detailed pre-train-item-detailed">
                        <div className="breakdown-item-left">
                          <span className="breakdown-rate-badge pre-badge">20%</span>
                          <span className="breakdown-label-detailed">Pre-TRAIN Law</span>
                        </div>
                        <div className="breakdown-item-right">
                          <span className="breakdown-days-detailed">{formatNumber(result.breakdown.preTrain.days)} days</span>
                          <span className="breakdown-amount-detailed pre-amount">
                            {formatCurrency(result.breakdown.preTrain.interest)}
                          </span>
                        </div>
                      </div>

                      {/* Post-TRAIN Item */}
                      <div className="breakdown-item-detailed post-train-item-detailed">
                        <div className="breakdown-item-left">
                          <span className="breakdown-rate-badge post-badge">12%</span>
                          <span className="breakdown-label-detailed">Post-TRAIN Law</span>
                        </div>
                        <div className="breakdown-item-right">
                          <span className="breakdown-days-detailed">{formatNumber(result.breakdown.postTrain.days)} days</span>
                          <span className="breakdown-amount-detailed post-amount">
                            {formatCurrency(result.breakdown.postTrain.interest)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Calculation Summary */}
                    <div className="breakdown-calculation">
                      <div className="calc-row">
                        <span className="calc-label">Base Amount:</span>
                        <span className="calc-value">{formatCurrency(result.baseAmount)}</span>
                      </div>
                      <div className="calc-row">
                        <span className="calc-label">Pre-TRAIN:</span>
                        <span className="calc-value">{formatCurrency(result.baseAmount)} × 20% × {formatNumber(result.breakdown.preTrain.days)} ÷ 365</span>
                      </div>
                      <div className="calc-row">
                        <span className="calc-label">Post-TRAIN:</span>
                        <span className="calc-value">{formatCurrency(result.baseAmount)} × 12% × {formatNumber(result.breakdown.postTrain.days)} ÷ 365</span>
                      </div>
                    </div>
                  </>
                )}

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
                      {result.crossPeriod ? (
                        <span className="rate-tag mixed-rate-tag">
                          <span className="pre-rate-tag">20%</span>
                          <span className="rate-arrow-small">→</span>
                          <span className="post-rate-tag">12%</span>
                          <span className="mixed-label">Mixed</span>
                        </span>
                      ) : (
                        <span className="rate-tag" style={{
                          backgroundColor: result.rate === 20 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: result.rate === 20 ? '#ef4444' : '#10b981'
                        }}>
                          {result.rate}% ({result.rateLabel})
                        </span>
                      )}
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
                    {result.crossPeriod ? (
                      <>
                        ({formatCurrency(result.baseAmount)} × 20% × {formatNumber(result.breakdown.preTrain.days)} ÷ 365) + 
                        ({formatCurrency(result.baseAmount)} × 12% × {formatNumber(result.breakdown.postTrain.days)} ÷ 365)
                        = {formatCurrency(result.interest)}
                      </>
                    ) : (
                      <>
                        {formatCurrency(result.baseAmount)} × {result.rate}% × {formatNumber(result.daysLate)} days ÷ 365
                        = {formatCurrency(result.interest)}
                      </>
                    )}
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
                {applicableRate !== null && !crossPeriodDetails && (
                  <div className="placeholder-note rate-note">
                    <ScaleIcon className="note-icon" />
                    <span>Rate: {applicableRate}% ({rateLabel})</span>
                  </div>
                )}
                {crossPeriodDetails && crossPeriodDetails.crossesCutoff && (
                  <div className="placeholder-note mixed-note">
                    <ArrowsRightLeftIcon className="note-icon" />
                    <span>Mixed rates: 20% + 12% across cutoff date</span>
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
        .interest-calculator-standalone {
          width: 100%;
          background: var(--card-bg);
          border-radius: 1rem;
          padding: 1.5rem;
          border: 1px solid var(--border-color);
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

        /* ===== CROSS PERIOD DISPLAY ===== */
        .cross-period-display {
          background: rgba(245, 158, 11, 0.06);
          border: 1px solid rgba(245, 158, 11, 0.15);
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          overflow: hidden;
        }

        .cross-period-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .cross-icon {
          width: 1rem;
          height: 1rem;
          color: #f59e0b;
          flex-shrink: 0;
        }

        .cross-period-title {
          font-size: 0.813rem;
          font-weight: 600;
          color: #f59e0b;
        }

        .cross-period-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .period-breakdown, .period-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.25rem 0;
          font-size: 0.75rem;
        }

        .period-breakdown .period-label {
          color: var(--text-secondary);
        }

        .period-breakdown .period-days {
          font-weight: 500;
          color: var(--text-primary);
        }

        .period-total {
          border-top: 1px solid var(--border-color);
          padding-top: 0.375rem;
          margin-top: 0.25rem;
        }

        .period-total .period-label {
          font-weight: 600;
          color: var(--text-primary);
        }

        .period-total .period-days.total {
          font-weight: 700;
          color: #3b82f6;
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

        .mixed-rates {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .pre-rate {
          color: #ef4444;
        }

        .post-rate {
          color: #10b981;
        }

        .rate-arrow {
          color: var(--text-tertiary);
          font-weight: 300;
        }

        .rate-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .rate-options {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
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

        .rate-option.mixed {
          color: #f59e0b;
          border-color: rgba(245, 158, 11, 0.2);
          background: rgba(245, 158, 11, 0.06);
        }

        .mixed-icon {
          width: 0.75rem;
          height: 0.75rem;
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

        /* ===== ENHANCED BREAKDOWN ===== */
        .breakdown-header-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .breakdown-header-icon {
          width: 1rem;
          height: 1rem;
          color: #f59e0b;
          flex-shrink: 0;
        }

        .breakdown-title {
          font-size: 0.813rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .breakdown-subtitle {
          font-size: 0.688rem;
          color: var(--text-secondary);
          font-weight: 400;
        }

        /* Visual Progress Bar */
        .breakdown-visual {
          display: flex;
          height: 0.5rem;
          border-radius: 0.25rem;
          overflow: hidden;
          margin-bottom: 0.25rem;
          background: var(--bg-primary);
        }

        .breakdown-bar {
          height: 100%;
          transition: width 0.5s ease;
        }

        .breakdown-bar.pre-train-bar {
          background: linear-gradient(90deg, #ef4444, #dc2626);
        }

        .breakdown-bar.post-train-bar {
          background: linear-gradient(90deg, #10b981, #059669);
        }

        .breakdown-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.625rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }

        .pre-label {
          color: #ef4444;
        }

        .post-label {
          color: #10b981;
        }

        /* Detailed Breakdown Items */
        .breakdown-items-detailed {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .breakdown-item-detailed {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
        }

        .breakdown-item-detailed.pre-train-item-detailed {
          background: rgba(239, 68, 68, 0.04);
          border-color: rgba(239, 68, 68, 0.12);
        }

        .breakdown-item-detailed.post-train-item-detailed {
          background: rgba(16, 185, 129, 0.04);
          border-color: rgba(16, 185, 129, 0.12);
        }

        .breakdown-item-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .breakdown-rate-badge {
          padding: 0.125rem 0.5rem;
          border-radius: 2rem;
          font-size: 0.688rem;
          font-weight: 700;
          min-width: 2.5rem;
          text-align: center;
        }

        .pre-badge {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }

        .post-badge {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }

        .breakdown-label-detailed {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .breakdown-item-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .breakdown-days-detailed {
          font-size: 0.688rem;
          color: var(--text-secondary);
          background: var(--bg-primary);
          padding: 0.125rem 0.5rem;
          border-radius: 2rem;
          border: 1px solid var(--border-color);
        }

        .breakdown-amount-detailed {
          font-size: 0.813rem;
          font-weight: 600;
          min-width: 5rem;
          text-align: right;
        }

        .pre-amount {
          color: #ef4444;
        }

        .post-amount {
          color: #10b981;
        }

        /* Calculation Summary */
        .breakdown-calculation {
          background: var(--bg-primary);
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.25rem;
          border: 1px solid var(--border-color);
        }

        .calc-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.125rem 0;
          font-size: 0.688rem;
        }

        .calc-label {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .calc-value {
          color: var(--text-primary);
          font-family: monospace;
          font-size: 0.688rem;
        }

        /* ===== RESULT ITEMS ===== */
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

        .mixed-rate-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.125rem 0.5rem;
          border-radius: 2rem;
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          font-size: 0.688rem;
          font-weight: 600;
        }

        .pre-rate-tag {
          color: #ef4444;
        }

        .post-rate-tag {
          color: #10b981;
        }

        .rate-arrow-small {
          color: var(--text-tertiary);
          font-weight: 300;
        }

        .mixed-label {
          color: #f59e0b;
          font-size: 0.625rem;
          background: rgba(245, 158, 11, 0.1);
          padding: 0 0.25rem;
          border-radius: 0.25rem;
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
          flex-wrap: wrap;
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

        .placeholder-note.mixed-note {
          background: rgba(245, 158, 11, 0.06);
          color: #f59e0b;
          border-color: rgba(245, 158, 11, 0.08);
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

        [data-theme="dark"] .cross-period-display {
          background: rgba(245, 158, 11, 0.08);
        }

        [data-theme="dark"] .breakdown-item-detailed.pre-train-item-detailed {
          background: rgba(239, 68, 68, 0.08);
        }

        [data-theme="dark"] .breakdown-item-detailed.post-train-item-detailed {
          background: rgba(16, 185, 129, 0.08);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          .calculator-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
        }

        @media (max-width: 768px) {
          .interest-calculator-standalone {
            padding: 1rem;
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

          .breakdown-item-detailed {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .breakdown-item-right {
            width: 100%;
            justify-content: space-between;
          }

          .breakdown-labels {
            flex-direction: column;
            align-items: center;
            gap: 0.125rem;
          }

          .calc-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.125rem;
          }
        }

        @media (max-width: 480px) {
          .interest-calculator-standalone {
            padding: 0.75rem;
          }

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

          .breakdown-item-right {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default InterestCalculator;