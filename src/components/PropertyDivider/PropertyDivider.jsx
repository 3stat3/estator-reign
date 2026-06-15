import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const PropertyDivider = () => {
  const { darkMode } = useAuth();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const [decedents, setDecedents] = useState(() => {
    const saved = localStorage.getItem('propertyDividerData');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedAuditTrail, setSelectedAuditTrail] = useState(null);
  const [editingPerson, setEditingPerson] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [inheritanceResult, setInheritanceResult] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inheritanceSummary, setInheritanceSummary] = useState([]);
  
  // Track all inheritance transfers (who got what from whom)
  const [inheritanceTransfers, setInheritanceTransfers] = useState([]);
  
  useEffect(() => {
    localStorage.setItem('propertyDividerData', JSON.stringify(decedents));
    calculateAllInheritances();
  }, [decedents]);
  
  const [personForm, setPersonForm] = useState({
    name: '',
    dod: '',
    gender: 'Male',
    spouseId: null,
    parentId: null,
    isDeceased: false
  });
  
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    type: 'Land',
    totalSqm: '',
    classification: 'Conjugal'
  });

  // Format number with commas
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const clearAllData = () => {
    localStorage.removeItem('propertyDividerData');
    setDecedents([]);
    setSelectedPerson(null);
    setInheritanceResult(null);
    setInheritanceSummary([]);
    setInheritanceTransfers([]);
    setShowClearConfirm(false);
  };

  const getChildrenForPerson = (personId) => {
    const person = decedents.find(p => p.id === personId);
    if (!person) return [];
    
    const directChildren = decedents.filter(p => p.parentId === personId);
    const spouseChildren = person.spouseId 
      ? decedents.filter(p => p.parentId === person.spouseId)
      : [];
    
    const allChildren = [...directChildren, ...spouseChildren];
    const uniqueChildren = allChildren.filter((child, index, self) => 
      self.findIndex(c => c.id === child.id) === index
    );
    
    return uniqueChildren;
  };

  // Get living descendants for representation
  const getLivingDescendantsForRepresentation = (personId, allPersons) => {
    const descendants = [];
    const children = allPersons.filter(p => p.parentId === personId);
    
    for (const child of children) {
      if (!child.dod) {
        descendants.push({ ...child, represents: child.parentId === personId ? null : null });
      } else {
        const grandDescendants = getLivingDescendantsForRepresentation(child.id, allPersons);
        descendants.push(...grandDescendants.map(d => ({ ...d, represents: child.name })));
      }
    }
    return descendants;
  };

  // Check if a pre-deceased child has living descendants who can represent them
  const hasLivingDescendants = (personId, allPersons) => {
    const children = allPersons.filter(p => p.parentId === personId);
    for (const child of children) {
      if (!child.dod) return true;
      if (hasLivingDescendants(child.id, allPersons)) return true;
    }
    return false;
  };

  // Get eligible heirs for a decedent (including representatives)
  const getEligibleHeirsForDecedent = (decedent, allPersons, spouse) => {
    const children = allPersons.filter(p => p.parentId === decedent.id);
    const eligibleHeirs = [];
    
    // Add surviving spouse
    if (spouse && !spouse.dod) {
      eligibleHeirs.push({ 
        ...spouse, 
        relationship: 'Spouse', 
        isRepresentative: false, 
        represents: null,
        originalShare: null
      });
    }
    
    // Process children
    for (const child of children) {
      if (!child.dod) {
        // Living child - direct heir
        eligibleHeirs.push({ 
          ...child, 
          relationship: 'Child', 
          isRepresentative: false, 
          represents: null,
          originalShare: null
        });
      } else if (hasLivingDescendants(child.id, allPersons)) {
        // Pre-deceased child WITH living descendants - representation applies
        const representatives = getLivingDescendantsForRepresentation(child.id, allPersons);
        representatives.forEach(rep => {
          eligibleHeirs.push({ 
            ...rep, 
            relationship: 'Grandchild', 
            isRepresentative: true, 
            represents: child.name,
            originalShare: null
          });
        });
      }
      // Pre-deceased child WITHOUT living descendants - EXCLUDED completely
    }
    
    return eligibleHeirs;
  };

  // Get ascendants (parents/grandparents) when no descendants exist
  const getAscendantsForSuccession = (person, allPersons) => {
    const ascendants = [];
    let currentParentId = person.parentId;
    
    while (currentParentId) {
      const parent = allPersons.find(p => p.id === currentParentId);
      if (parent && !parent.dod) {
        ascendants.push({ ...parent, relationship: 'Parent', isRepresentative: false, represents: null });
        break;
      }
      currentParentId = parent?.parentId || null;
    }
    
    return ascendants;
  };

  // Get collateral heirs (siblings and their representatives) when no ascendants
  const getCollateralHeirs = (person, allPersons) => {
    if (!person.parentId) return [];
    
    const siblings = allPersons.filter(p => p.parentId === person.parentId && p.id !== person.id);
    const result = [];
    
    for (const sibling of siblings) {
      if (!sibling.dod) {
        result.push({ 
          ...sibling, 
          relationship: 'Sibling', 
          isRepresentative: false, 
          represents: null,
          originalShare: null
        });
      } else if (hasLivingDescendants(sibling.id, allPersons)) {
        const reps = getLivingDescendantsForRepresentation(sibling.id, allPersons);
        reps.forEach(rep => {
          result.push({ 
            ...rep, 
            relationship: 'Nephew/Niece', 
            isRepresentative: true, 
            represents: sibling.name,
            originalShare: null
          });
        });
      }
    }
    
    return result;
  };

  // Calculate person's total assets (including inherited)
  const calculatePersonTotalAssets = (personId, transfers) => {
    const person = decedents.find(p => p.id === personId);
    if (!person) return { conjugalShare: 0, exclusiveTotal: 0, inheritedTotal: 0, ocsTotal: 0 };
    
    // Get inherited amounts for this person
    const inheritedAmount = transfers
      .filter(t => t.toPersonId === personId)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate own conjugal share (50% of conjugal properties they are part of)
    let ownConjugalShare = 0;
    let ownExclusiveTotal = 0;
    let totalConjugalFull = 0;
    
    // Properties directly owned by this person
    (person.properties || []).forEach(prop => {
      if (prop.classification === 'Conjugal') {
        ownConjugalShare += prop.totalSqm / 2;
        totalConjugalFull += prop.totalSqm;
      } else if (prop.classification === 'Exclusive') {
        ownExclusiveTotal += prop.totalSqm;
      }
    });
    
    // Add conjugal share from spouse (if any)
    const spouse = decedents.find(p => p.id === person.spouseId);
    if (spouse) {
      (spouse.properties || []).forEach(prop => {
        if (prop.classification === 'Conjugal') {
          ownConjugalShare += prop.totalSqm / 2;
          totalConjugalFull += prop.totalSqm;
        }
      });
    }
    
    // Determine OCS total based on death status and order
    let ocsTotal;
    if (!person.dod) {
      // Living person: OCS = conjugal share + exclusive + inherited
      ocsTotal = ownConjugalShare + ownExclusiveTotal + inheritedAmount;
    } else {
      // Check if this person is the first to die in their couple
      const spouse = decedents.find(p => p.id === person.spouseId);
      const isFirstToDie = !spouse?.dod || (person.dod && spouse.dod && new Date(person.dod) < new Date(spouse.dod));
      
      if (isFirstToDie) {
        // First to die: OCS = TOTAL conjugal (full) + TOTAL exclusive (full)
        ocsTotal = totalConjugalFull + ownExclusiveTotal;
      } else {
        // Second to die: OCS = conjugal share + exclusive + inherited
        ocsTotal = ownConjugalShare + ownExclusiveTotal + inheritedAmount;
      }
    }
    
    return {
      conjugalShare: ownConjugalShare,
      exclusiveTotal: ownExclusiveTotal,
      inheritedTotal: inheritedAmount,
      ocsTotal: ocsTotal,
      totalConjugalFull: totalConjugalFull
    };
  };

  // Process inheritance for a single decedent
  const processDecedentInheritance = (decedent, allPersons, transfers) => {
    const spouse = allPersons.find(p => p.id === decedent.spouseId);
    const assets = calculatePersonTotalAssets(decedent.id, transfers);
    
    // Calculate total hereditary estate (what gets distributed)
    let conjugalShareToSpouse = 0;
    let hereditaryEstate = assets.exclusiveTotal; // Start with exclusive properties
    
    // Add decedent's conjugal share (50% of conjugal properties)
    hereditaryEstate += assets.conjugalShare;
    
    // If spouse is alive, spouse gets the other 50% conjugal share automatically
    if (spouse && !spouse.dod) {
      conjugalShareToSpouse = assets.totalConjugalFull - assets.conjugalShare;
    }
    
    // Get eligible heirs
    let eligibleHeirs = getEligibleHeirsForDecedent(decedent, allPersons, spouse);
    
    // If no spouse and no children/descendants, check ascendants
    if (eligibleHeirs.length === 0) {
      const ascendants = getAscendantsForSuccession(decedent, allPersons);
      if (ascendants.length > 0) {
        eligibleHeirs = ascendants;
      }
    }
    
    // If still no heirs, check collateral (siblings)
    if (eligibleHeirs.length === 0) {
      const collateral = getCollateralHeirs(decedent, allPersons);
      if (collateral.length > 0) {
        eligibleHeirs = collateral;
      }
    }
    
    // If still no heirs, return empty
    if (eligibleHeirs.length === 0) {
      return {
        decedentId: decedent.id,
        decedentName: decedent.name,
        conjugalShareToSpouse: conjugalShareToSpouse,
        hereditaryEstate: hereditaryEstate,
        heirs: [],
        distributionType: 'No Heirs Found',
        propertyDetails: decedent.properties,
        transfers: []
      };
    }
    
    // Distribute hereditary estate equally among eligible heirs
    const sharePerHeir = hereditaryEstate / eligibleHeirs.length;
    const newTransfers = [];
    const heirsWithShares = [];
    
    eligibleHeirs.forEach(heir => {
      const totalShare = sharePerHeir;
      newTransfers.push({
        fromPersonId: decedent.id,
        fromPersonName: decedent.name,
        toPersonId: heir.id,
        toPersonName: heir.name,
        amount: totalShare,
        relationship: heir.relationship,
        represents: heir.represents,
        isRepresentative: heir.isRepresentative
      });
      
      heirsWithShares.push({
        id: heir.id,
        name: heir.name,
        relationship: heir.relationship,
        share: sharePerHeir,
        conjugalShare: 0,
        totalShare: totalShare,
        represents: heir.represents,
        isRepresentative: heir.isRepresentative
      });
    });
    
    return {
      decedentId: decedent.id,
      decedentName: decedent.name,
      decedentDod: decedent.dod,
      conjugalShareToSpouse: conjugalShareToSpouse,
      hereditaryEstate: hereditaryEstate,
      totalEstate: conjugalShareToSpouse + hereditaryEstate,
      heirs: heirsWithShares,
      distributionType: 'Legal Succession',
      propertyDetails: decedent.properties,
      transfers: newTransfers
    };
  };

  // Main inheritance calculation - processes deaths in chronological order
  const calculateAllInheritances = () => {
    // Sort deceased by date of death (oldest first)
    const deceased = decedents
      .filter(p => p.dod && p.isDeceased)
      .sort((a, b) => new Date(a.dod) - new Date(b.dod));
    
    let allTransfers = [];
    const inheritanceRecords = [];
    
    for (const decedent of deceased) {
      const result = processDecedentInheritance(decedent, decedents, allTransfers);
      
      // Add any new transfers from this decedent
      if (result.transfers && result.transfers.length > 0) {
        allTransfers = [...allTransfers, ...result.transfers];
      }
      
      inheritanceRecords.push(result);
    }
    
    setInheritanceTransfers(allTransfers);
    setInheritanceSummary(inheritanceRecords);
    
    // Update selected person if needed
    if (selectedPerson) {
      updateSelectedPersonData(selectedPerson.id, inheritanceRecords, allTransfers);
    }
  };
  
  const updateSelectedPersonData = (personId, records, transfers) => {
    const person = decedents.find(p => p.id === personId);
    if (!person) return;
    
    const assets = calculatePersonTotalAssets(personId, transfers);
    const inheritedProperties = transfers
      .filter(t => t.toPersonId === personId)
      .map(t => ({
        sourceDecedent: t.fromPersonName,
        sourceDod: decedents.find(p => p.id === t.fromPersonId)?.dod || '',
        share: t.amount,
        totalShare: t.amount,
        relationship: t.relationship,
        represents: t.represents,
        distributionType: 'Legal Succession'
      }));
    
    let heirs = [];
    if (person.isDeceased) {
      const decedentRecord = records.find(r => r.decedentId === personId);
      if (decedentRecord) {
        heirs = decedentRecord.heirs;
      }
    }
    
    setInheritanceResult({
      assets: assets,
      inheritedProperties: inheritedProperties,
      heirs: heirs,
      isLiving: !person.isDeceased,
      conjugalShareToSpouse: person.isDeceased ? records.find(r => r.decedentId === personId)?.conjugalShareToSpouse || 0 : 0
    });
  };

  const handleSelectPerson = (person) => {
    setSelectedPerson(person);
    updateSelectedPersonData(person.id, inheritanceSummary, inheritanceTransfers);
  };

  const addNewPerson = () => {
    setEditingPerson(null);
    setPersonForm({
      name: '',
      dod: '',
      gender: 'Male',
      spouseId: null,
      parentId: null,
      isDeceased: false
    });
    setShowPersonModal(true);
  };

  const savePerson = () => {
    if (!personForm.name.trim()) {
      alert('Please enter a name');
      return;
    }
    
    const newPersonId = editingPerson?.id || Date.now();
    const newPerson = {
      id: newPersonId,
      name: personForm.name,
      dod: personForm.dod || null,
      gender: personForm.gender,
      spouseId: personForm.spouseId,
      parentId: personForm.parentId,
      isDeceased: !!personForm.dod,
      properties: editingPerson?.properties || [],
      heirs: editingPerson?.heirs || []
    };
    
    let updatedDecedents;
    
    if (editingPerson) {
      updatedDecedents = decedents.map(p => p.id === editingPerson.id ? newPerson : p);
    } else {
      updatedDecedents = [...decedents, newPerson];
    }
    
    if (newPerson.spouseId) {
      updatedDecedents = updatedDecedents.map(p => {
        if (p.id === newPerson.spouseId) {
          return { ...p, spouseId: newPerson.id };
        }
        return p;
      });
    }
    
    if (editingPerson && editingPerson.spouseId !== newPerson.spouseId) {
      if (editingPerson.spouseId) {
        updatedDecedents = updatedDecedents.map(p => {
          if (p.id === editingPerson.spouseId && p.spouseId === editingPerson.id) {
            return { ...p, spouseId: null };
          }
          return p;
        });
      }
    }
    
    setDecedents(updatedDecedents);
    setShowPersonModal(false);
  };

  const addPropertyToPerson = () => {
    if (!selectedPerson) return;
    setEditingProperty(null);
    setPropertyForm({ name: '', type: 'Land', totalSqm: '', classification: 'Conjugal' });
    setShowPropertyModal(true);
  };

  const saveProperty = () => {
    if (!propertyForm.name.trim() || !propertyForm.totalSqm) {
      alert('Please fill all property fields');
      return;
    }
    
    const newProperty = {
      id: editingProperty?.id || Date.now(),
      name: propertyForm.name,
      type: propertyForm.type,
      totalSqm: parseFloat(propertyForm.totalSqm),
      classification: propertyForm.classification
    };
    
    let updatedDecedents = decedents.map(p => {
      if (p.id === selectedPerson.id) {
        let properties = [...(p.properties || [])];
        if (editingProperty) {
          properties = properties.map(prop => prop.id === editingProperty.id ? newProperty : prop);
        } else {
          properties.push(newProperty);
        }
        return { ...p, properties };
      }
      return p;
    });
    
    setDecedents(updatedDecedents);
    setShowPropertyModal(false);
  };

  const deleteProperty = (propertyId) => {
    if (window.confirm('Remove this property?')) {
      let updatedDecedents = decedents.map(p => {
        if (p.id === selectedPerson.id) {
          return { ...p, properties: p.properties.filter(prop => prop.id !== propertyId) };
        }
        return p;
      });
      
      setDecedents(updatedDecedents);
    }
  };

  const filteredPersons = decedents.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedDecedents = [...filteredPersons].sort((a, b) => {
    if (!a.dod && !b.dod) return 0;
    if (!a.dod) return 1;
    if (!b.dod) return -1;
    return new Date(a.dod) - new Date(b.dod);
  });

  // Render Person Card Content
  const PersonCardContent = ({ person }) => {
    const assets = inheritanceResult?.assets || { conjugalShare: 0, exclusiveTotal: 0, inheritedTotal: 0, ocsTotal: 0, totalConjugalFull: 0 };
    const isDeceased = person.isDeceased;
    const spouse = decedents.find(p => p.id === person.spouseId);
    
    // Get conjugal properties (full amounts) that this person is part of
    const conjugalProperties = [];
    const exclusiveProperties = [];
    
    // Person's own properties
    (person.properties || []).forEach(prop => {
      if (prop.classification === 'Conjugal') {
        conjugalProperties.push({ ...prop, ownershipType: 'Own' });
      } else {
        exclusiveProperties.push({ ...prop, ownershipType: 'Own' });
      }
    });
    
    // Spouse's conjugal properties (if any)
    if (spouse) {
      (spouse.properties || []).forEach(prop => {
        if (prop.classification === 'Conjugal' && !conjugalProperties.some(p => p.id === prop.id)) {
          conjugalProperties.push({ ...prop, ownershipType: 'From Spouse' });
        }
      });
    }
    
    // Add inherited properties to exclusive section
    const inheritedProps = inheritanceResult?.inheritedProperties || [];
    inheritedProps.forEach(inv => {
      exclusiveProperties.push({
        name: `Share from ${inv.sourceDecedent}'s property`,
        type: 'Inheritance',
        totalSqm: inv.totalShare,
        classification: 'Inherited',
        ownershipType: 'Inherited',
        inheritedFrom: inv.sourceDecedent
      });
    });
    
    return (
      <div>
        {/* Properties Section */}
        <div style={{
          background: darkMode ? 'rgba(30, 35, 50, 0.8)' : 'white',
          borderRadius: '20px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: darkMode ? '#fff' : '#1a1a2e' }}>
            📋 Properties
          </h3>
          
          {/* Conjugal Properties */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#10b981' }}>
              Conjugal Properties:
            </div>
            {conjugalProperties.length === 0 ? (
              <div style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', padding: '8px 0' }}>None</div>
            ) : (
              conjugalProperties.map((prop, idx) => (
                <div key={idx} style={{
                  padding: '8px 12px',
                  background: darkMode ? 'rgba(0,0,0,0.3)' : '#f8f9ff',
                  borderRadius: '12px',
                  marginBottom: '6px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '13px', color: darkMode ? '#fff' : '#1a1a2e' }}>
                    {prop.name} {prop.ownershipType === 'From Spouse' && `(from ${spouse?.name})`}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>
                    {formatNumber(prop.totalSqm)} m²
                  </span>
                </div>
              ))
            )}
            
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
                Total Share from conjugal property:
              </span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>
                {formatNumber(assets.conjugalShare)} m²
              </span>
            </div>
          </div>
          
          {/* Exclusive Properties */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#667eea' }}>
              Exclusive Properties:
            </div>
            {exclusiveProperties.length === 0 ? (
              <div style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', padding: '8px 0' }}>None</div>
            ) : (
              exclusiveProperties.map((prop, idx) => (
                <div key={idx} style={{
                  padding: '8px 12px',
                  background: darkMode ? 'rgba(0,0,0,0.3)' : '#f8f9ff',
                  borderRadius: '12px',
                  marginBottom: '6px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontSize: '13px', color: darkMode ? '#fff' : '#1a1a2e' }}>
                      {prop.name}
                    </span>
                    {prop.inheritedFrom && (
                      <div style={{ fontSize: '10px', color: '#f59e0b' }}>(inherited from {prop.inheritedFrom})</div>
                    )}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#667eea' }}>
                    {formatNumber(prop.totalSqm)} m²
                  </span>
                </div>
              ))
            )}
          </div>
          
          {/* OCS Total */}
          <div style={{
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15))',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
              Total Property to appear in OCS:
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>
              {formatNumber(assets.ocsTotal)} m²
            </span>
          </div>
        </div>
        
        {/* Heirs Section - Only for Deceased */}
        {isDeceased && inheritanceResult?.heirs && inheritanceResult.heirs.length > 0 && (
          <div style={{
            background: darkMode ? 'rgba(30, 35, 50, 0.8)' : 'white',
            borderRadius: '20px',
            padding: '16px',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: darkMode ? '#fff' : '#1a1a2e' }}>
              👥 Heirs
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
                    <th style={{ textAlign: 'left', padding: '10px 8px', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '11px', fontWeight: 600 }}>Heir</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '11px', fontWeight: 600 }}>Share from the property</th>
                  </tr>
                </thead>
                <tbody>
                  {inheritanceResult.heirs.map((heir, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{ fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}>
                          {heir.relationship === 'Spouse' ? '💑' : heir.relationship === 'Child' ? '👶' : '👧'} {heir.name}
                        </span>
                        {heir.represents && (
                          <div style={{ fontSize: '9px', color: '#f59e0b' }}>(rep. {heir.represents})</div>
                        )}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, color: '#667eea' }}>
                        {formatNumber(heir.totalShare)} m²
                      </td>
                    </tr>
                  ))}
                </tbody>
                {inheritanceResult.heirs.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: `2px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>Total:</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>
                        {formatNumber(inheritanceResult.heirs.reduce((sum, h) => sum + h.totalShare, 0))} m²
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
        
        {isDeceased && (!inheritanceResult?.heirs || inheritanceResult.heirs.length === 0) && (
          <div style={{
            background: darkMode ? 'rgba(30, 35, 50, 0.8)' : 'white',
            borderRadius: '20px',
            padding: '16px',
            textAlign: 'center',
            color: '#ef4444'
          }}>
            No eligible heirs found
          </div>
        )}
        
        {!isDeceased && (
          <div style={{
            background: darkMode ? 'rgba(30, 35, 50, 0.8)' : 'white',
            borderRadius: '20px',
            padding: '16px',
            textAlign: 'center',
            color: darkMode ? '#94a3b8' : '#64748b'
          }}>
            ⏳ Heirs will be shown upon death
          </div>
        )}
      </div>
    );
  };

  const LeftPanel = () => (
    <div style={{
      width: isMobile ? '100%' : '380px',
      height: isMobile && !isMobileMenuOpen ? '0px' : '100%',
      overflow: isMobile && !isMobileMenuOpen ? 'hidden' : 'auto',
      background: darkMode 
        ? 'rgba(18, 22, 28, 0.95)' 
        : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRight: isMobile ? 'none' : `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: isMobile ? 'fixed' : 'relative',
      top: 0,
      left: 0,
      zIndex: 100,
      transform: isMobile && !isMobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)',
      transition: 'transform 0.3s ease-in-out',
      boxShadow: isMobile && isMobileMenuOpen ? '2px 0 8px rgba(0,0,0,0.15)' : 'none'
    }}>
      <div style={{ padding: '20px' }}>
        {isMobile && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '10px',
            borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
          }}>
            <div style={{ fontSize: '20px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
              Persons List
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: darkMode ? '#fff' : '#1a1a2e'
              }}
            >
              ✕
            </button>
          </div>
        )}
        
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '16px',
            borderRadius: '20px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '2px' }}>
                  Total Persons
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>
                  {decedents.length}
                </div>
              </div>
              <div style={{ fontSize: '40px' }}>⚖️</div>
            </div>
          </div>
          
          <button
            onClick={addNewPerson}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '40px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)'
            }}
          >
            + Add New Person
          </button>
        </div>
        
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search persons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              paddingLeft: '36px',
              background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              borderRadius: '40px',
              fontSize: '14px',
              color: darkMode ? '#fff' : '#1a1a2e',
              outline: 'none'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '14px'
          }}>🔍</span>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px',
          padding: '0 4px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: darkMode ? '#94a3b8' : '#64748b' }}>
            {sortedDecedents.length} person{sortedDecedents.length !== 1 ? 's' : ''}
          </div>
          {decedents.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{
                padding: '4px 12px',
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '40px',
                fontSize: '10px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Clear All
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AnimatePresence>
            {sortedDecedents.map(person => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleSelectPerson(person)}
                style={{
                  padding: '12px',
                  background: selectedPerson?.id === person.id 
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15))'
                    : darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderRadius: '16px',
                  border: `1px solid ${selectedPerson?.id === person.id 
                    ? 'rgba(102, 126, 234, 0.5)'
                    : darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '20px',
                    background: person.gender === 'Male' 
                      ? 'linear-gradient(135deg, #1e3a5f, #0f2b45)'
                      : 'linear-gradient(135deg, #8b1a4a, #5c0d32)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    {person.gender === 'Male' ? '👨' : '👩'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: darkMode ? '#fff' : '#1a1a2e', marginBottom: '2px' }}>
                      {person.name}
                    </div>
                    <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                      {person.dod ? `⚰️ ${person.dod}` : 'Still alive'}
                    </div>
                  </div>
                  {person.properties?.length > 0 && (
                    <div style={{
                      background: 'rgba(102, 126, 234, 0.15)',
                      color: '#667eea',
                      borderRadius: '20px',
                      padding: '2px 8px',
                      fontSize: '10px',
                      fontWeight: 600
                    }}>
                      {person.properties.length} 🏠
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {decedents.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '40px 20px' }}
          >
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🏛️</div>
            <h3 style={{ color: darkMode ? '#fff' : '#1a1a2e', marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>Welcome to Property Divider</h3>
            <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '12px', lineHeight: '1.5' }}>
              Click "Add New Person" to start<br />
              building your estate plan
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );

  const RightPanel = () => (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      background: darkMode ? '#0a0c10' : '#f0f2f5',
      padding: isMobile ? '16px' : '28px'
    }}>
      {isMobile && !isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 200,
            width: '56px',
            height: '56px',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ☰
        </button>
      )}
      
      <AnimatePresence mode="wait">
        {selectedPerson ? (
          <motion.div
            key={selectedPerson.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header Card */}
            <div style={{
              background: darkMode 
                ? 'linear-gradient(135deg, #1a1e2e 0%, #0f1220 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
              borderRadius: '24px',
              padding: '20px',
              marginBottom: '20px',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
              boxShadow: darkMode ? 'none' : '0 8px 32px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: isMobile ? '60px' : '80px',
                    height: isMobile ? '60px' : '80px',
                    borderRadius: '30px',
                    background: selectedPerson.gender === 'Male' 
                      ? 'linear-gradient(135deg, #667eea, #764ba2)'
                      : 'linear-gradient(135deg, #f093fb, #f5576c)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? '30px' : '40px',
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                    flexShrink: 0
                  }}>
                    {selectedPerson.gender === 'Male' ? '👨' : '👩'}
                  </div>
                  <div>
                    <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 700, color: darkMode ? '#fff' : '#1a1a2e', marginBottom: '6px' }}>
                      {selectedPerson.name}
                    </h1>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '12px' }}>⚰️</span>
                        <span style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                          {selectedPerson.dod || 'Still alive'}
                        </span>
                      </div>
                      {selectedPerson.spouseId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '12px' }}>💍</span>
                          <span style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                            Spouse of {decedents.find(p => p.id === selectedPerson.spouseId)?.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingPerson(selectedPerson);
                    setPersonForm({
                      name: selectedPerson.name,
                      dod: selectedPerson.dod || '',
                      gender: selectedPerson.gender,
                      spouseId: selectedPerson.spouseId,
                      parentId: selectedPerson.parentId,
                      isDeceased: selectedPerson.isDeceased
                    });
                    setShowPersonModal(true);
                  }}
                  style={{
                    padding: '8px 20px',
                    background: 'transparent',
                    border: `1.5px solid ${darkMode ? 'rgba(102, 126, 234, 0.5)' : '#667eea'}`,
                    borderRadius: '40px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#667eea',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  ✏️ Edit Profile
                </button>
              </div>
            </div>
            
            {/* Person Card Content */}
            <PersonCardContent person={selectedPerson} />
            
            {/* Add Property Button for Living Persons */}
            {!selectedPerson.isDeceased && (
              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={addPropertyToPerson}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '40px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + Add Property
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'calc(100vh - 40px)',
              textAlign: 'center',
              padding: '20px'
            }}
          >
            <div>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>🏛️</div>
              <h2 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 600, marginBottom: '10px', color: darkMode ? '#fff' : '#1a1a2e' }}>Select a Person</h2>
              <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>
                Click on any person from the left panel to view<br />
                their properties and inheritance details.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      background: darkMode ? '#0a0c10' : '#f0f2f5',
      borderRadius: isMobile ? '0' : '28px',
      overflow: 'hidden',
      fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative'
    }}>
      {isMobile && isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99
          }}
        />
      )}
      
      <LeftPanel />
      <RightPanel />
      
      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(8px)', padding: '16px' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: darkMode ? '#1e1e2e' : '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              width: '400px',
              maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '10px', color: darkMode ? '#fff' : '#1a1a2e' }}>Clear All Data?</h3>
              <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
                This action cannot be undone. All persons, properties, and inheritance data will be permanently deleted.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                  borderRadius: '40px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: darkMode ? '#fff' : '#1a1a2e'
                }}
              >
                Cancel
              </button>
              <button
                onClick={clearAllData}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '40px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Yes, Clear Everything
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Add/Edit Person Modal */}
      {showPersonModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: darkMode ? '#1e1e2e' : '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              width: '500px',
              maxWidth: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}
          >
            <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
              {editingPerson ? 'Edit Person' : 'Add New Person'}
            </h3>
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>Full Name *</label>
            <input type="text" placeholder="e.g., Juan Dela Cruz" value={personForm.name} onChange={(e) => setPersonForm({...personForm, name: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px' }} />
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>⚰️ Date of Death (leave blank if still alive)</label>
            <input type="date" value={personForm.dod} onChange={(e) => setPersonForm({...personForm, dod: e.target.value, isDeceased: !!e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }} />
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>Gender</label>
            <select value={personForm.gender} onChange={(e) => setPersonForm({...personForm, gender: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>💍 Spouse (if married)</label>
            <select value={personForm.spouseId || ''} onChange={(e) => setPersonForm({...personForm, spouseId: e.target.value ? parseInt(e.target.value) : null})} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }}>
              <option value="">No Spouse / Select Spouse</option>
              {decedents.filter(p => p.id !== (editingPerson?.id || 0) && p.gender !== personForm.gender).map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.dod ? '(Deceased)' : '(Alive)'}</option>
              ))}
            </select>
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>👪 Parent (who is the father/mother of this person?)</label>
            <select value={personForm.parentId || ''} onChange={(e) => setPersonForm({...personForm, parentId: e.target.value ? parseInt(e.target.value) : null})} style={{ width: '100%', padding: '12px', marginBottom: '20px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }}>
              <option value="">No Parent / Select Parent</option>
              {decedents.filter(p => p.id !== (editingPerson?.id || 0)).map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.dod ? '(Deceased)' : '(Alive)'}</option>
              ))}
            </select>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
              <button onClick={() => setShowPersonModal(false)} style={{ padding: '10px 20px', cursor: 'pointer', background: 'transparent', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '40px', fontSize: '13px', fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}>Cancel</button>
              <button onClick={savePerson} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '40px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Save Person</button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Add Property Modal */}
      {showPropertyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: darkMode ? '#1e1e2e' : '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              width: '450px',
              maxWidth: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}
          >
            <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
              {editingProperty ? 'Edit Property' : 'Add Property'}
            </h3>
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>Property Name</label>
            <input type="text" placeholder="e.g., Family Home, Lot A" value={propertyForm.name} onChange={(e) => setPropertyForm({...propertyForm, name: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }} />
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>Property Type</label>
            <select value={propertyForm.type} onChange={(e) => setPropertyForm({...propertyForm, type: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }}>
              <option value="Land">Land</option>
              <option value="Building">Building</option>
              <option value="Land & Building">Land & Building</option>
            </select>
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>Total Area (Square Meters)</label>
            <input type="number" placeholder="e.g., 300" value={propertyForm.totalSqm} onChange={(e) => setPropertyForm({...propertyForm, totalSqm: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }} />
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>Classification</label>
            <select value={propertyForm.classification} onChange={(e) => setPropertyForm({...propertyForm, classification: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '20px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }}>
              <option value="Exclusive">Exclusive - 100% belongs to decedent</option>
              <option value="Conjugal">Conjugal/Community - 50% to spouse, 50% to estate</option>
            </select>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
              <button onClick={() => setShowPropertyModal(false)} style={{ padding: '10px 20px', cursor: 'pointer', background: 'transparent', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '40px', fontSize: '13px', fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}>Cancel</button>
              <button onClick={saveProperty} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '40px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Save Property</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PropertyDivider;