// src/components/PropertyDivider/modules/PersonManager.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PersonManager = ({ darkMode = false, persons = [], onUpdate }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPerson, setEditingPerson] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    fatherId: '',
    motherId: '',
    spouseId: '',
    isDeceased: false,
    dateOfDeath: '',
    gender: 'Male'
  });

  // Bulk import state - Excel-like table
  const [bulkRows, setBulkRows] = useState([
    { id: 1, name: '', father: '', mother: '', spouse: '', gender: 'Male', isDeceased: 'No', dateOfDeath: '' }
  ]);
  const [nextRowId, setNextRowId] = useState(2);

  const filteredPersons = persons.filter(person =>
    person.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

    const newPerson = {
      id: `p_${Date.now()}`,
      ...formData,
      dateOfDeath: formData.isDeceased ? formData.dateOfDeath : '',
      children: [],
      generation: 0
    };
    
    if (editingPerson) {
      onUpdate(persons.map(p => p.id === editingPerson.id ? newPerson : p));
    } else {
      onUpdate([...persons, newPerson]);
    }
    
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

  // Bulk import handlers
  const addBulkRow = () => {
    setBulkRows([
      ...bulkRows,
      { id: nextRowId, name: '', father: '', mother: '', spouse: '', gender: 'Male', isDeceased: 'No', dateOfDeath: '' }
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
    // Validate rows
    const emptyRows = bulkRows.filter(row => !row.name.trim());
    if (emptyRows.length > 0) {
      alert('Please fill in the Name field for all rows or remove empty rows.');
      return;
    }

    const newPersons = bulkRows.map((row, index) => {
      const isDeceased = row.isDeceased?.toLowerCase() === 'yes';
      return {
        id: `p_${Date.now()}_${index}`,
        name: row.name.trim(),
        fatherId: row.father?.trim() || '',
        motherId: row.mother?.trim() || '',
        spouseId: row.spouse?.trim() || '',
        gender: row.gender || 'Male',
        isDeceased: isDeceased,
        dateOfDeath: isDeceased ? row.dateOfDeath || '' : '',
        children: [],
        generation: 0
      };
    });
    
    onUpdate([...persons, ...newPersons]);
    
    // Reset bulk rows
    setBulkRows([
      { id: 1, name: '', father: '', mother: '', spouse: '', gender: 'Male', isDeceased: 'No', dateOfDeath: '' }
    ]);
    setNextRowId(2);
    setShowBulkAdd(false);
  };

  const handleDelete = (personId) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      onUpdate(persons.filter(p => p.id !== personId));
      if (selectedPerson?.id === personId) setSelectedPerson(null);
    }
  };

  return (
    <div className="pm-wrapper">
      {/* Header - All in one row */}
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
            📋 Bulk Import
          </button>
          <button className="pm-btn pm-btn-primary" onClick={() => setShowAddForm(true)}>
            + Add Person
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="pm-grid">
        {filteredPersons.length > 0 ? (
          filteredPersons.map((person) => {
            const status = getStatusBadge(person);
            const isSelected = selectedPerson?.id === person.id;
            
            return (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`pm-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedPerson(person)}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="pm-card-header">
                  <div className="pm-avatar" style={{
                    background: person.isDeceased 
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
                    </h3>
                    <p className="pm-card-relationship">{getGenerationLabel(person)}</p>
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

      {/* Add/Edit Person Modal */}
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

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {showBulkAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pm-modal-overlay"
            onClick={() => setShowBulkAdd(false)}
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
                  <h2 className="pm-modal-title">📋 Bulk Import Persons</h2>
                  <p className="pm-modal-subtitle">
                    Fill in the table below to add multiple persons at once
                  </p>
                </div>
                <button 
                  className="pm-modal-close"
                  onClick={() => setShowBulkAdd(false)}
                >
                  ✕
                </button>
              </div>

              <div className="pm-bulk-table-wrapper">
                <div className="pm-bulk-table-scroll">
                  <table className="pm-bulk-table">
                    <thead>
                      <tr>
                        <th style={{ width: '30px' }}>#</th>
                        <th style={{ minWidth: '140px' }}>Name *</th>
                        <th style={{ minWidth: '100px' }}>Father</th>
                        <th style={{ minWidth: '100px' }}>Mother</th>
                        <th style={{ minWidth: '100px' }}>Spouse</th>
                        <th style={{ minWidth: '90px' }}>Gender</th>
                        <th style={{ minWidth: '80px' }}>Deceased</th>
                        <th style={{ minWidth: '130px' }}>Date of Death</th>
                        <th style={{ width: '40px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkRows.map((row, index) => (
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
                            <button
                              className="pm-bulk-remove"
                              onClick={() => removeBulkRow(row.id)}
                              title="Remove row"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pm-bulk-actions">
                <button className="pm-bulk-add-row" onClick={addBulkRow}>
                  + Add Row
                </button>
                <div className="pm-bulk-tip">
                  💡 Tip: Name is required. Leave other fields empty for unknown values.
                </div>
              </div>

              <div className="pm-form-actions">
                <button
                  type="button"
                  className="pm-btn pm-btn-secondary"
                  onClick={() => {
                    setShowBulkAdd(false);
                    setBulkRows([
                      { id: 1, name: '', father: '', mother: '', spouse: '', gender: 'Male', isDeceased: 'No', dateOfDeath: '' }
                    ]);
                    setNextRowId(2);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="pm-btn pm-btn-primary"
                  onClick={handleBulkImport}
                  disabled={bulkRows.some(row => !row.name.trim())}
                >
                  Import {bulkRows.filter(row => row.name.trim()).length} Persons
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* PersonManager - Uses Global CSS Variables */
        .pm-wrapper {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: var(--bg-primary);
          color: var(--text-primary);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* Header - All in one row */
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

        /* Buttons - Normal size */
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

        /* Grid */
        .pm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          flex: 1;
          align-content: start;
        }

        /* Card */
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

        /* Empty State */
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

        /* Modal */
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

        /* Bulk Import Table */
        .pm-bulk-table-wrapper {
          max-height: 50vh;
          overflow: auto;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          margin-bottom: 16px;
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

        /* Dark mode overrides */
        .dark .pm-badge-married {
          background: #1a2a3a;
          color: #60a5fa;
        }

        .dark .pm-bulk-table th {
          background: var(--bg-secondary);
        }

        .dark .pm-bulk-input:hover {
          border-color: var(--border-color);
        }

        .dark .pm-bulk-input:focus {
          background: var(--bg-secondary);
          border-color: #667eea;
        }

        .dark .pm-bulk-select:hover {
          border-color: var(--border-color);
        }

        .dark .pm-bulk-select:focus {
          background: var(--bg-secondary);
          border-color: #667eea;
        }

        /* Mobile Responsive */
        @media (max-width: 992px) {
          .pm-header {
            gap: 10px;
          }

          .pm-header-center {
            max-width: 200px;
            min-width: 100px;
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
        }
      `}</style>
    </div>
  );
};

export default PersonManager;