// src/components/PropertyDivider/inheritance/index.js

/**
 * Inheritance Calculator Engine
 * Handles complex estate division with chronological death ordering
 */

/**
 * Main function to calculate all inheritance across multiple decedents
 * @param {Array} people - Array of person objects with properties, relationships, and death dates
 * @returns {Object} Comprehensive inheritance results
 */
export function calculateAllInheritance(people) {
  // Filter to only include deceased persons
  const deceased = people.filter(p => p.isDeceased);
  
  if (deceased.length === 0) {
    return {
      results: [],
      summary: {
        totalEstate: 0,
        transfers: [],
        finalDistribution: {}
      }
    };
  }

  // Sort by date of death (chronological)
  const sortedDeceased = [...deceased].sort((a, b) => {
    if (!a.dod) return 1;
    if (!b.dod) return -1;
    return new Date(a.dod) - new Date(b.dod);
  });

  // Copy people to track state changes
  const state = {
    people: people.map(p => ({
      ...p,
      properties: p.properties ? [...p.properties] : [],
      inheritedProperties: []
    })),
    transfers: [],
    results: []
  };

  // Process each death in chronological order
  sortedDeceased.forEach(person => {
    const result = processDeath(person, state);
    if (result) {
      state.results.push(result);
    }
  });

  // Calculate final distribution
  const finalDistribution = calculateFinalDistribution(state);

  return {
    results: state.results,
    transfers: state.transfers,
    summary: {
      totalEstate: state.results.reduce((sum, r) => sum + (r.assets?.totalEstate || 0), 0),
      transfers: state.transfers,
      finalDistribution
    }
  };
}

/**
 * Process a single death event
 */
function processDeath(person, state) {
  // Find the current person in state
  const currentPerson = state.people.find(p => p.id === person.id);
  if (!currentPerson) return null;

  // Calculate total estate for this person
  const assets = calculateEstate(currentPerson, state);
  
  // If no assets, skip
  if (assets.totalEstate === 0) {
    return {
      decedent: person.id,
      deathDate: person.dod,
      assets: assets,
      distribution: { heirs: [], type: 'No Assets' }
    };
  }

  // Find eligible heirs
  const heirs = findEligibleHeirs(currentPerson, state);
  
  if (heirs.length === 0) {
    // No eligible heirs - property goes to next of kin or state
    return {
      decedent: person.id,
      deathDate: person.dod,
      assets: assets,
      distribution: { heirs: [], type: 'No Eligible Heirs' }
    };
  }

  // Distribute the estate
  const distribution = distributeEstate(assets, heirs, currentPerson, state);

  // Record transfers
  distribution.heirs.forEach(heir => {
    if (heir.share > 0) {
      state.transfers.push({
        from: person.id,
        fromName: person.name,
        to: heir.id,
        toName: heir.name,
        amount: heir.share,
        conjugal: heir.conjugal || false,
        relationship: heir.relationship,
        represents: heir.represents || null,
        type: heir.conjugal ? 'Conjugal Share' : heir.represents ? 'Representation' : 'Inheritance'
      });
    }
  });

  return {
    decedent: person.id,
    deathDate: person.dod,
    assets: assets,
    distribution: distribution
  };
}

/**
 * Calculate the total estate for a person
 * Includes conjugal share and exclusive properties
 */
function calculateEstate(person, state) {
  const conjugalProperties = person.properties.filter(p => p.classification === 'Conjugal');
  const exclusiveProperties = person.properties.filter(p => p.classification === 'Exclusive');
  
  // Conjugal share is 50% of conjugal properties
  const conjugalShare = conjugalProperties.reduce((sum, p) => sum + (p.totalSqm / 2), 0);
  
  // Exclusive properties are 100% owned
  const exclusiveTotal = exclusiveProperties.reduce((sum, p) => sum + p.totalSqm, 0);
  
  // Add inherited properties (from previous deaths)
  const inheritedTotal = (person.inheritedProperties || []).reduce((sum, prop) => sum + prop.totalSqm, 0);
  
  const totalEstate = conjugalShare + exclusiveTotal + inheritedTotal;

  return {
    conjugalProperties,
    exclusiveProperties,
    conjugalShare,
    exclusiveTotal,
    inheritedTotal,
    totalEstate,
    // For compatibility with existing code
    conjugal: conjugalProperties,
    exclusive: exclusiveProperties
  };
}

/**
 * Find eligible heirs for a decedent
 * Following Philippine inheritance law (Civil Code)
 */
function findEligibleHeirs(decedent, state) {
  const heirs = [];
  const currentDate = new Date();
  
  // 1. Surviving Spouse (if alive at time of death)
  if (decedent.spouseId) {
    const spouse = state.people.find(p => p.id === decedent.spouseId);
    if (spouse && !spouse.isDeceased) {
      heirs.push({
        id: spouse.id,
        name: spouse.name,
        relationship: 'Surviving Spouse',
        isSpouse: true,
        priority: 1
      });
    }
  }

  // 2. Children (direct descendants)
  const children = state.people.filter(p => p.parentId === decedent.id);
  children.forEach(child => {
    if (child.isDeceased) {
      // Pre-deceased child - check for representation (children of the deceased child)
      const grandchildren = state.people.filter(p => p.parentId === child.id);
      if (grandchildren.length > 0) {
        grandchildren.forEach(grandchild => {
          heirs.push({
            id: grandchild.id,
            name: grandchild.name,
            relationship: 'Grandchild (Representation)',
            represents: child.id,
            representsName: child.name,
            isRepresentative: true,
            priority: 2
          });
        });
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

  // 3. Parents (if no spouse or children)
  if (heirs.length === 0) {
    // No spouse or children, check parents
    if (decedent.parentId) {
      const parent = state.people.find(p => p.id === decedent.parentId);
      if (parent && !parent.isDeceased) {
        heirs.push({
          id: parent.id,
          name: parent.name,
          relationship: 'Parent',
          priority: 3
        });
      }
    }
  }

  // 4. Siblings (if no spouse, children, or parents)
  if (heirs.length === 0 && decedent.parentId) {
    const parent = state.people.find(p => p.id === decedent.parentId);
    if (parent) {
      // Find siblings (children of the same parent)
      const siblings = state.people.filter(p => 
        p.parentId === parent.id && 
        p.id !== decedent.id
      );
      
      siblings.forEach(sibling => {
        if (sibling.isDeceased) {
          // Pre-deceased sibling - check for representation
          const niecesNephews = state.people.filter(p => p.parentId === sibling.id);
          if (niecesNephews.length > 0) {
            niecesNephews.forEach(niece => {
              heirs.push({
                id: niece.id,
                name: niece.name,
                relationship: 'Niece/Nephew (Representation)',
                represents: sibling.id,
                representsName: sibling.name,
                isRepresentative: true,
                priority: 4
              });
            });
          }
        } else {
          heirs.push({
            id: sibling.id,
            name: sibling.name,
            relationship: 'Sibling',
            priority: 4
          });
        }
      });
    }
  }

  return heirs;
}

/**
 * Distribute estate among eligible heirs
 * Follows Philippine law: spouse gets 50% of conjugal property, children divide equally
 */
function distributeEstate(assets, heirs, decedent, state) {
  const totalEstate = assets.totalEstate;
  
  if (heirs.length === 0) {
    return { heirs: [], totalEstate };
  }

  // Determine distribution strategy based on heir types
  const hasSpouse = heirs.some(h => h.isSpouse);
  const hasChildren = heirs.some(h => h.relationship === 'Child' || h.relationship.includes('Grandchild'));
  const hasParents = heirs.some(h => h.relationship === 'Parent');

  let distributedHeirs = [];

  if (hasSpouse && hasChildren) {
    // Spouse and children: Spouse gets 50% of conjugal share, children split the rest
    const conjugalAmount = assets.conjugalShare;
    const spouseShare = conjugalAmount * 0.5;
    const childrenShare = conjugalAmount * 0.5 + assets.exclusiveTotal + (assets.inheritedTotal || 0);
    
    // Distribute to spouse
    const spouseHeirs = heirs.filter(h => h.isSpouse);
    spouseHeirs.forEach(spouse => {
      distributedHeirs.push({
        ...spouse,
        share: spouseShare,
        conjugal: true,
        totalShare: spouseShare
      });
    });

    // Distribute to children
    const childrenHeirs = heirs.filter(h => !h.isSpouse);
    const childrenCount = childrenHeirs.length;
    if (childrenCount > 0) {
      const perChildShare = childrenShare / childrenCount;
      childrenHeirs.forEach(child => {
        distributedHeirs.push({
          ...child,
          share: perChildShare,
          conjugal: false,
          totalShare: perChildShare
        });
      });
    }
  } else if (hasSpouse && !hasChildren) {
    // Spouse only (or spouse + parents)
    const spouseHeirs = heirs.filter(h => h.isSpouse);
    spouseHeirs.forEach(spouse => {
      distributedHeirs.push({
        ...spouse,
        share: totalEstate,
        conjugal: true,
        totalShare: totalEstate
      });
    });

    // If there are parents, they get half of the estate
    const parentHeirs = heirs.filter(h => h.relationship === 'Parent');
    if (parentHeirs.length > 0) {
      const parentShare = totalEstate * 0.5;
      const perParentShare = parentShare / parentHeirs.length;
      
      // Adjust spouse share
      distributedHeirs = distributedHeirs.map(h => {
        if (h.isSpouse) {
          return { ...h, share: totalEstate * 0.5, totalShare: totalEstate * 0.5 };
        }
        return h;
      });

      parentHeirs.forEach(parent => {
        distributedHeirs.push({
          ...parent,
          share: perParentShare,
          conjugal: false,
          totalShare: perParentShare
        });
      });
    }
  } else if (hasChildren && !hasSpouse) {
    // Children only
    const childrenHeirs = heirs.filter(h => !h.isSpouse);
    const perChildShare = totalEstate / childrenHeirs.length;
    childrenHeirs.forEach(child => {
      distributedHeirs.push({
        ...child,
        share: perChildShare,
        conjugal: false,
        totalShare: perChildShare
      });
    });
  } else {
    // Default: equal distribution among all heirs
    const perHeirShare = totalEstate / heirs.length;
    heirs.forEach(heir => {
      distributedHeirs.push({
        ...heir,
        share: perHeirShare,
        conjugal: false,
        totalShare: perHeirShare
      });
    });
  }

  return {
    heirs: distributedHeirs,
    totalEstate
  };
}

/**
 * Calculate final distribution after all deaths are processed
 */
function calculateFinalDistribution(state) {
  const finalDistribution = {};
  
  state.people.forEach(person => {
    if (!person.isDeceased) {
      // Calculate total properties for living persons
      let total = 0;
      
      person.properties.forEach(prop => {
        if (prop.classification === 'Conjugal') {
          total += prop.totalSqm / 2;
        } else {
          total += prop.totalSqm;
        }
      });
      
      // Add inherited properties
      if (person.inheritedProperties) {
        person.inheritedProperties.forEach(prop => {
          total += prop.totalSqm;
        });
      }
      
      finalDistribution[person.id] = {
        name: person.name,
        total: total
      };
    }
  });
  
  return finalDistribution;
}

/**
 * Legacy function for backward compatibility
 */
export function calculateInheritance(people) {
  const result = calculateAllInheritance(people);
  return result.results || [];
}

/**
 * Asset Ledger class for tracking property ownership
 */
export class AssetLedger {
  constructor() {
    this.entries = [];
  }

  addEntry(personId, property) {
    this.entries.push({
      personId,
      ...property,
      timestamp: Date.now()
    });
  }

  getPersonAssets(personId) {
    return this.entries.filter(e => e.personId === personId);
  }

  getTotalValue(personId) {
    return this.getPersonAssets(personId).reduce((sum, e) => sum + e.totalSqm, 0);
  }

  clear() {
    this.entries = [];
  }
}