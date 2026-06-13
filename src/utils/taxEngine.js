// Tax Engine Service - Reads settings from localStorage

const getTaxSettings = () => {
  const saved = localStorage.getItem('taxRateSettings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load tax settings', e);
    }
  }
  return null;
};

// Find applicable regime based on date of death
export const getApplicableTaxRegime = (dateOfDeath) => {
  if (!dateOfDeath) return null;
  
  const settings = getTaxSettings();
  if (!settings || !settings.regimes) return null;
  
  const deathDate = new Date(dateOfDeath);
  
  // Find the regime that applies to this date
  const applicableRegime = settings.regimes.find(regime => {
    const fromDate = regime.effectiveFrom ? new Date(regime.effectiveFrom) : null;
    const toDate = regime.effectiveTo ? new Date(regime.effectiveTo) : null;
    
    if (fromDate && deathDate < fromDate) return false;
    if (toDate && deathDate > toDate) return false;
    return true;
  });
  
  return applicableRegime || null;
};

// Compute tax based on regime and net taxable estate
export const computeTax = (netTaxableEstate, regime) => {
  if (!regime || netTaxableEstate <= 0) return 0;
  
  if (regime.calculationType === 'percentage') {
    return netTaxableEstate * (regime.config.rate / 100);
  } 
  else if (regime.calculationType === 'bracketed') {
    const brackets = regime.config.brackets || [];
    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i];
      if (netTaxableEstate <= (bracket.max || Infinity)) {
        const excess = netTaxableEstate - bracket.min;
        return (bracket.base || 0) + (excess * (bracket.rate / 100));
      }
    }
    return 0;
  }
  else if (regime.calculationType === 'hybrid') {
    const flatTax = netTaxableEstate * (regime.config.flatRate / 100);
    const excessTax = netTaxableEstate > regime.config.threshold 
      ? (netTaxableEstate - regime.config.threshold) * (regime.config.excessRate / 100)
      : 0;
    return flatTax + excessTax;
  }
  else if (regime.calculationType === 'formula') {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('net_taxable_estate', 'return ' + regime.config.formula);
      return fn(netTaxableEstate);
    } catch (e) {
      console.error('Formula execution failed', e);
      return 0;
    }
  }
  
  return 0;
};

// Get net estate exemption for a regime
export const getNetEstateExemption = (regime) => {
  return regime?.exemptions?.netEstateExemption || 0;
};

// Check if special deductions apply (TRAIN Law specific)
export const hasSpecialDeductions = (regime) => {
  if (!regime) return false;
  const specialDeductions = regime.exemptions?.specialDeductions;
  if (!specialDeductions) return false;
  
  return specialDeductions.familyHome.enabled || 
         specialDeductions.standardDeduction.enabled || 
         specialDeductions.medicalExpenses.enabled;
};

// Get standard deduction amount if applicable
export const getStandardDeduction = (regime) => {
  const standardDeduction = regime?.exemptions?.specialDeductions?.standardDeduction;
  if (standardDeduction?.enabled) {
    return standardDeduction.amount;
  }
  return 0;
};

// Get family home max deduction
export const getFamilyHomeMax = (regime) => {
  const familyHome = regime?.exemptions?.specialDeductions?.familyHome;
  if (familyHome?.enabled) {
    return familyHome.maxAmount;
  }
  return 0;
};

// Get medical expenses max deduction
export const getMedicalExpensesMax = (regime) => {
  const medical = regime?.exemptions?.specialDeductions?.medicalExpenses;
  if (medical?.enabled) {
    return medical.maxAmount;
  }
  return 0;
};