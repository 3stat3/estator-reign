// src/components/PropertyDivider/inheritance/utils.js

/**
 * Utility functions for inheritance calculations
 */

/**
 * Sort persons by date of death (chronological)
 */
export function sortByDeathDate(persons) {
  return [...persons]
    .filter(p => p.isDeceased && p.dod)
    .sort((a, b) => new Date(a.dod) - new Date(b.dod));
}

/**
 * Check if a person is alive at a given date
 */
export function isAliveAtDate(person, date) {
  if (!person.isDeceased) return true;
  if (!person.dod) return true;
  return new Date(person.dod) > new Date(date);
}

/**
 * Find all descendants of a person
 */
export function findDescendants(person, allPeople) {
  const descendants = [];
  const children = allPeople.filter(p => p.parentId === person.id);
  
  children.forEach(child => {
    descendants.push(child);
    const grandChildren = findDescendants(child, allPeople);
    descendants.push(...grandChildren);
  });
  
  return descendants;
}

/**
 * Find all ancestors of a person
 */
export function findAncestors(person, allPeople) {
  const ancestors = [];
  let current = person;
  
  while (current.parentId) {
    const parent = allPeople.find(p => p.id === current.parentId);
    if (parent) {
      ancestors.push(parent);
      current = parent;
    } else {
      break;
    }
  }
  
  return ancestors;
}

/**
 * Calculate total property value for a person
 */
export function calculateTotalProperties(person) {
  if (!person.properties) return 0;
  return person.properties.reduce((sum, prop) => sum + prop.totalSqm, 0);
}

/**
 * Calculate conjugal share for a person (50% of conjugal properties)
 */
export function calculateConjugalShare(person) {
  if (!person.properties) return 0;
  const conjugalProps = person.properties.filter(p => p.classification === 'Conjugal');
  return conjugalProps.reduce((sum, prop) => sum + (prop.totalSqm / 2), 0);
}

/**
 * Calculate exclusive properties total
 */
export function calculateExclusiveTotal(person) {
  if (!person.properties) return 0;
  const exclusiveProps = person.properties.filter(p => p.classification === 'Exclusive');
  return exclusiveProps.reduce((sum, prop) => sum + prop.totalSqm, 0);
}

/**
 * Check if a person has any living descendants
 */
export function hasLivingDescendants(person, allPeople) {
  const descendants = findDescendants(person, allPeople);
  return descendants.some(d => !d.isDeceased);
}

/**
 * Get the next of kin for a person
 */
export function getNextOfKin(person, allPeople) {
  // Find spouse
  if (person.spouseId) {
    const spouse = allPeople.find(p => p.id === person.spouseId);
    if (spouse && !spouse.isDeceased) {
      return spouse;
    }
  }
  
  // Find children
  const children = allPeople.filter(p => p.parentId === person.id);
  const livingChildren = children.filter(c => !c.isDeceased);
  if (livingChildren.length > 0) {
    return livingChildren;
  }
  
  // Find parents
  if (person.parentId) {
    const parent = allPeople.find(p => p.id === person.parentId);
    if (parent && !parent.isDeceased) {
      return parent;
    }
  }
  
  return null;
}

/**
 * Format number with proper decimal places
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Create a summary card for a decedent
 */
export function createDecedentSummary(decedent, result) {
  return {
    name: decedent.name,
    deathDate: decedent.dod,
    conjugalProperties: result.assets?.conjugalShare || 0,
    exclusiveProperties: result.assets?.exclusiveTotal || 0,
    inheritedProperties: result.assets?.inheritedTotal || 0,
    totalEstate: result.assets?.totalEstate || 0,
    heirs: result.distribution?.heirs || [],
    totalHeirs: result.distribution?.heirs?.length || 0
  };
}

/**
 * Group transfers by person
 */
export function groupTransfersByPerson(transfers) {
  const grouped = {};
  
  transfers.forEach(transfer => {
    if (!grouped[transfer.from]) {
      grouped[transfer.from] = { given: [], received: [] };
    }
    if (!grouped[transfer.to]) {
      grouped[transfer.to] = { given: [], received: [] };
    }
    
    grouped[transfer.from].given.push(transfer);
    grouped[transfer.to].received.push(transfer);
  });
  
  return grouped;
}

/**
 * Calculate net inheritance for a person
 */
export function calculateNetInheritance(personId, transfers) {
  const received = transfers
    .filter(t => t.to === personId)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const given = transfers
    .filter(t => t.from === personId)
    .reduce((sum, t) => sum + t.amount, 0);
  
  return received - given;
}