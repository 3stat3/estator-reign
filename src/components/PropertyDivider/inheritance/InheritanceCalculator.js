// src/components/PropertyDivider/inheritance/InheritanceCalculator.js

import { AssetLedger } from './AssetLedger.js';
import { getDeathTimeline } from './DeathTimeline.js';

/**
 * Calculate all inheritance distributions
 */
export const calculateAllInheritance = (allPersons) => {
  console.log('🔄 Calculating inheritance...');
  
  const timeline = getDeathTimeline(allPersons);
  const ledger = new AssetLedger();
  
  allPersons.forEach(p => {
    ledger.setPersonName(p.id, p.name);
  });
  
  const processed = new Set();
  const results = [];
  
  for (const event of timeline) {
    const decedent = event.person;
    
    if (processed.has(decedent.id)) continue;
    processed.add(decedent.id);
    
    const assets = calculateDecedentAssets(decedent, ledger);
    const distribution = distributeInheritance(decedent, assets, allPersons, ledger);
    
    for (const transfer of distribution.transfers) {
      if (transfer.to !== 'state') {
        ledger.addAsset(
          transfer.to,
          transfer.amount,
          decedent.id,
          transfer.relationship,
          transfer.represents || null,
          transfer.conjugal || false
        );
      }
    }
    
    results.push({
      decedent: decedent.id,
      decedentName: decedent.name,
      deathDate: decedent.dod,
      assets: assets,
      distribution: distribution,
      transfers: distribution.transfers
    });
  }
  
  return {
    results,
    ledger,
    finalBalances: ledger.getBalances(),
    transferHistory: ledger.getTransferHistory()
  };
};

/**
 * Calculate decedent's current assets
 */
const calculateDecedentAssets = (decedent, ledger) => {
  const inheritedAmount = ledger.getInheritanceForPerson(decedent.id);
  
  let conjugalShare = 0;
  let exclusiveTotal = 0;
  let totalConjugalFull = 0;
  
  (decedent.properties || []).forEach(prop => {
    if (prop.classification === 'Conjugal') {
      conjugalShare += prop.totalSqm / 2;
      totalConjugalFull += prop.totalSqm;
    } else if (prop.classification === 'Exclusive') {
      exclusiveTotal += prop.totalSqm;
    }
  });
  
  return {
    conjugalShare,
    exclusiveTotal,
    inheritedAmount,
    totalConjugalFull,
    totalEstate: conjugalShare + exclusiveTotal + inheritedAmount
  };
};

/**
 * Distribute inheritance following Philippine law (Intestate Succession)
 */
const distributeInheritance = (decedent, assets, allPersons, ledger) => {
  const spouse = allPersons.find(p => p.id === decedent.spouseId);
  let conjugalShareToSpouse = 0;
  let hereditaryEstate = assets.totalEstate;
  
  if (spouse && !spouse.isDeceased) {
    conjugalShareToSpouse = assets.totalConjugalFull / 2;
    hereditaryEstate = assets.conjugalShare + assets.exclusiveTotal + assets.inheritedAmount;
  }
  
  if (!spouse || spouse.isDeceased) {
    hereditaryEstate = assets.totalEstate;
  }
  
  const heirs = getEligibleHeirs(decedent, allPersons);
  
  if (heirs.length === 0 || hereditaryEstate === 0) {
    if (hereditaryEstate > 0) {
      return {
        heirs: [],
        transfers: [{
          from: decedent.id,
          to: 'state',
          amount: hereditaryEstate,
          relationship: 'Escheat',
          represents: null,
          conjugal: false
        }]
      };
    }
    return {
      heirs: [],
      transfers: []
    };
  }
  
  const shareInfo = calculateShares(decedent, heirs, allPersons);
  const perShareAmount = hereditaryEstate / shareInfo.total;
  
  const transfers = [];
  
  for (const group of shareInfo.groups) {
    if (group.type === 'group') {
      const groupAmount = perShareAmount * group.count;
      const perDescendant = groupAmount / group.descendants.length;
      
      for (const desc of group.descendants) {
        transfers.push({
          from: decedent.id,
          to: desc.id,
          amount: perDescendant,
          relationship: 'Grandchild (Representation)',
          represents: group.childName,
          conjugal: false
        });
      }
    } else if (group.type === 'spouse') {
      const amount = perShareAmount * group.count;
      transfers.push({
        from: decedent.id,
        to: group.id,
        amount: amount,
        relationship: 'Spouse (Inheritance)',
        represents: null,
        conjugal: false
      });
    } else if (group.type === 'parent') {
      const amount = perShareAmount * group.count;
      transfers.push({
        from: decedent.id,
        to: group.id,
        amount: amount,
        relationship: 'Parent',
        represents: null,
        conjugal: false
      });
    } else if (group.type === 'sibling') {
      const amount = perShareAmount * group.count;
      transfers.push({
        from: decedent.id,
        to: group.id,
        amount: amount,
        relationship: group.relationship || 'Sibling',
        represents: null,
        conjugal: false
      });
    } else if (group.type === 'collateral') {
      const amount = perShareAmount * group.count;
      transfers.push({
        from: decedent.id,
        to: group.id,
        amount: amount,
        relationship: group.relationship || 'Collateral Relative',
        represents: null,
        conjugal: false
      });
    } else {
      const amount = perShareAmount * group.count;
      transfers.push({
        from: decedent.id,
        to: group.id,
        amount: amount,
        relationship: group.relationship,
        represents: null,
        conjugal: false
      });
    }
  }
  
  if (conjugalShareToSpouse > 0 && spouse) {
    transfers.push({
      from: decedent.id,
      to: spouse.id,
      amount: conjugalShareToSpouse,
      relationship: 'Spouse (Conjugal Share)',
      represents: null,
      conjugal: true
    });
  }
  
  return { heirs, transfers };
};

/**
 * Get eligible heirs following Philippine Intestate Succession
 */
const getEligibleHeirs = (decedent, allPersons) => {
  const children = allPersons.filter(p => p.parentId === decedent.id);
  const spouse = allPersons.find(p => p.id === decedent.spouseId);
  const eligible = [];
  
  // === STEP 1: CHECK DESCENDANTS (CHILDREN) ===
  if (children.length > 0) {
    // Add spouse if alive (spouse inherits with children)
    if (spouse && !spouse.isDeceased) {
      eligible.push({
        id: spouse.id,
        name: spouse.name,
        relationship: 'Spouse',
        type: 'spouse'
      });
    }
    
    // Process children
    for (const child of children) {
      // === CHILD IS ALIVE ===
      if (!child.isDeceased) {
        eligible.push({
          id: child.id,
          name: child.name,
          relationship: 'Child',
          type: 'direct'
        });
        continue;
      }
      
      // === CHILD DIED AFTER PARENT ===
      // Article 978: Children who died after the parent still inherit
      // Their share goes to their own heirs (not by representation)
      if (new Date(child.dod) > new Date(decedent.dod)) {
        // The child inherits the share, then it passes to their estate
        eligible.push({
          id: child.id,
          name: child.name,
          relationship: 'Child (deceased after parent)',
          type: 'direct'
        });
        continue;
      }
      
      // === CHILD DIED BEFORE PARENT (PRE-DECEASED) ===
      // Article 972: Right of representation - descendants of pre-deceased child
      const descendants = getDescendants(child.id, allPersons);
      const livingDescendants = descendants.filter(d => !d.isDeceased);
      
      if (livingDescendants.length > 0) {
        // The living descendants represent the pre-deceased child
        // They get ONE share TOTAL, divided among them (per stirpes)
        eligible.push({
          type: 'group',
          childId: child.id,
          childName: child.name,
          relationship: 'Pre-deceased Child',
          descendants: livingDescendants,
          count: 1
        });
      }
      // Else: no descendants → EXCLUDED (no one to represent)
    }
    
    return eligible;
  }
  
  // === STEP 2: CHECK PARENTS (ASCENDANTS) ===
  const parents = getLivingParents(decedent, allPersons);
  if (parents.length > 0) {
    if (spouse && !spouse.isDeceased) {
      eligible.push({
        id: spouse.id,
        name: spouse.name,
        relationship: 'Spouse',
        type: 'spouse'
      });
    }
    
    parents.forEach(p => {
      eligible.push({
        id: p.id,
        name: p.name,
        relationship: 'Parent',
        type: 'parent'
      });
    });
    
    return eligible;
  }
  
  // === STEP 3: CHECK SPOUSE ONLY ===
  if (spouse && !spouse.isDeceased) {
    eligible.push({
      id: spouse.id,
      name: spouse.name,
      relationship: 'Spouse',
      type: 'spouse'
    });
    return eligible;
  }
  
  // === STEP 4: CHECK SIBLINGS ===
  const siblings = getLivingSiblings(decedent, allPersons);
  if (siblings.length > 0) {
    const fullBloodSiblings = siblings.filter(s => 
      isFullBloodSibling(decedent, s, allPersons)
    );
    const halfBloodSiblings = siblings.filter(s => 
      !isFullBloodSibling(decedent, s, allPersons)
    );
    
    for (const s of fullBloodSiblings) {
      eligible.push({
        id: s.id,
        name: s.name,
        relationship: 'Sibling (Full Blood)',
        type: 'sibling',
        bloodType: 'full'
      });
    }
    
    for (const s of halfBloodSiblings) {
      eligible.push({
        id: s.id,
        name: s.name,
        relationship: 'Sibling (Half Blood)',
        type: 'sibling',
        bloodType: 'half'
      });
    }
    
    return eligible;
  }
  
  // === STEP 5: CHECK OTHER COLLATERAL RELATIVES ===
  const collateralRelatives = getCollateralRelatives(decedent, allPersons);
  if (collateralRelatives.length > 0) {
    const degreeGroups = {};
    collateralRelatives.forEach(rel => {
      const degree = rel.degree;
      if (!degreeGroups[degree]) degreeGroups[degree] = [];
      degreeGroups[degree].push(rel);
    });
    
    const nearestDegree = Math.min(...Object.keys(degreeGroups).map(Number));
    degreeGroups[nearestDegree].forEach(rel => {
      eligible.push({
        id: rel.id,
        name: rel.name,
        relationship: rel.relationship,
        type: 'collateral',
        degree: rel.degree
      });
    });
    
    return eligible;
  }
  
  return eligible;
};

/**
 * Get fallback heirs for a child who died after parent with no spouse/children
 */
const getFallbackHeirsForChild = (decedent, child, allPersons) => {
  const recipients = [];
  
  const mother = allPersons.find(p => p.id === decedent.spouseId);
  if (mother && !mother.isDeceased) {
    recipients.push({
      id: mother.id,
      name: mother.name,
      relationship: 'Mother (substituted)'
    });
    return recipients;
  }
  
  const grandparents = getLivingParents(decedent, allPersons);
  if (grandparents.length > 0) {
    grandparents.forEach(gp => {
      recipients.push({
        id: gp.id,
        name: gp.name,
        relationship: 'Grandparent (substituted)'
      });
    });
    return recipients;
  }
  
  const siblings = allPersons.filter(p => 
    p.parentId === child.parentId && 
    p.id !== child.id && 
    !p.isDeceased
  );
  
  if (siblings.length > 0) {
    siblings.forEach(sib => {
      recipients.push({
        id: sib.id,
        name: sib.name,
        relationship: 'Sibling (substituted)'
      });
    });
    return recipients;
  }
  
  return recipients;
};

/**
 * Calculate total shares and organize groups
 */
const calculateShares = (decedent, heirs, allPersons) => {
  let total = 0;
  const groups = [];
  
  for (const heir of heirs) {
    if (heir.type === 'group') {
      // Pre-deceased child group - counts as ONE share
      total += 1;
      groups.push({
        type: 'group',
        count: 1,
        childName: heir.childName,
        descendants: heir.descendants
      });
    } else if (heir.type === 'spouse') {
      // Spouse gets ONE share (equal to a child)
      total += 1;
      groups.push({
        type: 'spouse',
        count: 1,
        id: heir.id,
        relationship: 'Spouse'
      });
    } else if (heir.type === 'parent') {
      // Each parent gets ONE share
      total += 1;
      groups.push({
        type: 'parent',
        count: 1,
        id: heir.id,
        relationship: 'Parent'
      });
    } else if (heir.type === 'sibling') {
      // Full blood siblings get 2 shares, half blood get 1 share
      if (heir.bloodType === 'full') {
        total += 2;
        groups.push({
          type: 'sibling',
          count: 2,
          id: heir.id,
          relationship: heir.relationship
        });
      } else {
        total += 1;
        groups.push({
          type: 'sibling',
          count: 1,
          id: heir.id,
          relationship: heir.relationship
        });
      }
    } else if (heir.type === 'collateral') {
      total += 1;
      groups.push({
        type: 'collateral',
        count: 1,
        id: heir.id,
        relationship: heir.relationship
      });
    } else {
      // Direct heir (child)
      total += 1;
      groups.push({
        type: 'direct',
        count: 1,
        id: heir.id,
        relationship: heir.relationship
      });
    }
  }
  
  return { total, groups };
};

/**
 * Get all descendants (children, grandchildren, etc.)
 */
const getDescendants = (personId, allPersons) => {
  const descendants = [];
  const children = allPersons.filter(p => p.parentId === personId);
  
  for (const child of children) {
    descendants.push(child);
    const grandChildren = getDescendants(child.id, allPersons);
    descendants.push(...grandChildren);
  }
  
  return descendants;
};

/**
 * Get living parents (ascendants)
 */
const getLivingParents = (person, allPersons) => {
  const parents = [];
  let currentId = person.parentId;
  
  while (currentId) {
    const parent = allPersons.find(p => p.id === currentId);
    if (parent && !parent.isDeceased) {
      parents.push(parent);
    }
    currentId = parent?.parentId || null;
  }
  
  return parents;
};

/**
 * Get living siblings
 */
const getLivingSiblings = (person, allPersons) => {
  if (!person.parentId) return [];
  
  return allPersons.filter(p => 
    p.parentId === person.parentId && 
    p.id !== person.id && 
    !p.isDeceased
  );
};

/**
 * Check if two siblings are full blood
 */
const isFullBloodSibling = (person1, person2, allPersons) => {
  const mother1 = allPersons.find(p => p.id === person1.spouseId);
  const mother2 = allPersons.find(p => p.id === person2.spouseId);
  
  if (mother1 && mother2 && mother1.id === mother2.id) {
    return true;
  }
  
  if (person1.spouseId && person2.spouseId && person1.spouseId === person2.spouseId) {
    return true;
  }
  
  return false;
};

/**
 * Get collateral relatives up to 5th degree
 */
const getCollateralRelatives = (person, allPersons) => {
  const relatives = [];
  const maxDegree = 5;
  
  const visited = new Set();
  const queue = [{ id: person.id, degree: 0, path: [] }];
  visited.add(person.id);
  
  while (queue.length > 0) {
    const current = queue.shift();
    const currentPerson = allPersons.find(p => p.id === current.id);
    if (!currentPerson) continue;
    
    if (currentPerson.parentId) {
      const parent = allPersons.find(p => p.id === currentPerson.parentId);
      if (parent && !visited.has(parent.id) && current.degree + 1 <= maxDegree) {
        const newDegree = current.degree + 1;
        visited.add(parent.id);
        queue.push({ id: parent.id, degree: newDegree, path: [...current.path, currentPerson.id] });
        if (parent.id !== person.id) {
          relatives.push({
            id: parent.id,
            name: parent.name,
            relationship: getRelationshipName(newDegree, 'ascending'),
            degree: newDegree,
            isDeceased: parent.isDeceased
          });
        }
      }
    }
    
    const children = allPersons.filter(p => p.parentId === current.id);
    for (const child of children) {
      if (!visited.has(child.id) && current.degree + 1 <= maxDegree) {
        const newDegree = current.degree + 1;
        visited.add(child.id);
        queue.push({ id: child.id, degree: newDegree, path: [...current.path, currentPerson.id] });
        if (child.id !== person.id) {
          relatives.push({
            id: child.id,
            name: child.name,
            relationship: getRelationshipName(newDegree, 'descending'),
            degree: newDegree,
            isDeceased: child.isDeceased
          });
        }
      }
    }
  }
  
  const filteredRelatives = relatives.filter(r => 
    r.id !== person.id && 
    !r.isDeceased &&
    r.degree >= 3
  );
  
  return filteredRelatives;
};

/**
 * Get relationship name based on degree and direction
 */
const getRelationshipName = (degree, direction) => {
  const names = {
    1: direction === 'ascending' ? 'Parent' : 'Child',
    2: direction === 'ascending' ? 'Grandparent' : 'Grandchild',
    3: direction === 'ascending' ? 'Great-grandparent' : 'Great-grandchild',
    4: direction === 'ascending' ? 'Great-great-grandparent' : 'Great-great-grandchild',
    5: direction === 'ascending' ? '3rd Great-grandparent' : '3rd Great-grandchild',
  };
  
  return names[degree] || `${degree}th degree relative`;
};

/**
 * Get living parents
 */
const getLivingParentsForPerson = (person, allPersons) => {
  const parents = [];
  let currentId = person.parentId;
  
  while (currentId) {
    const parent = allPersons.find(p => p.id === currentId);
    if (parent && !parent.isDeceased) {
      parents.push(parent);
    }
    currentId = parent?.parentId || null;
  }
  
  return parents;
};

/**
 * Get living siblings
 */
const getLivingSiblingsForPerson = (person, allPersons) => {
  if (!person.parentId) return [];
  
  return allPersons.filter(p => 
    p.parentId === person.parentId && 
    p.id !== person.id && 
    !p.isDeceased
  );
};