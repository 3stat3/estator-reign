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
  DocumentTextIcon,
  ArrowPathIcon,
  HomeIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const VanishingDeductionCalculator = () => {
  const [formData, setFormData] = useState({
    // Property Identification
    propertyDescription: '',
    
    // Tax Regime Selection (NEW)
    taxRegime: 'train', // 'train', 'ra8424', 'pd1158'
    
    // Prior Transfer Details
    priorTransferDate: '',
    priorTransferType: 'inheritance', // 'inheritance' or 'donation'
    priorTaxPaid: '',
    priorPropertyValue: '',
    
    // Present Decedent Details
    presentDeathDate: '',
    presentPropertyValue: '',
    
    // Liens & Deductions
    mortgagePaid: '',
    claimsAgainstEstate: '',
    unpaidMortgages: '',
    otherDeductions: '',
    
    // Additional info
    isNonResidentAlien: false
  });

  const [result, setResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [displayValues, setDisplayValues] = useState({
    priorTaxPaid: '',
    priorPropertyValue: '',
    presentPropertyValue: '',
    mortgagePaid: '',
    claimsAgainstEstate: '',
    unpaidMortgages: '',
    otherDeductions: ''
  });

  // ============================================================
  // TAX REGIME CONFIGURATIONS
  // ============================================================
  
  const getTaxRegimeInfo = (regime) => {
    const regimes = {
      train: {
        label: 'TRAIN Law (2018-Present)',
        rateType: 'Flat',
        rateDisplay: '6%',
        description: 'Flat estate tax rate of 6%',
        getRate: (netEstate) => 0.06
      },
      ra8424: {
        label: 'RA 8424 (1998-2017)',
        rateType: 'Graduated',
        rateDisplay: '5% - 20%',
        description: 'Graduated rates from 5% to 20%',
        getRate: (netEstate) => {
          if (netEstate <= 200000) return 0.05;
          if (netEstate <= 500000) return 0.08;
          if (netEstate <= 2000000) return 0.11;
          if (netEstate <= 5000000) return 0.15;
          return 0.20;
        }
      },
      pd1158: {
        label: 'PD 1158 (1977-1997)',
        rateType: 'Graduated',
        rateDisplay: '5% - 35%',
        description: 'Graduated rates from 5% to 35%',
        getRate: (netEstate) => {
          if (netEstate <= 200000) return 0.05;
          if (netEstate <= 500000) return 0.08;
          if (netEstate <= 2000000) return 0.12;
          if (netEstate <= 5000000) return 0.16;
          if (netEstate <= 10000000) return 0.20;
          if (netEstate <= 20000000) return 0.25;
          return 0.35;
        }
      }
    };
    return regimes[regime] || regimes.train;
  };

  // ============================================================
  // CORE VANISHING DEDUCTION FUNCTIONS (UNCHANGED - SAME FOR ALL REGIMES)
  // ============================================================
  
  const getPercentageByPeriod = (yearsBetween) => {
    if (yearsBetween <= 1) return 100;
    if (yearsBetween <= 2) return 80;
    if (yearsBetween <= 3) return 60;
    if (yearsBetween <= 4) return 40;
    if (yearsBetween <= 5) return 20;
    return 0;
  };

  const getPeriodLabel = (yearsBetween) => {
    if (yearsBetween <= 1) return 'Within 1 year';
    if (yearsBetween <= 2) return '1-2 years';
    if (yearsBetween <= 3) return '2-3 years';
    if (yearsBetween <= 4) return '3-4 years';
    if (yearsBetween <= 5) return '4-5 years';
    return 'More than 5 years';
  };

  const getPercentageLabel = (percentage) => {
    return `${percentage}%`;
  };

  // ============================================================
  // FORMATTING HELPERS (UNCHANGED)
  // ============================================================
  
  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    const num = value.replace(/,/g, '');
    if (isNaN(num)) return value;
    const parts = num.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // ============================================================
  // INPUT HANDLING (UNCHANGED)
  // ============================================================
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
      setResult(null);
      return;
    }

    const numericFields = [
      'priorTaxPaid', 'priorPropertyValue', 'presentPropertyValue',
      'mortgagePaid', 'claimsAgainstEstate', 'unpaidMortgages', 'otherDeductions'
    ];

    if (numericFields.includes(name)) {
      const cleanValue = value.replace(/,/g, '');
      if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
        setFormData(prev => ({ ...prev, [name]: cleanValue }));
        setDisplayValues(prev => ({ ...prev, [name]: formatNumberWithCommas(cleanValue) }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setResult(null);
  };

  const handleBlur = (name) => {
    const numericFields = [
      'priorTaxPaid', 'priorPropertyValue', 'presentPropertyValue',
      'mortgagePaid', 'claimsAgainstEstate', 'unpaidMortgages', 'otherDeductions'
    ];
    if (numericFields.includes(name) && formData[name]) {
      setDisplayValues(prev => ({ ...prev, [name]: formatNumberWithCommas(formData[name]) }));
    }
  };

  const handleFocus = (name) => {
    const numericFields = [
      'priorTaxPaid', 'priorPropertyValue', 'presentPropertyValue',
      'mortgagePaid', 'claimsAgainstEstate', 'unpaidMortgages', 'otherDeductions'
    ];
    if (numericFields.includes(name) && formData[name]) {
      setDisplayValues(prev => ({ ...prev, [name]: formData[name] }));
    }
  };

  // ============================================================
  // DATE CALCULATION (UNCHANGED)
  // ============================================================
  
  const calculateYearsBetween = (date1, date2) => {
    if (!date1 || !date2) return null;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays / 365.25;
  };

  // ============================================================
  // VALIDATION (UNCHANGED)
  // ============================================================
  
  const isAllFieldsFilled = () => {
    return formData.priorTransferDate &&
           formData.priorTaxPaid &&
           formData.priorPropertyValue &&
           formData.presentDeathDate &&
           formData.presentPropertyValue;
  };

  // ============================================================
  // MAIN CALCULATION ENGINE (UPDATED FOR FLEXIBLE TAX RATES)
  // ============================================================
  
  useEffect(() => {
    if (isAllFieldsFilled()) {
      calculateDeduction();
    } else {
      setResult(null);
    }
  }, [formData.priorTransferDate, formData.priorTaxPaid, formData.priorPropertyValue,
      formData.presentDeathDate, formData.presentPropertyValue, formData.mortgagePaid,
      formData.claimsAgainstEstate, formData.unpaidMortgages, formData.otherDeductions,
      formData.isNonResidentAlien, formData.taxRegime]);

  const calculateDeduction = useCallback(() => {
    setIsCalculating(true);

    setTimeout(() => {
      // Parse values
      const priorTax = parseFloat(formData.priorTaxPaid) || 0;
      const priorValue = parseFloat(formData.priorPropertyValue) || 0;
      const presentValue = parseFloat(formData.presentPropertyValue) || 0;
      const mortgagePaid = parseFloat(formData.mortgagePaid) || 0;
      const claims = parseFloat(formData.claimsAgainstEstate) || 0;
      const unpaidMortgages = parseFloat(formData.unpaidMortgages) || 0;
      const otherDeductions = parseFloat(formData.otherDeductions) || 0;

      // ============================================================
      // STEP 1: Calculate years between transfers
      // ============================================================
      const yearsBetween = calculateYearsBetween(formData.priorTransferDate, formData.presentDeathDate);
      
      const isWithin5Years = yearsBetween !== null && yearsBetween <= 5;
      let allowable = false;
      let percentage = 0;
      let periodLabel = '';
      let percentageLabel = '';

      if (isWithin5Years) {
        percentage = getPercentageByPeriod(yearsBetween);
        periodLabel = getPeriodLabel(yearsBetween);
        percentageLabel = getPercentageLabel(percentage);
        allowable = true;
      }

      // ============================================================
      // STEP 2: Determine Initial Basis (lower of prior or present value)
      // ============================================================
      const initialBasis = Math.min(priorValue, presentValue);
      
      // ============================================================
      // STEP 3: Reduce by liens and deductions
      // ============================================================
      const totalLiens = mortgagePaid + claims + unpaidMortgages + otherDeductions;
      const adjustedBasis = Math.max(0, initialBasis - totalLiens);
      
      // ============================================================
      // STEP 4: Apply percentage to get the Vanishing Deduction
      // ============================================================
      const deduction = allowable ? adjustedBasis * (percentage / 100) : 0;

      // ============================================================
      // STEP 5: Get the tax rate based on the selected regime
      // ============================================================
      const regimeInfo = getTaxRegimeInfo(formData.taxRegime);
      const applicableRate = regimeInfo.getRate(adjustedBasis);
      const taxSavings = deduction * applicableRate;

      // ============================================================
      // STEP 6: Non-resident alien adjustment
      // ============================================================
      const nonResidentAdjustment = formData.isNonResidentAlien ? 'Partial (PH properties only)' : 'Full';

      // ============================================================
      // STEP 7: Determine eligibility status
      // ============================================================
      let eligibilityStatus = 'eligible';
      let eligibilityMessage = '';

      if (!isWithin5Years) {
        eligibilityStatus = 'ineligible';
        eligibilityMessage = `Property transferred ${yearsBetween ? yearsBetween.toFixed(1) : 'more than'} years ago. Must be within 5 years.`;
      } else if (priorTax <= 0) {
        eligibilityStatus = 'warning';
        eligibilityMessage = 'Prior tax payment is required. Please verify if tax was paid.';
      } else if (adjustedBasis <= 0) {
        eligibilityStatus = 'warning';
        eligibilityMessage = 'Adjusted basis is zero after deducting liens and claims.';
      } else {
        eligibilityMessage = `Eligible for ${percentage}% deduction based on transfer period.`;
      }

      setResult({
        // Basic Info
        propertyDescription: formData.propertyDescription || 'Unnamed Property',
        priorTransferDate: formData.priorTransferDate,
        priorTransferType: formData.priorTransferType,
        priorTaxPaid: priorTax,
        priorValue: priorValue,
        presentDeathDate: formData.presentDeathDate,
        presentValue: presentValue,
        
        // Tax Regime Info
        taxRegime: formData.taxRegime,
        regimeInfo: regimeInfo,
        applicableRate: applicableRate,
        
        // Calculations
        yearsBetween: yearsBetween,
        isWithin5Years: isWithin5Years,
        periodLabel: periodLabel,
        percentage: percentage,
        percentageLabel: percentageLabel,
        initialBasis: initialBasis,
        totalLiens: totalLiens,
        adjustedBasis: adjustedBasis,
        deduction: deduction,
        taxSavings: taxSavings,
        
        // Status
        eligible: allowable,
        eligibilityStatus: eligibilityStatus,
        eligibilityMessage: eligibilityMessage,
        nonResidentAdjustment: nonResidentAdjustment,
        isNonResidentAlien: formData.isNonResidentAlien,
        
        // Breakdown
        breakdown: {
          mortgagePaid: mortgagePaid,
          claims: claims,
          unpaidMortgages: unpaidMortgages,
          otherDeductions: otherDeductions
        },
        
        // Eligibility requirements checklist
        requirements: {
          priorTaxPaid: priorTax > 0,
          within5Years: isWithin5Years,
          identifiable: true,
          philippinesProperty: true,
          notPreviouslyClaimed: true
        }
      });

      setIsCalculating(false);
    }, 300);
  }, [formData.priorTransferDate, formData.priorTaxPaid, formData.priorPropertyValue,
      formData.presentDeathDate, formData.presentPropertyValue, formData.mortgagePaid,
      formData.claimsAgainstEstate, formData.unpaidMortgages, formData.otherDeductions,
      formData.isNonResidentAlien, formData.propertyDescription, formData.priorTransferType,
      formData.taxRegime]);

  // ============================================================
  // FORMATTING HELPERS
  // ============================================================
  
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

  const getEligibilityIcon = (status) => {
    switch(status) {
      case 'eligible': return <CheckCircleIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />;
      case 'warning': return <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />;
      case 'ineligible': return <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />;
      default: return null;
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  
  return (
    <div className="vanishing-deduction-calculator">
      {/* Header */}
      <div className="calculator-header">
        <div className="header-left">
          <div className="header-title-group">
            <div className="icon-wrapper">
              <CalculatorIcon className="header-icon" />
            </div>
            <div>
              <h3>Vanishing Deduction Calculator</h3>
              <p>Estate Tax - Sec. 86(A)(2) of the Tax Code (1977-Present)</p>
            </div>
          </div>
        </div>
        <div className="header-badge">
          <span className={`badge ${isAllFieldsFilled() ? 'active' : ''}`}>
            <span className="badge-dot"></span>
            {isAllFieldsFilled() ? 'Auto-Calculating' : 'Awaiting Input'}
          </span>
        </div>
      </div>

      <div className="calculator-grid">
        {/* Left Column - Form */}
        <div className="calculator-form">
          {/* Property Description */}
          <div className="form-group">
            <label htmlFor="propertyDescription">
              <DocumentTextIcon className="input-icon" />
              Property Description (Optional)
            </label>
            <input
              type="text"
              id="propertyDescription"
              name="propertyDescription"
              value={formData.propertyDescription}
              onChange={handleInputChange}
              placeholder="e.g., Residential Lot in Makati"
              className="form-input"
            />
          </div>

          {/* ============================================================
              NEW: TAX REGIME SELECTOR
              ============================================================ */}
          <div className="form-group section-group regime-selector">
            <div className="section-header">
              <CalendarIcon className="section-icon" />
              <span className="section-title">Tax Regime</span>
              <span className="section-badge">Select Period</span>
            </div>
            <div className="regime-options">
              <label className={`regime-option ${formData.taxRegime === 'train' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="taxRegime"
                  value="train"
                  checked={formData.taxRegime === 'train'}
                  onChange={handleInputChange}
                />
                <span className="regime-label">TRAIN Law</span>
                <span className="regime-sub">2018-Present (6%)</span>
              </label>
              <label className={`regime-option ${formData.taxRegime === 'ra8424' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="taxRegime"
                  value="ra8424"
                  checked={formData.taxRegime === 'ra8424'}
                  onChange={handleInputChange}
                />
                <span className="regime-label">RA 8424</span>
                <span className="regime-sub">1998-2017 (5%-20%)</span>
              </label>
              <label className={`regime-option ${formData.taxRegime === 'pd1158' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="taxRegime"
                  value="pd1158"
                  checked={formData.taxRegime === 'pd1158'}
                  onChange={handleInputChange}
                />
                <span className="regime-label">PD 1158</span>
                <span className="regime-sub">1977-1997 (5%-35%)</span>
              </label>
            </div>
            <div className="regime-note">
              <InformationCircleIcon className="regime-note-icon" />
              <span>
                {formData.taxRegime === 'train' && 'TRAIN Law: Flat 6% estate tax rate.'}
                {formData.taxRegime === 'ra8424' && 'RA 8424: Graduated estate tax rates from 5% to 20%.'}
                {formData.taxRegime === 'pd1158' && 'PD 1158: Graduated estate tax rates from 5% to 35%.'}
              </span>
            </div>
          </div>

          {/* Prior Transfer Section */}
          <div className="section-group">
            <div className="section-header">
              <ArrowPathIcon className="section-icon" />
              <span className="section-title">Prior Transfer Details</span>
              <span className="section-badge">Previous Transfer</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priorTransferDate">
                  <CalendarIcon className="input-icon" />
                  Date of Prior Transfer
                </label>
                <input
                  type="date"
                  id="priorTransferDate"
                  name="priorTransferDate"
                  value={formData.priorTransferDate}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="priorTransferType">
                  <DocumentTextIcon className="input-icon" />
                  Transfer Type
                </label>
                <select
                  id="priorTransferType"
                  name="priorTransferType"
                  value={formData.priorTransferType}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="inheritance">Inheritance (Estate Tax)</option>
                  <option value="donation">Donation (Donor's Tax)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priorTaxPaid">
                  <BanknotesIcon className="input-icon" />
                  Tax Paid on Prior Transfer
                </label>
                <input
                  type="text"
                  id="priorTaxPaid"
                  name="priorTaxPaid"
                  value={displayValues.priorTaxPaid || formData.priorTaxPaid}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus('priorTaxPaid')}
                  onBlur={() => handleBlur('priorTaxPaid')}
                  placeholder="₱0.00"
                  className="form-input currency-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="priorPropertyValue">
                  <CurrencyDollarIcon className="input-icon" />
                  Property Value at Prior Transfer
                </label>
                <input
                  type="text"
                  id="priorPropertyValue"
                  name="priorPropertyValue"
                  value={displayValues.priorPropertyValue || formData.priorPropertyValue}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus('priorPropertyValue')}
                  onBlur={() => handleBlur('priorPropertyValue')}
                  placeholder="₱0.00"
                  className="form-input currency-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Present Transfer Section */}
          <div className="section-group">
            <div className="section-header">
              <CalendarIcon className="section-icon" />
              <span className="section-title">Present Decedent Details</span>
              <span className="section-badge">Current Transfer</span>
            </div>

            <div className="form-group">
              <label htmlFor="presentDeathDate">
                <CalendarIcon className="input-icon" />
                Date of Present Decedent's Death
              </label>
              <input
                type="date"
                id="presentDeathDate"
                name="presentDeathDate"
                value={formData.presentDeathDate}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="presentPropertyValue">
                <CurrencyDollarIcon className="input-icon" />
                Property Value at Present Death
              </label>
              <input
                type="text"
                id="presentPropertyValue"
                name="presentPropertyValue"
                value={displayValues.presentPropertyValue || formData.presentPropertyValue}
                onChange={handleInputChange}
                onFocus={() => handleFocus('presentPropertyValue')}
                onBlur={() => handleBlur('presentPropertyValue')}
                placeholder="₱0.00"
                className="form-input currency-input"
                required
              />
            </div>
          </div>

          {/* Liens & Deductions Section */}
          <div className="section-group">
            <div className="section-header">
              <ScaleIcon className="section-icon" />
              <span className="section-title">Liens & Deductions</span>
              <span className="section-badge">Reductions</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mortgagePaid">
                  Mortgage/Lien Paid by Present Decedent
                </label>
                <input
                  type="text"
                  id="mortgagePaid"
                  name="mortgagePaid"
                  value={displayValues.mortgagePaid || formData.mortgagePaid}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus('mortgagePaid')}
                  onBlur={() => handleBlur('mortgagePaid')}
                  placeholder="₱0.00"
                  className="form-input currency-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="claimsAgainstEstate">
                  Claims Against Estate (Proportionate Share)
                </label>
                <input
                  type="text"
                  id="claimsAgainstEstate"
                  name="claimsAgainstEstate"
                  value={displayValues.claimsAgainstEstate || formData.claimsAgainstEstate}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus('claimsAgainstEstate')}
                  onBlur={() => handleBlur('claimsAgainstEstate')}
                  placeholder="₱0.00"
                  className="form-input currency-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="unpaidMortgages">
                  Unpaid Mortgages (Proportionate Share)
                </label>
                <input
                  type="text"
                  id="unpaidMortgages"
                  name="unpaidMortgages"
                  value={displayValues.unpaidMortgages || formData.unpaidMortgages}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus('unpaidMortgages')}
                  onBlur={() => handleBlur('unpaidMortgages')}
                  placeholder="₱0.00"
                  className="form-input currency-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="otherDeductions">
                  Other Deductions (Proportionate Share)
                </label>
                <input
                  type="text"
                  id="otherDeductions"
                  name="otherDeductions"
                  value={displayValues.otherDeductions || formData.otherDeductions}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus('otherDeductions')}
                  onBlur={() => handleBlur('otherDeductions')}
                  placeholder="₱0.00"
                  className="form-input currency-input"
                />
              </div>
            </div>
          </div>

          {/* Special Considerations */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isNonResidentAlien"
                checked={formData.isNonResidentAlien}
                onChange={handleInputChange}
                className="checkbox-input"
              />
              <span className="checkbox-text">
                Decedent is a Non-Resident Alien
                <span className="checkbox-hint">(Deduction limited to PH properties)</span>
              </span>
            </label>
          </div>

          {/* Time Period Indicator */}
          {formData.priorTransferDate && formData.presentDeathDate && (
            <div className="time-period-indicator">
              <ClockIcon className="time-icon" />
              <span className="time-label">
                Time between transfers: 
                <strong className="time-value">
                  {calculateYearsBetween(formData.priorTransferDate, formData.presentDeathDate) !== null 
                    ? ` ${calculateYearsBetween(formData.priorTransferDate, formData.presentDeathDate).toFixed(2)} years`
                    : ' Calculating...'}
                </strong>
              </span>
              {calculateYearsBetween(formData.priorTransferDate, formData.presentDeathDate) !== null && 
               calculateYearsBetween(formData.priorTransferDate, formData.presentDeathDate) > 5 && (
                <span className="time-warning">⚠️ Beyond 5-year limit</span>
              )}
            </div>
          )}
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
                  <div className={`results-icon-wrapper ${result.eligibilityStatus}`}>
                    {getEligibilityIcon(result.eligibilityStatus)}
                  </div>
                  <div>
                    <h4>Vanishing Deduction Results</h4>
                    <p className="property-name">{result.propertyDescription}</p>
                  </div>
                </div>

                {/* Eligibility Status Banner */}
                <div className={`eligibility-banner ${result.eligibilityStatus}`}>
                  {getEligibilityIcon(result.eligibilityStatus)}
                  <span className="eligibility-text">
                    {result.eligibilityStatus === 'eligible' && '✅ Eligible for Vanishing Deduction'}
                    {result.eligibilityStatus === 'warning' && '⚠️ Conditional Eligibility'}
                    {result.eligibilityStatus === 'ineligible' && '❌ Not Eligible'}
                  </span>
                  <span className="eligibility-detail">{result.eligibilityMessage}</span>
                </div>

                {/* Date & Transfer Info */}
                <div className="results-grid">
                  <div className="result-detail">
                    <span className="detail-label">Prior Transfer Date</span>
                    <span className="detail-value">{formatDate(result.priorTransferDate)}</span>
                    <span className="detail-sub">{result.priorTransferType === 'inheritance' ? 'Inheritance' : 'Donation'}</span>
                  </div>
                  <div className="result-detail">
                    <span className="detail-label">Present Death Date</span>
                    <span className="detail-value">{formatDate(result.presentDeathDate)}</span>
                  </div>
                  <div className="result-detail highlight">
                    <span className="detail-label">Time Between Transfers</span>
                    <span className="detail-value">{result.yearsBetween ? result.yearsBetween.toFixed(2) : 'N/A'} years</span>
                    <span className="detail-sub">{result.periodLabel}</span>
                  </div>
                  <div className="result-detail highlight">
                    <span className="detail-label">Deductible Percentage</span>
                    <span className="detail-value percentage-value">{result.percentageLabel}</span>
                    <span className="detail-sub">{result.isWithin5Years ? 'Within 5-year limit' : 'Exceeded 5-year limit'}</span>
                  </div>
                </div>

                {/* NEW: Tax Regime Information */}
                <div className="regime-info-display">
                  <div className="regime-info-header">
                    <DocumentTextIcon className="regime-info-icon" />
                    <span className="regime-info-title">Tax Regime Applied</span>
                  </div>
                  <div className="regime-info-content">
                    <span className="regime-name">{result.regimeInfo.label}</span>
                    <span className="regime-rate">{result.regimeInfo.rateDisplay}</span>
                    <span className="regime-type">{result.regimeInfo.rateType} Rate</span>
                  </div>
                </div>

                <div className="result-divider"></div>

                {/* Detailed Computation */}
                <div className="computation-section">
                  <div className="computation-header">
                    <DocumentTextIcon className="computation-icon" />
                    <span className="computation-title">Computation Breakdown</span>
                  </div>

                  {/* Step 1: Initial Basis */}
                  <div className="computation-step">
                    <div className="step-header">
                      <span className="step-number">1</span>
                      <span className="step-label">Initial Basis</span>
                    </div>
                    <div className="step-detail">
                      <span className="step-formula">Lower of prior value or present value</span>
                    </div>
                    <div className="step-values">
                      <span className="value-item">Prior: {formatCurrency(result.priorValue)}</span>
                      <span className="value-operator">vs</span>
                      <span className="value-item">Present: {formatCurrency(result.presentValue)}</span>
                      <span className="value-result">= {formatCurrency(result.initialBasis)}</span>
                    </div>
                  </div>

                  {/* Step 2: Liens & Deductions */}
                  <div className="computation-step">
                    <div className="step-header">
                      <span className="step-number">2</span>
                      <span className="step-label">Less: Liens & Deductions</span>
                    </div>
                    <div className="step-detail">
                      {result.breakdown.mortgagePaid > 0 && (
                        <div className="deduction-item">
                          <span className="deduction-label">Mortgage/Lien Paid</span>
                          <span className="deduction-value">{formatCurrency(result.breakdown.mortgagePaid)}</span>
                        </div>
                      )}
                      {result.breakdown.claims > 0 && (
                        <div className="deduction-item">
                          <span className="deduction-label">Claims Against Estate</span>
                          <span className="deduction-value">{formatCurrency(result.breakdown.claims)}</span>
                        </div>
                      )}
                      {result.breakdown.unpaidMortgages > 0 && (
                        <div className="deduction-item">
                          <span className="deduction-label">Unpaid Mortgages</span>
                          <span className="deduction-value">{formatCurrency(result.breakdown.unpaidMortgages)}</span>
                        </div>
                      )}
                      {result.breakdown.otherDeductions > 0 && (
                        <div className="deduction-item">
                          <span className="deduction-label">Other Deductions</span>
                          <span className="deduction-value">{formatCurrency(result.breakdown.otherDeductions)}</span>
                        </div>
                      )}
                      {result.totalLiens === 0 && (
                        <div className="deduction-item no-deductions">
                          <span className="deduction-label">No deductions applied</span>
                          <span className="deduction-value">₱0.00</span>
                        </div>
                      )}
                      <div className="deduction-total">
                        <span className="total-label">Total Liens & Deductions</span>
                        <span className="total-value">{formatCurrency(result.totalLiens)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Adjusted Basis */}
                  <div className="computation-step highlight-step">
                    <div className="step-header">
                      <span className="step-number">3</span>
                      <span className="step-label">Adjusted Basis</span>
                    </div>
                    <div className="step-formula-display">
                      <span className="formula-text">{formatCurrency(result.initialBasis)} - {formatCurrency(result.totalLiens)}</span>
                      <span className="formula-equals">=</span>
                      <span className="formula-result">{formatCurrency(result.adjustedBasis)}</span>
                    </div>
                  </div>

                  {/* Step 4: Apply Percentage */}
                  <div className="computation-step final-step">
                    <div className="step-header">
                      <span className="step-number">4</span>
                      <span className="step-label">Apply Deductible Percentage</span>
                    </div>
                    <div className="step-formula-display">
                      <span className="formula-text">{formatCurrency(result.adjustedBasis)} × {result.percentageLabel}</span>
                      <span className="formula-equals">=</span>
                      <span className="formula-result final">{formatCurrency(result.deduction)}</span>
                    </div>
                  </div>
                </div>

                <div className="result-divider"></div>

                {/* Final Results */}
                <div className="result-items">
                  <div className="result-item">
                    <span className="result-label">
                      <ScaleIcon className="result-icon" />
                      Vanishing Deduction
                    </span>
                    <span className="result-value deduction-amount">{formatCurrency(result.deduction)}</span>
                  </div>

                  <div className="result-item">
                    <span className="result-label">
                      <BanknotesIcon className="result-icon" />
                      Tax Savings ({result.regimeInfo.rateDisplay})
                    </span>
                    <span className="result-value savings-amount">{formatCurrency(result.taxSavings)}</span>
                  </div>

                  <div className="result-item">
                    <span className="result-label">
                      <InformationCircleIcon className="result-icon" />
                      Applied Rate
                    </span>
                    <span className="result-value">
                      {(result.applicableRate * 100).toFixed(1)}% ({result.regimeInfo.rateType})
                    </span>
                  </div>

                  {result.isNonResidentAlien && (
                    <div className="result-item non-resident-note">
                      <span className="result-label">
                        <InformationCircleIcon className="result-icon" />
                        Non-Resident Alien
                      </span>
                      <span className="result-value note-text">{result.nonResidentAdjustment}</span>
                    </div>
                  )}
                </div>

                {/* Requirements Checklist */}
                <div className="requirements-section">
                  <div className="requirements-header">
                    <ShieldCheckIcon className="requirements-icon" />
                    <span className="requirements-title">Eligibility Requirements</span>
                  </div>
                  <div className="requirements-list">
                    <div className={`requirement-item ${result.requirements.priorTaxPaid ? 'met' : 'not-met'}`}>
                      <span className="requirement-check">{result.requirements.priorTaxPaid ? '✅' : '❌'}</span>
                      <span className="requirement-label">Prior tax paid on transfer</span>
                    </div>
                    <div className={`requirement-item ${result.requirements.within5Years ? 'met' : 'not-met'}`}>
                      <span className="requirement-check">{result.requirements.within5Years ? '✅' : '❌'}</span>
                      <span className="requirement-label">Within 5-year period</span>
                    </div>
                    <div className={`requirement-item ${result.requirements.identifiable ? 'met' : 'not-met'}`}>
                      <span className="requirement-check">{result.requirements.identifiable ? '✅' : '❌'}</span>
                      <span className="requirement-label">Identifiable property</span>
                    </div>
                    <div className={`requirement-item ${result.requirements.philippinesProperty ? 'met' : 'not-met'}`}>
                      <span className="requirement-check">{result.requirements.philippinesProperty ? '✅' : '❌'}</span>
                      <span className="requirement-label">Located in the Philippines</span>
                    </div>
                    <div className={`requirement-item ${result.requirements.notPreviouslyClaimed ? 'met' : 'not-met'}`}>
                      <span className="requirement-check">{result.requirements.notPreviouslyClaimed ? '✅' : '❌'}</span>
                      <span className="requirement-label">Not previously claimed for deduction</span>
                    </div>
                  </div>
                </div>

                {/* Formula Display */}
                <div className="result-formula">
                  <ExclamationTriangleIcon className="formula-icon" />
                  <span>
                    Vanishing Deduction = (Lower of Prior/Present Value - Liens) × Deductible Percentage
                  </span>
                </div>

                {/* Historical Note */}
                <div className="historical-note">
                  <InformationCircleIcon className="historical-note-icon" />
                  <span>
                    {result.regimeInfo.rateType === 'Flat' 
                      ? `Under ${result.regimeInfo.label}, the estate tax is a flat ${result.regimeInfo.rateDisplay}. The tax savings from the vanishing deduction is calculated using this rate.`
                      : `Under ${result.regimeInfo.label}, the estate tax follows a graduated rate structure (${result.regimeInfo.rateDisplay}). The tax savings shown reflects the rate applicable to the adjusted basis.`
                    }
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
                <h4>Ready to Compute</h4>
                <p>
                  Fill in all required fields above. The vanishing deduction 
                  will auto-calculate when complete.
                </p>
                <div className="placeholder-requirements">
                  <div className="req-item">
                    <span className="req-dot">•</span>
                    <span>Select applicable tax regime</span>
                  </div>
                  <div className="req-item">
                    <span className="req-dot">•</span>
                    <span>Prior transfer date & tax paid</span>
                  </div>
                  <div className="req-item">
                    <span className="req-dot">•</span>
                    <span>Present decedent's death date</span>
                  </div>
                  <div className="req-item">
                    <span className="req-dot">•</span>
                    <span>Property values at both transfers</span>
                  </div>
                </div>
                {isAllFieldsFilled() && (
                  <div className="placeholder-note processing">
                    <ArrowPathIcon className="note-icon spinning" />
                    <span>Calculating deduction...</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .vanishing-deduction-calculator {
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
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(124, 58, 237, 0.05));
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .header-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #8b5cf6;
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
          background: rgba(139, 92, 246, 0.08);
          color: #8b5cf6;
          border-color: rgba(139, 92, 246, 0.15);
        }

        .badge-dot {
          width: 0.375rem;
          height: 0.375rem;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s ease-in-out infinite;
        }

        .badge.active .badge-dot {
          background: #8b5cf6;
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
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.08);
        }

        .form-input::placeholder {
          color: var(--text-tertiary);
        }

        .form-input select {
          appearance: auto;
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

        /* ===== REGIME SELECTOR ===== */
        .regime-selector {
          background: var(--bg-primary);
          border-radius: 0.5rem;
          padding: 0.875rem 1rem;
          border: 1px solid var(--border-color);
        }

        .regime-options {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .regime-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.125rem;
          padding: 0.625rem 0.5rem;
          border-radius: 0.5rem;
          border: 2px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
          text-align: center;
        }

        .regime-option:hover {
          border-color: #8b5cf6;
        }

        .regime-option.selected {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.06);
        }

        .regime-option input {
          display: none;
        }

        .regime-label {
          font-size: 0.813rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .regime-sub {
          font-size: 0.625rem;
          color: var(--text-secondary);
        }

        .regime-note {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-top: 0.5rem;
          padding: 0.375rem 0.5rem;
          background: rgba(59, 130, 246, 0.04);
          border-radius: 0.375rem;
          font-size: 0.688rem;
          color: var(--text-secondary);
          border: 1px solid rgba(59, 130, 246, 0.08);
        }

        .regime-note-icon {
          width: 0.875rem;
          height: 0.875rem;
          color: #3b82f6;
          flex-shrink: 0;
        }

        /* ===== SECTION GROUPS ===== */
        .section-group {
          background: var(--bg-primary);
          border-radius: 0.5rem;
          padding: 0.875rem 1rem;
          border: 1px solid var(--border-color);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .section-icon {
          width: 0.875rem;
          height: 0.875rem;
          color: #8b5cf6;
        }

        .section-title {
          font-size: 0.813rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .section-badge {
          font-size: 0.625rem;
          padding: 0.125rem 0.5rem;
          border-radius: 2rem;
          background: rgba(139, 92, 246, 0.08);
          color: #8b5cf6;
          font-weight: 500;
          margin-left: auto;
        }

        /* ===== CHECKBOX ===== */
        .checkbox-group {
          padding: 0.25rem 0;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          cursor: pointer;
          font-size: 0.813rem;
          color: var(--text-primary);
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          transition: all 0.2s;
        }

        .checkbox-label:hover {
          border-color: #8b5cf6;
        }

        .checkbox-input {
          margin-top: 0.125rem;
          width: 1rem;
          height: 1rem;
          accent-color: #8b5cf6;
          flex-shrink: 0;
        }

        .checkbox-text {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .checkbox-hint {
          font-size: 0.688rem;
          color: var(--text-tertiary);
          font-weight: 400;
        }

        /* ===== TIME PERIOD INDICATOR ===== */
        .time-period-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          background: rgba(59, 130, 246, 0.04);
          border: 1px solid rgba(59, 130, 246, 0.08);
          font-size: 0.813rem;
          color: var(--text-secondary);
        }

        .time-icon {
          width: 1rem;
          height: 1rem;
          color: #3b82f6;
          flex-shrink: 0;
        }

        .time-label {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }

        .time-value {
          color: var(--text-primary);
          font-weight: 600;
        }

        .time-warning {
          color: #ef4444;
          font-weight: 500;
          font-size: 0.75rem;
          margin-left: auto;
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
          max-height: 80vh;
          overflow-y: auto;
        }

        .results-card::-webkit-scrollbar {
          width: 4px;
        }

        .results-card::-webkit-scrollbar-track {
          background: transparent;
        }

        .results-card::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 2rem;
        }

        .results-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .results-icon-wrapper {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .results-icon-wrapper.eligible {
          background: rgba(16, 185, 129, 0.08);
        }

        .results-icon-wrapper.warning {
          background: rgba(245, 158, 11, 0.08);
        }

        .results-icon-wrapper.ineligible {
          background: rgba(239, 68, 68, 0.08);
        }

        .results-header h4 {
          font-size: 0.938rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.125rem 0;
        }

        .property-name {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0;
        }

        /* ===== ELIGIBILITY BANNER ===== */
        .eligibility-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }

        .eligibility-banner.eligible {
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.12);
        }

        .eligibility-banner.warning {
          background: rgba(245, 158, 11, 0.06);
          border: 1px solid rgba(245, 158, 11, 0.12);
        }

        .eligibility-banner.ineligible {
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.12);
        }

        .eligibility-text {
          font-size: 0.813rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .eligibility-detail {
          font-size: 0.75rem;
          color: var(--text-secondary);
          flex: 1;
          min-width: 100%;
          padding-top: 0.125rem;
        }

        /* ===== RESULTS GRID ===== */
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
          background: rgba(139, 92, 246, 0.04);
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

        .detail-value.percentage-value {
          color: #8b5cf6;
          font-weight: 700;
        }

        .detail-sub {
          font-size: 0.688rem;
          color: var(--text-tertiary);
        }

        .result-divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.75rem 0;
        }

        /* ===== REGIME INFO DISPLAY ===== */
        .regime-info-display {
          background: rgba(139, 92, 246, 0.04);
          border: 1px solid rgba(139, 92, 246, 0.12);
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          margin-bottom: 0.75rem;
        }

        .regime-info-header {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-bottom: 0.25rem;
        }

        .regime-info-icon {
          width: 0.875rem;
          height: 0.875rem;
          color: #8b5cf6;
        }

        .regime-info-title {
          font-size: 0.688rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .regime-info-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .regime-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .regime-rate {
          font-size: 0.813rem;
          font-weight: 700;
          color: #8b5cf6;
          background: rgba(139, 92, 246, 0.08);
          padding: 0.125rem 0.5rem;
          border-radius: 2rem;
        }

        .regime-type {
          font-size: 0.688rem;
          color: var(--text-secondary);
          background: var(--bg-primary);
          padding: 0.125rem 0.5rem;
          border-radius: 2rem;
          border: 1px solid var(--border-color);
        }

        /* ===== COMPUTATION SECTION ===== */
        .computation-section {
          margin: 0.5rem 0;
        }

        .computation-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .computation-icon {
          width: 1rem;
          height: 1rem;
          color: #8b5cf6;
        }

        .computation-title {
          font-size: 0.813rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .computation-step {
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.5rem;
          border-radius: 0.375rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
        }

        .computation-step.highlight-step {
          border-color: rgba(139, 92, 246, 0.2);
          background: rgba(139, 92, 246, 0.04);
        }

        .computation-step.final-step {
          border-color: rgba(245, 158, 11, 0.2);
          background: rgba(245, 158, 11, 0.04);
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 50%;
          background: #8b5cf6;
          color: white;
          font-size: 0.625rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .step-detail {
          margin-left: 1.75rem;
          margin-bottom: 0.25rem;
        }

        .step-formula {
          font-size: 0.688rem;
          color: var(--text-secondary);
          font-style: italic;
        }

        .step-values {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-left: 1.75rem;
          font-size: 0.75rem;
        }

        .value-item {
          color: var(--text-secondary);
        }

        .value-operator {
          color: var(--text-tertiary);
          font-weight: 300;
        }

        .value-result {
          font-weight: 600;
          color: #8b5cf6;
        }

        .deduction-item {
          display: flex;
          justify-content: space-between;
          padding: 0.125rem 0;
          font-size: 0.75rem;
        }

        .deduction-item.no-deductions {
          color: var(--text-tertiary);
        }

        .deduction-label {
          color: var(--text-secondary);
        }

        .deduction-value {
          font-weight: 500;
          color: var(--text-primary);
        }

        .deduction-total {
          display: flex;
          justify-content: space-between;
          padding: 0.25rem 0;
          border-top: 1px dashed var(--border-color);
          margin-top: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .total-label {
          color: var(--text-primary);
        }

        .total-value {
          color: #ef4444;
        }

        .step-formula-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-left: 1.75rem;
          padding: 0.375rem 0.5rem;
          background: var(--bg-secondary);
          border-radius: 0.25rem;
          font-size: 0.75rem;
          flex-wrap: wrap;
        }

        .formula-text {
          color: var(--text-secondary);
        }

        .formula-equals {
          color: var(--text-tertiary);
          font-weight: 300;
        }

        .formula-result {
          font-weight: 600;
          color: #8b5cf6;
        }

        .formula-result.final {
          color: #f59e0b;
          font-size: 0.875rem;
        }

        /* ===== RESULT ITEMS ===== */
        .result-items {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.375rem 0;
        }

        .result-label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.813rem;
          color: var(--text-secondary);
        }

        .result-icon {
          width: 0.875rem;
          height: 0.875rem;
          color: var(--text-tertiary);
        }

        .result-value {
          font-size: 0.813rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .result-value.deduction-amount {
          font-size: 1.125rem;
          font-weight: 700;
          color: #8b5cf6;
        }

        .result-value.savings-amount {
          font-size: 1rem;
          font-weight: 600;
          color: #10b981;
        }

        .result-item.non-resident-note {
          background: rgba(59, 130, 246, 0.04);
          border-radius: 0.375rem;
          padding: 0.25rem 0.5rem;
          margin-top: 0.25rem;
        }

        .result-value.note-text {
          font-size: 0.75rem;
          color: #3b82f6;
          font-weight: 400;
        }

        /* ===== REQUIREMENTS ===== */
        .requirements-section {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-primary);
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
        }

        .requirements-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .requirements-icon {
          width: 0.875rem;
          height: 0.875rem;
          color: #8b5cf6;
        }

        .requirements-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .requirements-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.25rem 0.5rem;
        }

        .requirement-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.688rem;
          padding: 0.125rem 0;
        }

        .requirement-item.met {
          color: var(--text-secondary);
        }

        .requirement-item.not-met {
          color: var(--text-tertiary);
          opacity: 0.6;
        }

        .requirement-check {
          flex-shrink: 0;
        }

        .requirement-label {
          color: var(--text-secondary);
        }

        .requirement-item.not-met .requirement-label {
          text-decoration: line-through;
        }

        /* ===== FORMULA ===== */
        .result-formula {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: rgba(139, 92, 246, 0.04);
          border-radius: 0.375rem;
          font-size: 0.688rem;
          color: var(--text-secondary);
          border: 1px solid rgba(139, 92, 246, 0.08);
          flex-wrap: wrap;
        }

        .formula-icon {
          width: 0.875rem;
          height: 0.875rem;
          color: #8b5cf6;
          flex-shrink: 0;
        }

        /* ===== HISTORICAL NOTE ===== */
        .historical-note {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: rgba(245, 158, 11, 0.04);
          border-radius: 0.375rem;
          font-size: 0.688rem;
          color: var(--text-secondary);
          border: 1px solid rgba(245, 158, 11, 0.08);
        }

        .historical-note-icon {
          width: 0.875rem;
          height: 0.875rem;
          color: #f59e0b;
          flex-shrink: 0;
          margin-top: 0.0625rem;
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
          gap: 0.5rem;
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

        .placeholder-requirements {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-primary);
          border-radius: 0.375rem;
          width: 100%;
          text-align: left;
        }

        .req-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .req-dot {
          color: #8b5cf6;
        }

        .placeholder-note.processing {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(139, 92, 246, 0.06);
          border-radius: 0.375rem;
          font-size: 0.75rem;
          color: #8b5cf6;
          width: 100%;
          justify-content: center;
          border: 1px solid rgba(139, 92, 246, 0.08);
        }

        .note-icon.spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          .calculator-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }

          .results-card {
            max-height: none;
          }
        }

        @media (max-width: 768px) {
          .vanishing-deduction-calculator {
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

          .results-grid {
            grid-template-columns: 1fr;
          }

          .result-detail.highlight {
            grid-column: span 1;
          }

          .results-card {
            padding: 1rem;
          }

          .requirements-list {
            grid-template-columns: 1fr;
          }

          .badge {
            font-size: 0.625rem;
          }

          .step-values {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.125rem;
          }

          .step-formula-display {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .regime-options {
            grid-template-columns: 1fr;
          }

          .regime-info-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }

        @media (max-width: 480px) {
          .vanishing-deduction-calculator {
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

          .result-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.125rem;
          }

          .result-value.deduction-amount {
            font-size: 1rem;
          }

          .section-header {
            flex-wrap: wrap;
          }

          .section-badge {
            margin-left: 0;
          }

          .time-period-indicator {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .time-warning {
            margin-left: 0;
          }
        }

        /* ===== DARK MODE ===== */
        [data-theme="dark"] .section-group {
          background: var(--bg-secondary);
        }

        [data-theme="dark"] .regime-selector {
          background: var(--bg-secondary);
        }

        [data-theme="dark"] .badge.active {
          background: rgba(139, 92, 246, 0.12);
        }

        [data-theme="dark"] .checkbox-label {
          background: var(--bg-primary);
        }

        [data-theme="dark"] .computation-step {
          background: var(--bg-secondary);
        }

        [data-theme="dark"] .result-detail.highlight {
          background: rgba(139, 92, 246, 0.06);
        }

        [data-theme="dark"] .requirements-section {
          background: var(--bg-secondary);
        }

        [data-theme="dark"] .regime-option {
          background: var(--bg-primary);
        }

        [data-theme="dark"] .regime-option.selected {
          background: rgba(139, 92, 246, 0.12);
        }

        [data-theme="dark"] .eligibility-banner.eligible {
          background: rgba(16, 185, 129, 0.08);
        }

        [data-theme="dark"] .eligibility-banner.warning {
          background: rgba(245, 158, 11, 0.08);
        }

        [data-theme="dark"] .eligibility-banner.ineligible {
          background: rgba(239, 68, 68, 0.08);
        }

        [data-theme="dark"] .regime-info-display {
          background: rgba(139, 92, 246, 0.08);
        }
      `}</style>
    </div>
  );
};

export default VanishingDeductionCalculator;