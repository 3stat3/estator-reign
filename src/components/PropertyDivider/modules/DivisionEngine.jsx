// src/components/PropertyDivider/modules/DivisionEngine.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertiesOCS from './PropertiesOCS';
import ExportReport from './ExportReport';

const DivisionEngine = ({ 
  darkMode = false,
  persons = [], 
  properties = [],
  propositusId = null
}) => {
    const [divisionResults, setDivisionResults] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showOCSModal, setShowOCSModal] = useState(false);
    const [expandedHeirId, setExpandedHeirId] = useState(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [resultsKey, setResultsKey] = useState(0);

  const componentKey = propositusId || 'no-propositus';

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  // Clear results when propositus changes
  useEffect(() => {
    setDivisionResults(null);
    setExpandedHeirId(null);
  }, [propositusId]);

  const getChildren = (personId) => {
    const person = persons.find(p => p.id === personId);
    if (!person) return [];
    const directChildren = persons.filter(p => p.fatherId === personId || p.motherId === personId);
    if (directChildren.length > 0) {
      return directChildren;
    }
    return directChildren;
  };

  const getSpouse = (personId) => {
    const person = persons.find(p => p.id === personId);
    if (!person || !person.spouseId) return null;
    return persons.find(p => p.id === person.spouseId);
  };

  const getParents = (personId) => {
    const person = persons.find(p => p.id === personId);
    if (!person) return [];
    const parents = [];
    if (person.fatherId) {
      const father = persons.find(p => p.id === person.fatherId);
      if (father) parents.push(father);
    }
    if (person.motherId) {
      const mother = persons.find(p => p.id === person.motherId);
      if (mother) parents.push(mother);
    }
    return parents;
  };

  const getSiblings = (personId) => {
    const person = persons.find(p => p.id === personId);
    if (!person) return [];
    return persons.filter(p => {
      if (p.id === personId) return false;
      const sameFather = p.fatherId && person.fatherId && p.fatherId === person.fatherId;
      const sameMother = p.motherId && person.motherId && p.motherId === person.motherId;
      return sameFather || sameMother;
    });
  };

  const isDeceasedAtDate = (person, date) => {
    if (!person.isDeceased || !person.dateOfDeath || !person.dateOfDeath.trim()) return false;
    return new Date(person.dateOfDeath) <= new Date(date);
  };

  const isActuallyDeceased = (person) => {
    return person.isDeceased && person.dateOfDeath && person.dateOfDeath.trim() !== '';
  };

  const findAllHeirs = (person, currentDate) => {
    const heirs = [];
    const children = getChildren(person.id);
    for (const child of children) {
      if (!isDeceasedAtDate(child, currentDate)) {
        heirs.push(child);
      }
    }
    return heirs;
  };

  // Find the original owners of conjugal property (the couple who owns it)
  const getConjugalPropertyOwners = () => {
    const owners = new Set();
    const conjugalProperties = properties.filter(p => p.classification === 'Conjugal');
    conjugalProperties.forEach(prop => {
      if (prop.ownerId) {
        // Add the owner
        owners.add(prop.ownerId);
        
        // Also add the owner's spouse (since conjugal property is owned by both)
        const owner = persons.find(p => p.id === prop.ownerId);
        if (owner && owner.spouseId) {
          owners.add(owner.spouseId);
        }
      }
    });
    return Array.from(owners);
  };

  // ============================================================
  // MAIN CALCULATION
  // ============================================================

  const calculateDivision = () => {
    if (!propositusId) {
      alert('Please select a decedent (propositus) first.');
      return;
    }

    setIsCalculating(true);

    try {
      const propositus = persons.find(p => p.id === propositusId);
      if (!propositus) {
        alert('Propositus not found.');
        setIsCalculating(false);
        return;
      }

      const conjugalShareMap = {};
      const exclusivePropertyMap = {};
      const inheritanceHistory = {};
      const excludedSet = new Set();
      const predeceasedInheritanceMap = {}; // Track what predeceased persons inherit from propositus

      // ============================================================
      // FIX: Assign conjugal property based on ACTUAL OWNERS
      // ============================================================
      const conjugalProperties = properties.filter(p => p.classification === 'Conjugal');
      const conjugalTotal = conjugalProperties.reduce((sum, p) => sum + (p.totalSqm || 0), 0);
      
      if (conjugalTotal > 0) {
        // Get the actual owners of conjugal property
        const conjugalOwners = getConjugalPropertyOwners();
        
        if (conjugalOwners.length > 0) {
          // Split conjugal property equally among the actual owners
          const sharePerOwner = conjugalTotal / conjugalOwners.length;
          conjugalOwners.forEach(ownerId => {
            conjugalShareMap[ownerId] = (conjugalShareMap[ownerId] || 0) + sharePerOwner;
          });
          
          // Log for debugging
          const ownerNames = conjugalOwners.map(id => {
            const person = persons.find(p => p.id === id);
            return person ? person.name : id;
          });
          console.log(`   💑 Conjugal property (${conjugalTotal} sqm) assigned to: ${ownerNames.join(' & ')} (${sharePerOwner} sqm each)`);
        } else {
          // Fallback: if no owners found, use the old logic (propositus + spouse)
          const spouse = getSpouse(propositusId);
          if (spouse) {
            conjugalShareMap[propositusId] = conjugalTotal / 2;
            conjugalShareMap[spouse.id] = conjugalTotal / 2;
            console.log(`   💑 Fallback: ${propositus.name} gets ${conjugalTotal/2} sqm, ${spouse.name} gets ${conjugalTotal/2} sqm`);
          } else {
            conjugalShareMap[propositusId] = conjugalTotal;
            console.log(`   💑 Fallback: ${propositus.name} gets ${conjugalTotal} sqm`);
          }
        }
      }

      // Handle Exclusive Properties - belongs entirely to the owner (NOT split)
      const exclusiveProperties = properties.filter(p => p.classification === 'Exclusive');
      exclusiveProperties.forEach(prop => {
        if (prop.ownerId) {
          // Exclusive property goes 100% to the owner
          exclusivePropertyMap[prop.ownerId] = (exclusivePropertyMap[prop.ownerId] || 0) + prop.totalSqm;
          if (!inheritanceHistory[prop.ownerId]) inheritanceHistory[prop.ownerId] = [];
          inheritanceHistory[prop.ownerId].push({
            source: `Own Exclusive Property: ${prop.name}`,
            amount: prop.totalSqm,
            propertyName: prop.name,
            type: 'Exclusive'
          });
          const owner = persons.find(p => p.id === prop.ownerId);
          console.log(`   🏛️ Exclusive property "${prop.name}" (${prop.totalSqm} sqm) belongs to ${owner?.name || prop.ownerId}`);
        }
      });

      // ============================================================
      // Process deaths chronologically
      // ============================================================
      const deceasedPersons = persons
        .filter(p => isActuallyDeceased(p))
        .sort((a, b) => new Date(a.dateOfDeath) - new Date(b.dateOfDeath));

      const deathEvents = [];

      // After processing all deaths, update predeceased persons with what they should have received
      for (const event of deathEvents) {
        if (event.isRepresented && predeceasedInheritanceMap[event.person.id]) {
          event.shouldHaveReceived = predeceasedInheritanceMap[event.person.id];
          // Also update the event's totalEstate to show the inheritance amount
          event.totalEstate = predeceasedInheritanceMap[event.person.id];
        }
      }

      for (const deceased of deceasedPersons) {
        if (excludedSet.has(deceased.id)) {
          deathEvents.push({
            person: deceased,
            conjugalShare: 0,
            exclusiveProperty: 0,
            totalEstate: 0,
            shouldHaveReceived: 0,
            heirs: [],
            distribution: [],
            isExcluded: true,
            isRepresented: false
          });
          continue;
        }

        const conjugalShare = conjugalShareMap[deceased.id] || 0;
        const exclusiveProp = exclusivePropertyMap[deceased.id] || 0;
        const totalEstate = conjugalShare + exclusiveProp;

        console.log(`\n💀 ${deceased.name} (${deceased.dateOfDeath})`);
        console.log(`   Conjugal Share: ${conjugalShare} sqm`);
        console.log(`   Exclusive Property: ${exclusiveProp} sqm`);
        console.log(`   Total Estate: ${totalEstate} sqm`);

        if (totalEstate === 0) {
          const isPreDeceased = new Date(deceased.dateOfDeath) < new Date(propositus.dateOfDeath);
          let shouldHaveReceived = 0;
          let isExcluded = false;
          
          if (isPreDeceased) {
            const children = getChildren(deceased.id);
            const hasLivingKids = children.some(c => !isActuallyDeceased(c));
            if (!hasLivingKids) {
              excludedSet.add(deceased.id);
              isExcluded = true;
              console.log(`   ❌ Pre-deceased with no children - EXCLUDED`);
            } else {
              console.log(`   ℹ️ Pre-deceased with children - will be represented`);
              shouldHaveReceived = totalEstate; // This is 0, but we need to track it
            }
          }
          delete conjugalShareMap[deceased.id];
          delete exclusivePropertyMap[deceased.id];
          
          // Check if this predeceased person will inherit from the propositus
          const willInheritFromPropositus = isPreDeceased && !isExcluded;

          deathEvents.push({
            person: deceased,
            conjugalShare: conjugalShare,
            exclusiveProperty: exclusiveProp,
            totalEstate: 0,
            shouldHaveReceived: 0, // Will be updated later
            heirs: [],
            distribution: [],
            isExcluded: isExcluded,
            isRepresented: willInheritFromPropositus
          });
          continue;
        }

        const currentDeathDate = new Date(deceased.dateOfDeath);
        const heirs = [];
        const heirDetails = [];
        
        const spouse = getSpouse(deceased.id);
        if (spouse && !isDeceasedAtDate(spouse, currentDeathDate) && !excludedSet.has(spouse.id)) {
          heirs.push(spouse);
          heirDetails.push({ person: spouse, type: 'Spouse', representation: null, share: 0 });
          console.log(`   💑 Spouse: ${spouse.name}`);
        }

        // Get children and filter out any that are already excluded
        const children = getChildren(deceased.id).filter(c => !excludedSet.has(c.id));
        const livingChildren = children.filter(c => !isDeceasedAtDate(c, currentDeathDate));
        const deceasedChildren = children.filter(c => isDeceasedAtDate(c, currentDeathDate));
        
        for (const child of livingChildren) {
          if (!excludedSet.has(child.id)) {
            heirs.push(child);
            heirDetails.push({ person: child, type: 'Child', representation: null, share: 0 });
            console.log(`   👶 Living child: ${child.name}`);
          }
        }
        
        for (const child of deceasedChildren) {
          if (excludedSet.has(child.id)) continue;
          const heirsOfChild = findAllHeirs(child, currentDeathDate);
          if (heirsOfChild.length > 0) {
            heirs.push(child);
            heirDetails.push({ 
              person: child, 
              type: 'Represented Child', 
              representation: heirsOfChild,
              share: 0
            });
            console.log(`   👶 Represented child: ${child.name} → ${heirsOfChild.map(r => r.name).join(', ')}`);
          } else {
            excludedSet.add(child.id);
            console.log(`   ❌ ${child.name} (deceased, no living heirs) - EXCLUDED`);
          }
        }

        if (heirs.length === 0) {
          const parents = getParents(deceased.id);
          const livingParents = parents.filter(p => 
            !isDeceasedAtDate(p, currentDeathDate) && !excludedSet.has(p.id)
          );
          for (const parent of livingParents) {
            heirs.push(parent);
            heirDetails.push({ person: parent, type: 'Parent', representation: null, share: 0 });
            console.log(`   👴👵 Parent: ${parent.name}`);
          }
        }

        if (heirs.length === 0) {
          const siblings = getSiblings(deceased.id);
          const livingSiblings = siblings.filter(s => 
            !isDeceasedAtDate(s, currentDeathDate) && !excludedSet.has(s.id)
          );
          const deceasedSiblings = siblings.filter(s => 
            isDeceasedAtDate(s, currentDeathDate) && !excludedSet.has(s.id)
          );
          
          for (const sibling of livingSiblings) {
            heirs.push(sibling);
            heirDetails.push({ person: sibling, type: 'Sibling', representation: null, share: 0 });
            console.log(`   👥 Living sibling: ${sibling.name}`);
          }
          
          for (const sibling of deceasedSiblings) {
            const heirsOfSibling = findAllHeirs(sibling, currentDeathDate);
            if (heirsOfSibling.length > 0) {
              heirs.push(sibling);
              heirDetails.push({ 
                person: sibling, 
                type: 'Represented Sibling', 
                representation: heirsOfSibling,
                share: 0
              });
              console.log(`   👥 Represented sibling: ${sibling.name} → ${heirsOfSibling.map(r => r.name).join(', ')}`);
            }
          }
        }

        delete conjugalShareMap[deceased.id];
        delete exclusivePropertyMap[deceased.id];

        if (heirs.length === 0) {
          console.log(`   ⚠️ No heirs found - estate abandoned`);
          deathEvents.push({
            person: deceased,
            conjugalShare: conjugalShare,
            exclusiveProperty: exclusiveProp,
            totalEstate: totalEstate,
            shouldHaveReceived: totalEstate,
            heirs: [],
            distribution: [],
            isAbandoned: true,
            isExcluded: false,
            isRepresented: false
          });
          continue;
        }

        const sharePerHeir = totalEstate / heirs.length;
        console.log(`   📊 ${heirs.length} heirs, each gets ${sharePerHeir.toFixed(4)} sqm`);
        console.log(`   Heirs:`, heirs.map(h => h.name).join(', '));

        const distribution = [];
        
        for (let i = 0; i < heirs.length; i++) {
          const heir = heirs[i];
          const detail = heirDetails[i];
          const shareAmount = sharePerHeir;
          
          // If this is the propositus distributing to heirs, track predeceased children
          if (deceased.id === propositusId && detail && (detail.type === 'Represented Child' || detail.type === 'Represented Sibling')) {
            // Store what this predeceased child would have received
            predeceasedInheritanceMap[heir.id] = shareAmount;
          }
          
          if (detail && (detail.type === 'Represented Child' || detail.type === 'Represented Sibling')) {
            exclusivePropertyMap[heir.id] = (exclusivePropertyMap[heir.id] || 0) + shareAmount;
            if (!inheritanceHistory[heir.id]) inheritanceHistory[heir.id] = [];
            inheritanceHistory[heir.id].push({
              source: `Inherited from ${deceased.name}`,
              amount: shareAmount,
              type: 'Exclusive'
            });
            
            const repShare = shareAmount / detail.representation.length;
            for (const rep of detail.representation) {
              exclusivePropertyMap[rep.id] = (exclusivePropertyMap[rep.id] || 0) + repShare;
              if (!inheritanceHistory[rep.id]) inheritanceHistory[rep.id] = [];
              inheritanceHistory[rep.id].push({
                source: `Inherited from ${deceased.name} (through ${heir.name})`,
                amount: repShare,
                type: 'Exclusive'
              });
            }
            
            distribution.push({
              heir: heir,
              type: 'Represented',
              share: shareAmount,
              passedTo: detail.representation.map(r => ({ 
                person: r, 
                share: repShare 
              }))
            });
          } else {
            exclusivePropertyMap[heir.id] = (exclusivePropertyMap[heir.id] || 0) + shareAmount;
            if (!inheritanceHistory[heir.id]) inheritanceHistory[heir.id] = [];
            inheritanceHistory[heir.id].push({
              source: `Inherited from ${deceased.name}`,
              amount: shareAmount,
              type: 'Exclusive'
            });
            
            distribution.push({
              heir: heir,
              type: detail ? detail.type : 'Heir',
              share: shareAmount,
              passedTo: null
            });
          }
        }

        // Store the inheritance amount for predeceased persons
          if (deceased.id === propositusId) {
            // If this is the propositus, their estate is distributed to heirs
            // We'll track what each heir (including predeceased children) receives
          }

          deathEvents.push({
            person: deceased,
            conjugalShare: conjugalShare,
            exclusiveProperty: exclusiveProp,
            totalEstate: totalEstate,
            shouldHaveReceived: totalEstate,
            heirs: heirs,
            distribution: distribution,
            sharePerHeir: sharePerHeir,
            isExcluded: false,
            isRepresented: false
          });
      }

      // ============================================================
      // Calculate final heirs
      // ============================================================
      const finalHeirs = [];
      
      for (const person of persons) {
        if (isActuallyDeceased(person)) continue;
        const conjugalShare = conjugalShareMap[person.id] || 0;
        const exclusiveProp = exclusivePropertyMap[person.id] || 0;
        const total = conjugalShare + exclusiveProp;
        if (total > 0.0001) {
          finalHeirs.push({
            person: person,
            total: total,
            conjugalShare: conjugalShare,
            exclusiveProperty: exclusiveProp,
            inheritanceHistory: inheritanceHistory[person.id] || []
          });
        }
      }

      for (const person of persons) {
        if (person.isDeceased && !person.dateOfDeath) {
          const conjugalShare = conjugalShareMap[person.id] || 0;
          const exclusiveProp = exclusivePropertyMap[person.id] || 0;
          const total = conjugalShare + exclusiveProp;
          if (total > 0.0001 && !finalHeirs.some(h => h.person.id === person.id)) {
            finalHeirs.push({
              person: person,
              total: total,
              conjugalShare: conjugalShare,
              exclusiveProperty: exclusiveProp,
              inheritanceHistory: inheritanceHistory[person.id] || []
            });
          }
        }
      }

      finalHeirs.sort((a, b) => b.total - a.total);
      const totalEstate = finalHeirs.reduce((sum, h) => sum + h.total, 0);

      console.log(`\n📊 FINAL RESULTS`);
      console.log(`Total Estate: ${totalEstate} sqm`);
      finalHeirs.forEach(h => {
        const pct = (h.total / totalEstate) * 100;
        console.log(`   ${h.person.name}: ${h.total.toFixed(4)} sqm (${pct.toFixed(1)}%)`);
      });

      // ============================================================
      // FILTER HEIRS - Show the propositus's direct heirs from their distribution
      // ============================================================
      // Get direct children of the propositus (needed for both filters)
      const propositusChildren = getChildren(propositusId);
      const childIds = new Set(propositusChildren.map(c => c.id));
      const propositusSpouse = getSpouse(propositusId);

      // Find the propositus's death event
      const propositusEvent = deathEvents.find(event => event.person.id === propositusId);

      let filteredFinalHeirs = [];
      let filteredTotalEstate = 0;

      if (propositusEvent && propositusEvent.distribution && propositusEvent.distribution.length > 0) {
        // Get the direct heirs from the propositus's distribution
        const directHeirs = [];
        const usedIds = new Set();
        
        for (const dist of propositusEvent.distribution) {
          // Skip if already processed (in case of duplicate entries)
          if (usedIds.has(dist.heir.id)) continue;
          usedIds.add(dist.heir.id);
          
          // Find the heir in finalHeirs to get their total share
          const heirData = finalHeirs.find(h => h.person.id === dist.heir.id);
          if (heirData) {
            // Use the distribution share amount (what they directly inherited from propositus)
            directHeirs.push({
              person: dist.heir,
              total: dist.share,
              conjugalShare: 0,
              exclusiveProperty: dist.share,
              inheritanceHistory: heirData.inheritanceHistory || []
            });
          } else {
            // If not in finalHeirs (shouldn't happen), create a basic entry
            directHeirs.push({
              person: dist.heir,
              total: dist.share,
              conjugalShare: 0,
              exclusiveProperty: dist.share,
              inheritanceHistory: []
            });
          }
        }
        
        filteredFinalHeirs = directHeirs;
        filteredTotalEstate = filteredFinalHeirs.reduce((sum, h) => sum + h.total, 0);
      } else {
        // Fallback: use the old filtering method
        const allowedHeirIds = new Set();
        allowedHeirIds.add(propositusId);
        if (propositusSpouse) allowedHeirIds.add(propositusSpouse.id);
        childIds.forEach(id => allowedHeirIds.add(id));

        filteredFinalHeirs = finalHeirs.filter(heir => allowedHeirIds.has(heir.person.id));
        filteredTotalEstate = filteredFinalHeirs.reduce((sum, h) => sum + h.total, 0);
      }

      console.log('Propositus distribution heirs:', filteredFinalHeirs.length);
      console.log('Propositus distribution total estate:', filteredTotalEstate);

      // ============================================================
      // FILTER DEATH EVENTS - Only show propositus and immediate family
      // ============================================================
      const filteredDeathEvents = [];

      // For each death event, check if it's relevant
      for (const event of deathEvents) {
        // ONLY include the propositus
        if (event.person.id === propositusId) {
          filteredDeathEvents.push(event);
          continue;
        }
        
        // Include if this person is the spouse of the propositus
        if (propositusSpouse && event.person.id === propositusSpouse.id) {
          filteredDeathEvents.push(event);
          continue;
        }
        
        // Include if this person is a child of the propositus
        if (childIds.has(event.person.id)) {
          filteredDeathEvents.push(event);
          continue;
        }
      }

      // Sort by date
      filteredDeathEvents.sort((a, b) => new Date(a.person.dateOfDeath) - new Date(b.person.dateOfDeath));

      console.log('========== DEATH EVENTS DEBUG ==========');
      console.log('Propositus ID:', propositusId);
      console.log('Propositus Name:', propositus.name);
      console.log('Total deathEvents before filter:', deathEvents.length);
      console.log('Filtered deathEvents count:', filteredDeathEvents.length);
      console.log('==========================================');

      // Increment key to force re-render
      setResultsKey(prev => prev + 1);
      
      setDivisionResults({
        heirs: filteredFinalHeirs,
        totalEstate: filteredTotalEstate,
        deathEvents: filteredDeathEvents,
        inheritanceHistory: inheritanceHistory
      });

      setIsCalculating(false);

    } catch (error) {
      console.error('Error calculating division:', error);
      alert('Error calculating division. Check console.');
      setIsCalculating(false);
    }
  };

  // ============================================================
// AUTO-CALCULATE ON PROPOSITUS CHANGE
// ============================================================
useEffect(() => {
  if (propositusId && persons.length > 0 && properties.length > 0 && !isCalculating) {
    // Clear results first to force UI update
    setDivisionResults(null);
    // Then calculate
    setTimeout(() => {
      calculateDivision();
    }, 50);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [propositusId, persons.length, properties.length]);

  // ============================================================
  // UI HELPERS (UNCHANGED)
  // ============================================================

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatNumber = (num) => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTypeColor = (type) => {
    const colors = {
      'Spouse': { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' },
      'Child': { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.2)' },
      'Represented': { bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.2)' },
      'Sibling': { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
      'Parent': { bg: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', border: 'rgba(14, 165, 233, 0.2)' },
      'Heir': { bg: 'rgba(107, 114, 128, 0.08)', color: '#6b7280', border: 'rgba(107, 114, 128, 0.15)' },
    };
    return colors[type] || colors['Heir'];
  };

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================

    const renderSummaryCards = () => {
      if (!divisionResults) return null;
      const { heirs, totalEstate, properties } = divisionResults;
      
      const conjugalProps = properties?.conjugal || [];
      const exclusiveProps = properties?.exclusive || [];
      const conjugalTotal = conjugalProps.reduce((sum, p) => sum + (p.totalSqm || 0), 0);
      const exclusiveTotal = exclusiveProps.reduce((sum, p) => sum + (p.totalSqm || 0), 0);
      
      return (
        <>
          <div className="de-summary-grid">
            <motion.div 
              className="de-summary-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <div className="de-summary-icon">🏛️</div>
              <div className="de-summary-value">{formatNumber(totalEstate)}</div>
              <div className="de-summary-label">Total Estate</div>
              <div className="de-summary-unit">sqm</div>
            </motion.div>
            <motion.div 
              className="de-summary-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="de-summary-icon">👥</div>
              <div className="de-summary-value">{heirs.length}</div>
              <div className="de-summary-label">Total Heirs</div>
            </motion.div>
            <motion.div 
              className="de-summary-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="de-summary-icon">📊</div>
              <div className="de-summary-value">{heirs.length}</div>
              <div className="de-summary-label">Total Shares</div>
            </motion.div>
            <motion.div 
              className="de-summary-card de-summary-highlight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="de-summary-icon">⚖️</div>
              <div className="de-summary-value">Intestate</div>
              <div className="de-summary-label">Succession Type</div>
            </motion.div>
          </div>
        </>
      );
    };

  const renderDeathTimeline = () => {
    if (!divisionResults) return null;
    const { deathEvents } = divisionResults;

    return (
      <div className="de-timeline-section">
        <div className="de-timeline-header-row">
          <h3 className="de-section-title">
            <span className="de-section-icon">📅</span>
            Death Timeline
          </h3>
          <button 
            className="de-btn de-btn-ocs"
            onClick={() => setShowOCSModal(true)}
          >
            📄 Properties to Appear in OCS
          </button>
        </div>
        <div className="de-timeline-list">
          {deathEvents.map((event, index) => {
            // Check if this event has distribution to show
            const hasDistribution = event.distribution && event.distribution.length > 0;
            // Check if this is a predeceased person with representation (has children)
            const isPredeceasedWithRep = event.isRepresented === true;
            
            return (
              <motion.div
                key={index}
                className={`de-timeline-item ${event.isExcluded ? 'de-timeline-excluded' : ''} ${event.isAbandoned ? 'de-timeline-abandoned' : ''} ${isPredeceasedWithRep ? 'de-timeline-represented' : ''}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => {
                  // Show modal if there's distribution OR if it's a predeceased person with representation
                  if (hasDistribution || isPredeceasedWithRep) {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }
                }}
                style={{ cursor: (hasDistribution || isPredeceasedWithRep) ? 'pointer' : 'default' }}
              >
                <div className="de-timeline-marker">
                  <span className="de-timeline-number">{index + 1}</span>
                </div>
                <div className="de-timeline-content">
                  <div className="de-timeline-header">
                    <span className="de-timeline-name">
                      {event.person.name}
                      {event.isExcluded && <span className="de-badge de-badge-excluded">Excluded</span>}
                      {isPredeceasedWithRep && <span className="de-badge de-badge-represented">Represented</span>}
                      {event.isAbandoned && <span className="de-badge de-badge-abandoned">Abandoned</span>}
                    </span>
                    <span className="de-timeline-date">{formatDate(event.person.dateOfDeath)}</span>
                  </div>
                  <div className="de-timeline-details">
                    <span className="de-timeline-estate">
                      Estate: <strong>{formatNumber(event.totalEstate)}</strong> sqm
                    </span>
                    {/* Show "Should have received" for predeceased persons with representation */}
                    {isPredeceasedWithRep && (
                      <span className="de-timeline-should-have">
                        Should have received: <strong>{formatNumber(event.shouldHaveReceived || 0)}</strong> sqm
                      </span>
                    )}
                    <span className="de-timeline-heirs">
                      Heirs: <strong>{event.heirs?.length || 0}</strong>
                    </span>
                    {(hasDistribution || isPredeceasedWithRep) && (
                      <span className="de-timeline-click">Click to view →</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderHeirsList = () => {
    if (!divisionResults) return null;
    const { heirs, totalEstate } = divisionResults;

    // Toggle expansion
    const toggleExpand = (heirId) => {
      setExpandedHeirId(expandedHeirId === heirId ? null : heirId);
    };

    return (
      <div className="de-heirs-section">
        <h3 className="de-section-title">
          <span className="de-section-icon">👥</span>
          Heirs & Their Shares
        </h3>
        <div className="de-heirs-list">
          {heirs.map((heir, index) => {
            const pct = (heir.total / totalEstate) * 100;
            const isExpanded = expandedHeirId === heir.person.id;
            
            return (
              <motion.div
                key={heir.person.id}
                className={`de-heir-card ${isExpanded ? 'de-heir-expanded' : ''}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                {/* Clickable header */}
                <div 
                  className="de-heir-header" 
                  onClick={() => toggleExpand(heir.person.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="de-heir-info">
                    <div className="de-heir-avatar" style={{
                      background: heir.person.isDeceased && heir.person.dateOfDeath ? 
                        'linear-gradient(135deg, #dc2626, #b91c1c)' : 
                        'linear-gradient(135deg, #667eea, #764ba2)'
                    }}>
                      {getInitials(heir.person.name)}
                    </div>
                    <div>
                      <div className="de-heir-name">
                        {heir.person.name}
                        {heir.person.isDeceased && heir.person.dateOfDeath && (
                          <span className="de-heir-deceased">⚰️</span>
                        )}
                        <span className="de-heir-type-badge" style={{
                          background: getTypeColor('Heir').bg,
                          color: getTypeColor('Heir').color,
                        }}>
                          Exclusive
                        </span>
                      </div>
                      <div className="de-heir-source-preview">
                        {heir.inheritanceHistory && heir.inheritanceHistory.length > 0 && (
                          <span className="de-source-preview-text">
                            {heir.inheritanceHistory.length} source{heir.inheritanceHistory.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="de-heir-share">
                    <div className="de-heir-share-value">
                      {formatNumber(heir.total)}
                      <span className="de-heir-share-unit"> sqm</span>
                    </div>
                    <div className="de-heir-share-percent">
                      {pct.toFixed(1)}%
                    </div>
                    <div className="de-heir-expand-icon">
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>
                </div>

                {/* Expanded audit trail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="de-heir-audit-trail"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="de-audit-header">
                        <span className="de-audit-title">📋 Property Audit Trail</span>
                        <span className="de-audit-total">
                          {formatNumber(heir.total)} sqm
                        </span>
                      </div>
                      
                      <div className="de-audit-table">
                        <div className="de-audit-header-row">
                          <span className="de-audit-col-source">Source</span>
                          <span className="de-audit-col-amount">Area</span>
                          <span className="de-audit-col-type">Type</span>
                        </div>
                        
                        {heir.inheritanceHistory && heir.inheritanceHistory.length > 0 ? (
                          <>
                            {heir.inheritanceHistory.map((item, idx) => {
                              // Clean up the source display
                              let sourceDisplay = item.source;
                              // Remove "Inherited from " prefix
                              sourceDisplay = sourceDisplay.replace('Inherited from ', '');
                              // Remove "Own Exclusive Property: " prefix
                              sourceDisplay = sourceDisplay.replace('Own Exclusive Property: ', '');
                              // Remove " (through " and everything after
                              const throughIndex = sourceDisplay.indexOf(' (through ');
                              if (throughIndex > -1) {
                                sourceDisplay = sourceDisplay.substring(0, throughIndex);
                              }
                              
                              let sourceIcon = '📤';
                              if (item.source.includes('Own Exclusive Property')) {
                                sourceIcon = '🏛️';
                              } else if (item.source.includes('through')) {
                                sourceIcon = '↳';
                              } else if (item.source.includes('Inherited from')) {
                                sourceIcon = '⬇️';
                              }
                              
                              return (
                                <div key={idx} className="de-audit-row">
                                  <span className="de-audit-col-source">
                                    <span className="de-audit-source-with-icon">
                                      <span className="de-audit-source-icon">{sourceIcon}</span>
                                      <span className="de-audit-source-text">{sourceDisplay}</span>
                                    </span>
                                  </span>
                                  <span className="de-audit-col-amount">
                                    <span className="de-audit-amount-value">{formatNumber(item.amount)}</span>
                                    <span className="de-audit-amount-unit">sqm</span>
                                  </span>
                                  <span className="de-audit-col-type">
                                    <span className="de-audit-type-badge">
                                      {item.type || 'Inheritance'}
                                    </span>
                                  </span>
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          <div className="de-audit-empty">No inheritance history available</div>
                        )}
                        
                        {/* Total row */}
                        {heir.inheritanceHistory && heir.inheritanceHistory.length > 1 && (
                          <div className="de-audit-total-row">
                            <span className="de-audit-col-source">Total</span>
                            <span className="de-audit-col-amount">
                              {formatNumber(heir.total)} <span style={{fontSize: '10px', fontWeight: '400'}}>sqm</span>
                            </span>
                            <span className="de-audit-col-type"></span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          
          <div className="de-heirs-total">
            <span>Total Estate</span>
            <span>{formatNumber(totalEstate)} sqm</span>
          </div>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!selectedEvent) return null;

    // Check if this is a represented predeceased person
    const isRepresentedPredeceased = selectedEvent.isRepresented === true;

    return (
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            className="de-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              className="de-modal"
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="de-modal-header">
                <div className="de-modal-header-left">
                  <div className="de-modal-avatar" style={{
                    background: isRepresentedPredeceased ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'white',
                    flexShrink: '0'
                  }}>
                    {getInitials(selectedEvent.person.name)}
                  </div>
                  <div>
                    <h2 className="de-modal-title">{selectedEvent.person.name}</h2>
                    <p className="de-modal-subtitle">
                      ⚰️ Died: {formatDate(selectedEvent.person.dateOfDeath)}
                      {isRepresentedPredeceased && (
                        <span style={{ display: 'block', color: '#8b5cf6', fontWeight: '600' }}>
                          ⚖️ Predeceased — Estate distributed to representatives
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button className="de-modal-close" onClick={() => setShowEventModal(false)}>✕</button>
              </div>

              <div className="de-modal-body">
                <div className="de-modal-estate">
                  <div className={`de-modal-estate-item ${isRepresentedPredeceased ? 'de-modal-estate-should-have' : 'de-modal-estate-total'}`}>
                    <div className="de-modal-estate-icon">🏛️</div>
                    <span className="de-modal-estate-label">
                      {isRepresentedPredeceased ? 'Should Have Received' : 'Total Estate'}
                    </span>
                    <span className="de-modal-estate-value">
                      {formatNumber(isRepresentedPredeceased ? selectedEvent.shouldHaveReceived : selectedEvent.totalEstate)}
                      <span className="de-modal-estate-unit"> sqm</span>
                    </span>
                  </div>
                  <div className="de-modal-estate-item">
                    <div className="de-modal-estate-icon">💑</div>
                    <span className="de-modal-estate-label">Conjugal Share</span>
                    <span className="de-modal-estate-value">{formatNumber(selectedEvent.conjugalShare)} <span className="de-modal-estate-unit">sqm</span></span>
                  </div>
                  <div className="de-modal-estate-item">
                    <div className="de-modal-estate-icon">🏛️</div>
                    <span className="de-modal-estate-label">Exclusive Property</span>
                    <span className="de-modal-estate-value">{formatNumber(selectedEvent.exclusiveProperty)} <span className="de-modal-estate-unit">sqm</span></span>
                  </div>
                </div>

                {/* Show distribution or representation info */}
                {selectedEvent.distribution && selectedEvent.distribution.length > 0 ? (
                  <div className="de-modal-distribution">
                    <h4 className="de-modal-section-title">
                      <span className="de-modal-section-icon">📤</span>
                      {isRepresentedPredeceased ? 'Distribution to Representatives' : 'Distribution'}
                    </h4>
                    <div className="de-modal-dist-list">
                      {selectedEvent.distribution.map((dist, idx) => {
                        const color = getTypeColor(dist.type);
                        return (
                          <div key={idx} className="de-modal-dist-item">
                            <div className="de-modal-dist-left">
                              <div className="de-modal-dist-avatar" style={{
                                background: color.bg,
                                color: color.color,
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                {getInitials(dist.heir.name)}
                              </div>
                              <div>
                                <span className="de-modal-dist-name">{dist.heir.name}</span>
                                <span className="de-modal-dist-type" style={{
                                  background: color.bg,
                                  color: color.color,
                                }}>
                                  {dist.type}
                                </span>
                              </div>
                            </div>
                            <div className="de-modal-dist-right">
                              <span className="de-modal-dist-share">{formatNumber(dist.share)} <span className="de-modal-dist-unit">sqm</span></span>
                              {dist.passedTo && (
                                <div className="de-modal-dist-passed">
                                  ⤷ {dist.passedTo.map(p => 
                                    `${p.person.name}: ${formatNumber(p.share)} sqm`
                                  ).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : isRepresentedPredeceased && selectedEvent.shouldHaveReceived > 0 ? (
                  <div className="de-modal-representation">
                    <h4 className="de-modal-section-title">
                      <span className="de-modal-section-icon">👥</span>
                      Representatives
                    </h4>
                    <p style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-secondary, #64748b)',
                      marginBottom: '12px'
                    }}>
                      This predeceased person's estate of <strong>{formatNumber(selectedEvent.shouldHaveReceived)} sqm</strong> is distributed to their legal representatives.
                    </p>
                    <div className="de-modal-dist-list">
                      <div className="de-modal-dist-item" style={{ 
                        background: 'rgba(139, 92, 246, 0.04)',
                        borderColor: 'rgba(139, 92, 246, 0.15)'
                      }}>
                        <div className="de-modal-dist-left">
                          <div className="de-modal-dist-avatar" style={{
                            background: 'rgba(139, 92, 246, 0.12)',
                            color: '#8b5cf6',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            👤
                          </div>
                          <div>
                            <span className="de-modal-dist-name">Representatives</span>
                            <span className="de-modal-dist-type" style={{
                              background: 'rgba(139, 92, 246, 0.12)',
                              color: '#8b5cf6',
                            }}>
                              Inherit by representation
                            </span>
                          </div>
                        </div>
                        <div className="de-modal-dist-right">
                          <span className="de-modal-dist-share">
                            {formatNumber(selectedEvent.shouldHaveReceived)} <span className="de-modal-dist-unit">sqm</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="de-modal-no-distribution">
                    <p style={{ 
                      textAlign: 'center', 
                      color: 'var(--text-secondary, #64748b)',
                      padding: '20px 0'
                    }}>
                      No distribution recorded for this event.
                    </p>
                  </div>
                )}
              </div>

              <div className="de-modal-footer">
                <button className="de-modal-btn de-modal-btn-close" onClick={() => setShowEventModal(false)}>
                  ✕ Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // ============================================================
  // MAIN RETURN
  // ============================================================

  return (
    <div className="de-wrapper" key={componentKey}>
      <div className="de-header">
      <div className="de-header-top">
        <div className="de-header-left">
          <h1 className="de-title">⚖️ Division Engine</h1>
          <p className="de-subtitle">Philippine Intestate Succession System</p>
          <span className="de-badge-intestate">Intestate Only</span>
        </div>
        
        {/* Summary Cards - inline with title */}
        {divisionResults && (
          <div className="de-summary-grid">
            <div className="de-summary-card">
            <div className="de-summary-icon">🏛️</div>
            <div className="de-summary-content">
              <span className="de-summary-value">{formatNumber(divisionResults.totalEstate)}</span>
              <span className="de-summary-label">
                {propositusId ? persons.find(p => p.id === propositusId)?.name || 'Estate' : 'Estate'}
                <span className="de-summary-unit"> sqm</span>
              </span>
            </div>
          </div>
            <div className="de-summary-card">
              <div className="de-summary-icon">👥</div>
              <div className="de-summary-content">
                <span className="de-summary-value">{divisionResults.heirs.length}</span>
                <span className="de-summary-label">Heirs</span>
              </div>
            </div>
            <div className="de-summary-card">
              <div className="de-summary-icon">📊</div>
              <div className="de-summary-content">
                <span className="de-summary-value">{divisionResults.heirs.length}</span>
                <span className="de-summary-label">Shares</span>
              </div>
            </div>
            <div className="de-summary-card de-summary-highlight">
              <div className="de-summary-icon">⚖️</div>
              <div className="de-summary-content">
                <span className="de-summary-value">Intestate</span>
                <span className="de-summary-label">Type</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="de-header-actions">
          {divisionResults && (
            <button 
              className="de-btn de-btn-export"
              onClick={() => setShowExportModal(true)}
            >
              📄 Export Report
            </button>
          )}
          <button 
            className="de-btn de-btn-primary"
            onClick={calculateDivision}
            disabled={isCalculating || !propositusId}
          >
            {isCalculating ? (
              <>
                <span className="de-spinner" />
                Calculating...
              </>
            ) : (
              'Calculate Division'
            )}
          </button>
        </div>
      </div>
    </div>

      {divisionResults ? (
        <div className="de-results">
          <div className="de-results-grid">
            {renderDeathTimeline()}
            {renderHeirsList()}
          </div>
          
          {renderModal()}
        </div>
      ) : (
            <div className="de-empty-state">
              <div className="de-empty-icon">⚖️</div>
              <h3>Ready to Calculate</h3>
              <p>
                {!propositusId 
                  ? 'Please select a decedent (propositus) first.'
                  : 'Click the "Calculate Division" button to distribute the estate.'
                }
              </p>
              <div className="de-empty-details">
                <span>👥 {persons.length} persons</span>
                <span>🏠 {properties.length} properties</span>
                <span>🎯 {propositusId ? persons.find(p => p.id === propositusId)?.name || 'None' : 'None'}</span>
              </div>
            </div>
          )}

          {/* Properties OCS Modal */}
          <PropertiesOCS
          darkMode={darkMode}
          persons={persons}
          properties={properties}
          deathEvents={divisionResults?.deathEvents || []}
          propositusId={propositusId}
          isOpen={showOCSModal}
          onClose={() => setShowOCSModal(false)}
        />

        {/* Export Report Modal */}
        {showExportModal && (
          <ExportReport
            darkMode={darkMode}
            divisionResults={divisionResults}
            persons={persons}
            properties={properties}
            propositusId={propositusId}
            onClose={() => setShowExportModal(false)}
          />
        )}

      <style>{`
  /* ============================================================
    WRAPPER & LAYOUT
    ============================================================ */
  .de-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 0 2px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg-primary, #f8fafc);
    color: var(--text-primary, #0f172a);
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  /* ============================================================
    HEADER
    ============================================================ */
  .de-header {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px 24px;
    background: var(--card-bg, #ffffff);
    border-radius: 14px;
    border: 1px solid var(--border-color, #e2e8f0);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .de-header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .de-header-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex-shrink: 0;
  }

  .de-title {
    font-size: 22px;
    font-weight: 800;
    color: var(--text-primary, #0f172a);
    margin: 0;
    letter-spacing: -0.5px;
  }

  .de-subtitle {
    font-size: 12px;
    color: var(--text-secondary, #64748b);
    margin: 0;
  }

  .de-badge-intestate {
    display: inline-block;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 10px;
    border-radius: 10px;
    background: rgba(139, 92, 246, 0.1);
    color: #8b5cf6;
    border: 1px solid rgba(139, 92, 246, 0.2);
    margin-top: 2px;
    width: fit-content;
  }

  /* ============================================================
    SUMMARY CARDS - LARGER SIZE
    ============================================================ */
  .de-summary-grid {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .de-summary-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 22px 12px 18px;
    background: var(--bg-secondary, #f8fafc);
    border-radius: 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    transition: all 0.2s ease;
    flex-shrink: 0;
    min-height: 58px;
    min-width: 130px;
  }

  .de-summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .de-summary-highlight {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.06));
    border-color: rgba(99, 102, 241, 0.15);
  }

  .de-summary-icon {
    font-size: 24px;
    line-height: 1;
    flex-shrink: 0;
  }

  .de-summary-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.2;
  }

  .de-summary-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary, #0f172a);
    line-height: 1.1;
  }

  .de-summary-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.4px;
    line-height: 1;
  }

  .de-summary-unit {
    font-size: 11px;
    color: var(--text-secondary, #64748b);
    font-weight: 400;
    margin-left: 1px;
  }

  /* ============================================================
    BUTTONS
    ============================================================ */
  .de-btn {
    padding: 10px 24px;
    border-radius: 10px;
    border: none;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    height: 44px;
  }

  .de-btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  .de-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
  }

  .de-btn-export {
    background: linear-gradient(135deg, #10b981, #059669);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .de-btn-export:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  .de-header-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .de-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  .de-spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: de-spin 0.8s linear infinite;
  }

  @keyframes de-spin {
    to { transform: rotate(360deg); }
  }

  /* ============================================================
    EMPTY STATE
    ============================================================ */
  .de-empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    background: var(--card-bg, #ffffff);
    border-radius: 14px;
    border: 1px solid var(--border-color, #e2e8f0);
  }

  .de-empty-icon {
    font-size: 56px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .de-empty-state h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #0f172a);
    margin: 0 0 6px 0;
  }

  .de-empty-state p {
    font-size: 14px;
    color: var(--text-secondary, #64748b);
    margin: 0 0 18px 0;
  }

  .de-empty-details {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    padding: 8px 20px;
    border-radius: 10px;
    background: var(--bg-secondary, #f1f5f9);
    border: 1px solid var(--border-color, #e2e8f0);
    font-size: 13px;
    color: var(--text-secondary, #64748b);
  }

  /* ============================================================
    RESULTS
    ============================================================ */
  .de-results {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  /* ============================================================
    RESULTS GRID
    ============================================================ */
  .de-results-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  /* ============================================================
    SECTION TITLES
    ============================================================ */
  .de-section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #0f172a);
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .de-section-icon {
    font-size: 16px;
  }

  /* ============================================================
    TIMELINE
    ============================================================ */
  .de-timeline-section {
    background: var(--card-bg, #ffffff);
    border-radius: 12px;
    padding: 16px 18px;
    border: 1px solid var(--border-color, #e2e8f0);
  }

  .de-timeline-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .de-timeline-header-row .de-section-title {
    margin-bottom: 0;
  }

  .de-btn-ocs {
    padding: 6px 16px;
    border-radius: 8px;
    border: 1px solid rgba(99, 102, 241, 0.3);
    background: rgba(99, 102, 241, 0.06);
    color: #6366f1;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .de-btn-ocs:hover {
    background: rgba(99, 102, 241, 0.12);
    border-color: rgba(99, 102, 241, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
  }

  .de-btn-ocs:active {
    transform: scale(0.97);
  }

  /* Dark mode support for OCS button */
  [data-theme="dark"] .de-btn-ocs {
    background: rgba(99, 102, 241, 0.12);
    border-color: rgba(99, 102, 241, 0.2);
    color: #818cf8;
  }

  [data-theme="dark"] .de-btn-ocs:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.4);
  }

  .de-timeline-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
    max-height: 380px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .de-timeline-list::-webkit-scrollbar {
    width: 4px;
  }

  .de-timeline-list::-webkit-scrollbar-track {
    background: var(--bg-secondary, #f1f5f9);
    border-radius: 2px;
  }

  .de-timeline-list::-webkit-scrollbar-thumb {
    background: var(--border-color, #e2e8f0);
    border-radius: 2px;
  }

  .de-timeline-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 8px 12px;
    border-radius: 10px;
    background: var(--bg-secondary, #f8fafc);
    border: 1px solid transparent;
    transition: all 0.2s ease;
  }

  .de-timeline-item:hover:not(.de-timeline-excluded):not(.de-timeline-abandoned) {
    background: var(--hover-bg, #f1f5f9);
    border-color: rgba(99, 102, 241, 0.15);
  }

  .de-timeline-item.de-timeline-represented {
    background: rgba(139, 92, 246, 0.06);
    border-color: rgba(139, 92, 246, 0.15);
  }

  .de-timeline-item.de-timeline-represented:hover {
    background: rgba(139, 92, 246, 0.1);
    border-color: rgba(139, 92, 246, 0.25);
  }

  .de-timeline-excluded {
    opacity: 0.5;
    background: rgba(220, 38, 38, 0.04);
    border-color: rgba(220, 38, 38, 0.08);
  }

  .de-timeline-abandoned {
    opacity: 0.5;
    background: rgba(245, 158, 11, 0.04);
    border-color: rgba(245, 158, 11, 0.08);
  }

  .de-timeline-marker {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 10px;
    font-weight: 700;
  }

  .de-timeline-represented .de-timeline-marker {
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    border: 2px solid rgba(139, 92, 246, 0.3);
  }

  .de-timeline-excluded .de-timeline-marker {
    background: #dc2626;
  }

  .de-timeline-abandoned .de-timeline-marker {
    background: #f59e0b;
  }

  .de-timeline-content {
    flex: 1;
    min-width: 0;
  }

  .de-timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  }

  .de-timeline-name {
    font-weight: 600;
    color: var(--text-primary, #0f172a);
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .de-timeline-date {
    font-size: 11px;
    color: var(--text-secondary, #64748b);
  }

  .de-timeline-details {
    display: flex;
    gap: 14px;
    font-size: 11px;
    color: var(--text-secondary, #64748b);
    margin-top: 2px;
    flex-wrap: wrap;
  }

  .de-timeline-estate strong,
  .de-timeline-heirs strong,
  .de-timeline-should-have strong {
    color: var(--text-primary, #0f172a);
  }

  .de-timeline-should-have {
    color: #8b5cf6;
  }

  .de-timeline-should-have strong {
    color: #8b5cf6;
  }

  .de-timeline-click {
    font-size: 10px;
    color: #6366f1;
    font-weight: 500;
  }

  .de-badge {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 1px 8px;
    border-radius: 10px;
  }

  .de-badge-excluded {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  }

  .de-badge-represented {
    background: rgba(139, 92, 246, 0.12);
    color: #8b5cf6;
  }

  .de-badge-abandoned {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  /* ============================================================
    HEIRS LIST
    ============================================================ */
  .de-heirs-section {
    background: var(--card-bg, #ffffff);
    border-radius: 12px;
    padding: 16px 18px;
    border: 1px solid var(--border-color, #e2e8f0);
  }

  .de-heirs-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
    max-height: 380px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .de-heirs-list::-webkit-scrollbar {
    width: 4px;
  }

  .de-heirs-list::-webkit-scrollbar-track {
    background: var(--bg-secondary, #f1f5f9);
    border-radius: 2px;
  }

  .de-heirs-list::-webkit-scrollbar-thumb {
    background: var(--border-color, #e2e8f0);
    border-radius: 2px;
  }

  .de-heir-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-radius: 10px;
    background: var(--bg-secondary, #f8fafc);
    border: 1px solid transparent;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .de-heir-card:hover {
    background: var(--hover-bg, #f1f5f9);
    border-color: rgba(99, 102, 241, 0.1);
  }

  .de-heir-info {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  .de-heir-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }

  .de-heir-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary, #0f172a);
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .de-heir-deceased {
    font-size: 11px;
    opacity: 0.5;
  }

  .de-heir-type-badge {
    font-size: 7px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 1px 8px;
    border-radius: 10px;
  }

  .de-heir-source {
    font-size: 10px;
    color: var(--text-secondary, #64748b);
    margin-top: 1px;
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }

  .de-source-item {
    background: var(--bg-secondary, #f1f5f9);
    padding: 0 6px;
    border-radius: 4px;
  }

  .de-heir-share {
    text-align: right;
    flex-shrink: 0;
  }

  .de-heir-share-value {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary, #0f172a);
  }

  .de-heir-share-unit {
    font-size: 10px;
    font-weight: 400;
    color: var(--text-secondary, #64748b);
  }

  .de-heir-share-percent {
    font-size: 10px;
    font-weight: 600;
    color: #6366f1;
  }

  .de-heirs-total {
    display: flex;
    justify-content: space-between;
    padding: 10px 12px;
    margin-top: 4px;
    border-top: 2px solid var(--border-color, #e2e8f0);
    font-weight: 700;
    font-size: 13px;
    color: var(--text-primary, #0f172a);
  }

  /* ============================================================
    MODAL
    ============================================================ */
  .de-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 20px;
  }

  .de-modal {
    background: var(--card-bg, #ffffff);
    border-radius: 16px;
    max-width: 540px;
    width: 100%;
    max-height: 85vh;
    overflow: hidden;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
    border: 1px solid var(--border-color, #e2e8f0);
    display: flex;
    flex-direction: column;
  }

  .de-modal-header {
    padding: 18px 22px;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: var(--bg-secondary, #f8fafc);
    flex-shrink: 0;
  }

  .de-modal-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--text-primary, #0f172a);
    margin: 0;
  }

  .de-modal-subtitle {
    font-size: 12px;
    color: var(--text-secondary, #64748b);
    margin: 2px 0 0 0;
  }

  .de-modal-close {
    background: none;
    border: none;
    font-size: 20px;
    color: var(--text-secondary, #64748b);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s;
    line-height: 1;
  }

  .de-modal-close:hover {
    background: var(--border-color, #e2e8f0);
  }

  .de-modal-body {
    padding: 20px 22px;
    overflow-y: auto;
    flex: 1;
  }

  .de-modal-estate {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 18px;
  }

  .de-modal-estate-item {
    background: var(--bg-secondary, #f8fafc);
    border-radius: 8px;
    padding: 8px 10px;
    text-align: center;
    border: 1px solid var(--border-color, #e2e8f0);
  }

  .de-modal-estate-should-have {
    background: rgba(139, 92, 246, 0.08);
    border-color: rgba(139, 92, 246, 0.2);
  }

  .de-modal-estate-should-have .de-modal-estate-value {
    color: #8b5cf6;
  }

  .de-modal-estate-label {
    display: block;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: var(--text-secondary, #64748b);
  }

  .de-modal-estate-value {
    display: block;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary, #0f172a);
    margin-top: 2px;
  }

  .de-modal-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary, #64748b);
    margin: 0 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .de-modal-distribution {
    margin-top: 2px;
  }

  .de-modal-dist-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--bg-secondary, #f8fafc);
    margin-bottom: 4px;
    border: 1px solid var(--border-color, #e2e8f0);
  }

  .de-modal-dist-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .de-modal-dist-name {
    font-weight: 500;
    color: var(--text-primary, #0f172a);
    font-size: 12px;
  }

  .de-modal-dist-type {
    font-size: 7px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 1px 8px;
    border-radius: 10px;
  }

  .de-modal-dist-right {
    text-align: right;
  }

  .de-modal-dist-share {
    font-weight: 600;
    font-size: 12px;
    color: var(--text-primary, #0f172a);
  }

  .de-modal-dist-passed {
    font-size: 10px;
    color: var(--text-secondary, #64748b);
    margin-top: 2px;
  }

  .de-modal-footer {
    padding: 14px 22px;
    border-top: 1px solid var(--border-color, #e2e8f0);
    display: flex;
    justify-content: flex-end;
    background: var(--bg-secondary, #f8fafc);
    flex-shrink: 0;
  }

  .de-modal-btn {
    padding: 8px 22px;
    border-radius: 8px;
    border: none;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--border-color, #e2e8f0);
    color: var(--text-primary, #0f172a);
  }

  .de-modal-btn:hover {
    background: var(--hover-bg, #d1d5db);
  }

  /* ============================================================
    MODAL - ENHANCED
    ============================================================ */
  .de-modal-header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .de-modal-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }

  .de-modal-estate {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
  }

  .de-modal-estate-item {
    background: var(--bg-secondary, #f8fafc);
    border-radius: 10px;
    padding: 12px 14px;
    text-align: center;
    border: 1px solid var(--border-color, #e2e8f0);
    transition: all 0.2s ease;
  }

  .de-modal-estate-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .de-modal-estate-total {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.06));
    border-color: rgba(99, 102, 241, 0.2);
  }

  .de-modal-estate-total .de-modal-estate-value {
    color: #6366f1;
  }

  .de-modal-estate-should-have {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.06));
    border-color: rgba(139, 92, 246, 0.25);
  }

  .de-modal-estate-should-have .de-modal-estate-value {
    color: #8b5cf6;
  }

  .de-modal-estate-icon {
    font-size: 16px;
    margin-bottom: 2px;
  }

  .de-modal-estate-label {
    display: block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--text-secondary, #64748b);
    font-weight: 600;
  }

  .de-modal-estate-value {
    display: block;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary, #0f172a);
    margin-top: 2px;
  }

  .de-modal-estate-unit {
    font-size: 11px;
    font-weight: 400;
    color: var(--text-secondary, #64748b);
    margin-left: 2px;
  }

  .de-modal-section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary, #64748b);
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .de-modal-section-icon {
    font-size: 14px;
  }

  .de-modal-dist-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .de-modal-dist-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-radius: 10px;
    background: var(--bg-secondary, #f8fafc);
    border: 1px solid var(--border-color, #e2e8f0);
    transition: all 0.2s ease;
  }

  .de-modal-dist-item:hover {
    border-color: rgba(99, 102, 241, 0.2);
    background: var(--hover-bg, #f1f5f9);
  }

  .de-modal-dist-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .de-modal-dist-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .de-modal-dist-name {
    font-weight: 600;
    color: var(--text-primary, #0f172a);
    font-size: 13px;
  }

  .de-modal-dist-type {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 2px 10px;
    border-radius: 12px;
    margin-left: 6px;
  }

  .de-modal-dist-right {
    text-align: right;
    flex-shrink: 0;
  }

  .de-modal-dist-share {
    font-weight: 700;
    font-size: 14px;
    color: var(--text-primary, #0f172a);
  }

  .de-modal-dist-unit {
    font-size: 10px;
    font-weight: 400;
    color: var(--text-secondary, #64748b);
  }

  .de-modal-dist-passed {
    font-size: 11px;
    color: var(--text-secondary, #64748b);
    margin-top: 2px;
  }

  .de-modal-btn-close {
    background: var(--border-color, #e2e8f0);
    color: var(--text-primary, #0f172a);
    padding: 8px 24px;
    border-radius: 8px;
    border: none;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .de-modal-btn-close:hover {
    background: var(--hover-bg, #d1d5db);
  }

  /* ============================================================
    RESPONSIVE
    ============================================================ */
  @media (max-width: 1024px) {
    .de-results-grid {
      grid-template-columns: 1fr;
    }

    .de-timeline-list,
    .de-heirs-list {
      max-height: 280px;
    }
  }

  @media (max-width: 768px) {
    .de-header {
      flex-direction: column;
      align-items: stretch;
      padding: 14px 18px;
    }

    .de-header-top {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      flex-wrap: wrap;
    }

    .de-btn {
      width: 100%;
      justify-content: center;
      height: 40px;
      font-size: 14px;
      padding: 8px 20px;
    }

    .de-summary-grid {
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }

    .de-summary-card {
      padding: 8px 14px 8px 12px;
      min-height: 44px;
      min-width: 100px;
      border-radius: 10px;
    }

    .de-summary-icon {
      font-size: 18px;
    }

    .de-summary-value {
      font-size: 18px;
    }

    .de-summary-label {
      font-size: 9px;
    }

    .de-summary-unit {
      font-size: 9px;
    }

    .de-modal-estate {
      grid-template-columns: 1fr;
    }

    .de-modal {
      max-width: 100%;
      max-height: 95vh;
    }

    .de-heir-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .de-heir-share {
      text-align: left;
      width: 100%;
    }

    .de-modal-header-left {
      flex-wrap: wrap;
    }
  }

  @media (max-width: 480px) {
    .de-title {
      font-size: 18px;
    }

    .de-header {
      padding: 12px 14px;
    }

    .de-heir-name {
      font-size: 12px;
    }

    .de-timeline-item {
      flex-direction: column;
      gap: 4px;
    }

    .de-timeline-marker {
      width: 22px;
      height: 22px;
      font-size: 9px;
    }

    .de-modal-header {
      padding: 14px 16px;
    }

    .de-modal-body {
      padding: 14px 16px;
    }

    .de-modal-footer {
      padding: 10px 16px;
    }

    .de-modal-dist-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .de-modal-dist-right {
      text-align: left;
      width: 100%;
    }

    .de-summary-card {
      padding: 6px 12px 6px 10px;
      min-height: 38px;
      min-width: 80px;
      gap: 8px;
    }

    .de-summary-icon {
      font-size: 16px;
    }

    .de-summary-value {
      font-size: 16px;
    }

    .de-summary-label {
      font-size: 8px;
    }

    .de-summary-unit {
      font-size: 8px;
    }

    .de-btn {
      height: 36px;
      font-size: 13px;
      padding: 6px 16px;
    }
  }

  /* ============================================================
    DARK MODE SUPPORT
    ============================================================ */
  [data-theme="dark"] .de-wrapper {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --card-bg: #1e293b;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --border-color: #334155;
    --hover-bg: #334155;
  }

  /* ============================================================
   HEIRS LIST - EXPANDABLE
   ============================================================ */
.de-heir-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  border-radius: 10px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.de-heir-header:hover {
  background: var(--hover-bg, #f1f5f9);
}

.de-heir-card {
  background: var(--bg-secondary, #f8fafc);
  border-radius: 10px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  flex-shrink: 0;
  overflow: hidden;
}

.de-heir-card:hover {
  border-color: rgba(99, 102, 241, 0.1);
}

.de-heir-card.de-heir-expanded {
  border-color: rgba(99, 102, 241, 0.2);
  background: var(--bg-secondary, #f8fafc);
}

.de-heir-expand-icon {
  font-size: 10px;
  color: var(--text-secondary, #64748b);
  margin-left: 8px;
  transition: transform 0.3s ease;
}

.de-heir-source-preview {
  font-size: 10px;
  color: var(--text-secondary, #64748b);
}

.de-source-preview-text {
  background: var(--bg-secondary, #f1f5f9);
  padding: 0 8px;
  border-radius: 4px;
  font-size: 9px;
  color: var(--text-secondary, #64748b);
}

/* ============================================================
   AUDIT TRAIL - CLEAN TABLE LAYOUT
   ============================================================ */
.de-heir-audit-trail {
  padding: 12px 16px 16px 16px;
  border-top: 1px solid var(--border-color, #e2e8f0);
  margin-top: 4px;
  overflow: hidden;
}

.de-audit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0 12px 0;
  font-size: 13px;
  border-bottom: 2px solid var(--border-color, #e2e8f0);
  margin-bottom: 12px;
}

.de-audit-title {
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  font-size: 14px;
}

.de-audit-total {
  font-weight: 700;
  color: #6366f1;
  font-size: 14px;
  background: rgba(99, 102, 241, 0.08);
  padding: 4px 16px;
  border-radius: 6px;
}

.de-audit-table {
  background: var(--card-bg, #ffffff);
  border-radius: 10px;
  border: 1px solid var(--border-color, #e2e8f0);
  overflow: hidden;
  width: 100%;
}

.de-audit-header-row {
  display: table-row;
  background: var(--bg-secondary, #f8fafc);
  border-bottom: 2px solid var(--border-color, #e2e8f0);
}

.de-audit-header-row .de-audit-col-source,
.de-audit-header-row .de-audit-col-amount,
.de-audit-header-row .de-audit-col-type {
  display: table-cell;
  padding: 10px 16px;
  font-weight: 700;
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.de-audit-row {
  display: table-row;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.de-audit-row:last-child {
  border-bottom: none;
}

.de-audit-row:hover {
  background: var(--hover-bg, #f1f5f9);
}

.de-audit-row .de-audit-col-source,
.de-audit-row .de-audit-col-amount,
.de-audit-row .de-audit-col-type {
  display: table-cell;
  padding: 10px 16px;
  vertical-align: middle;
}

.de-audit-col-source {
  color: var(--text-primary, #0f172a);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  min-width: 120px;
}

.de-audit-col-amount {
  color: var(--text-primary, #0f172a);
  font-weight: 700;
  font-size: 14px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  min-width: 100px;
}

.de-audit-col-type {
  display: table-cell;
  padding: 10px 16px;
  vertical-align: middle;
  white-space: nowrap;
  min-width: 80px;
}

.de-audit-type-badge {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 4px 14px;
  border-radius: 12px;
  background: rgba(99, 102, 241, 0.08);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.15);
  display: inline-block;
  white-space: nowrap;
}

.de-audit-total-row {
  display: table-row;
  background: rgba(99, 102, 241, 0.05);
  border-top: 2px solid var(--border-color, #e2e8f0);
}

.de-audit-total-row .de-audit-col-source,
.de-audit-total-row .de-audit-col-amount,
.de-audit-total-row .de-audit-col-type {
  display: table-cell;
  padding: 12px 16px;
  vertical-align: middle;
}

.de-audit-total-row .de-audit-col-source {
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.de-audit-total-row .de-audit-col-amount {
  color: #6366f1;
  font-size: 15px;
  font-weight: 700;
  text-align: right;
}

.de-audit-source-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.de-audit-source-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.de-audit-source-text {
  font-weight: 500;
}

.de-audit-amount-value {
  font-weight: 700;
}

.de-audit-amount-unit {
  font-size: 10px;
  font-weight: 400;
  color: var(--text-secondary, #64748b);
  margin-left: 3px;
}

.de-audit-empty {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
}

/* Dark mode support */
[data-theme="dark"] .de-audit-table {
  background: var(--bg-secondary, #1e293b);
}

[data-theme="dark"] .de-audit-header-row {
  background: var(--bg-primary, #0f172a);
}

[data-theme="dark"] .de-audit-total-row {
  background: rgba(99, 102, 241, 0.08);
}

[data-theme="dark"] .de-audit-type-badge {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.25);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .de-audit-col-source {
    font-size: 12px;
    min-width: 80px;
  }
  
  .de-audit-col-amount {
    font-size: 12px;
    min-width: 70px;
  }
  
  .de-audit-col-type {
    min-width: 60px;
  }
  
  .de-audit-type-badge {
    font-size: 8px;
    padding: 3px 10px;
  }
}

@media (max-width: 480px) {
  .de-heir-audit-trail {
    padding: 8px 10px 12px 10px;
  }
  
  /* Stack vertically on very small screens */
  .de-audit-row {
    display: flex;
    flex-direction: column;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
  }
  
  .de-audit-row .de-audit-col-source,
  .de-audit-row .de-audit-col-amount,
  .de-audit-row .de-audit-col-type {
    display: flex;
    padding: 2px 0;
    white-space: normal;
  }
  
  .de-audit-header-row {
    display: none;
  }
  
  .de-audit-total-row {
    display: flex;
    flex-direction: row;
    padding: 10px 12px;
    justify-content: space-between;
  }
  
  .de-audit-total-row .de-audit-col-source,
  .de-audit-total-row .de-audit-col-amount,
  .de-audit-total-row .de-audit-col-type {
    display: flex;
    padding: 0;
  }
  
  .de-audit-col-source {
    font-size: 12px;
    min-width: auto;
  }
  
  .de-audit-col-amount {
    font-size: 12px;
    text-align: left;
    min-width: auto;
  }
  
  .de-audit-col-type {
    min-width: auto;
  }
  
  .de-audit-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .de-audit-total {
    font-size: 12px;
    padding: 3px 12px;
  }
}
`}</style>
    </div>
  );
};

export default DivisionEngine;