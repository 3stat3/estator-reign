// src/data/auditStages.js
// Audit stage definitions with deadlines and actions

export const auditStages = [
  {
    id: 'initiation',
    label: 'Initiation',
    icon: '📋',
    description: 'Verify audit authority and LOA validity',
    actions: [
      'Verify Letter of Authority (LOA)',
      'Check for multiple LOAs',
      'Validate LOA covers correct tax types'
    ],
    deadlines: [
      {
        label: 'LOA validity period',
        description: 'LOA is valid for one year from date of issue',
        note: 'Can be extended by Commissioner'
      }
    ]
  },
  {
    id: 'examination',
    label: 'Examination',
    icon: '🔍',
    description: 'Document gathering and review',
    actions: [
      'Request and review financial documents',
      'Check tax returns against financial statements',
      'Verify invoices and supporting documents',
      'Substantiate deductions and credits'
    ],
    deadlines: [
      {
        label: 'Document request response',
        description: 'Taxpayer typically given 15-30 days to respond'
      }
    ]
  },
  {
    id: 'discrepancy',
    label: 'Discrepancy Discussion',
    icon: '⚖️',
    description: 'Issue NOD and discuss findings with taxpayer',
    actions: [
      'Prepare Notice of Discrepancy (NOD)',
      'Schedule Discrepancy Discussion (DOD)',
      'Document minutes of discussion',
      'Evaluate taxpayer response'
    ],
    deadlines: [
      {
        label: 'NOD to DOD timeline',
        description: 'NOD should be resolved within 30 days',
        note: 'NOD may be reissued within 1 year'
      }
    ]
  },
  {
    id: 'assessment',
    label: 'Assessment',
    icon: '📊',
    description: 'Issue PAN and FAN',
    actions: [
      'Prepare Preliminary Assessment Notice (PAN)',
      'Wait for taxpayer response (15 days)',
      'If no response, issue Final Assessment Notice (FAN)'
    ],
    deadlines: [
      {
        label: 'PAN response',
        description: 'Taxpayer has 15 days to respond'
      },
      {
        label: 'FAN protest',
        description: 'Taxpayer has 30 days to file protest'
      },
      {
        label: 'Prescriptive period',
        description: 'Assessment must be made within 3 years from filing',
        note: '10 years for fraud cases'
      }
    ]
  },
  {
    id: 'collection',
    label: 'Collection',
    icon: '💰',
    description: 'Payment or enforcement',
    actions: [
      'Issue Final Decision on Disputed Assessment (FDDA)',
      'Issue Warrant of Distraint and/or Levy (WDL)',
      'Monitor payment or CTA appeal'
    ],
    deadlines: [
      {
        label: 'CTA appeal',
        description: 'Taxpayer has 30 days from FDDA to appeal'
      },
      {
        label: 'Collection period',
        description: 'Collection must be made within 3 years from assessment'
      }
    ]
  }
];

// Get stage by ID
export const getStageById = (stageId) => {
  return auditStages.find(stage => stage.id === stageId);
};

// Get next stage
export const getNextStage = (currentStageId) => {
  const index = auditStages.findIndex(stage => stage.id === currentStageId);
  if (index < auditStages.length - 1) {
    return auditStages[index + 1];
  }
  return null;
};

// Get previous stage
export const getPreviousStage = (currentStageId) => {
  const index = auditStages.findIndex(stage => stage.id === currentStageId);
  if (index > 0) {
    return auditStages[index - 1];
  }
  return null;
};