// src/data/taxRates.js
// Tax rates by year

export const taxRates = {
  interest: {
    '2024': 12,
    '2025': 12,
    '2026': 12
  },
  surcharge: {
    '2024': 25,
    '2025': 25,
    '2026': 25
  },
  vat: {
    '2024': 12,
    '2025': 12,
    '2026': 12
  },
  percentageTax: {
    '2024': 3,
    '2025': 3,
    '2026': 3
  },
  ewt: {
    '2024': {
      goods: 1,
      services: 2
    },
    '2025': {
      goods: 1,
      services: 2
    },
    '2026': {
      goods: 1,
      services: 2
    }
  },
  incomeTax: {
    '2024': {
      rates: [
        { from: 0, to: 250000, rate: 0 },
        { from: 250000, to: 400000, rate: 15 },
        { from: 400000, to: 800000, rate: 20 },
        { from: 800000, to: 2000000, rate: 25 },
        { from: 2000000, to: 8000000, rate: 30 },
        { from: 8000000, to: Infinity, rate: 35 }
      ]
    },
    '2025': {
      rates: [
        { from: 0, to: 250000, rate: 0 },
        { from: 250000, to: 400000, rate: 15 },
        { from: 400000, to: 800000, rate: 20 },
        { from: 800000, to: 2000000, rate: 25 },
        { from: 2000000, to: 8000000, rate: 30 },
        { from: 8000000, to: Infinity, rate: 35 }
      ]
    },
    '2026': {
      rates: [
        { from: 0, to: 250000, rate: 0 },
        { from: 250000, to: 400000, rate: 15 },
        { from: 400000, to: 800000, rate: 20 },
        { from: 800000, to: 2000000, rate: 25 },
        { from: 2000000, to: 8000000, rate: 30 },
        { from: 8000000, to: Infinity, rate: 35 }
      ]
    }
  }
};

// Helper: Get interest rate for a specific year
export const getInterestRate = (year) => {
  const validYear = Math.max(2024, Math.min(2026, year));
  return taxRates.interest[validYear] || 12;
};

// Helper: Get surcharge rate for a specific year
export const getSurchargeRate = (year) => {
  const validYear = Math.max(2024, Math.min(2026, year));
  return taxRates.surcharge[validYear] || 25;
};