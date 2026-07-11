// src/components/PropertyDivider/modules/PersonManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import PersonDetailModal from './PersonDetailModal';
import { assignGenerations } from '../services/familyTreeService';

const PersonManager = ({ 
  darkMode = false, 
  persons = [], 
  properties = [],
  decedentId = null,
  onUpdate,
  onUpdateProperties,
  onUpdateDecedent,
  onNavigateToPropertyManager 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPerson, setEditingPerson] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [propositusId, setPropositusId] = useState(decedentId || null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPersonForDetail, setSelectedPersonForDetail] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (decedentId !== undefined && decedentId !== propositusId) {
      setPropositusId(decedentId);
    }
  }, [decedentId]);

  const [formData, setFormData] = useState({
    name: '',
    fatherId: '',
    motherId: '',
    spouseId: '',
    isDeceased: false,
    dateOfDeath: '',
    gender: 'Male'
  });

  const [bulkRows, setBulkRows] = useState([]);
  const [nextRowId, setNextRowId] = useState(1);
  const [bulkFileName, setBulkFileName] = useState('');

  const filteredPersons = persons.filter(person =>
    person.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const propositus = persons.find(p => p.id === propositusId);

  const isHeir = (person) => {
    if (!propositus) return false;
    if (person.id === propositusId) return false;
    
    if (person.fatherId === propositusId || person.motherId === propositusId) return true;
    
    if (person.id === propositus.spouseId) return true;
    
    const children = persons.filter(p => p.fatherId === propositusId || p.motherId === propositusId);
    if (children.length === 0) {
      if (person.id === propositus.fatherId || person.id === propositus.motherId) return true;
    }
    
    return false;
  };

  const isPredeceased = (person) => {
    if (!propositus || !propositus.dateOfDeath) return false;
    if (!person.isDeceased || !person.dateOfDeath) return false;
    return new Date(person.dateOfDeath) < new Date(propositus.dateOfDeath);
  };

  const hasHeirsByRepresentation = (person) => {
    if (!propositus) return false;
    if (!person.isDeceased) return false;
    
    const isChildOfPropositus = person.fatherId === propositusId || person.motherId === propositusId;
    if (!isChildOfPropositus) return false;
    if (!isPredeceased(person)) return false;
    
    const grandchildren = persons.filter(p => p.fatherId === person.id || p.motherId === person.id);
    return grandchildren.length > 0;
  };

  const getChildren = (personId) => {
    return persons.filter(p => p.fatherId === personId || p.motherId === personId);
  };

  const getGenerationLabel = (person) => {
    if (!person.generation) return 'Unknown';
    const suffix = person.generation === 1 ? 'st' 
      : person.generation === 2 ? 'nd' 
      : person.generation === 3 ? 'rd' 
      : 'th';
    return `${person.generation}${suffix} Generation`;
  };

  const getStatusBadge = (person) => {
    if (person.isDeceased) {
      return { label: 'Deceased', color: '#dc2626', bg: darkMode ? '#2d1f1f' : '#fef2f2' };
    }
    return { label: 'Living', color: '#16a34a', bg: darkMode ? '#1a2a1a' : '#f0fdf4' };
  };

  const getRoleBadge = (person) => {
    if (person.id === propositusId) {
      return { label: '👑 Propositus', color: '#8b5cf6', bg: darkMode ? '#2d1a3a' : '#f3e8ff' };
    }
    if (isPredeceased(person) && hasHeirsByRepresentation(person)) {
      return { label: '⚰️ Predeceased (Has Reps)', color: '#f59e0b', bg: darkMode ? '#3d2a1a' : '#fef3c7' };
    }
    if (isPredeceased(person)) {
      return { label: '⚰️ Predeceased', color: '#6b7280', bg: darkMode ? '#1f2937' : '#f3f4f6' };
    }
    if (isHeir(person) && !person.isDeceased) {
      return { label: '🏛️ Heir', color: '#10b981', bg: darkMode ? '#1a3a2a' : '#d1fae5' };
    }
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.isDeceased && !formData.dateOfDeath) {
      alert('Please enter the date of death.');
      return;
    }

    let updatedPersons;
    
    if (editingPerson) {
      updatedPersons = persons.map(p => {
        if (p.id === editingPerson.id) {
          return {
            ...p,
            ...formData,
            dateOfDeath: formData.isDeceased ? formData.dateOfDeath : '',
          };
        }
        return p;
      });
    } else {
      const newPerson = {
        id: `p_${Date.now()}`,
        ...formData,
        dateOfDeath: formData.isDeceased ? formData.dateOfDeath : '',
        children: [],
        generation: 0
      };
      updatedPersons = [...persons, newPerson];
    }
    
    const personsWithGenerations = assignGenerations(updatedPersons, propositusId);
    
    onUpdate(personsWithGenerations);
    
    setFormData({
      name: '',
      fatherId: '',
      motherId: '',
      spouseId: '',
      isDeceased: false,
      dateOfDeath: '',
      gender: 'Male'
    });
    setShowAddForm(false);
    setEditingPerson(null);
  };

  const downloadExcelTemplate = () => {
    const headers = ['Name', 'Father', 'Mother', 'Spouse', 'Gender', 'IsDeceased', 'DateOfDeath', 'PropertyName', 'PropertyType', 'PropertyClassification', 'PropertySize', 'PropertyLocation'];
    const sampleData = [
      ['Juan Dela Cruz', '', '', 'Maria Dela Cruz', 'Male', 'Yes', '2024-01-15', 'Family House', 'Land', 'Conjugal', '250', 'Manila'],
      ['Maria Dela Cruz', '', '', 'Juan Dela Cruz', 'Female', 'No', '', 'Family House', 'Land', 'Conjugal', '250', 'Manila'],
      ['Pedro Dela Cruz', 'Juan Dela Cruz', 'Maria Dela Cruz', '', 'Male', 'Yes', '2023-03-10', 'Farm', 'Land', 'Exclusive', '500', 'Bulacan'],
      ['Ana Dela Cruz', 'Juan Dela Cruz', 'Maria Dela Cruz', '', 'Female', 'No', '', '', '', '', '', '']
    ];
    
    const wb = XLSX.utils.book_new();
    const wsData = [headers, ...sampleData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    ws['!cols'] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 25 },
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Persons');
    XLSX.writeFile(wb, 'Person_Import_Template.xlsx');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setBulkFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
          defval: '',
          raw: false,
          dateNF: 'yyyy-mm-dd'
        });
        
        if (jsonData.length === 0) {
          alert('The file is empty or has no valid data.');
          return;
        }
        
        const newRows = jsonData.map((row, index) => {
          let dateOfDeath = row.DateOfDeath || '';
          
          if (dateOfDeath) {
            if (typeof dateOfDeath === 'number') {
              const excelEpoch = new Date(1900, 0, 1);
              const daysOffset = dateOfDeath > 60 ? dateOfDeath - 1 : dateOfDeath;
              const date = new Date(excelEpoch);
              date.setDate(date.getDate() + daysOffset - 1);
              dateOfDeath = date.toISOString().split('T')[0];
            } 
            else if (dateOfDeath instanceof Date) {
              dateOfDeath = dateOfDeath.toISOString().split('T')[0];
            }
            else if (typeof dateOfDeath === 'string') {
              const date = new Date(dateOfDeath);
              if (!isNaN(date.getTime())) {
                dateOfDeath = date.toISOString().split('T')[0];
              }
              else {
                const parts = dateOfDeath.split(/[\/\-\.]/);
                if (parts.length === 3) {
                  const month = parseInt(parts[0]) - 1;
                  const day = parseInt(parts[1]);
                  const year = parseInt(parts[2]);
                  if (!isNaN(month) && !isNaN(day) && !isNaN(year) && year > 1900) {
                    const d = new Date(year, month, day);
                    if (!isNaN(d.getTime())) {
                      dateOfDeath = d.toISOString().split('T')[0];
                    }
                  }
                }
              }
            }
          }
          
          const isDeceased = row.IsDeceased?.toString().toLowerCase() === 'yes' || 
                            row.IsDeceased === true ||
                            row.IsDeceased === 1;

          const hasProperty = row.PropertyName?.toString().trim();

          return {
            id: Date.now() + index,
            name: row.Name?.toString().trim() || '',
            father: row.Father?.toString().trim() || '',
            mother: row.Mother?.toString().trim() || '',
            spouse: row.Spouse?.toString().trim() || '',
            gender: row.Gender || 'Male',
            isDeceased: isDeceased ? 'Yes' : 'No',
            dateOfDeath: dateOfDeath || '',
            propertyName: hasProperty || '',
            propertyType: hasProperty ? (row.PropertyType || 'Land') : '',
            propertyClassification: hasProperty ? (row.PropertyClassification || 'Conjugal') : '',
            propertySize: hasProperty ? (row.PropertySize?.toString() || '') : '',
            propertyLocation: hasProperty ? (row.PropertyLocation?.toString().trim() || '') : ''
          };
        });
        
        setBulkRows(newRows);
        setNextRowId(newRows.length + 1);
        
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading the Excel file. Please make sure it\'s a valid .xlsx or .xls file.');
      }
    };
    reader.readAsArrayBuffer(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addBulkRow = () => {
    setBulkRows([
      ...bulkRows,
      { 
        id: nextRowId, 
        name: '', 
        father: '', 
        mother: '', 
        spouse: '', 
        gender: 'Male', 
        isDeceased: 'No', 
        dateOfDeath: '',
        propertyName: '',
        propertyType: 'Land',
        propertyClassification: 'Conjugal',
        propertySize: '',
        propertyLocation: ''
      }
    ]);
    setNextRowId(nextRowId + 1);
  };

  const removeBulkRow = (id) => {
    if (bulkRows.length <= 1) {
      alert('You need at least one row to import.');
      return;
    }
    setBulkRows(bulkRows.filter(row => row.id !== id));
  };

  const updateBulkRow = (id, field, value) => {
    setBulkRows(bulkRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleBulkImport = () => {
    const emptyRows = bulkRows.filter(row => !row.name.trim());
    if (emptyRows.length > 0) {
      alert('Please fill in the Name field for all rows or remove empty rows.');
      return;
    }

    const newPersons = bulkRows.map((row, index) => {
      const isDeceased = row.isDeceased?.toLowerCase() === 'yes';
      
      let spouseId = '';
      if (row.spouse?.trim()) {
        const spouseName = row.spouse.trim();
        const existingSpouse = persons.find(p => p.name.toLowerCase() === spouseName.toLowerCase());
        if (existingSpouse) {
          spouseId = existingSpouse.id;
        } else {
          const spouseInBulk = bulkRows.find(r => 
            r.name?.trim()?.toLowerCase() === spouseName.toLowerCase() && 
            r.id !== row.id
          );
          if (spouseInBulk) {
            const spouseIndex = bulkRows.indexOf(spouseInBulk);
            spouseId = `p_${Date.now()}_${spouseIndex}`;
          } else {
            spouseId = row.spouse.trim();
          }
        }
      }
      
      let fatherId = '';
      if (row.father?.trim()) {
        const fatherName = row.father.trim();
        const existingFather = persons.find(p => p.name.toLowerCase() === fatherName.toLowerCase());
        if (existingFather) {
          fatherId = existingFather.id;
        } else {
          const fatherInBulk = bulkRows.find(r => 
            r.name?.trim()?.toLowerCase() === fatherName.toLowerCase() && 
            r.id !== row.id
          );
          if (fatherInBulk) {
            const fatherIndex = bulkRows.indexOf(fatherInBulk);
            fatherId = `p_${Date.now()}_${fatherIndex}`;
          } else {
            fatherId = row.father.trim();
          }
        }
      }
      
      let motherId = '';
      if (row.mother?.trim()) {
        const motherName = row.mother.trim();
        const existingMother = persons.find(p => p.name.toLowerCase() === motherName.toLowerCase());
        if (existingMother) {
          motherId = existingMother.id;
        } else {
          const motherInBulk = bulkRows.find(r => 
            r.name?.trim()?.toLowerCase() === motherName.toLowerCase() && 
            r.id !== row.id
          );
          if (motherInBulk) {
            const motherIndex = bulkRows.indexOf(motherInBulk);
            motherId = `p_${Date.now()}_${motherIndex}`;
          } else {
            motherId = row.mother.trim();
          }
        }
      }
      
      return {
        id: `p_${Date.now()}_${index}`,
        name: row.name.trim(),
        fatherId: fatherId,
        motherId: motherId,
        spouseId: spouseId,
        gender: row.gender || 'Male',
        isDeceased: isDeceased,
        dateOfDeath: isDeceased ? row.dateOfDeath || '' : '',
        children: [],
        generation: 0
      };
    });
    
    const updatedPersons = [...persons, ...newPersons];
    const personsWithGenerations = assignGenerations(updatedPersons, propositusId);
    
    const newProperties = [];
    bulkRows.forEach((row, index) => {
      if (row.propertyName?.trim()) {
        const personId = newPersons[index]?.id;
        if (personId) {
          const property = {
            id: `pr_${Date.now()}_${index}`,
            name: row.propertyName.trim(),
            type: row.propertyType || 'Land',
            classification: row.propertyClassification || 'Conjugal',
            totalSqm: parseFloat(row.propertySize) || 0,
            ownerId: personId,
            location: row.propertyLocation || '',
            description: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          newProperties.push(property);
        }
      }
    });

    onUpdate(personsWithGenerations);

    if (onUpdateProperties && newProperties.length > 0) {
      onUpdateProperties([...properties, ...newProperties]);
    }
    
    setBulkRows([]);
    setBulkFileName('');
    setShowBulkAdd(false);
  };

  const handleDelete = (personId) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      let newPropositusId = propositusId;
      if (personId === propositusId) {
        newPropositusId = null;
        setPropositusId(null);
        if (onUpdateDecedent) {
          onUpdateDecedent(null);
        }
      }
      
      const updatedPersons = persons.filter(p => p.id !== personId);
      const personsWithGenerations = assignGenerations(updatedPersons, newPropositusId);
      
      onUpdate(personsWithGenerations);
      if (selectedPerson?.id === personId) setSelectedPerson(null);
    }
  };

  const getPropositusStats = () => {
    if (!propositus) return null;
    
    const heirs = persons.filter(p => isHeir(p) && !p.isDeceased);
    const predeceased = persons.filter(p => isPredeceased(p));
    const withReps = persons.filter(p => hasHeirsByRepresentation(p));
    
    return {
      totalHeirs: heirs.length,
      predeceasedCount: predeceased.length,
      withRepsCount: withReps.length
    };
  };

  const propositusStats = getPropositusStats();

  return (
    <div className="pm-wrapper">
      <div className="pm-propositus-section">
        <div className="pm-propositus-selector">
          <div className="pm-propositus-label">
            <span className="pm-propositus-icon">🎯</span>
            <span>Decedent (Propositus):</span>
          </div>
          <select
            value={propositusId || ''}
            onChange={(e) => {
              const newId = e.target.value || null;
              setPropositusId(newId);
              if (onUpdateDecedent) {
                onUpdateDecedent(newId);
              }
            }}
            className="pm-propositus-select"
          >
            <option value="">— Select the decedent —</option>
            {persons.filter(p => p.isDeceased).map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.dateOfDeath ? `(† ${formatDate(p.dateOfDeath)})` : ''}
              </option>
            ))}
          </select>
          {propositus && (
            <span className="pm-propositus-badge">
              👑 {propositus.name}
            </span>
          )}
        </div>
        
        {propositusStats && (
          <div className="pm-propositus-stats">
            <span className="pm-stat-item">
              🏛️ {propositusStats.totalHeirs} Heirs
            </span>
            <span className="pm-stat-item">
              ⚰️ {propositusStats.predeceasedCount} Predeceased
            </span>
            {propositusStats.withRepsCount > 0 && (
              <span className="pm-stat-item pm-stat-reps">
                👶 {propositusStats.withRepsCount} with Reps
              </span>
            )}
          </div>
        )}
      </div>

      <div className="pm-header">
        <div className="pm-header-left">
          <h1 className="pm-title">👤 Persons</h1>
          <span className="pm-stats-inline">
            {filteredPersons.length} · 💚 {persons.filter(p => !p.isDeceased).length} · ⚰️ {persons.filter(p => p.isDeceased).length}
          </span>
        </div>
        
        <div className="pm-header-center">
          <input
            type="text"
            placeholder="🔍 Search persons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pm-search"
          />
        </div>
        
        <div className="pm-header-actions">
          <button className="pm-btn pm-btn-secondary" onClick={() => setShowBulkAdd(true)}>
            📋 Bulk Add Person
          </button>
          <button className="pm-btn pm-btn-primary" onClick={() => setShowAddForm(true)}>
            + Add Person
          </button>
        </div>
      </div>

      <div className="pm-grid">
        {filteredPersons.length > 0 ? (
          filteredPersons.map((person) => {
            const status = getStatusBadge(person);
            const isSelected = selectedPerson?.id === person.id;
            const isPropositus = person.id === propositusId;
            const roleBadge = getRoleBadge(person);
            const childCount = getChildren(person.id).length;
            const isPredeceasedPerson = isPredeceased(person);
            const hasReps = hasHeirsByRepresentation(person);
            
            return (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`pm-card ${isSelected ? 'selected' : ''} ${isPropositus ? 'propositus' : ''}`}
                onClick={() => {
                  setSelectedPersonForDetail(person);
                  setShowDetailModal(true);
                }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="pm-card-header">
                  <div className="pm-avatar" style={{
                    background: isPropositus 
                      ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                      : person.isDeceased 
                        ? '#dc2626' 
                        : person.gender === 'Female' 
                          ? 'linear-gradient(135deg, #ec4899, #db2777)'
                          : 'linear-gradient(135deg, #3b82f6, #2563eb)'
                  }}>
                    {person.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="pm-card-name">
                      {person.name}
                      {person.isDeceased && ' ⚰️'}
                      {isPropositus && ' 👑'}
                    </h3>
                    <p className="pm-card-relationship">
                      {getGenerationLabel(person)}
                      {isPredeceasedPerson && ' · ⚠️ Predeceased'}
                      {hasReps && ` · 👶 ${getChildren(person.id).length} children (heirs by rep)`}
                    </p>
                  </div>
                </div>
                
                <div className="pm-card-details">
                  <span className="pm-badge" style={{
                    background: status.bg,
                    color: status.color,
                  }}>
                    {status.label}
                  </span>
                  <span className="pm-badge pm-badge-muted">
                    {person.gender || 'Unknown'}
                  </span>
                  {person.spouseId && (
                    <span className="pm-badge pm-badge-married">💑 Married</span>
                  )}
                  {person.isDeceased && person.dateOfDeath && (
                    <span className="pm-badge pm-badge-date">📅 {formatDate(person.dateOfDeath)}</span>
                  )}
                  {roleBadge && (
                    <span className="pm-badge" style={{
                      background: roleBadge.bg,
                      color: roleBadge.color,
                      border: `1px solid ${roleBadge.color}`,
                    }}>
                      {roleBadge.label}
                    </span>
                  )}
                  {childCount > 0 && !isPropositus && (
                    <span className="pm-badge pm-badge-children">
                      👶 {childCount} child{childCount > 1 ? 'ren' : ''}
                    </span>
                  )}
                </div>

                <div className="pm-card-actions">
                  <button 
                    className="pm-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPerson(person);
                      setFormData({
                        name: person.name,
                        fatherId: person.fatherId || '',
                        motherId: person.motherId || '',
                        spouseId: person.spouseId || '',
                        isDeceased: person.isDeceased || false,
                        dateOfDeath: person.dateOfDeath || '',
                        gender: person.gender || 'Male'
                      });
                      setShowAddForm(true);
                    }}
                  >
                    ✏️
                  </button>
                  <button 
                    className="pm-icon-btn pm-icon-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(person.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="pm-empty-state">
            <div className="pm-empty-icon">👤</div>
            <h3>No persons added yet</h3>
            <p>Click the "Add Person" button to start building your family tree</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pm-modal-overlay"
            onClick={() => {
              setShowAddForm(false);
              setEditingPerson(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="pm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="pm-modal-title">
                {editingPerson ? '✏️ Edit Person' : '➕ Add Person'}
              </h2>
              <p className="pm-modal-subtitle">
                {editingPerson 
                  ? 'Update the person\'s information' 
                  : 'Enter the details of the person to add to the estate'}
              </p>

              <form onSubmit={handleSubmit}>
                <div className="pm-form-group">
                  <label className="pm-form-label">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Juan Dela Cruz"
                    className="pm-form-input"
                    required
                  />
                </div>

                <div className="pm-form-row">
                  <div className="pm-form-group">
                    <label className="pm-form-label">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="pm-form-select"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-form-label">Spouse</label>
                    <select
                      value={formData.spouseId}
                      onChange={(e) => setFormData({...formData, spouseId: e.target.value})}
                      className="pm-form-select"
                    >
                      <option value="">None</option>
                      {persons
                        .filter(p => p.id !== editingPerson?.id)
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                <div className="pm-form-row">
                  <div className="pm-form-group">
                    <label className="pm-form-label">Father</label>
                    <select
                      value={formData.fatherId}
                      onChange={(e) => setFormData({...formData, fatherId: e.target.value})}
                      className="pm-form-select"
                    >
                      <option value="">Unknown</option>
                      {persons
                        .filter(p => p.id !== editingPerson?.id && p.gender !== 'Female')
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))
                      }
                    </select>
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-form-label">Mother</label>
                    <select
                      value={formData.motherId}
                      onChange={(e) => setFormData({...formData, motherId: e.target.value})}
                      className="pm-form-select"
                    >
                      <option value="">Unknown</option>
                      {persons
                        .filter(p => p.id !== editingPerson?.id && p.gender !== 'Male')
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                <div className="pm-form-group">
                  <label className="pm-form-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.isDeceased}
                      onChange={(e) => setFormData({...formData, isDeceased: e.target.checked})}
                    />
                    This person is deceased
                  </label>
                </div>

                {formData.isDeceased && (
                  <div className="pm-form-group">
                    <label className="pm-form-label">Date of Death *</label>
                    <input
                      type="date"
                      value={formData.dateOfDeath}
                      onChange={(e) => setFormData({...formData, dateOfDeath: e.target.value})}
                      className="pm-form-input"
                      required={formData.isDeceased}
                    />
                  </div>
                )}

                <div className="pm-form-actions">
                  <button
                    type="button"
                    className="pm-btn pm-btn-secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingPerson(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="pm-btn pm-btn-primary">
                    {editingPerson ? 'Update Person' : 'Add Person'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pm-modal-overlay"
            onClick={() => {
              setShowBulkAdd(false);
              setBulkRows([]);
              setBulkFileName('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="pm-modal pm-modal-bulk"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pm-modal-header">
                <div>
                  <h2 className="pm-modal-title">📋 Bulk Add Persons</h2>
                  <p className="pm-modal-subtitle">
                    Upload an Excel file or manually add rows to import multiple persons at once
                  </p>
                </div>
                <button 
                  className="pm-modal-close"
                  onClick={() => {
                    setShowBulkAdd(false);
                    setBulkRows([]);
                    setBulkFileName('');
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="pm-bulk-upload-section">
                <div className="pm-bulk-upload-actions">
                  <button 
                    className="pm-btn pm-btn-secondary pm-btn-download"
                    onClick={downloadExcelTemplate}
                  >
                    📥 Download Excel Template
                  </button>
                  <div className="pm-bulk-upload-wrapper">
                    <button 
                      className="pm-btn pm-btn-primary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📤 Upload Excel File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
                {bulkFileName && (
                  <div className="pm-bulk-file-info">
                    <span className="pm-bulk-file-icon">📄</span>
                    <span className="pm-bulk-file-name">{bulkFileName}</span>
                    <span className="pm-bulk-file-size">
                      {bulkRows.length} rows loaded
                    </span>
                  </div>
                )}
              </div>

              <div className="pm-bulk-divider">
                <span>or manually add rows below</span>
              </div>

              <div className="pm-bulk-table-wrapper">
                <div className="pm-bulk-table-scroll">
                  <table className="pm-bulk-table">
                    <thead>
                      <tr>
                        <th style={{ width: '25px' }}>#</th>
                        <th style={{ minWidth: '120px' }}>Name *</th>
                        <th style={{ minWidth: '80px' }}>Father</th>
                        <th style={{ minWidth: '80px' }}>Mother</th>
                        <th style={{ minWidth: '80px' }}>Spouse</th>
                        <th style={{ minWidth: '70px' }}>Gender</th>
                        <th style={{ minWidth: '65px' }}>Deceased</th>
                        <th style={{ minWidth: '100px' }}>Date of Death</th>
                        <th style={{ minWidth: '100px' }}>Property</th>
                        <th style={{ minWidth: '80px' }}>Prop Type</th>
                        <th style={{ minWidth: '90px' }}>Prop Class</th>
                        <th style={{ minWidth: '70px' }}>Size (sqm)</th>
                        <th style={{ minWidth: '100px' }}>Location</th>
                        <th style={{ width: '30px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkRows.length === 0 ? (
                        <tr>
                          <td colSpan="14" className="pm-bulk-empty">
                            <div className="pm-bulk-empty-state">
                              <span>📂</span>
                              <p>No data loaded. Upload an Excel file or add rows manually.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        bulkRows.map((row, index) => (
                          <tr key={row.id}>
                            <td className="pm-bulk-row-number">{index + 1}</td>
                            <td>
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => updateBulkRow(row.id, 'name', e.target.value)}
                                placeholder="Full name"
                                className="pm-bulk-input"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={row.father}
                                onChange={(e) => updateBulkRow(row.id, 'father', e.target.value)}
                                placeholder="Father"
                                className="pm-bulk-input"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={row.mother}
                                onChange={(e) => updateBulkRow(row.id, 'mother', e.target.value)}
                                placeholder="Mother"
                                className="pm-bulk-input"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={row.spouse}
                                onChange={(e) => updateBulkRow(row.id, 'spouse', e.target.value)}
                                placeholder="Spouse"
                                className="pm-bulk-input"
                              />
                            </td>
                            <td>
                              <select
                                value={row.gender}
                                onChange={(e) => updateBulkRow(row.id, 'gender', e.target.value)}
                                className="pm-bulk-select"
                              >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                              </select>
                            </td>
                            <td>
                              <select
                                value={row.isDeceased}
                                onChange={(e) => updateBulkRow(row.id, 'isDeceased', e.target.value)}
                                className="pm-bulk-select"
                              >
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="date"
                                value={row.dateOfDeath}
                                onChange={(e) => updateBulkRow(row.id, 'dateOfDeath', e.target.value)}
                                className="pm-bulk-input pm-bulk-date"
                                disabled={row.isDeceased !== 'Yes'}
                                style={{
                                  opacity: row.isDeceased !== 'Yes' ? 0.5 : 1,
                                  cursor: row.isDeceased !== 'Yes' ? 'not-allowed' : 'pointer'
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={row.propertyName || ''}
                                onChange={(e) => updateBulkRow(row.id, 'propertyName', e.target.value)}
                                placeholder="Property name"
                                className="pm-bulk-input"
                              />
                            </td>
                            <td>
                              <select
                                value={row.propertyType || 'Land'}
                                onChange={(e) => updateBulkRow(row.id, 'propertyType', e.target.value)}
                                className="pm-bulk-select"
                              >
                                <option value="Land">Land</option>
                                <option value="Building">Building</option>
                              </select>
                            </td>
                            <td>
                              <select
                                value={row.propertyClassification || 'Conjugal'}
                                onChange={(e) => updateBulkRow(row.id, 'propertyClassification', e.target.value)}
                                className="pm-bulk-select"
                              >
                                <option value="Conjugal">Conjugal</option>
                                <option value="Exclusive">Exclusive</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                value={row.propertySize || ''}
                                onChange={(e) => updateBulkRow(row.id, 'propertySize', e.target.value)}
                                placeholder="sqm"
                                className="pm-bulk-input"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={row.propertyLocation || ''}
                                onChange={(e) => updateBulkRow(row.id, 'propertyLocation', e.target.value)}
                                placeholder="Location"
                                className="pm-bulk-input"
                              />
                            </td>
                            <td>
                              <button
                                className="pm-bulk-remove"
                                onClick={() => removeBulkRow(row.id)}
                                title="Remove row"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pm-bulk-actions">
                <button className="pm-bulk-add-row" onClick={addBulkRow}>
                  + Add Row
                </button>
                <div className="pm-bulk-tip">
                  💡 Tip: Name is required. Fill in property fields (PropertyName, PropertySize) to create properties automatically.
                </div>
              </div>

              <div className="pm-form-actions">
                <button
                  type="button"
                  className="pm-btn pm-btn-secondary"
                  onClick={() => {
                    setShowBulkAdd(false);
                    setBulkRows([]);
                    setBulkFileName('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="pm-btn pm-btn-primary"
                  onClick={handleBulkImport}
                  disabled={bulkRows.length === 0 || bulkRows.some(row => !row.name.trim())}
                >
                  Import {bulkRows.filter(row => row.name.trim()).length} Persons
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailModal && selectedPersonForDetail && (
          <PersonDetailModal
            darkMode={darkMode}
            person={selectedPersonForDetail}
            persons={persons}
            properties={properties}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedPersonForDetail(null);
            }}
            onAddProperty={() => {
              const personId = selectedPersonForDetail.id;
              setShowDetailModal(false);
              setSelectedPersonForDetail(null);
              if (onNavigateToPropertyManager) {
                onNavigateToPropertyManager(personId);
              }
            }}
            onUpdatePerson={(updatedPerson) => {
              onUpdate(persons.map(p => p.id === updatedPerson.id ? updatedPerson : p));
            }}
          />
        )}
      </AnimatePresence>

      <style>{`
        .pm-wrapper {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: var(--bg-primary);
          color: var(--text-primary);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .pm-propositus-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .pm-propositus-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .pm-propositus-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .pm-propositus-icon {
          font-size: 18px;
        }

        .pm-propositus-select {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          cursor: pointer;
          min-width: 200px;
        }

        .pm-propositus-select:focus {
          border-color: #8b5cf6;
        }

        .pm-propositus-badge {
          padding: 4px 14px;
          border-radius: 20px;
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .pm-propositus-stats {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .pm-stat-item {
          font-size: 13px;
          color: var(--text-secondary);
          padding: 4px 10px;
          border-radius: 16px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
        }

        .pm-stat-reps {
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.3);
          color: #f59e0b;
        }

        .pm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .pm-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .pm-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
        }

        .pm-stats-inline {
          font-size: 13px;
          color: var(--text-secondary);
          background: var(--bg-secondary);
          padding: 4px 12px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          white-space: nowrap;
        }

        .pm-header-center {
          flex: 1;
          max-width: 300px;
          min-width: 120px;
        }

        .pm-search {
          width: 100%;
          padding: 6px 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          background: var(--bg-secondary);
          color: var(--text-primary);
          transition: border 0.2s;
          height: 34px;
        }

        .pm-search:focus {
          border-color: #667eea;
        }

        .pm-header-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .pm-btn {
          padding: 8px 18px;
          border-radius: 8px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .pm-btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #ffffff;
        }

        .pm-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .pm-btn-secondary {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .pm-btn-secondary:hover {
          background: var(--border-color);
        }

        .pm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pm-btn-download {
          border: 1px dashed var(--border-color);
          background: transparent;
        }

        .pm-btn-download:hover {
          background: var(--bg-secondary);
          border-color: #667eea;
        }

        .pm-bulk-upload-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 16px 20px;
          margin-bottom: 12px;
        }

        .pm-bulk-upload-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .pm-bulk-upload-wrapper {
          position: relative;
        }

        .pm-bulk-file-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          margin-top: 10px;
          background: var(--bg-primary);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .pm-bulk-file-icon {
          font-size: 20px;
        }

        .pm-bulk-file-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .pm-bulk-file-size {
          font-size: 12px;
          color: var(--text-secondary);
          margin-left: auto;
        }

        .pm-bulk-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 8px 0 12px 0;
          color: var(--text-secondary);
          font-size: 12px;
        }

        .pm-bulk-divider::before,
        .pm-bulk-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border-color);
        }

        .pm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          flex: 1;
          align-content: start;
        }

        .pm-card {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 20px;
          border: 2px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow);
          position: relative;
        }

        .pm-card.selected {
          border-color: #667eea;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
        }

        .pm-card.propositus {
          border-color: #8b5cf6;
          background: var(--bg-secondary);
          box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.2), 0 4px 20px rgba(139, 92, 246, 0.1);
        }

        .pm-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .pm-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .pm-avatar {
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
        }

        .pm-card-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .pm-card-relationship {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 2px 0 0 0;
        }

        .pm-card-details {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          font-size: 12px;
        }

        .pm-badge {
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          display: inline-block;
        }

        .pm-badge-muted {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .pm-badge-married {
          background: #eff6ff;
          color: #3b82f6;
        }

        .pm-badge-date {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .pm-badge-children {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .dark .pm-badge-married {
          background: #1a2a3a;
          color: #60a5fa;
        }

        .dark .pm-badge-children {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border-color: rgba(16, 185, 129, 0.2);
        }

        .pm-card-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
        }

        .pm-icon-btn {
          padding: 4px 8px;
          border-radius: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }

        .pm-icon-btn:hover {
          background: var(--border-color);
        }

        .pm-icon-delete:hover {
          color: #dc2626;
        }

        .pm-empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          color: var(--text-secondary);
        }

        .pm-empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .pm-empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 8px 0;
        }

        .pm-empty-state p {
          font-size: 14px;
          margin: 0;
          color: var(--text-secondary);
        }

        .pm-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .pm-modal {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 32px;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
        }

        .pm-modal-bulk {
          max-width: 95vw;
          width: 100%;
          padding: 24px;
        }

        .pm-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .pm-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0 4px;
          transition: color 0.2s;
        }

        .pm-modal-close:hover {
          color: var(--text-primary);
        }

        .pm-modal-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px 0;
        }

        .pm-modal-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }

        .pm-form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 14px;
        }

        .pm-form-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .pm-form-input,
        .pm-form-select {
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          font-size: 14px;
          outline: none;
          background: var(--bg-secondary);
          color: var(--text-primary);
          width: 100%;
          box-sizing: border-box;
        }

        .pm-form-input:focus,
        .pm-form-select:focus {
          border-color: #667eea;
        }

        .pm-form-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .pm-form-checkbox input {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #667eea;
        }

        .pm-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .pm-form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .pm-bulk-table-wrapper {
          max-height: 40vh;
          overflow: auto;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          margin-bottom: 12px;
        }

        .pm-bulk-table-scroll {
          overflow-x: auto;
        }

        .pm-bulk-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 780px;
        }

        .pm-bulk-table thead {
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .pm-bulk-table th {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-weight: 600;
          padding: 10px 8px;
          text-align: left;
          border-bottom: 2px solid var(--border-color);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .pm-bulk-table td {
          padding: 6px 4px;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }

        .pm-bulk-row-number {
          text-align: center;
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 12px;
        }

        .pm-bulk-empty {
          padding: 30px 20px !important;
          text-align: center;
        }

        .pm-bulk-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        .pm-bulk-empty-state span {
          font-size: 40px;
          opacity: 0.5;
        }

        .pm-bulk-empty-state p {
          font-size: 14px;
          margin: 0;
        }

        .pm-bulk-input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid transparent;
          border-radius: 4px;
          font-size: 13px;
          outline: none;
          background: transparent;
          color: var(--text-primary);
          transition: all 0.2s;
          min-width: 60px;
          box-sizing: border-box;
        }

        .pm-bulk-input:hover {
          border-color: var(--border-color);
        }

        .pm-bulk-input:focus {
          border-color: #667eea;
          background: var(--bg-secondary);
        }

        .pm-bulk-date {
          min-width: 100px;
        }

        .pm-bulk-date:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pm-bulk-select {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid transparent;
          border-radius: 4px;
          font-size: 13px;
          outline: none;
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
          min-width: 60px;
        }

        .pm-bulk-select:hover {
          border-color: var(--border-color);
        }

        .pm-bulk-select:focus {
          border-color: #667eea;
          background: var(--bg-secondary);
        }

        .pm-bulk-remove {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .pm-bulk-remove:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .dark .pm-bulk-remove:hover {
          background: #7f1d1d;
          color: #fca5a5;
        }

        .pm-bulk-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .pm-bulk-add-row {
          padding: 6px 16px;
          border: 1px dashed var(--border-color);
          border-radius: 8px;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pm-bulk-add-row:hover {
          border-color: #667eea;
          color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }

        .pm-bulk-tip {
          font-size: 12px;
          color: var(--text-secondary);
        }

        @media (max-width: 992px) {
          .pm-header {
            gap: 10px;
          }

          .pm-header-center {
            max-width: 200px;
            min-width: 100px;
          }

          .pm-propositus-section {
            flex-direction: column;
            align-items: stretch;
          }

          .pm-propositus-selector {
            flex-wrap: wrap;
          }

          .pm-propositus-select {
            flex: 1;
            min-width: 150px;
          }

          .pm-propositus-stats {
            justify-content: flex-start;
          }

          .pm-bulk-upload-actions {
            flex-direction: column;
            align-items: stretch;
          }
        }

        @media (max-width: 768px) {
          .pm-wrapper {
            gap: 16px;
          }

          .pm-header {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .pm-header-left {
            justify-content: space-between;
          }

          .pm-header-center {
            max-width: 100%;
          }

          .pm-header-actions {
            width: 100%;
          }

          .pm-header-actions .pm-btn {
            flex: 1;
            text-align: center;
          }

          .pm-propositus-section {
            padding: 12px 16px;
          }

          .pm-propositus-selector {
            flex-direction: column;
            align-items: stretch;
          }

          .pm-propositus-select {
            width: 100%;
          }

          .pm-propositus-stats {
            justify-content: center;
          }

          .pm-grid {
            grid-template-columns: 1fr;
          }

          .pm-card {
            padding: 16px;
          }

          .pm-avatar {
            width: 40px;
            height: 40px;
            font-size: 14px;
          }

          .pm-card-name {
            font-size: 14px;
          }

          .pm-modal {
            padding: 20px;
            max-width: 100%;
          }

          .pm-modal-bulk {
            max-width: 100vw;
            padding: 16px;
          }

          .pm-form-row {
            grid-template-columns: 1fr;
          }

          .pm-form-actions .pm-btn {
            flex: 1;
          }

          .pm-empty-icon {
            font-size: 48px;
          }

          .pm-empty-state h3 {
            font-size: 16px;
          }

          .pm-bulk-table {
            font-size: 12px;
            min-width: 650px;
          }

          .pm-bulk-table th,
          .pm-bulk-table td {
            padding: 4px;
          }

          .pm-bulk-input,
          .pm-bulk-select {
            font-size: 12px;
            padding: 4px 6px;
            min-width: 40px;
          }

          .pm-bulk-date {
            min-width: 80px;
          }

          .pm-bulk-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .pm-bulk-add-row {
            justify-content: center;
          }

          .pm-bulk-upload-actions {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .pm-modal {
            padding: 16px;
          }

          .pm-modal-title {
            font-size: 18px;
          }

          .pm-btn {
            font-size: 12px;
            padding: 6px 12px;
          }

          .pm-title {
            font-size: 20px;
          }

          .pm-stats-inline {
            font-size: 11px;
            padding: 2px 8px;
          }

          .pm-bulk-table {
            min-width: 500px;
          }

          .pm-search {
            font-size: 12px;
            padding: 5px 10px;
            height: 30px;
          }

          .pm-propositus-label {
            font-size: 13px;
          }

          .pm-propositus-select {
            font-size: 13px;
            padding: 4px 10px;
          }

          .pm-stat-item {
            font-size: 11px;
            padding: 2px 8px;
          }

          .pm-bulk-upload-section {
            padding: 12px 16px;
          }

          .pm-bulk-file-info {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default PersonManager;