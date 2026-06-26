// src/components/PropertyDivider/inheritance/index.js

/**
 * Calculate inheritance distribution for all decedents
 * @param {Array} decedents - Array of person objects
 * @returns {Object} - Inheritance calculation results
 */
export const calculateAllInheritance = (decedents) => {
  const results = [];
  const allTransfers = [];

  // Find all deceased persons
  const deceasedPersons = decedents.filter(p => p.isDeceased);

  if (deceasedPersons.length === 0) {
    return { results: [], transfers: [] };
  }

  // Process each deceased person
  deceasedPersons.forEach(decedent => {
    const result = calculateSingleInheritance(decedent, decedents);
    if (result) {
      results.push(result);
      if (result.transfers) {
        allTransfers.push(...result.transfers);
      }
    }
  });

  return {
    results: results,
    transfers: allTransfers
  };
};

/**
 * Calculate inheritance for a single decedent
 * @param {Object} decedent - The deceased person
 * @param {Array} decedents - All people in the system
 * @returns {Object} - Inheritance result for this decedent
 */
const calculateSingleInheritance = (decedent, decedents) => {
  // Calculate total assets
  const assets = calculateAssets(decedent);
  
  // Find heirs based on family relationships
  const heirs = findHeirs(decedent, decedents);
  
  // Calculate distribution
  const distribution = distributeInheritance(assets, heirs, decedent, decedents);
  
  // Generate transfer records
  const transfers = generateTransfers(decedent, distribution, decedents);

  return {
    decedent: decedent.id,
    deathDate: decedent.dod,
    assets: assets,
    heirs: distribution,
    transfers: transfers,
    distribution: {
      heirs: distribution
    }
  };
};

/**
 * Calculate all assets for a person
 */
const calculateAssets = (person) => {
  const properties = person.properties || [];
  
  let conjugalTotal = 0;
  let exclusiveTotal = 0;
  let conjugalShare = 0;
  
  properties.forEach(prop => {
    if (prop.classification === 'Conjugal') {
      conjugalTotal += prop.totalSqm;
      conjugalShare += prop.totalSqm / 2; // Spouse gets 50%
    } else if (prop.classification === 'Exclusive') {
      exclusiveTotal += prop.totalSqm;
    }
  });

  const totalEstate = conjugalShare + exclusiveTotal;

  return {
    conjugalTotal: conjugalTotal,
    exclusiveTotal: exclusiveTotal,
    conjugalShare: conjugalShare,
    totalEstate: totalEstate,
    inheritedAmount: 0 // Will be calculated if they inherited from others
  };
};

/**
 * Find all heirs for a decedent
 */
const findHeirs = (decedent, decedents) => {
  const heirs = [];
  
  // Find spouse
  const spouse = decedents.find(p => p.id === decedent.spouseId);
  if (spouse) {
    heirs.push({
      id: spouse.id,
      name: spouse.name,
      relationship: 'Spouse',
      priority: 1
    });
  }

  // Find children
  const children = decedents.filter(p => p.parentId === decedent.id);
  if (children.length > 0) {
    children.forEach(child => {
      // Check if child is deceased and has descendants (representation)
      if (child.isDeceased) {
        const descendants = decedents.filter(p => p.parentId === child.id);
        if (descendants.length > 0) {
          // Represent deceased child
          descendants.forEach(desc => {
            heirs.push({
              id: desc.id,
              name: desc.name,
              relationship: 'Grandchild (Representation)',
              priority: 2,
              isRepresentative: true,
              represents: child.name
            });
          });
        } else {
          // Deceased child with no descendants - skip
          // Or could be handled differently based on rules
        }
      } else {
        heirs.push({
          id: child.id,
          name: child.name,
          relationship: 'Child',
          priority: 2
        });
      }
    });
  }

  // Find parents if no spouse or children
  if (heirs.length === 0) {
    const parent = decedents.find(p => p.id === decedent.parentId);
    if (parent) {
      heirs.push({
        id: parent.id,
        name: parent.name,
        relationship: 'Parent',
        priority: 3
      });
    }
  }

  // Find siblings if no spouse, children, or parents
  if (heirs.length === 0 && decedent.parentId) {
    const siblings = decedents.filter(p => 
      p.parentId === decedent.parentId && p.id !== decedent.id
    );
    siblings.forEach(sibling => {
      heirs.push({
        id: sibling.id,
        name: sibling.name,
        relationship: 'Sibling',
        priority: 4
      });
    });
  }

  // Sort by priority
  heirs.sort((a, b) => a.priority - b.priority);

  return heirs;
};

/**
 * Distribute inheritance among heirs
 */
const distributeInheritance = (assets, heirs, decedent, decedents) => {
  if (heirs.length === 0) return [];
  
  const totalEstate = assets.totalEstate;
  if (totalEstate === 0) return heirs.map(h => ({ ...h, share: 0, conjugalShare: 0 }));

  // Find if spouse is in heirs
  const spouseIndex = heirs.findIndex(h => h.relationship === 'Spouse');
  const hasSpouse = spouseIndex !== -1;
  
  let conjugalShare = assets.conjugalShare;
  let exclusiveShare = assets.exclusiveTotal;

  // If spouse exists, they get conjugal share first
  if (hasSpouse) {
    // Spouse gets conjugal share
    heirs[spouseIndex].conjugalShare = conjugalShare;
    heirs[spouseIndex].share = conjugalShare;
  }

  // Remaining estate (exclusive + any conjugal not going to spouse)
  const remainingEstate = exclusiveShare + (hasSpouse ? 0 : conjugalShare);
  
  if (remainingEstate > 0) {
    // Distribute remaining among all heirs (excluding spouse if they already got conjugal share)
    const eligibleHeirs = hasSpouse 
      ? heirs.filter((_, i) => i !== spouseIndex)
      : heirs;
    
    if (eligibleHeirs.length > 0) {
      const sharePerHeir = remainingEstate / eligibleHeirs.length;
      eligibleHeirs.forEach(heir => {
        heir.share = (heir.share || 0) + sharePerHeir;
        heir.conjugalShare = (heir.conjugalShare || 0);
      });
    }
  }

  // Ensure all heirs have share property
  heirs.forEach(h => {
    h.share = h.share || 0;
    h.conjugalShare = h.conjugalShare || 0;
    h.totalShare = h.share + h.conjugalShare;
  });

  return heirs;
};

/**
 * Generate transfer records for each distribution
 */
const generateTransfers = (decedent, distribution, decedents) => {
  const transfers = [];
  
  distribution.forEach(heir => {
    if (heir.totalShare > 0) {
      transfers.push({
        from: decedent.id,
        to: heir.id,
        amount: heir.totalShare,
        relationship: heir.relationship,
        conjugal: heir.conjugalShare > 0,
        represents: heir.represents || null
      });
    }
  });

  return transfers;
};

/**
 * AssetLedger class for tracking property transfers
 */
export class AssetLedger {
  constructor() {
    this.entries = [];
  }

  addEntry(from, to, amount, type, description) {
    this.entries.push({
      from,
      to,
      amount,
      type,
      description,
      timestamp: new Date().toISOString()
    });
  }

  getTransfersByPerson(personId) {
    return this.entries.filter(e => e.from === personId || e.to === personId);
  }

  getTotalReceived(personId) {
    return this.entries
      .filter(e => e.to === personId)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  getTotalGiven(personId) {
    return this.entries
      .filter(e => e.from === personId)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  getNetBalance(personId) {
    return this.getTotalReceived(personId) - this.getTotalGiven(personId);
  }
}

export default {
  calculateAllInheritance,
  AssetLedger
};