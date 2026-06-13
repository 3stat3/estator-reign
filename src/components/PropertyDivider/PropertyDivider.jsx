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
  const [editingPerson, setEditingPerson] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [inheritanceResult, setInheritanceResult] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedInherited, setExpandedInherited] = useState({});
  const [inheritanceSummary, setInheritanceSummary] = useState([]);
  
  useEffect(() => {
    localStorage.setItem('propertyDividerData', JSON.stringify(decedents));
    // Recalculate all inheritances when data changes
    calculateAllInheritances();
  }, [decedents]);
  
  const [personForm, setPersonForm] = useState({
    name: '',
    dod: '',
    gender: 'Male',
    spouseId: null,
    parentId: null,
    isDeceased: false,
    taxDecValue: 0,
    zonalValuePerSqm: 1000
  });
  
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    type: 'Land',
    totalSqm: '',
    classification: 'Conjugal'
  });

  const clearAllData = () => {
    localStorage.removeItem('propertyDividerData');
    setDecedents([]);
    setSelectedPerson(null);
    setInheritanceResult(null);
    setInheritanceSummary([]);
    setShowClearConfirm(false);
  };

  const getChildren = (personId) => {
    return decedents.filter(p => p.parentId === personId);
  };

  // Helper: Check if a person has living descendants
  const hasLivingDescendants = (personId, allPersons) => {
    const children = allPersons.filter(p => p.parentId === personId);
    for (const child of children) {
      if (!child.dod) return true;
      if (hasLivingDescendants(child.id, allPersons)) return true;
    }
    return false;
  };

  // Helper: Get all living descendants (for representation)
  const getLivingDescendants = (personId, allPersons) => {
    const descendants = [];
    const children = allPersons.filter(p => p.parentId === personId);
    
    for (const child of children) {
      if (!child.dod) {
        descendants.push(child);
      } else {
        const grandDescendants = getLivingDescendants(child.id, allPersons);
        descendants.push(...grandDescendants);
      }
    }
    return descendants;
  };

  // Calculate total estate value with proper valuation
  const calculateEstateValue = (person, inheritedValue = 0) => {
    let totalSqm = inheritedValue;
    
    (person.properties || []).forEach(prop => {
      if (prop.classification === 'Exclusive') {
        totalSqm += prop.totalSqm;
      } else if (prop.classification === 'Conjugal') {
        totalSqm += prop.totalSqm / 2;
      }
    });
    
    // Apply valuation (zonal value per sqm)
    const zonalValue = person.zonalValuePerSqm || 1000;
    const monetaryValue = totalSqm * zonalValue;
    
    // Tax declaration value (for comparison - "whichever is higher" rule)
    const taxDecValue = person.taxDecValue || (totalSqm * 100); // Default fallback
    
    return {
      totalSqm,
      monetaryValue: Math.max(monetaryValue, taxDecValue),
      zonalValue,
      taxDecValue
    };
  };

  // Get eligible heirs (excludes pre-deceased without living descendants)
  const getEligibleHeirs = (decedent, allPersons, spouse) => {
    const children = allPersons.filter(p => p.parentId === decedent.id);
    const eligibleHeirs = [];
    
    if (spouse && !spouse.dod) {
      eligibleHeirs.push({ ...spouse, relationship: 'Spouse', isRepresentative: false });
    }
    
    for (const child of children) {
      if (!child.dod) {
        // Living child is an heir
        eligibleHeirs.push({ ...child, relationship: 'Child', isRepresentative: false });
      } else if (hasLivingDescendants(child.id, allPersons)) {
        // Deceased child with living descendants - they represent
        const descendants = getLivingDescendants(child.id, allPersons);
        descendants.forEach(desc => {
          eligibleHeirs.push({ 
            ...desc, 
            relationship: 'Grandchild', 
            isRepresentative: true,
            represents: child.name 
          });
        });
      }
      // If child died with NO living descendants, they are EXCLUDED (like Arnestor)
    }
    
    return eligibleHeirs;
  };

  // Process inheritance chronologically
  const calculateAllInheritances = () => {
    // Sort by date of death (oldest first)
    const deceased = decedents
      .filter(p => p.dod && p.isDeceased)
      .sort((a, b) => new Date(a.dod) - new Date(b.dod));
    
    // Track accumulated inheritance values
    const inheritedValues = new Map();
    const inheritanceRecords = [];
    
    for (const decedent of deceased) {
      const spouse = decedents.find(d => d.id === decedent.spouseId);
      
      // Calculate total estate including previously inherited
      const previousInheritance = inheritedValues.get(decedent.id) || 0;
      const estate = calculateEstateValue(decedent, previousInheritance);
      
      // Get eligible heirs
      const eligibleHeirs = getEligibleHeirs(decedent, decedents, spouse);
      
      if (eligibleHeirs.length === 0) {
        // NO HEIRS - Distribute to surviving siblings (collateral heirs)
        const siblings = decedents.filter(p => 
          p.parentId === decedent.parentId && 
          p.id !== decedent.id && 
          !p.dod
        );
        
        if (siblings.length > 0) {
          const sharePerSibling = estate.totalSqm / siblings.length;
          siblings.forEach(sibling => {
            const current = inheritedValues.get(sibling.id) || 0;
            inheritedValues.set(sibling.id, current + sharePerSibling);
          });
          
          inheritanceRecords.push({
            decedentName: decedent.name,
            decedentDod: decedent.dod,
            totalEstate: estate.totalSqm,
            distributionType: 'Collateral (Siblings)',
            heirs: siblings.map(s => ({ name: s.name, share: sharePerSibling, relationship: 'Sibling' })),
            estateValue: estate.monetaryValue
          });
        }
      } else {
        // Calculate shares
        let conjugalTotal = 0;
        let hereditaryEstate = estate.totalSqm;
        
        // Calculate automatic conjugal share for spouse
        if (spouse && !spouse.dod) {
          (decedent.properties || []).forEach(prop => {
            if (prop.classification === 'Conjugal') {
              const conjugalShare = prop.totalSqm / 2;
              conjugalTotal += conjugalShare;
              hereditaryEstate -= conjugalShare;
            }
          });
        }
        
        // Distribute hereditary estate
        const shareValue = hereditaryEstate / eligibleHeirs.length;
        const heirsWithShares = [];
        
        eligibleHeirs.forEach(heir => {
          const heirShare = shareValue;
          const current = inheritedValues.get(heir.id) || 0;
          inheritedValues.set(heir.id, current + heirShare);
          
          heirsWithShares.push({
            id: heir.id,
            name: heir.name,
            relationship: heir.relationship,
            share: heirShare,
            conjugalShare: heir.relationship === 'Spouse' ? conjugalTotal : 0,
            totalShare: heir.relationship === 'Spouse' ? conjugalTotal + heirShare : heirShare,
            represents: heir.represents
          });
        });
        
        inheritanceRecords.push({
          decedentName: decedent.name,
          decedentDod: decedent.dod,
          totalEstate: estate.totalSqm,
          conjugalTotal,
          hereditaryEstate,
          distributionType: 'Legal Heirs',
          heirs: heirsWithShares,
          estateValue: estate.monetaryValue,
          propertyDetails: decedent.properties
        });
      }
    }
    
    setInheritanceSummary(inheritanceRecords);
    
    // Update selected person if needed
    if (selectedPerson) {
      const updatedPerson = decedents.find(p => p.id === selectedPerson.id);
      if (updatedPerson && updatedPerson.isDeceased) {
        const result = getPersonInheritanceResult(updatedPerson.id, inheritanceRecords);
        setInheritanceResult(result);
      } else if (updatedPerson) {
        const inherited = getPersonInheritedProperties(updatedPerson.id, inheritanceRecords);
        setInheritanceResult({ inheritedProperties: inherited, isLiving: true });
      }
    }
  };

  // Get inheritance result for a specific person
  const getPersonInheritanceResult = (personId, records) => {
    const decedentRecord = records.find(r => r.decedentName === decedents.find(d => d.id === personId)?.name);
    return decedentRecord || null;
  };

  // Get properties inherited BY a person (not from)
  const getPersonInheritedProperties = (personId, records) => {
    const person = decedents.find(p => p.id === personId);
    if (!person) return [];
    
    const inherited = [];
    
    records.forEach(record => {
      const heir = record.heirs?.find(h => h.id === personId);
      if (heir && heir.share > 0) {
        inherited.push({
          sourceDecedent: record.decedentName,
          sourceDod: record.decedentDod,
          share: heir.share,
          conjugalShare: heir.conjugalShare || 0,
          totalShare: heir.totalShare || heir.share,
          relationship: heir.relationship,
          represents: heir.represents,
          distributionType: record.distributionType,
          propertyBreakdown: record.propertyDetails?.map(prop => ({
            name: prop.name,
            type: prop.type,
            totalSqm: prop.totalSqm,
            classification: prop.classification,
            yourShare: heir.share * (prop.totalSqm / record.totalEstate)
          }))
        });
      }
    });
    
    return inherited;
  };

  const handleSelectPerson = (person) => {
    setSelectedPerson(person);
    setExpandedInherited({});
    
    if (person.isDeceased) {
      const result = getPersonInheritanceResult(person.id, inheritanceSummary);
      setInheritanceResult(result);
    } else {
      const inherited = getPersonInheritedProperties(person.id, inheritanceSummary);
      setInheritanceResult({ inheritedProperties: inherited, isLiving: true });
    }
  };

  const toggleExpanded = (index) => {
    setExpandedInherited(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const addNewPerson = () => {
    setEditingPerson(null);
    setPersonForm({
      name: '',
      dod: '',
      gender: 'Male',
      spouseId: null,
      parentId: null,
      isDeceased: false,
      taxDecValue: 0,
      zonalValuePerSqm: 1000
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
      dod: personForm.dod,
      gender: personForm.gender,
      spouseId: personForm.spouseId,
      parentId: personForm.parentId,
      isDeceased: !!personForm.dod,
      taxDecValue: personForm.taxDecValue || 0,
      zonalValuePerSqm: personForm.zonalValuePerSqm || 1000,
      properties: editingPerson?.properties || [],
      heirs: editingPerson?.heirs || []
    };
    
    let updatedDecedents;
    
    if (editingPerson) {
      updatedDecedents = decedents.map(p => p.id === editingPerson.id ? newPerson : p);
    } else {
      updatedDecedents = [...decedents, newPerson];
    }
    
    // Handle bidirectional spouse relationship
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

  const LeftPanel = () => (
    <div style={{
      width: isMobile ? '100%' : '400px',
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
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 14px rgba(102, 126, 234, 0.4)';
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
              outline: 'none',
              transition: 'all 0.2s'
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
                cursor: 'pointer',
                transition: 'all 0.2s'
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
                  cursor: 'pointer',
                  transition: 'all 0.2s'
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
      padding: isMobile ? '16px' : '0'
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
            style={{ padding: isMobile ? '16px' : '28px' }}
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
                      isDeceased: selectedPerson.isDeceased,
                      taxDecValue: selectedPerson.taxDecValue || 0,
                      zonalValuePerSqm: selectedPerson.zonalValuePerSqm || 1000
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
                    transition: 'all 0.2s',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  ✏️ Edit Profile
                </button>
              </div>
            </div>
            
            {/* Inherited Properties Section */}
            {inheritanceResult?.inheritedProperties?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  background: darkMode ? 'rgba(30, 35, 50, 0.8)' : 'white',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  padding: '16px',
                  marginBottom: '20px',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: darkMode ? '#fff' : '#1a1a2e' }}>
                  📦 Inherited Properties
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {inheritanceResult.inheritedProperties.map((inv, idx) => (
                    <div key={idx} style={{
                      padding: '16px',
                      background: darkMode ? 'rgba(10, 12, 16, 0.8)' : '#f8f9ff',
                      borderRadius: '16px',
                      borderLeft: `4px solid ${inv.relationship === 'Spouse' ? '#10b981' : '#667eea'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                      <div onClick={() => toggleExpanded(idx)}>
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontWeight: 600, color: '#667eea', fontSize: '12px', marginBottom: '4px' }}>
                            📌 From: {inv.sourceDecedent} (died {inv.sourceDod})
                            {inv.represents && (
                              <span style={{ marginLeft: '6px', fontSize: '10px', color: '#f59e0b' }}>
                                (Representing {inv.represents})
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: darkMode ? '#fff' : '#1a1a2e', marginBottom: '6px' }}>
                            {inv.totalShare.toFixed(2)} m² total
                          </div>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {inv.conjugalShare > 0 && (
                              <div style={{ fontSize: '11px', color: '#10b981' }}>
                                • {inv.conjugalShare.toFixed(2)} m² conjugal share
                              </div>
                            )}
                            {inv.share > 0 && (
                              <div style={{ fontSize: '11px', color: '#667eea' }}>
                                • {inv.share.toFixed(2)} m² inheritance share
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '18px',
                          color: darkMode ? '#64748b' : '#94a3b8',
                          textAlign: 'right',
                          transition: 'transform 0.2s',
                          transform: expandedInherited[idx] ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}>
                          ▼
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedInherited[idx] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ overflow: 'hidden', marginTop: '12px' }}
                          >
                            <div style={{
                              paddingTop: '12px',
                              borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                                🔍 Property Breakdown:
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {inv.propertyBreakdown?.map((prop, propIdx) => (
                                  <div key={propIdx} style={{
                                    padding: '10px',
                                    background: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                                    borderRadius: '10px',
                                    borderLeft: `3px solid ${prop.classification === 'Exclusive' ? '#f59e0b' : '#10b981'}`
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                                      <div>
                                        <span style={{ fontWeight: 600, fontSize: '13px', color: darkMode ? '#fff' : '#1a1a2e' }}>{prop.name}</span>
                                        <span style={{ marginLeft: '6px', fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8' }}>
                                          ({prop.type})
                                        </span>
                                      </div>
                                      <div>
                                        <span style={{
                                          padding: '2px 6px',
                                          borderRadius: '10px',
                                          fontSize: '9px',
                                          fontWeight: 600,
                                          background: prop.classification === 'Exclusive' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                          color: prop.classification === 'Exclusive' ? '#f59e0b' : '#10b981'
                                        }}>
                                          {prop.classification}
                                        </span>
                                      </div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                                      Total: {prop.totalSqm} m² → Your share: <strong>{prop.yourShare?.toFixed(2) || inv.share} m²</strong>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* Own Properties Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                background: darkMode ? 'rgba(30, 35, 50, 0.8)' : 'white',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '16px',
                marginBottom: '20px',
                border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
                  🏠 Owned Properties
                </h3>
                <button
                  onClick={addPropertyToPerson}
                  style={{
                    padding: '6px 16px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '40px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  + Add Property
                </button>
              </div>
              
              {(selectedPerson.properties || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏷️</div>
                  <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>No properties added yet</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
                        <th style={{ textAlign: 'left', padding: '8px 6px', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '11px', fontWeight: 600 }}>Property</th>
                        <th style={{ textAlign: 'left', padding: '8px 6px', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '11px', fontWeight: 600 }}>Type</th>
                        <th style={{ textAlign: 'left', padding: '8px 6px', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '11px', fontWeight: 600 }}>Area</th>
                        <th style={{ textAlign: 'left', padding: '8px 6px', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '11px', fontWeight: 600 }}>Status</th>
                        <th style={{ textAlign: 'center', padding: '8px 6px', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '11px', fontWeight: 600 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPerson.properties || []).map((prop, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}
                        >
                          <td style={{ padding: '8px 6px', fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e', wordBreak: 'break-word' }}>{prop.name}</td>
                          <td style={{ padding: '8px 6px', color: darkMode ? '#fff' : '#1a1a2e' }}>{prop.type}</td>
                          <td style={{ padding: '8px 6px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>{prop.totalSqm} m²</td>
                          <td style={{ padding: '8px 6px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '20px',
                              fontSize: '9px',
                              fontWeight: 600,
                              background: prop.classification === 'Exclusive' ? 'rgba(102, 126, 234, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: prop.classification === 'Exclusive' ? '#667eea' : '#10b981'
                            }}>
                              {prop.classification}
                            </span>
                            {prop.classification === 'Conjugal' && (
                              <div style={{ fontSize: '9px', color: '#10b981', marginTop: '2px' }}>(50% to spouse)</div>
                            )}
                          </td>
                          <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                onClick={() => {
                                  setEditingProperty({ id: prop.id, ...prop });
                                  setPropertyForm({ name: prop.name, type: prop.type, totalSqm: prop.totalSqm, classification: prop.classification });
                                  setShowPropertyModal(true);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', opacity: 0.7, padding: '4px' }}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteProperty(prop.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', opacity: 0.7, color: '#ef4444', padding: '4px' }}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
            
            {/* Estate Distribution Section (for deceased persons) */}
            {selectedPerson.isDeceased && inheritanceResult && !inheritanceResult.isLiving && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  padding: '16px',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(102, 126, 234, 0.2)'}`
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: darkMode ? '#fff' : '#1a1a2e' }}>
                  📤 Estate Distribution
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    padding: '12px',
                    background: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '2px' }}>Total Estate</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#667eea' }}>{inheritanceResult.totalEstate?.toFixed(2) || 0} m²</div>
                  </div>
                  {inheritanceResult.conjugalTotal > 0 && (
                    <div style={{
                      padding: '12px',
                      background: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                      borderRadius: '12px'
                    }}>
                      <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '2px' }}>Spouse's Conjugal Share</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>{inheritanceResult.conjugalTotal?.toFixed(2) || 0} m²</div>
                    </div>
                  )}
                  <div style={{
                    padding: '12px',
                    background: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '2px' }}>Hereditary Estate</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{inheritanceResult.hereditaryEstate?.toFixed(2) || inheritanceResult.totalEstate?.toFixed(2) || 0} m²</div>
                  </div>
                </div>
                
                {inheritanceResult.heirs && inheritanceResult.heirs.length > 0 && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
                          <th style={{ textAlign: 'left', padding: '8px 6px', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '11px', fontWeight: 600 }}>Heir</th>
                          <th style={{ textAlign: 'left', padding: '8px 6px', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '11px', fontWeight: 600 }}>Share Type</th>
                          <th style={{ textAlign: 'left', padding: '8px 6px', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '11px', fontWeight: 600 }}>Area</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inheritanceResult.heirs.map((heir, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                            <td style={{ padding: '8px 6px', fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}>
                              {heir.name}
                              {heir.represents && (
                                <div style={{ fontSize: '9px', color: '#f59e0b' }}>(rep. {heir.represents})</div>
                              )}
                            </td>
                            <td style={{ padding: '8px 6px', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '11px' }}>
                              {heir.relationship}
                            </td>
                            <td style={{ padding: '8px 6px', fontWeight: 600, color: '#667eea' }}>{heir.totalShare.toFixed(2)} m²</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
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
                  cursor: 'pointer',
                  transition: 'all 0.2s'
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
            <select value={personForm.parentId || ''} onChange={(e) => setPersonForm({...personForm, parentId: e.target.value ? parseInt(e.target.value) : null})} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }}>
              <option value="">No Parent / Select Parent</option>
              {decedents.filter(p => p.id !== (editingPerson?.id || 0)).map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.dod ? '(Deceased)' : '(Alive)'}</option>
              ))}
            </select>
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>💰 Tax Declaration Value (Optional)</label>
            <input type="number" placeholder="e.g., 30000" value={personForm.taxDecValue} onChange={(e) => setPersonForm({...personForm, taxDecValue: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }} />
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>💰 Zonal Value per sqm (Default: ₱1,000)</label>
            <input type="number" placeholder="e.g., 1000" value={personForm.zonalValuePerSqm} onChange={(e) => setPersonForm({...personForm, zonalValuePerSqm: parseFloat(e.target.value) || 1000})} style={{ width: '100%', padding: '12px', marginBottom: '20px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }} />
            
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