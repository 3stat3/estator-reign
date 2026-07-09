// src/components/PropertyDivider/services/familyTreeService.js

/**
 * Assigns generation numbers to all persons in a family tree
 * 
 * @param {Array} persons - Array of person objects with id, fatherId, motherId, spouseId
 * @param {string} rootId - Optional: The ID of the root person (propositus) to start from
 * @returns {Array} - Array of persons with generation numbers assigned
 */
export function assignGenerations(persons, rootId = null) {
  if (!persons || persons.length === 0) return persons;
  
  console.log('========================================');
  console.log('🔍 GENERATION ASSIGNMENT START');
  console.log('========================================');
  console.log('📊 Total persons:', persons.length);
  console.log('🎯 Root ID:', rootId);
  console.log('📋 Persons:', persons.map(p => ({ 
    id: p.id, 
    name: p.name, 
    fatherId: p.fatherId, 
    motherId: p.motherId, 
    spouseId: p.spouseId 
  })));
  console.log('========================================\n');
  
  // Create a copy of persons to work with
  const people = persons.map(p => ({ ...p, generation: 0 }));
  
  // Build adjacency list for children (BLOOD RELATIONS ONLY)
  const childrenMap = {};
  people.forEach(p => {
    childrenMap[p.id] = [];
  });
  
  people.forEach(p => {
    if (p.fatherId && childrenMap[p.fatherId]) {
      childrenMap[p.fatherId].push(p.id);
    }
    if (p.motherId && childrenMap[p.motherId]) {
      childrenMap[p.motherId].push(p.id);
    }
  });
  
  console.log('📊 Children Map (blood relations only):');
  Object.keys(childrenMap).forEach(parentId => {
    if (childrenMap[parentId].length > 0) {
      const parent = people.find(p => p.id === parentId);
      const childrenNames = childrenMap[parentId].map(id => {
        const child = people.find(p => p.id === id);
        return child ? child.name : 'unknown';
      });
      console.log(`   ${parent ? parent.name : parentId} → [${childrenNames.join(', ')}]`);
    }
  });
  console.log('');
  
  // ============================================================
  // STEP 1: Build spouse relationships map
  // ============================================================
  const spouseMap = {};
  people.forEach(p => {
    if (p.spouseId) {
      spouseMap[p.id] = p.spouseId;
      spouseMap[p.spouseId] = p.id; // Bi-directional
    }
  });
  
  console.log('💑 Spouse relationships:');
  Object.keys(spouseMap).forEach(id => {
    const person = people.find(p => p.id === id);
    const spouse = people.find(p => p.id === spouseMap[id]);
    if (person && spouse) {
      console.log(`   ${person.name} ↔ ${spouse.name}`);
    }
  });
  console.log('');
  
  // ============================================================
  // STEP 2: Find blood roots - persons with no parents
  // AND are NOT just spouses who married into the family
  // ============================================================
  
  // First, find all persons with no parents
  const potentialRoots = people.filter(p => !p.fatherId && !p.motherId);
  console.log('🌳 Potential roots (no parents):', potentialRoots.map(r => r.name));
  console.log('');
  
  // For each potential root, check if they should be a root
  const rootCandidates = [];
  const processedSpouses = new Set();
  
  potentialRoots.forEach(person => {
    // If already processed, skip
    if (processedSpouses.has(person.id)) return;
    
    const hasChildren = childrenMap[person.id] && childrenMap[person.id].length > 0;
    
    // Check if this person has a spouse
    if (person.spouseId) {
      const spouse = people.find(p => p.id === person.spouseId);
      if (spouse) {
        // Check if the spouse has parents (blood relations)
        const spouseHasParents = spouse.fatherId || spouse.motherId;
        
        // If the spouse has parents, then this person is marrying into the family
        // They should NOT be a root - they should follow their spouse's generation
        if (spouseHasParents) {
          console.log(`   ⏭️ ${person.name} is spouse of ${spouse.name} (who has parents) → NOT a root`);
          processedSpouses.add(person.id);
          return;
        }
        
        // If both spouses have no parents, check if they have children
        if (hasChildren) {
          console.log(`   💑 Root couple: ${person.name} + ${spouse.name} (both have no parents, have children)`);
          rootCandidates.push(person);
          rootCandidates.push(spouse);
          processedSpouses.add(person.id);
          processedSpouses.add(spouse.id);
          return;
        }
      }
    }
    
    // If this person has no spouse with parents, check if they have children
    if (hasChildren) {
      console.log(`   🌱 Single root: ${person.name} (has children, spouse not a root)`);
      rootCandidates.push(person);
      processedSpouses.add(person.id);
    } else {
      // This person has no parents, no spouse with parents, and no children
      // They are likely a disconnected node - assign them generation 1 later
      console.log(`   ⏭️ ${person.name} skipped (no parents, no children)`);
      processedSpouses.add(person.id);
    }
  });
  
  // If we have root candidates, use them
  let roots = rootCandidates;
  
  // If no roots found, find persons who have children
  if (roots.length === 0) {
    const parents = people.filter(p => 
      childrenMap[p.id] && childrenMap[p.id].length > 0
    );
    roots = parents.length > 0 ? parents : people;
    console.log('⚠️ No roots found, using parents as roots:', roots.map(r => r.name));
  }
  
  // If a specific rootId is provided, use it as the primary root
  if (rootId) {
    const rootPerson = people.find(p => p.id === rootId);
    if (rootPerson) {
      roots = roots.filter(r => r.id !== rootId);
      roots = [rootPerson, ...roots];
      console.log(`🎯 Using specified root: ${rootPerson.name} (id: ${rootPerson.id})`);
    }
  }
  
  console.log('🌳 Final roots:', roots.map(r => `${r.name} (id: ${r.id})`));
  console.log('');
  
  // ============================================================
  // STEP 3: Assign generations to BLOOD RELATIVES via BFS
  // ============================================================
  const visited = new Set();
  let queue = [];
  let currentGeneration = 1;
  
  console.log('🔄 BFS GENERATION ASSIGNMENT (Blood Relations)');
  console.log('----------------------------------------');
  
  // Start BFS from roots
  roots.forEach(root => {
    if (!visited.has(root.id)) {
      root.generation = currentGeneration;
      visited.add(root.id);
      queue.push(root.id);
      console.log(`📍 Root: ${root.name} → Generation ${currentGeneration}`);
    }
  });
  
  // Process queue - ONLY through blood relations (father/mother)
  while (queue.length > 0) {
    const currentId = queue.shift();
    const currentPerson = people.find(p => p.id === currentId);
    if (!currentPerson) continue;
    
    const childIds = childrenMap[currentId] || [];
    const childGeneration = currentPerson.generation + 1;
    
    childIds.forEach(childId => {
      if (!visited.has(childId)) {
        const child = people.find(p => p.id === childId);
        if (child) {
          if (!child.generation || child.generation > childGeneration) {
            child.generation = childGeneration;
            console.log(`   👶 ${child.name} → Generation ${childGeneration} (child of ${currentPerson.name})`);
          }
          visited.add(childId);
          queue.push(childId);
        }
      }
    });
  }
  
  console.log('');
  
  // Handle any unvisited persons (these are spouses without children)
  people.forEach(person => {
    if (!person.generation || person.generation === 0) {
      // Check if they have a spouse with a generation
      if (person.spouseId) {
        const spouse = people.find(p => p.id === person.spouseId);
        if (spouse && spouse.generation && spouse.generation > 0) {
          person.generation = spouse.generation;
          console.log(`💑 ${person.name} → Generation ${spouse.generation} (follows spouse ${spouse.name})`);
          return;
        }
      }
      // If still no generation, assign as 1st generation
      person.generation = 1;
      console.log(`⚠️ ${person.name} had no generation, assigned 1 (orphan/fallback)`);
    }
  });
  
  console.log('');
  console.log('📊 Generations after BFS:');
  people.forEach(p => {
    console.log(`   ${p.name}: Generation ${p.generation}`);
  });
  console.log('');
  
  // ============================================================
  // STEP 4: Final spouse sync - ensure all spouses match
  // ============================================================
  console.log('💑 FINAL SPOUSE SYNCHRONIZATION');
  console.log('----------------------------------------');
  
  let spouseSynced = true;
  let syncIterations = 0;
  const maxSyncIterations = people.length * 3;
  
  while (spouseSynced && syncIterations < maxSyncIterations) {
    spouseSynced = false;
    syncIterations++;
    
    people.forEach(person => {
      if (person.spouseId) {
        const spouse = people.find(p => p.id === person.spouseId);
        if (spouse && person.generation && spouse.generation) {
          if (person.generation !== spouse.generation) {
            const higherGen = Math.max(person.generation, spouse.generation);
            console.log(`   🔄 ${person.name} (${person.generation}) + ${spouse.name} (${spouse.generation}) → Both → ${higherGen}`);
            person.generation = higherGen;
            spouse.generation = higherGen;
            spouseSynced = true;
          }
        }
      }
    });
  }
  
  console.log(`   ✅ Spouse sync completed after ${syncIterations} iterations`);
  console.log('');
  
  console.log('========================================');
  console.log('✅ FINAL GENERATIONS ASSIGNED');
  console.log('========================================');
  people.forEach(p => {
    const isSpousePerson = p.spouseId && people.some(person => person.id === p.spouseId);
    const hasParents = p.fatherId || p.motherId;
    const hasChildren = childrenMap[p.id] && childrenMap[p.id].length > 0;
    console.log(`   ${p.name}: Generation ${p.generation} ${isSpousePerson ? '(spouse)' : ''} ${hasParents ? '(has parents)' : '(root)'} ${hasChildren ? '(has children)' : ''}`);
  });
  console.log('========================================\n');
  
  return people;
}

/**
 * Gets the generation label for a person
 * 
 * @param {Object} person - Person object with generation property
 * @returns {string} - Formatted generation label
 */
export function getGenerationLabel(person) {
  if (!person || !person.generation) return 'Unknown';
  const suffix = person.generation === 1 ? 'st' 
    : person.generation === 2 ? 'nd' 
    : person.generation === 3 ? 'rd' 
    : 'th';
  return `${person.generation}${suffix} Generation`;
}

/**
 * Gets all descendants of a person
 * 
 * @param {Array} persons - Array of person objects
 * @param {string} personId - The ID of the person
 * @returns {Array} - Array of descendant person objects
 */
export function getDescendants(persons, personId) {
  const descendants = [];
  const children = persons.filter(p => p.fatherId === personId || p.motherId === personId);
  
  children.forEach(child => {
    descendants.push(child);
    const grandChildren = getDescendants(persons, child.id);
    descendants.push(...grandChildren);
  });
  
  return descendants;
}

/**
 * Gets all ancestors of a person
 * 
 * @param {Array} persons - Array of person objects
 * @param {string} personId - The ID of the person
 * @returns {Array} - Array of ancestor person objects
 */
export function getAncestors(persons, personId) {
  const person = persons.find(p => p.id === personId);
  if (!person) return [];
  
  const ancestors = [];
  
  if (person.fatherId) {
    const father = persons.find(p => p.id === person.fatherId);
    if (father) {
      ancestors.push(father);
      ancestors.push(...getAncestors(persons, father.id));
    }
  }
  
  if (person.motherId) {
    const mother = persons.find(p => p.id === person.motherId);
    if (mother) {
      ancestors.push(mother);
      ancestors.push(...getAncestors(persons, mother.id));
    }
  }
  
  return ancestors;
}

/**
 * Finds the root (oldest ancestor) of a person
 * 
 * @param {Array} persons - Array of person objects
 * @param {string} personId - The ID of the person
 * @returns {Object|null} - The root person object or null
 */
export function findRoot(persons, personId) {
  const ancestors = getAncestors(persons, personId);
  if (ancestors.length === 0) {
    return persons.find(p => p.id === personId) || null;
  }
  
  return ancestors.find(a => !a.fatherId && !a.motherId) || ancestors[ancestors.length - 1];
}