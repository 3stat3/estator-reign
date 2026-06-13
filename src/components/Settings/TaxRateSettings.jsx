import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  BeakerIcon,
  ChartBarIcon,
  CalculatorIcon,
  VariableIcon,
  CodeBracketIcon,
  EyeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// Helper function to format numbers with commas
const formatNumberWithCommas = (value) => {
  if (value === null || value === undefined || value === '') return '';
  return Number(value).toLocaleString();
};

// Default tax rate configuration
const DEFAULT_TAX_RATES = {
  version: "2.0.0",
  lastUpdated: new Date().toISOString(),
  regimes: [
    {
      id: "train_law",
      name: "TRAIN Law",
      effectiveFrom: "2018-01-01",
      effectiveTo: null,
      calculationType: "percentage",
      config: {
        rate: 6,
        appliesTo: "net_taxable_estate"
      },
      exemptions: {
        netEstateExemption: 0,
        specialDeductions: {
          familyHome: { enabled: true, maxAmount: 10000000 },
          standardDeduction: { enabled: true, amount: 5000000 },
          medicalExpenses: { enabled: true, maxAmount: 500000 }
        }
      },
      description: "6% flat rate under TRAIN Law (Jan 1, 2018 - present)"
    },
    {
      id: "pre_train_1998",
      name: "Pre-TRAIN Law (1998-2017)",
      effectiveFrom: "1998-01-01",
      effectiveTo: "2017-12-31",
      calculationType: "bracketed",
      config: {
        brackets: [
          { id: "b1", min: 0, max: 200000, rate: 5, base: 0 },
          { id: "b2", min: 200000, max: 500000, rate: 8, base: 10000 },
          { id: "b3", min: 500000, max: 2000000, rate: 11, base: 34000 },
          { id: "b4", min: 2000000, max: 5000000, rate: 15, base: 199000 },
          { id: "b5", min: 5000000, max: 10000000, rate: 20, base: 649000 },
          { id: "b6", min: 10000000, max: null, rate: 20, base: 1649000 }
        ],
        bracketStyle: "graduated"
      },
      exemptions: {
        netEstateExemption: 200000,
        specialDeductions: {
          familyHome: { enabled: false, maxAmount: 0 },
          standardDeduction: { enabled: false, amount: 0 },
          medicalExpenses: { enabled: false, maxAmount: 0 }
        }
      },
      description: "Graduated rates from 5% to 20%"
    },
    {
      id: "pre_1998",
      name: "Pre-1998 Law",
      effectiveFrom: null,
      effectiveTo: "1997-12-31",
      calculationType: "bracketed",
      config: {
        brackets: [
          { id: "b1", min: 0, max: 50000, rate: 5, base: 0 },
          { id: "b2", min: 50000, max: 200000, rate: 7, base: 2500 },
          { id: "b3", min: 200000, max: 500000, rate: 11, base: 13000 },
          { id: "b4", min: 500000, max: 2000000, rate: 15, base: 46000 },
          { id: "b5", min: 2000000, max: 5000000, rate: 20, base: 271000 },
          { id: "b6", min: 5000000, max: 10000000, rate: 25, base: 871000 },
          { id: "b7", min: 10000000, max: null, rate: 35, base: 2121000 }
        ],
        bracketStyle: "graduated"
      },
      exemptions: {
        netEstateExemption: 50000,
        specialDeductions: {
          familyHome: { enabled: false, maxAmount: 0 },
          standardDeduction: { enabled: false, amount: 0 },
          medicalExpenses: { enabled: false, maxAmount: 0 }
        }
      },
      description: "Graduated rates from 5% to 35%"
    }
  ]
};

// Calculation Type Definitions
const CALCULATION_TYPES = [
  {
    id: "percentage",
    name: "Percentage of Net Estate",
    icon: CalculatorIcon,
    description: "Simple percentage of the net taxable estate",
    template: { rate: 6, appliesTo: "net_taxable_estate" }
  },
  {
    id: "bracketed",
    name: "Bracketed / Graduated",
    icon: ChartBarIcon,
    description: "Different rates for different value ranges",
    template: { brackets: [], bracketStyle: "graduated" }
  },
  {
    id: "hybrid",
    name: "Hybrid (Flat + Excess)",
    icon: BeakerIcon,
    description: "Flat rate plus additional percentage on excess",
    template: { flatRate: 4, excessRate: 10, threshold: 10000000 }
  },
  {
    id: "formula",
    name: "Custom Formula",
    icon: VariableIcon,
    description: "Write your own mathematical formula",
    template: { formula: "net_taxable_estate * 0.06", variables: ["net_taxable_estate"] }
  },
  {
    id: "conditional",
    name: "Conditional Rules",
    icon: CodeBracketIcon,
    description: "If-Then rules for complex scenarios",
    template: { rules: [] }
  }
];

// Rule Builder Component for Conditional calculations
const RuleBuilder = ({ rules, onRulesChange }) => {
  const addRule = () => {
    onRulesChange([...rules, { id: Date.now(), condition: "", then: "", else: "" }]);
  };

  const updateRule = (id, field, value) => {
    onRulesChange(rules.map(rule => rule.id === id ? { ...rule, [field]: value } : rule));
  };

  const deleteRule = (id) => {
    onRulesChange(rules.filter(rule => rule.id !== id));
  };

  return (
    <div className="rule-builder">
      <div className="rule-builder-header">
        <h4>Conditional Rules</h4>
        <button className="btn-add-small" onClick={addRule}>
          <PlusIcon className="w-4 h-4" />
          Add Rule
        </button>
      </div>
      {rules.length === 0 ? (
        <div className="empty-rules">
          <p>No rules defined. Add a rule to start.</p>
        </div>
      ) : (
        <div className="rules-list">
          {rules.map((rule, idx) => (
            <div key={rule.id} className="rule-item">
              <div className="rule-number">Rule {idx + 1}</div>
              <div className="rule-fields">
                <input
                  type="text"
                  placeholder="IF condition (e.g., net_taxable_estate <= 200000)"
                  value={rule.condition}
                  onChange={(e) => updateRule(rule.id, 'condition', e.target.value)}
                  className="rule-condition"
                />
                <input
                  type="text"
                  placeholder="THEN result (e.g., net_taxable_estate * 0.05)"
                  value={rule.then}
                  onChange={(e) => updateRule(rule.id, 'then', e.target.value)}
                  className="rule-then"
                />
                <input
                  type="text"
                  placeholder="ELSE result (optional)"
                  value={rule.else || ''}
                  onChange={(e) => updateRule(rule.id, 'else', e.target.value)}
                  className="rule-else"
                />
                <button className="btn-icon-delete" onClick={() => deleteRule(rule.id)}>
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="formula-help">
        <strong>Available variables:</strong> net_taxable_estate, gross_estate, surviving_spouse_share
      </div>
    </div>
  );
};

// Formula Builder Component
const FormulaBuilder = ({ formula, onFormulaChange }) => {
  const [showHelp, setShowHelp] = useState(false);

  const insertVariable = (variable) => {
    onFormulaChange(formula + variable);
  };

  return (
    <div className="formula-builder">
      <div className="formula-header">
        <label>Custom Formula</label>
        <button className="btn-help" onClick={() => setShowHelp(!showHelp)}>
          <EyeIcon className="w-4 h-4" />
          {showHelp ? 'Hide Help' : 'Show Help'}
        </button>
      </div>
      <textarea
        value={formula}
        onChange={(e) => onFormulaChange(e.target.value)}
        placeholder="e.g., net_taxable_estate * 0.06 + (gross_estate > 10000000 ? gross_estate * 0.02 : 0)"
        rows={4}
        className="formula-textarea"
      />
      {showHelp && (
        <div className="formula-help-panel">
          <p><strong>Available Variables:</strong></p>
          <div className="variables-grid">
            <button className="var-btn" onClick={() => insertVariable("net_taxable_estate")}>net_taxable_estate</button>
            <button className="var-btn" onClick={() => insertVariable("gross_estate")}>gross_estate</button>
            <button className="var-btn" onClick={() => insertVariable("surviving_spouse_share")}>surviving_spouse_share</button>
            <button className="var-btn" onClick={() => insertVariable("total_deductions")}>total_deductions</button>
          </div>
          <p><strong>Operators:</strong> +, -, *, /, %, &gt;, &lt;, &gt;=, &lt;=, ==, &amp;&amp;, ||</p>
          <p><strong>Functions:</strong> Math.min(), Math.max(), Math.abs(), Math.floor(), Math.ceil()</p>
          <div className="example">
            <strong>Example:</strong> <code>{`net_taxable_estate <= 5000000 ? net_taxable_estate * 0.05 : 250000 + (net_taxable_estate - 5000000) * 0.12`}</code>
          </div>
        </div>
      )}
    </div>
  );
};

// Brackets Editor Component
const BracketsEditor = ({ brackets, onBracketsChange }) => {
  const addBracket = () => {
    const lastBracket = brackets[brackets.length - 1];
    const newMin = lastBracket ? lastBracket.max : 0;
    const newMax = lastBracket ? (typeof lastBracket.max === 'number' ? lastBracket.max + 1000000 : 1000000) : 1000000;
    const newId = `b${Date.now()}`;
    onBracketsChange([...brackets, { id: newId, min: newMin, max: newMax, rate: 5, base: 0 }]);
  };

  const updateBracket = (id, field, value) => {
    const updated = brackets.map(b => {
      if (b.id === id) {
        const newValue = field === 'rate' ? parseFloat(value) : parseFloat(value);
        return { ...b, [field]: newValue };
      }
      return b;
    });
    
    for (let i = 1; i < updated.length; i++) {
      const prev = updated[i - 1];
      const prevTax = ((prev.max || 0) - prev.min) * (prev.rate / 100);
      updated[i].base = (prev.base || 0) + prevTax;
    }
    
    onBracketsChange(updated);
  };

  const deleteBracket = (id) => {
    if (brackets.length > 1) {
      onBracketsChange(brackets.filter(b => b.id !== id));
    }
  };

  return (
    <div className="brackets-editor">
      <div className="brackets-header">
        <h4>Tax Brackets</h4>
        <button className="btn-add-small" onClick={addBracket}>
          <PlusIcon className="w-4 h-4" />
          Add Bracket
        </button>
      </div>
      <div className="brackets-table-container">
        <table className="brackets-table">
          <thead>
            <tr>
              <th>From (₱)</th>
              <th>To (₱)</th>
              <th>Rate (%)</th>
              <th>Base Tax (₱)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {brackets.map((bracket, idx) => (
              <tr key={bracket.id}>
                <td>
                  <input
                    type="number"
                    value={bracket.min}
                    onChange={(e) => updateBracket(bracket.id, 'min', e.target.value)}
                    disabled={idx > 0}
                    className={idx > 0 ? 'disabled-input' : ''}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={bracket.max === null ? '' : bracket.max}
                    onChange={(e) => updateBracket(bracket.id, 'max', e.target.value === '' ? null : e.target.value)}
                    placeholder={idx === brackets.length - 1 ? 'Above' : ''}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.1"
                    value={bracket.rate}
                    onChange={(e) => updateBracket(bracket.id, 'rate', e.target.value)}
                  />
                </td>
                <td className="base-cell">{formatNumberWithCommas(bracket.base)}</td>
                <td className="action-cell">
                  {brackets.length > 1 && (
                    <button className="btn-icon-delete" onClick={() => deleteBracket(bracket.id)}>
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Hybrid Editor Component
const HybridEditor = ({ config, onConfigChange }) => {
  return (
    <div className="hybrid-editor">
      <div className="form-group">
        <label>Flat Rate (%)</label>
        <input
          type="number"
          step="0.1"
          value={config.flatRate}
          onChange={(e) => onConfigChange({ ...config, flatRate: parseFloat(e.target.value) })}
        />
        <small>Applied to the entire net taxable estate</small>
      </div>
      <div className="form-group">
        <label>Excess Threshold (₱)</label>
        <input
          type="text"
          value={formatNumberWithCommas(config.threshold)}
          onChange={(e) => {
            const rawValue = e.target.value.replace(/,/g, '');
            onConfigChange({ ...config, threshold: parseFloat(rawValue) || 0 });
          }}
        />
        <small>Amount above this threshold gets additional tax</small>
      </div>
      <div className="form-group">
        <label>Excess Rate (%)</label>
        <input
          type="number"
          step="0.1"
          value={config.excessRate}
          onChange={(e) => onConfigChange({ ...config, excessRate: parseFloat(e.target.value) })}
        />
        <small>Additional percentage on amount above threshold</small>
      </div>
      <div className="formula-preview">
        <strong>Formula Preview:</strong>
        <code>{`(${config.flatRate}% of net estate) + (excess over ₱${formatNumberWithCommas(config.threshold)} × ${config.excessRate}%)`}</code>
      </div>
    </div>
  );
};

// Percentage Editor Component
const PercentageEditor = ({ config, onConfigChange }) => {
  return (
    <div className="percentage-editor">
      <div className="form-group">
        <label>Tax Rate (%)</label>
        <input
          type="number"
          step="0.1"
          value={config.rate}
          onChange={(e) => onConfigChange({ ...config, rate: parseFloat(e.target.value) })}
        />
      </div>
      <div className="formula-preview">
        <strong>Formula:</strong> Net Taxable Estate × {config.rate}%
      </div>
    </div>
  );
};

// Preview Calculator Component
const PreviewCalculator = ({ config, calculationType }) => {
  const [testValue, setTestValue] = useState(1000000);
  const [calculatedTax, setCalculatedTax] = useState(0);

  const calculatePreview = () => {
    try {
      let result = 0;
      const netTaxable = testValue;
      
      switch(calculationType) {
        case 'percentage':
          result = netTaxable * ((config?.rate || 0) / 100);
          break;
        case 'bracketed':
          const brackets = config?.brackets || [];
          for (let i = 0; i < brackets.length; i++) {
            const bracket = brackets[i];
            if (netTaxable <= (bracket.max || Infinity)) {
              const excess = netTaxable - bracket.min;
              result = (bracket.base || 0) + (excess * ((bracket.rate || 0) / 100));
              break;
            }
          }
          break;
        case 'hybrid':
          const flatTax = netTaxable * ((config?.flatRate || 0) / 100);
          const excessTax = netTaxable > (config?.threshold || 0) 
            ? (netTaxable - (config?.threshold || 0)) * ((config?.excessRate || 0) / 100)
            : 0;
          result = flatTax + excessTax;
          break;
        case 'formula':
          // eslint-disable-next-line no-new-func
          const fn = new Function('net_taxable_estate', 'return ' + (config?.formula || '0'));
          result = fn(netTaxable);
          break;
        default:
          result = 0;
      }
      setCalculatedTax(result);
    } catch (e) {
      setCalculatedTax(0);
    }
  };

  useEffect(() => {
    calculatePreview();
  }, [testValue, config, calculationType]);

  return (
    <div className="preview-calculator">
      <h4>Live Preview</h4>
      <div className="preview-input">
        <label>Test Net Taxable Estate (₱)</label>
        <input
          type="text"
          value={formatNumberWithCommas(testValue)}
          onChange={(e) => {
            const rawValue = e.target.value.replace(/,/g, '');
            setTestValue(parseFloat(rawValue) || 0);
          }}
        />
      </div>
      <div className="preview-result">
        <span>Calculated Tax:</span>
        <strong>₱{calculatedTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
      </div>
      <div className="preview-effective-rate">
        <span>Effective Rate:</span>
        <strong>{testValue > 0 ? ((calculatedTax / testValue) * 100).toFixed(2) : 0}%</strong>
      </div>
    </div>
  );
};

// Main Component - CLEANED (no duplicate header or tabs)
const TaxRateSettings = () => {
  const [taxRates, setTaxRates] = useState(DEFAULT_TAX_RATES);
  const [editingRegime, setEditingRegime] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ show: false, message: '', type: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [previewRegime, setPreviewRegime] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('taxRateSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTaxRates(parsed);
      } catch (e) {
        console.error('Failed to load saved settings', e);
      }
    }
    setIsLoading(false);
  }, []);

  const saveToLocalStorage = (newTaxRates) => {
    localStorage.setItem('taxRateSettings', JSON.stringify(newTaxRates));
    setSaveStatus({ show: true, message: 'Settings saved successfully!', type: 'success' });
    setTimeout(() => setSaveStatus({ show: false, message: '', type: '' }), 3000);
  };

  const handleSaveRegime = (regimeData) => {
    let newTaxRates;
    if (editingRegime) {
      newTaxRates = {
        ...taxRates,
        lastUpdated: new Date().toISOString(),
        regimes: taxRates.regimes.map(r => 
          r.id === editingRegime.id ? { ...r, ...regimeData, id: r.id } : r
        )
      };
    } else {
      const newId = `regime_${Date.now()}`;
      newTaxRates = {
        ...taxRates,
        lastUpdated: new Date().toISOString(),
        regimes: [...taxRates.regimes, { id: newId, ...regimeData }]
      };
    }
    setTaxRates(newTaxRates);
    saveToLocalStorage(newTaxRates);
    setEditingRegime(null);
    setShowAddModal(false);
  };

  const handleDeleteRegime = (regimeId) => {
    const newTaxRates = {
      ...taxRates,
      lastUpdated: new Date().toISOString(),
      regimes: taxRates.regimes.filter(r => r.id !== regimeId)
    };
    setTaxRates(newTaxRates);
    saveToLocalStorage(newTaxRates);
    setShowDeleteConfirm(null);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Are you sure you want to reset all tax rates to default? This cannot be undone.')) {
      setTaxRates(DEFAULT_TAX_RATES);
      saveToLocalStorage(DEFAULT_TAX_RATES);
    }
  };

  const RegimeEditorModal = ({ regime, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: '',
      effectiveFrom: '',
      effectiveTo: '',
      calculationType: 'percentage',
      config: {},
      exemptions: {
        netEstateExemption: 0,
        specialDeductions: {
          familyHome: { enabled: false, maxAmount: 0 },
          standardDeduction: { enabled: false, amount: 0 },
          medicalExpenses: { enabled: false, maxAmount: 0 }
        }
      },
      description: ''
    });

    useEffect(() => {
      if (regime) {
        const configCopy = regime.config ? JSON.parse(JSON.stringify(regime.config)) : 
          CALCULATION_TYPES.find(t => t.id === regime.calculationType)?.template || {};
        
        setFormData({
          name: regime.name || '',
          effectiveFrom: regime.effectiveFrom || '',
          effectiveTo: regime.effectiveTo || '',
          calculationType: regime.calculationType || 'percentage',
          config: configCopy,
          exemptions: regime.exemptions || {
            netEstateExemption: 0,
            specialDeductions: {
              familyHome: { enabled: false, maxAmount: 0 },
              standardDeduction: { enabled: false, amount: 0 },
              medicalExpenses: { enabled: false, maxAmount: 0 }
            }
          },
          description: regime.description || ''
        });
      }
    }, [regime]);

    const updateConfig = (newConfig) => {
      setFormData({ ...formData, config: newConfig });
    };

    const updateExemption = (field, value) => {
      setFormData({
        ...formData,
        exemptions: { ...formData.exemptions, [field]: value }
      });
    };

    const updateSpecialDeduction = (key, field, value) => {
      setFormData({
        ...formData,
        exemptions: {
          ...formData.exemptions,
          specialDeductions: {
            ...formData.exemptions.specialDeductions,
            [key]: { ...formData.exemptions.specialDeductions[key], [field]: value }
          }
        }
      });
    };

    const CalculationConfigEditor = () => {
      switch(formData.calculationType) {
        case 'percentage':
          return <PercentageEditor config={formData.config} onConfigChange={updateConfig} />;
        case 'bracketed':
          return <BracketsEditor brackets={formData.config.brackets || []} onBracketsChange={(brackets) => updateConfig({ ...formData.config, brackets })} />;
        case 'hybrid':
          return <HybridEditor config={formData.config} onConfigChange={updateConfig} />;
        case 'formula':
          return <FormulaBuilder formula={formData.config.formula || ''} onFormulaChange={(formula) => updateConfig({ ...formData.config, formula })} />;
        case 'conditional':
          return <RuleBuilder rules={formData.config.rules || []} onRulesChange={(rules) => updateConfig({ ...formData.config, rules })} />;
        default:
          return null;
      }
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content regime-editor-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{regime ? 'Edit Tax Regime' : 'Create New Tax Regime'}</h3>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Regime Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Future Tax Law 2030"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Effective From</label>
                <input
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Effective To (leave blank for present)</label>
                <input
                  type="date"
                  value={formData.effectiveTo}
                  onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Calculation Method *</label>
              <div className="calculation-types-grid">
                {CALCULATION_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      className={`calc-type-btn ${formData.calculationType === type.id ? 'active' : ''}`}
                      onClick={() => setFormData({ 
                        ...formData, 
                        calculationType: type.id,
                        config: JSON.parse(JSON.stringify(type.template))
                      })}
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <strong>{type.name}</strong>
                        <small>{type.description}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="config-section">
              <h4>Calculation Configuration</h4>
              <CalculationConfigEditor />
            </div>

            <div className="exemptions-section">
              <h4>Exemptions & Deductions</h4>
              <div className="form-group">
                <label>Net Estate Exemption (₱)</label>
                <input
                  type="text"
                  value={formatNumberWithCommas(formData.exemptions.netEstateExemption)}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/,/g, '');
                    updateExemption('netEstateExemption', parseFloat(rawValue) || 0);
                  }}
                />
                <small>Amount deducted before tax calculation</small>
              </div>

              <div className="special-deductions">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.exemptions.specialDeductions.familyHome.enabled}
                    onChange={(e) => updateSpecialDeduction('familyHome', 'enabled', e.target.checked)}
                  />
                  Enable Family Home Deduction
                </label>
                {formData.exemptions.specialDeductions.familyHome.enabled && (
                  <div className="form-group">
                    <label>Maximum Family Home Deduction (₱)</label>
                    <input
                      type="text"
                      value={formatNumberWithCommas(formData.exemptions.specialDeductions.familyHome.maxAmount)}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, '');
                        updateSpecialDeduction('familyHome', 'maxAmount', parseFloat(rawValue) || 0);
                      }}
                    />
                  </div>
                )}

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.exemptions.specialDeductions.standardDeduction.enabled}
                    onChange={(e) => updateSpecialDeduction('standardDeduction', 'enabled', e.target.checked)}
                  />
                  Enable Standard Deduction
                </label>
                {formData.exemptions.specialDeductions.standardDeduction.enabled && (
                  <div className="form-group">
                    <label>Standard Deduction Amount (₱)</label>
                    <input
                      type="text"
                      value={formatNumberWithCommas(formData.exemptions.specialDeductions.standardDeduction.amount)}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, '');
                        updateSpecialDeduction('standardDeduction', 'amount', parseFloat(rawValue) || 0);
                      }}
                    />
                  </div>
                )}

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.exemptions.specialDeductions.medicalExpenses.enabled}
                    onChange={(e) => updateSpecialDeduction('medicalExpenses', 'enabled', e.target.checked)}
                  />
                  Enable Medical Expenses Deduction
                </label>
                {formData.exemptions.specialDeductions.medicalExpenses.enabled && (
                  <div className="form-group">
                    <label>Maximum Medical Expenses Deduction (₱)</label>
                    <input
                      type="text"
                      value={formatNumberWithCommas(formData.exemptions.specialDeductions.medicalExpenses.maxAmount)}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, '');
                        updateSpecialDeduction('medicalExpenses', 'maxAmount', parseFloat(rawValue) || 0);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="2"
                placeholder="Brief description of this tax regime"
              />
            </div>

            <PreviewCalculator config={formData.config} calculationType={formData.calculationType} />
          </div>
          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-save" onClick={() => onSave(formData)}>Save Regime</button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <ArrowPathIcon className="loading-spinner" />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="tax-rate-settings">
      {/* New Tax Regime Button */}
      <div className="tax-rates-actions">
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <PlusIcon className="w-4 h-4" />
          New Tax Regime
        </button>
        <button className="btn-secondary" onClick={handleResetToDefault}>
          <ArrowPathIcon className="w-4 h-4" />
          Reset to Default
        </button>
      </div>

      {saveStatus.show && (
        <div className={`save-toast ${saveStatus.type}`}>
          <CheckIcon className="w-5 h-5" />
          {saveStatus.message}
        </div>
      )}

      <div className="regimes-list">
        {taxRates.regimes.map((regime) => {
          const calcType = CALCULATION_TYPES.find(t => t.id === regime.calculationType);
          const Icon = calcType?.icon || CalculatorIcon;
          
          return (
            <motion.div
              key={regime.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="regime-card"
            >
              <div className="regime-header">
                <div className="regime-title">
                  <h3>{regime.name}</h3>
                  <span className={`regime-badge ${regime.calculationType}`}>
                    <Icon className="w-3 h-3" />
                    {calcType?.name || regime.calculationType}
                  </span>
                </div>
                <div className="regime-actions">
                  <button
                    className="btn-icon-action edit-btn"
                    onClick={() => setEditingRegime(regime)}
                    title="Edit regime"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span className="btn-label">Edit</span>
                  </button>
                  <button
                    className="btn-icon-action delete-btn"
                    onClick={() => setShowDeleteConfirm(regime.id)}
                    title="Delete regime"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span className="btn-label">Delete</span>
                  </button>
                </div>
              </div>
              
              <div className="regime-dates">
                <CalendarIcon className="date-icon" />
                <span>
                  {regime.effectiveFrom ? new Date(regime.effectiveFrom).toLocaleDateString() : 'Beginning'} 
                  {' → '}
                  {regime.effectiveTo ? new Date(regime.effectiveTo).toLocaleDateString() : 'Present'}
                </span>
              </div>

              <div className="regime-details">
                {regime.calculationType === 'percentage' && (
                  <div className="detail-item">
                    <strong>Rate:</strong> {regime.config?.rate}%
                  </div>
                )}
                {regime.calculationType === 'bracketed' && (
                  <div className="detail-item">
                    <strong>Brackets:</strong> {regime.config?.brackets?.length || 0} tiers
                  </div>
                )}
                {regime.calculationType === 'hybrid' && (
                  <div className="detail-item">
                    <strong>Hybrid:</strong> {regime.config?.flatRate}% + {regime.config?.excessRate}% excess
                  </div>
                )}
                {regime.exemptions?.netEstateExemption > 0 && (
                  <div className="detail-item">
                    <strong>Exemption:</strong> ₱{formatNumberWithCommas(regime.exemptions.netEstateExemption)}
                  </div>
                )}
              </div>
              
              <p className="regime-description">{regime.description}</p>

              <button 
                className="btn-preview"
                onClick={() => setPreviewRegime(previewRegime === regime.id ? null : regime.id)}
              >
                <EyeIcon className="w-4 h-4" />
                {previewRegime === regime.id ? 'Hide Preview' : 'Test This Rate'}
              </button>

              {previewRegime === regime.id && (
                <div className="inline-preview">
                  <PreviewCalculator config={regime.config} calculationType={regime.calculationType} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="settings-info">
        <ExclamationTriangleIcon className="info-icon" />
        <div>
          <strong>Note:</strong> Changes to tax rates will apply to all new calculations based on the date of death.
          Past calculations will retain the rates at the time they were computed.
        </div>
      </div>

      {(editingRegime || showAddModal) && (
        <RegimeEditorModal
          key={editingRegime?.id || 'new'}
          regime={editingRegime}
          onClose={() => {
            setEditingRegime(null);
            setShowAddModal(false);
          }}
          onSave={handleSaveRegime}
        />
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>×</button>
            </div>
            <div className="modal-body">
              <ExclamationTriangleIcon className="warning-icon" />
              <p>Are you sure you want to delete this tax regime? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDeleteRegime(showDeleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tax-rate-settings {
          padding: 0;
        }

        .tax-rates-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .btn-secondary, .btn-primary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .btn-secondary {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
        }

        .btn-secondary:hover {
          background: var(--hover-bg);
          transform: translateY(-1px);
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          color: white;
          border: none;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          opacity: 0.9;
        }

        .save-toast {
          position: fixed;
          bottom: 1rem;
          right: 1rem;
          left: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #10b981;
          color: white;
          border-radius: 0.5rem;
          z-index: 100;
          animation: slideIn 0.3s ease;
          font-size: 0.875rem;
        }

        @media (min-width: 768px) {
          .save-toast {
            bottom: 2rem;
            right: 2rem;
            left: auto;
            padding: 0.75rem 1.25rem;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .regimes-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .regime-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 1rem;
          transition: all 0.2s;
        }

        @media (min-width: 768px) {
          .regime-card {
            padding: 1.25rem;
          }
        }

        .regime-card:hover {
          box-shadow: var(--shadow-md);
        }

        .regime-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 0.75rem;
          gap: 0.5rem;
        }

        @media (min-width: 640px) {
          .regime-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .regime-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .regime-title h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .regime-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .regime-badge.percentage {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .regime-badge.bracketed {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .regime-badge.hybrid {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .regime-badge.formula {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .regime-badge.conditional {
          background: rgba(236, 72, 153, 0.1);
          color: #ec4899;
        }

        .regime-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-icon-action {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          cursor: pointer;
          color: var(--text-primary);
          transition: all 0.2s;
          font-size: 0.75rem;
        }

        .btn-icon-action svg {
          width: 0.875rem;
          height: 0.875rem;
        }

        .btn-icon-action:hover {
          background: var(--hover-bg);
          transform: translateY(-1px);
        }

        .btn-icon-action.delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-color: #ef4444;
        }

        .btn-label {
          display: none;
        }

        @media (min-width: 768px) {
          .btn-label {
            display: inline;
          }
        }

        .regime-dates {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }

        .date-icon {
          width: 0.75rem;
          height: 0.75rem;
        }

        .regime-details {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }

        .detail-item {
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .regime-description {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          margin: 0.5rem 0 0 0;
        }

        .btn-preview {
          margin-top: 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: none;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-preview:hover {
          background: var(--hover-bg);
          color: var(--text-primary);
        }

        .inline-preview {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .settings-info {
          margin-top: 1.5rem;
          padding: 1rem;
          background: rgba(245, 158, 11, 0.1);
          border-left: 3px solid #f59e0b;
          border-radius: 0.5rem;
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .info-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #f59e0b;
          flex-shrink: 0;
        }

        .settings-info div {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          gap: 1rem;
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          animation: spin 1s linear infinite;
          color: var(--gradient-start);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }

        .regime-editor-modal {
          max-width: 900px;
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

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--border-color);
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

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .form-group small {
          font-size: 0.7rem;
          color: var(--text-tertiary);
          display: block;
          margin-top: 0.25rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .calculation-types-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        .calc-type-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .calc-type-btn:hover {
          background: var(--hover-bg);
          transform: translateY(-1px);
        }

        .calc-type-btn.active {
          border-color: var(--gradient-start);
          background: rgba(102, 126, 234, 0.1);
        }

        .calc-type-btn div {
          flex: 1;
        }

        .calc-type-btn strong {
          display: block;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .calc-type-btn small {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .config-section,
        .exemptions-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .config-section h4,
        .exemptions-section h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .special-deductions {
          margin-top: 1rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          margin-bottom: 0.5rem;
        }

        .brackets-editor,
        .hybrid-editor,
        .percentage-editor,
        .formula-builder,
        .rule-builder {
          margin-top: 1rem;
        }

        .brackets-header,
        .rule-builder-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .btn-add-small {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: var(--gradient-start);
          border: none;
          border-radius: 0.375rem;
          color: white;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .brackets-table-container {
          overflow-x: auto;
        }

        .brackets-table {
          width: 100%;
          border-collapse: collapse;
        }

        .brackets-table th,
        .brackets-table td {
          padding: 0.5rem;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }

        .brackets-table input {
          width: 100%;
          padding: 0.25rem 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 0.25rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .disabled-input {
          background: var(--hover-bg);
          color: var(--text-tertiary);
        }

        .base-cell, .action-cell {
          font-family: monospace;
        }

        .formula-textarea {
          font-family: monospace;
          font-size: 0.875rem;
        }

        .formula-help-panel {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: var(--hover-bg);
          border-radius: 0.5rem;
        }

        .variables-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin: 0.5rem 0;
        }

        .var-btn {
          padding: 0.25rem 0.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-family: monospace;
          cursor: pointer;
        }

        .var-btn:hover {
          background: var(--gradient-start);
          color: white;
        }

        .example {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: var(--bg-secondary);
          border-radius: 0.25rem;
          font-size: 0.75rem;
        }

        .formula-preview {
          margin-top: 0.75rem;
          padding: 0.5rem;
          background: var(--hover-bg);
          border-radius: 0.375rem;
          font-size: 0.75rem;
        }

        .preview-calculator {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--hover-bg);
          border-radius: 0.5rem;
        }

        .preview-calculator h4 {
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
        }

        .preview-input {
          margin-bottom: 0.75rem;
        }

        .preview-input label {
          display: block;
          font-size: 0.75rem;
          margin-bottom: 0.25rem;
        }

        .preview-result,
        .preview-effective-rate {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }

        .preview-result strong {
          font-size: 1.125rem;
          color: var(--gradient-start);
        }

        .rules-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .rule-item {
          padding: 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
        }

        .rule-number {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .rule-fields {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .rule-condition,
        .rule-then,
        .rule-else {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-family: monospace;
          font-size: 0.75rem;
        }

        .empty-rules {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
          border: 1px dashed var(--border-color);
          border-radius: 0.5rem;
        }

        .confirm-modal {
          max-width: 400px;
        }

        .warning-icon {
          width: 3rem;
          height: 3rem;
          color: #f59e0b;
          margin: 0 auto 1rem;
          display: block;
        }

        .confirm-modal .modal-body {
          text-align: center;
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

        .btn-danger {
          padding: 0.5rem 1rem;
          background: #ef4444;
          border: none;
          border-radius: 0.5rem;
          color: white;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default TaxRateSettings;