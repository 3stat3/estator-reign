import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CalculatorIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  HomeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  TruckIcon,
  HeartIcon,
  PencilSquareIcon,
  PrinterIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { getApplicableTaxRegime, computeTax, hasSpecialDeductions, getStandardDeduction, getFamilyHomeMax, getMedicalExpensesMax } from '../../utils/taxEngine';

// Helper function to format numbers with commas
const formatNumberWithCommas = (value) => {
  if (value === null || value === undefined || value === '') return '';
  return Number(value).toLocaleString();
};

// Separate Modal component to prevent re-renders
const AddEditModal = ({ isOpen, onClose, onSave, title, initialDescription, initialValue, onDescriptionChange, onValueChange }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={initialDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="e.g., Family Home, Savings Account, etc."
            />
          </div>
          <div className="form-group">
            <label>Value (₱)</label>
            <input
              type="text"
              value={formatNumberWithCommas(initialValue)}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/,/g, '');
                onValueChange(rawValue);
              }}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

const EstateTaxCalculator = () => {
  // Decedent Information
  const [decedentInfo, setDecedentInfo] = useState({
    name: '',
    tin: '',
    residence: '',
    dateOfDeath: '',
    executor: '',
    executorTin: '',
    dueDate: ''
  });

  // Tax regime based on date of death
  const [taxRegime, setTaxRegime] = useState({
    law: 'TRAIN',
    name: 'TRAIN Law',
    rateType: 'percentage',
    flatRate: 0.06,
    graduatedRates: [],
    netEstateExemption: 0,
    description: 'TRAIN Law (Jan 1, 2018 - present) - 6% flat rate',
    hasSpecialDeductions: true,
    standardDeductionAmount: 5000000,
    familyHomeMax: 10000000,
    medicalExpensesMax: 500000
  });

  // Exclusive Properties
  const [exclusiveRealProperties, setExclusiveRealProperties] = useState([]);
  const [exclusivePersonalProperties, setExclusivePersonalProperties] = useState([]);

  // Conjugal Properties
  const [conjugalRealProperties, setConjugalRealProperties] = useState([]);
  const [conjugalPersonalProperties, setConjugalPersonalProperties] = useState([]);

  // Taxable Transfers
  const [taxableTransfers, setTaxableTransfers] = useState([]);

  // Deductions
  const [deductions, setDeductions] = useState({
    funeralExpenses: 0,
    judicialExpenses: 0,
    claimsAgainstEstate: 0,
    claimsAgainstInsolvent: 0,
    unpaidMortgages: 0,
    transfersForPublicUse: 0,
    propertyPreviouslyTaxed: 0,
    familyHome: 0,
    standardDeduction: 5000000,
    medicalExpenses: 0,
    otherDeductions: 0
  });

  // UI State - Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalEditId, setModalEditId] = useState(null);
  const [modalDescription, setModalDescription] = useState('');
  const [modalValue, setModalValue] = useState('');

  const [taxReturnFiled, setTaxReturnFiled] = useState(false);
  const [taxPaidPerReturn, setTaxPaidPerReturn] = useState(0);
  const [surcharge, setSurcharge] = useState(0);
  const [interest, setInterest] = useState(0);
  const [compromisePenalty, setCompromisePenalty] = useState(0);
  const [showAuditMode, setShowAuditMode] = useState(false);
  const [showTaxDetails, setShowTaxDetails] = useState(false);

  // Determine tax regime based on date of death using settings
  const determineTaxRegime = useCallback((dateOfDeath) => {
    if (!dateOfDeath) return taxRegime;
    
    const applicableRegime = getApplicableTaxRegime(dateOfDeath);
    
    if (applicableRegime) {
      return {
        law: applicableRegime.id,
        name: applicableRegime.name,
        rateType: applicableRegime.calculationType,
        flatRate: applicableRegime.calculationType === 'percentage' ? applicableRegime.config.rate / 100 : 0,
        graduatedRates: (applicableRegime.config.brackets || []).map(b => ({
          from: b.min,
          to: b.max,
          rate: b.rate / 100,
          base: b.base
        })),
        netEstateExemption: applicableRegime.exemptions?.netEstateExemption || 0,
        description: applicableRegime.description,
        hasSpecialDeductions: hasSpecialDeductions(applicableRegime),
        standardDeductionAmount: getStandardDeduction(applicableRegime),
        familyHomeMax: getFamilyHomeMax(applicableRegime),
        medicalExpensesMax: getMedicalExpensesMax(applicableRegime)
      };
    }
    
    return taxRegime;
  }, [taxRegime]);

  // Update tax regime when date of death changes
  useEffect(() => {
    if (decedentInfo.dateOfDeath) {
      const newRegime = determineTaxRegime(decedentInfo.dateOfDeath);
      setTaxRegime(newRegime);
      
      // Auto-adjust deductions based on regime
      if (newRegime.hasSpecialDeductions) {
        setDeductions(prev => ({ 
          ...prev, 
          standardDeduction: newRegime.standardDeductionAmount,
          familyHome: 0,
          medicalExpenses: 0
        }));
      } else {
        setDeductions(prev => ({ 
          ...prev, 
          standardDeduction: 0,
          familyHome: 0,
          medicalExpenses: 0
        }));
      }
    }
  }, [decedentInfo.dateOfDeath, determineTaxRegime]);

  // Helper Functions - memoized
  const sumArray = useCallback((arr) => arr.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0), []);

  const exclusiveRealTotal = useMemo(() => sumArray(exclusiveRealProperties), [exclusiveRealProperties, sumArray]);
  const exclusivePersonalTotal = useMemo(() => sumArray(exclusivePersonalProperties), [exclusivePersonalProperties, sumArray]);
  const conjugalRealTotal = useMemo(() => sumArray(conjugalRealProperties), [conjugalRealProperties, sumArray]);
  const conjugalPersonalTotal = useMemo(() => sumArray(conjugalPersonalProperties), [conjugalPersonalProperties, sumArray]);
  const taxableTransfersTotal = useMemo(() => sumArray(taxableTransfers), [taxableTransfers, sumArray]);

  const grossExclusive = exclusiveRealTotal + exclusivePersonalTotal + taxableTransfersTotal;
  const grossConjugal = conjugalRealTotal + conjugalPersonalTotal;
  const grossEstate = grossExclusive + grossConjugal;

  const totalDeductions = 
    deductions.funeralExpenses +
    deductions.judicialExpenses +
    deductions.claimsAgainstEstate +
    deductions.claimsAgainstInsolvent +
    deductions.unpaidMortgages +
    deductions.transfersForPublicUse +
    deductions.propertyPreviouslyTaxed +
    deductions.otherDeductions;

  const familyHomeDeduction = deductions.familyHome;
  const standardDeduction = taxRegime.hasSpecialDeductions ? deductions.standardDeduction : 0;
  const medicalExpensesDeduction = taxRegime.hasSpecialDeductions ? Math.min(deductions.medicalExpenses, taxRegime.medicalExpensesMax) : 0;

  const totalSpecialDeductions = familyHomeDeduction + standardDeduction + medicalExpensesDeduction;

  const conjugalDeductions = totalDeductions + totalSpecialDeductions;
  const exclusiveDeductions = 0;

  const netExclusive = grossExclusive - exclusiveDeductions;
  const netConjugal = grossConjugal - conjugalDeductions;
  const netEstate = netExclusive + netConjugal;

  const survivingSpouseShare = netConjugal / 2;
  let netTaxableEstate = netEstate - survivingSpouseShare;

  if (!taxRegime.hasSpecialDeductions) {
    netTaxableEstate = Math.max(0, netTaxableEstate - taxRegime.netEstateExemption);
  }

  const computeEstateTax = useCallback(() => {
    if (netTaxableEstate <= 0) return 0;
    
    // Find the full regime object from settings
    const savedSettings = localStorage.getItem('taxRateSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        const fullRegime = settings.regimes?.find(r => r.id === taxRegime.law);
        if (fullRegime) {
          return computeTax(netTaxableEstate, fullRegime);
        }
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    
    // Fallback calculation
    if (taxRegime.rateType === 'percentage' || taxRegime.rateType === 'flat') {
      return netTaxableEstate * (taxRegime.flatRate || 0.06);
    } else if (taxRegime.rateType === 'bracketed' || taxRegime.rateType === 'graduated') {
      for (let i = 0; i < taxRegime.graduatedRates.length; i++) {
        const bracket = taxRegime.graduatedRates[i];
        if (netTaxableEstate <= (bracket.to || Infinity)) {
          const excess = netTaxableEstate - bracket.from;
          return bracket.base + (excess * bracket.rate);
        }
      }
    }
    return 0;
  }, [netTaxableEstate, taxRegime]);

  const estateTaxDue = computeEstateTax();
  const taxPayable = estateTaxDue - (taxReturnFiled ? taxPaidPerReturn : 0);
  const totalAmountPayable = Math.max(0, taxPayable + surcharge + interest + compromisePenalty);

  // Modal handlers
  const openModal = useCallback((type, item = null) => {
    setModalType(type);
    setModalEditId(item?.id || null);
    setModalDescription(item?.description || '');
    setModalValue(item?.value?.toString() || '');
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalType(null);
    setModalEditId(null);
    setModalDescription('');
    setModalValue('');
  }, []);

  const saveItem = useCallback(() => {
    if (!modalDescription || !modalValue) return;
    
    const newItem = {
      id: modalEditId || Date.now(),
      description: modalDescription,
      value: parseFloat(modalValue) || 0
    };

    switch(modalType) {
      case 'exclusiveReal':
        if (modalEditId) {
          setExclusiveRealProperties(prev => prev.map(item => item.id === modalEditId ? newItem : item));
        } else {
          setExclusiveRealProperties(prev => [...prev, newItem]);
        }
        break;
      case 'exclusivePersonal':
        if (modalEditId) {
          setExclusivePersonalProperties(prev => prev.map(item => item.id === modalEditId ? newItem : item));
        } else {
          setExclusivePersonalProperties(prev => [...prev, newItem]);
        }
        break;
      case 'conjugalReal':
        if (modalEditId) {
          setConjugalRealProperties(prev => prev.map(item => item.id === modalEditId ? newItem : item));
        } else {
          setConjugalRealProperties(prev => [...prev, newItem]);
        }
        break;
      case 'conjugalPersonal':
        if (modalEditId) {
          setConjugalPersonalProperties(prev => prev.map(item => item.id === modalEditId ? newItem : item));
        } else {
          setConjugalPersonalProperties(prev => [...prev, newItem]);
        }
        break;
      case 'transfer':
        if (modalEditId) {
          setTaxableTransfers(prev => prev.map(item => item.id === modalEditId ? newItem : item));
        } else {
          setTaxableTransfers(prev => [...prev, newItem]);
        }
        break;
      default: break;
    }
    closeModal();
  }, [modalType, modalEditId, modalDescription, modalValue, closeModal]);

  const deleteItem = useCallback((type, id) => {
    switch(type) {
      case 'exclusiveReal':
        setExclusiveRealProperties(prev => prev.filter(item => item.id !== id));
        break;
      case 'exclusivePersonal':
        setExclusivePersonalProperties(prev => prev.filter(item => item.id !== id));
        break;
      case 'conjugalReal':
        setConjugalRealProperties(prev => prev.filter(item => item.id !== id));
        break;
      case 'conjugalPersonal':
        setConjugalPersonalProperties(prev => prev.filter(item => item.id !== id));
        break;
      case 'transfer':
        setTaxableTransfers(prev => prev.filter(item => item.id !== id));
        break;
      default: break;
    }
  }, []);

  const resetForm = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      setDecedentInfo({
        name: '',
        tin: '',
        residence: '',
        dateOfDeath: '',
        executor: '',
        executorTin: '',
        dueDate: ''
      });
      setExclusiveRealProperties([]);
      setExclusivePersonalProperties([]);
      setConjugalRealProperties([]);
      setConjugalPersonalProperties([]);
      setTaxableTransfers([]);
      setDeductions({
        funeralExpenses: 0,
        judicialExpenses: 0,
        claimsAgainstEstate: 0,
        claimsAgainstInsolvent: 0,
        unpaidMortgages: 0,
        transfersForPublicUse: 0,
        propertyPreviouslyTaxed: 0,
        familyHome: 0,
        standardDeduction: 5000000,
        medicalExpenses: 0,
        otherDeductions: 0
      });
      setTaxReturnFiled(false);
      setTaxPaidPerReturn(0);
      setSurcharge(0);
      setInterest(0);
      setCompromisePenalty(0);
    }
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Get modal title
  const getModalTitle = useCallback(() => {
    const typeMap = {
      exclusiveReal: 'Exclusive Real Property',
      exclusivePersonal: 'Exclusive Personal Property',
      conjugalReal: 'Conjugal Real Property',
      conjugalPersonal: 'Conjugal Personal Property',
      transfer: 'Taxable Transfer'
    };
    const typeName = typeMap[modalType] || 'Property';
    return modalEditId ? `Edit ${typeName}` : `Add ${typeName}`;
  }, [modalType, modalEditId]);

  // PropertySection component
  const PropertySection = useCallback(({ title, items, onAdd, onEdit, onDelete, icon: Icon }) => (
    <div className="property-section">
      <div className="section-header">
        <div className="section-title">
          <Icon className="section-icon" />
          <h3>{title}</h3>
        </div>
        <button className="btn-add" onClick={onAdd}>
          <PlusIcon className="w-4 h-4" />
          Add Property
        </button>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">
          <p>No properties added yet. Click "Add Property" to get started.</p>
        </div>
      ) : (
        <div className="property-list">
          {items.map(item => (
            <div key={item.id} className="property-item">
              <div className="property-info">
                <span className="property-desc">{item.description}</span>
                <span className="property-value">₱{formatNumberWithCommas(item.value)}</span>
              </div>
              <div className="property-actions">
                <button className="btn-icon-edit" onClick={() => onEdit(item)}>
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
                <button className="btn-icon-delete" onClick={() => onDelete(item.id)}>
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="section-total">
        <span>Total {title}:</span>
        <strong>₱{formatNumberWithCommas(sumArray(items))}</strong>
      </div>
    </div>
  ), [sumArray]);

  const DeductionField = useCallback(({ label, value, onChange, hint, max, disabled = false }) => (
    <div className="deduction-field">
      <label>{label}</label>
      <div className="deduction-input-wrapper">
        <span className="currency-prefix">₱</span>
        <input
          type="text"
          value={formatNumberWithCommas(value)}
          onChange={(e) => {
            const rawValue = e.target.value.replace(/,/g, '');
            onChange(parseFloat(rawValue) || 0);
          }}
          className="deduction-input"
          disabled={disabled}
        />
      </div>
      {hint && <span className="deduction-hint">{hint}</span>}
      {max && value > max && <span className="deduction-warning">Exceeds limit of ₱{formatNumberWithCommas(max)}</span>}
    </div>
  ), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="estate-tax-calculator"
    >
      <div className="calculator-header">
        <div className="header-title">
          <CalculatorIcon className="header-icon" />
          <div>
            <h1>Estate Tax Calculator</h1>
            <p>ONETT Computation Sheet · BIR Form Style</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={resetForm}>
            <ArrowPathIcon className="w-4 h-4" />
            Reset
          </button>
          <button className="btn-secondary" onClick={handlePrint}>
            <PrinterIcon className="w-4 h-4" />
            Print
          </button>
          <button className={`btn-secondary ${showAuditMode ? 'active' : ''}`} onClick={() => setShowAuditMode(!showAuditMode)}>
            <EyeIcon className="w-4 h-4" />
            {showAuditMode ? 'Standard View' : 'Audit View'}
          </button>
        </div>
      </div>

      <div className="info-section">
        <div className="info-grid">
          <div className="info-field">
            <label>Estate of</label>
            <input type="text" value={decedentInfo.name} onChange={(e) => setDecedentInfo(prev => ({ ...prev, name: e.target.value }))} placeholder="Enter decedent's full name" />
          </div>
          <div className="info-field">
            <label>TIN</label>
            <input type="text" value={decedentInfo.tin} onChange={(e) => setDecedentInfo(prev => ({ ...prev, tin: e.target.value }))} placeholder="000-000-000" />
          </div>
          <div className="info-field">
            <label>Residence of Decedent</label>
            <input type="text" value={decedentInfo.residence} onChange={(e) => setDecedentInfo(prev => ({ ...prev, residence: e.target.value }))} placeholder="Full address" />
          </div>
          <div className="info-field">
            <label>Date of Death</label>
            <input 
              type="date" 
              value={decedentInfo.dateOfDeath} 
              onChange={(e) => setDecedentInfo(prev => ({ ...prev, dateOfDeath: e.target.value }))}
              min="1900-01-01"
              max="2100-12-31"
            />
          </div>
          <div className="info-field">
            <label>Executor/Administrator</label>
            <input type="text" value={decedentInfo.executor} onChange={(e) => setDecedentInfo(prev => ({ ...prev, executor: e.target.value }))} placeholder="Full name" />
          </div>
          <div className="info-field">
            <label>Due Date (ET)</label>
            <input 
              type="date" 
              value={decedentInfo.dueDate} 
              onChange={(e) => setDecedentInfo(prev => ({ ...prev, dueDate: e.target.value }))}
              min="1900-01-01"
              max="2100-12-31"
            />
          </div>
        </div>
      </div>

      {decedentInfo.dateOfDeath && (
        <div className={`tax-regime-banner ${taxRegime.law?.toLowerCase() || 'train'}`}>
          <div className="regime-info">
            <span className="regime-label">Applicable Tax Law:</span>
            <strong>{taxRegime.description}</strong>
          </div>
          <button className="btn-details" onClick={() => setShowTaxDetails(!showTaxDetails)}>
            {showTaxDetails ? 'Hide Rates' : 'View Tax Rates'}
          </button>
        </div>
      )}

      {showTaxDetails && taxRegime.rateType === 'bracketed' && taxRegime.graduatedRates.length > 0 && (
        <div className="tax-details-card">
          <h3>Graduated Tax Rates</h3>
          <table className="tax-rates-table">
            <thead>
              <tr>
                <th>Over (₱)</th>
                <th>But Not Over (₱)</th>
                <th>Base Tax (₱)</th>
                <th>Rate on Excess</th>
              </tr>
            </thead>
            <tbody>
              {taxRegime.graduatedRates.map((bracket, idx) => (
                <tr key={idx}>
                  <td>{formatNumberWithCommas(bracket.from)}</td>
                  <td>{bracket.to === Infinity ? 'Above' : formatNumberWithCommas(bracket.to)}</td>
                  <td>{formatNumberWithCommas(bracket.base)}</td>
                  <td>{(bracket.rate * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {taxRegime.netEstateExemption > 0 && (
            <p className="exemption-note">Net Estate Exemption: ₱{formatNumberWithCommas(taxRegime.netEstateExemption)}</p>
          )}
        </div>
      )}

      <div className="calculator-content">
        <div className="assets-column">
          <div className="assets-card">
            <h2 className="card-title">Exclusive Properties</h2>
            <PropertySection
              title="Real Properties"
              items={exclusiveRealProperties}
              onAdd={() => openModal('exclusiveReal')}
              onEdit={(item) => openModal('exclusiveReal', item)}
              onDelete={(id) => deleteItem('exclusiveReal', id)}
              icon={BuildingOfficeIcon}
            />
            <PropertySection
              title="Personal Properties"
              items={exclusivePersonalProperties}
              onAdd={() => openModal('exclusivePersonal')}
              onEdit={(item) => openModal('exclusivePersonal', item)}
              onDelete={(id) => deleteItem('exclusivePersonal', id)}
              icon={BriefcaseIcon}
            />
          </div>

          <div className="assets-card">
            <h2 className="card-title">Conjugal / Community Properties</h2>
            <PropertySection
              title="Real Properties"
              items={conjugalRealProperties}
              onAdd={() => openModal('conjugalReal')}
              onEdit={(item) => openModal('conjugalReal', item)}
              onDelete={(id) => deleteItem('conjugalReal', id)}
              icon={HomeIcon}
            />
            <PropertySection
              title="Personal Properties"
              items={conjugalPersonalProperties}
              onAdd={() => openModal('conjugalPersonal')}
              onEdit={(item) => openModal('conjugalPersonal', item)}
              onDelete={(id) => deleteItem('conjugalPersonal', id)}
              icon={TruckIcon}
            />
          </div>

          <div className="assets-card">
            <h2 className="card-title">Taxable Transfers</h2>
            <PropertySection
              title="Donations / Transfers"
              items={taxableTransfers}
              onAdd={() => openModal('transfer')}
              onEdit={(item) => openModal('transfer', item)}
              onDelete={(id) => deleteItem('transfer', id)}
              icon={HeartIcon}
            />
          </div>
        </div>

        <div className="deductions-column">
          <div className="deductions-card">
            <h2 className="card-title">Ordinary Deductions</h2>
            <div className="deductions-grid">
              <DeductionField
                label="Funeral Expenses"
                value={deductions.funeralExpenses}
                onChange={(val) => setDeductions(prev => ({ ...prev, funeralExpenses: val }))}
                hint="Actual expenses, subject to substantiation"
              />
              <DeductionField
                label="Judicial Expenses"
                value={deductions.judicialExpenses}
                onChange={(val) => setDeductions(prev => ({ ...prev, judicialExpenses: val }))}
              />
              <DeductionField
                label="Claims Against the Estate"
                value={deductions.claimsAgainstEstate}
                onChange={(val) => setDeductions(prev => ({ ...prev, claimsAgainstEstate: val }))}
              />
              <DeductionField
                label="Claims Against Insolvent Person"
                value={deductions.claimsAgainstInsolvent}
                onChange={(val) => setDeductions(prev => ({ ...prev, claimsAgainstInsolvent: val }))}
              />
              <DeductionField
                label="Unpaid Mortgages"
                value={deductions.unpaidMortgages}
                onChange={(val) => setDeductions(prev => ({ ...prev, unpaidMortgages: val }))}
              />
              <DeductionField
                label="Transfers for Public Use"
                value={deductions.transfersForPublicUse}
                onChange={(val) => setDeductions(prev => ({ ...prev, transfersForPublicUse: val }))}
              />
              <DeductionField
                label="Property Previously Taxed (Vanishing)"
                value={deductions.propertyPreviouslyTaxed}
                onChange={(val) => setDeductions(prev => ({ ...prev, propertyPreviouslyTaxed: val }))}
                hint="Property inherited within 5 years prior to death"
              />
              <DeductionField
                label="Other Deductions"
                value={deductions.otherDeductions}
                onChange={(val) => setDeductions(prev => ({ ...prev, otherDeductions: val }))}
              />
            </div>
          </div>

          {taxRegime.hasSpecialDeductions && (
            <div className="deductions-card">
              <h2 className="card-title">Special Deductions</h2>
              <div className="deductions-grid">
                {taxRegime.familyHomeMax > 0 && (
                  <DeductionField
                    label="Family Home"
                    value={deductions.familyHome}
                    onChange={(val) => setDeductions(prev => ({ ...prev, familyHome: Math.min(val, taxRegime.familyHomeMax) }))}
                    hint={`Maximum of ₱${formatNumberWithCommas(taxRegime.familyHomeMax)}`}
                    max={taxRegime.familyHomeMax}
                  />
                )}
                {taxRegime.standardDeductionAmount > 0 && (
                  <DeductionField
                    label="Standard Deduction"
                    value={deductions.standardDeduction}
                    onChange={(val) => setDeductions(prev => ({ ...prev, standardDeduction: val }))}
                    hint={`Fixed at ₱${formatNumberWithCommas(taxRegime.standardDeductionAmount)}`}
                  />
                )}
                {taxRegime.medicalExpensesMax > 0 && (
                  <DeductionField
                    label="Medical Expenses"
                    value={deductions.medicalExpenses}
                    onChange={(val) => setDeductions(prev => ({ ...prev, medicalExpenses: Math.min(val, taxRegime.medicalExpensesMax) }))}
                    hint={`Maximum of ₱${formatNumberWithCommas(taxRegime.medicalExpensesMax)}, requires receipts`}
                    max={taxRegime.medicalExpensesMax}
                  />
                )}
              </div>
            </div>
          )}

          {!taxRegime.hasSpecialDeductions && taxRegime.netEstateExemption > 0 && (
            <div className="deductions-card">
              <h2 className="card-title">Special Notes</h2>
              <div className="info-message">
                <p>⚠️ Under {taxRegime.name || 'this tax regime'}:</p>
                <ul>
                  <li>No standard deduction of ₱5M</li>
                  <li>Family home deduction may be subject to different rules</li>
                  <li>Medical expenses not deductible</li>
                  <li>Net estate exemption of ₱{formatNumberWithCommas(taxRegime.netEstateExemption)} applies</li>
                </ul>
              </div>
            </div>
          )}

          <div className="summary-card">
            <h2 className="card-title">Tax Computation Summary</h2>
            
            <div className="summary-row">
              <span>Gross Exclusive Estate:</span>
              <strong>₱{formatNumberWithCommas(grossExclusive)}</strong>
            </div>
            <div className="summary-row">
              <span>Gross Conjugal Estate:</span>
              <strong>₱{formatNumberWithCommas(grossConjugal)}</strong>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row">
              <span>Total Deductions (Ordinary):</span>
              <span>₱{formatNumberWithCommas(totalDeductions)}</span>
            </div>
            {taxRegime.hasSpecialDeductions && (
              <>
                <div className="summary-row">
                  <span>Special Deductions:</span>
                  <span>₱{formatNumberWithCommas(totalSpecialDeductions)}</span>
                </div>
              </>
            )}
            <div className="summary-divider"></div>
            <div className="summary-row">
              <span>Net Conjugal Estate:</span>
              <span>₱{formatNumberWithCommas(netConjugal)}</span>
            </div>
            <div className="summary-row highlight">
              <span>Share of Surviving Spouse (½ of Net Conjugal):</span>
              <strong>₱{formatNumberWithCommas(survivingSpouseShare)}</strong>
            </div>
            <div className="summary-divider"></div>
            {!taxRegime.hasSpecialDeductions && taxRegime.netEstateExemption > 0 && (
              <div className="summary-row">
                <span>Net Estate Exemption:</span>
                <span>₱{formatNumberWithCommas(taxRegime.netEstateExemption)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Net Taxable Estate:</span>
              <strong className="text-primary">₱{formatNumberWithCommas(Math.max(0, netTaxableEstate))}</strong>
            </div>
            <div className="summary-row">
              <span>Estate Tax Due {taxRegime.rateType === 'percentage' ? `(${(taxRegime.flatRate * 100).toFixed(0)}% flat)` : '(Graduated Rates)'}:</span>
              <strong>₱{formatNumberWithCommas(estateTaxDue)}</strong>
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="tax-return-section">
              <label className="checkbox-label">
                <input type="checkbox" checked={taxReturnFiled} onChange={(e) => setTaxReturnFiled(e.target.checked)} />
                A tax return was previously filed
              </label>
              {taxReturnFiled && (
                <DeductionField
                  label="Tax Paid per Return"
                  value={taxPaidPerReturn}
                  onChange={setTaxPaidPerReturn}
                />
              )}
            </div>

            <div className="penalty-section">
              <h3>Penalties (if applicable)</h3>
              <DeductionField
                label="25% Surcharge"
                value={surcharge}
                onChange={setSurcharge}
              />
              <DeductionField
                label="Interest (20% p.a.)"
                value={interest}
                onChange={setInterest}
              />
              <DeductionField
                label="Compromise Penalty"
                value={compromisePenalty}
                onChange={setCompromisePenalty}
              />
            </div>

            <div className="total-payable">
              <span>TOTAL AMOUNT PAYABLE:</span>
              <strong className="total-amount">₱{formatNumberWithCommas(totalAmountPayable)}</strong>
            </div>

            {showAuditMode && (
              <div className="audit-trail">
                <h3>Audit Information</h3>
                <div className="audit-details">
                  <p><strong>Computation Date:</strong> {new Date().toLocaleString()}</p>
                  <p><strong>Tax Law Applied:</strong> {taxRegime.description}</p>
                  <p><strong>Tax Rate Type:</strong> {taxRegime.rateType === 'percentage' ? `Flat ${(taxRegime.flatRate * 100).toFixed(0)}%` : 'Graduated'}</p>
                  <p><strong>Gross Estate:</strong> ₱{formatNumberWithCommas(grossEstate)}</p>
                  <p><strong>Total Deductions:</strong> ₱{formatNumberWithCommas(totalDeductions + (taxRegime.hasSpecialDeductions ? totalSpecialDeductions : 0))}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal - rendered outside */}
      <AddEditModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSave={saveItem}
        title={getModalTitle()}
        initialDescription={modalDescription}
        initialValue={modalValue}
        onDescriptionChange={setModalDescription}
        onValueChange={setModalValue}
      />

      <style>{`
        .estate-tax-calculator {
          max-width: 1600px;
          margin: 0 auto;
          padding: 1.5rem;
          background: var(--bg-primary);
          min-height: calc(100vh - 70px);
        }

        .calculator-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          width: 2.5rem;
          height: 2.5rem;
          color: var(--gradient-start);
        }

        .header-title h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .header-title p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: var(--hover-bg);
          transform: translateY(-1px);
        }

        .btn-secondary.active {
          background: var(--gradient-start);
          color: white;
          border-color: transparent;
        }

        .info-section {
          background: var(--card-bg);
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .info-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-field label {
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
        }

        .info-field input {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .info-field input[type="date"] {
          cursor: pointer;
        }

        .info-field input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          padding: 0.25rem;
        }

        .info-field input::placeholder {
          color: var(--text-tertiary);
          font-size: 0.75rem;
        }

        .tax-regime-banner {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .tax-regime-banner.train {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .tax-regime-banner.pre_train {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .tax-regime-banner.pre_1998 {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .regime-info {
          color: white;
        }

        .regime-label {
          font-size: 0.75rem;
          opacity: 0.9;
          margin-right: 0.75rem;
        }

        .btn-details {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          color: white;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .btn-details:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .tax-details-card {
          background: var(--card-bg);
          border-radius: 0.75rem;
          border: 1px solid var(--border-color);
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .tax-details-card h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .tax-rates-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .tax-rates-table th,
        .tax-rates-table td {
          padding: 0.5rem;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }

        .tax-rates-table th {
          font-weight: 600;
          color: var(--text-secondary);
        }

        .exemption-note {
          margin-top: 1rem;
          padding: 0.5rem;
          background: var(--hover-bg);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .info-message {
          background: rgba(239, 68, 68, 0.1);
          border-left: 3px solid #ef4444;
          padding: 1rem;
          border-radius: 0.5rem;
        }

        .info-message p {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #ef4444;
        }

        .info-message ul {
          margin-left: 1.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .info-message li {
          margin: 0.25rem 0;
        }

        .calculator-content {
          display: grid;
          grid-template-columns: 1fr 0.9fr;
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .calculator-content {
            grid-template-columns: 1fr;
          }
        }

        .assets-column, .deductions-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .assets-card, .deductions-card, .summary-card {
          background: var(--card-bg);
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          padding: 1.25rem;
        }

        .card-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid var(--border-color);
        }

        .property-section {
          margin-bottom: 1.5rem;
        }

        .property-section:last-child {
          margin-bottom: 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .section-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: var(--gradient-start);
        }

        .section-title h3 {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0;
        }

        .btn-add {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          background: var(--gradient-start);
          border: none;
          border-radius: 0.5rem;
          color: white;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .property-list {
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .property-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }

        .property-item:last-child {
          border-bottom: none;
        }

        .property-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-right: 1rem;
        }

        .property-desc {
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .property-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .property-actions {
          display: flex;
          gap: 0.25rem;
        }

        .btn-icon-edit, .btn-icon-delete {
          padding: 0.25rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          transition: color 0.2s;
        }

        .btn-icon-edit:hover {
          color: var(--gradient-start);
        }

        .btn-icon-delete:hover {
          color: #ef4444;
        }

        .section-total {
          margin-top: 0.75rem;
          padding-top: 0.5rem;
          text-align: right;
          font-size: 0.875rem;
          border-top: 1px dashed var(--border-color);
        }

        .empty-state {
          padding: 1rem;
          text-align: center;
          color: var(--text-secondary);
          border: 1px dashed var(--border-color);
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .deductions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .deduction-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .deduction-field label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .deduction-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .currency-prefix {
          position: absolute;
          left: 0.75rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .deduction-input {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 1.75rem;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .deduction-input:disabled {
          background: var(--hover-bg);
          cursor: not-allowed;
        }

        .deduction-hint {
          font-size: 0.65rem;
          color: var(--text-tertiary);
        }

        .deduction-warning {
          font-size: 0.65rem;
          color: #f59e0b;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .summary-row.highlight {
          background: rgba(102, 126, 234, 0.1);
          margin: 0 -0.5rem;
          padding: 0.5rem 0.5rem;
          border-radius: 0.5rem;
        }

        .summary-divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.5rem 0;
        }

        .text-primary {
          color: var(--gradient-start);
        }

        .tax-return-section {
          margin: 1rem 0;
          padding: 0.75rem;
          background: var(--hover-bg);
          border-radius: 0.5rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .penalty-section {
          margin: 1rem 0;
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.05);
          border-radius: 0.5rem;
        }

        .penalty-section h3 {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #ef4444;
        }

        .total-payable {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          margin-top: 1rem;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          border-radius: 0.75rem;
          color: white;
        }

        .total-amount {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .audit-trail {
          margin-top: 1rem;
          padding: 0.75rem;
          background: var(--hover-bg);
          border-radius: 0.5rem;
          border-left: 3px solid var(--gradient-start);
        }

        .audit-trail h3 {
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text-secondary);
        }

        .audit-details p {
          font-size: 0.7rem;
          margin: 0.25rem 0;
          color: var(--text-secondary);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--card-bg);
          border-radius: 1rem;
          width: 90%;
          max-width: 450px;
          box-shadow: var(--shadow-lg);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-secondary);
        }

        .modal-body {
          padding: 1.25rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }

        .form-group input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--border-color);
        }

        .btn-cancel {
          padding: 0.5rem 1rem;
          background: none;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          cursor: pointer;
          color: var(--text-primary);
        }

        .btn-save {
          padding: 0.5rem 1rem;
          background: var(--gradient-start);
          border: none;
          border-radius: 0.5rem;
          color: white;
          cursor: pointer;
        }

        @media print {
          .header-actions, .btn-add, .property-actions, .modal-overlay, .tax-regime-banner {
            display: none !important;
          }
          
          .calculator-content {
            display: block;
          }
          
          .assets-column, .deductions-column {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default EstateTaxCalculator;