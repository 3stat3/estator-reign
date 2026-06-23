// src/data/checklistTemplates.js
// Dynamic checklists by taxpayer type and year

export const getChecklistTemplate = (taxpayerType, year, industry = null) => {
  // Base checklist for all audits
  const baseChecklist = [
    {
      id: 'loa-verification',
      stage: 'initiation',
      category: 'Audit Authority',
      question: 'Is the Letter of Authority (LOA) valid and properly issued?',
      applicableTo: ['VAT', 'Non-VAT', 'Withholding Agent', 'Mixed'],
      required: true,
      legalBasis: getLegalBasis('LOA', year)
    },
    {
      id: 'loa-single-instance',
      stage: 'initiation',
      category: 'Audit Authority',
      question: 'Are there any other pending LOAs for the same taxable year?',
      applicableTo: ['VAT', 'Non-VAT', 'Withholding Agent', 'Mixed'],
      required: year >= 2026, // Only required for 2026+
      legalBasis: year >= 2026 ? 'RMO No. 1-2026' : null,
      note: year >= 2026 ? 'Single-instance audit applies' : 'Multiple LOAs allowed'
    },
    {
      id: 'tax-returns',
      stage: 'examination',
      category: 'Document Review',
      question: 'Are all tax returns for the audit year filed and available?',
      applicableTo: ['VAT', 'Non-VAT', 'Withholding Agent', 'Mixed'],
      required: true,
      documents: getRequiredReturns(taxpayerType, year)
    },
    {
      id: 'financial-statements',
      stage: 'examination',
      category: 'Document Review',
      question: 'Are audited financial statements available for the audit year?',
      applicableTo: ['VAT', 'Non-VAT', 'Withholding Agent', 'Mixed'],
      required: true
    }
  ];

  // VAT-specific checklist items
  const vatChecklist = [
    {
      id: 'vat-invoices',
      stage: 'examination',
      category: 'VAT Compliance',
      question: 'Are all sales supported by valid invoices with VAT breakdown?',
      applicableTo: ['VAT', 'Mixed'],
      required: true,
      legalBasis: getVATInvoicingRules(year),
      documents: ['Sales invoices', 'Official receipts']
    },
    {
      id: 'vat-input-credit',
      stage: 'examination',
      category: 'VAT Compliance',
      question: 'Are all Input VAT claims supported by valid invoices/import documents?',
      applicableTo: ['VAT', 'Mixed'],
      required: true,
      note: `Substantiation period: ${year >= 2026 ? '15 days (for refund)' : '15 days'}`
    },
    {
      id: 'vat-exempt-sales',
      stage: 'examination',
      category: 'VAT Compliance',
      question: 'Are VAT-exempt sales properly documented?',
      applicableTo: ['VAT', 'Mixed'],
      required: true,
      note: year >= 2026 ? 'Exempt sale expenses can be deducted from gross income' : 'Cannot claim input VAT'
    },
    {
      id: 'vat-zero-rated',
      stage: 'examination',
      category: 'VAT Compliance',
      question: 'Are zero-rated sales supported by required documents?',
      applicableTo: ['VAT', 'Mixed'],
      required: false,
      documents: ['BOC import documents', 'BOI certificates']
    }
  ];

  // Non-VAT specific checklist items
  const nonVatChecklist = [
    {
      id: 'percentage-tax',
      stage: 'examination',
      category: 'Percentage Tax',
      question: 'Are Percentage Tax returns (BIR Form 2551Q) filed correctly?',
      applicableTo: ['Non-VAT'],
      required: true,
      documents: ['BIR Form 2551Q']
    },
    {
      id: 'gross-receipts',
      stage: 'examination',
      category: 'Percentage Tax',
      question: 'Is gross receipts/sales correctly declared on Percentage Tax returns?',
      applicableTo: ['Non-VAT'],
      required: true
    }
  ];

  // Withholding agent checklist items
  const withholdingChecklist = [
    {
      id: 'wt-suppliers',
      stage: 'examination',
      category: 'Withholding Tax',
      question: 'Are withholding taxes correctly applied to supplier payments?',
      applicableTo: ['Withholding Agent', 'Mixed'],
      required: true,
      legalBasis: 'RR No. 2-98',
      ewtRates: getEWTRates(year)
    },
    {
      id: 'wt-2307',
      stage: 'examination',
      category: 'Withholding Tax',
      question: 'Are BIR Form 2307 issued to all suppliers?',
      applicableTo: ['Withholding Agent', 'Mixed'],
      required: true
    },
    {
      id: 'wt-masterlist',
      stage: 'examination',
      category: 'Withholding Tax',
      question: 'Is master list of suppliers maintained?',
      applicableTo: ['Withholding Agent', 'Mixed'],
      required: isTopWithholdingAgent(),
      note: 'Required for Top Withholding Agents'
    }
  ];

  // Industry-specific checklist items
  const industryChecklist = getIndustryChecklist(industry, year);

  // Combine all applicable checklist items
  let checklist = [...baseChecklist];
  
  if (taxpayerType === 'VAT' || taxpayerType === 'Mixed') {
    checklist = [...checklist, ...vatChecklist];
  }
  
  if (taxpayerType === 'Non-VAT') {
    checklist = [...checklist, ...nonVatChecklist];
  }
  
  if (taxpayerType === 'Withholding Agent' || taxpayerType === 'Mixed') {
    checklist = [...checklist, ...withholdingChecklist];
  }
  
  if (industryChecklist) {
    checklist = [...checklist, ...industryChecklist];
  }

  return checklist;
};

// Helper: Get legal basis for LOA
const getLegalBasis = (topic, year) => {
  if (topic === 'LOA') {
    return year >= 2026 ? 'RMO No. 1-2026' : 'RMO No. 43-90';
  }
  return null;
};

// Helper: Get required returns by taxpayer type
const getRequiredReturns = (taxpayerType, year) => {
  const returns = ['Income Tax Return (BIR 1702/1701)'];
  
  if (taxpayerType === 'VAT' || taxpayerType === 'Mixed') {
    returns.push('VAT Returns (BIR 2550Q quarterly, 2550M monthly)');
  }
  
  if (taxpayerType === 'Non-VAT') {
    returns.push('Percentage Tax Returns (BIR 2551Q quarterly)');
  }
  
  if (taxpayerType === 'Withholding Agent' || taxpayerType === 'Mixed') {
    returns.push('EWT Returns (BIR 1601-EQ quarterly, 1601-FQ monthly)');
  }
  
  return returns;
};

// Helper: Get VAT invoicing rules
const getVATInvoicingRules = (year) => {
  return year >= 2026 ? 'RR No. 7-2024 (new rules)' : 'RR No. 16-2005 (old rules)';
};

// Helper: Get EWT rates
const getEWTRates = (year) => {
  return {
    goods: 1,
    services: 2,
    note: year >= 2026 ? 'Updated under RR No. 7-2019' : 'Under RR No. 11-2018'
  };
};

// Helper: Check if Top Withholding Agent
const isTopWithholdingAgent = () => {
  // This would be based on taxpayer profile
  return true; // Placeholder
};

// Helper: Get industry checklist
const getIndustryChecklist = (industry, year) => {
  const industryChecks = {
    construction: [
      {
        id: 'construction-contracts',
        stage: 'examination',
        category: 'Construction Industry',
        question: 'Are all construction contracts properly documented?',
        applicableTo: ['VAT', 'Non-VAT', 'Withholding Agent', 'Mixed'],
        required: true
      },
      {
        id: 'construction-percentage-completion',
        stage: 'examination',
        category: 'Construction Industry',
        question: 'Is revenue recognized using percentage-of-completion method?',
        applicableTo: ['VAT', 'Non-VAT', 'Withholding Agent', 'Mixed'],
        required: true,
        legalBasis: 'RR No. 10-2011'
      },
      {
        id: 'construction-cwt',
        stage: 'examination',
        category: 'Construction Industry',
        question: 'Is CWT correctly withheld on construction payments?',
        applicableTo: ['VAT', 'Non-VAT', 'Withholding Agent', 'Mixed'],
        required: true
      }
    ],
    realestate: [
      {
        id: 'realestate-cwr',
        stage: 'examination',
        category: 'Real Estate',
        question: 'Is CWR correctly applied on real estate sales?',
        applicableTo: ['VAT', 'Non-VAT', 'Withholding Agent', 'Mixed'],
        required: true,
        legalBasis: 'RR No. 11-2018'
      }
    ],
    ecommerce: [
      {
        id: 'ecommerce-digital-records',
        stage: 'examination',
        category: 'E-commerce',
        question: 'Are digital transaction records available and complete?',
        applicableTo: ['VAT', 'Non-VAT', 'Withholding Agent', 'Mixed'],
        required: true,
        legalBasis: 'RMC No. 115-2020'
      }
    ]
  };

  if (industry && industryChecks[industry]) {
    return industryChecks[industry];
  }
  
  return null;
};