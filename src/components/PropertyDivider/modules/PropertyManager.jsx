// src/components/PropertyDivider/modules/PropertyManager.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PropertyManager = ({ 
  darkMode = false, 
  properties = [], 
  persons = [], 
  onUpdate,
  selectedPersonId = null
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkRows, setBulkRows] = useState([{ 
    name: '', 
    totalSqm: '', 
    ownerId: '', 
    type: 'Land', 
    classification: 'Conjugal', 
    location: '', 
    description: '' 
  }]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Land',
    classification: 'Conjugal',
    totalSqm: '',
    ownerId: selectedPersonId || '',
    location: '',
    description: ''
  });

  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return Number(num).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const filteredProperties = properties.filter(prop => {
    const matchesSearch = prop.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || prop.classification === filterType;
    return matchesSearch && matchesFilter;
  });

  const getOwnerName = (ownerId) => {
    if (!ownerId) return 'Unknown';
    const person = persons.find(p => p.id === ownerId);
    return person ? person.name : 'Unknown';
  };

  const getCoOwnerName = (ownerId, classification) => {
    if (!ownerId) return '';
    if (classification !== 'Conjugal') return '';
    const person = persons.find(p => p.id === ownerId);
    if (!person) return '';
    if (person.spouseId) {
      const spouse = persons.find(p => p.id === person.spouseId);
      return spouse ? ` & ${spouse.name}` : '';
    }
    return '';
  };

  const getPropertyOwnershipDisplay = (property) => {
    if (property.classification === 'Conjugal') {
      const owner = persons.find(p => p.id === property.ownerId);
      if (owner && owner.spouseId) {
        const spouse = persons.find(p => p.id === owner.spouseId);
        return `💑 ${owner.name} & ${spouse ? spouse.name : 'spouse'}`;
      }
    }
    return `👤 ${getOwnerName(property.ownerId)}`;
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

  // Bulk row functions
  const addBulkRow = () => {
    setBulkRows([...bulkRows, { 
      name: '', 
      totalSqm: '', 
      ownerId: '', 
      type: 'Land', 
      classification: 'Conjugal', 
      location: '', 
      description: '' 
    }]);
  };

  const removeBulkRow = (index) => {
    if (bulkRows.length <= 1) return;
    setBulkRows(bulkRows.filter((_, i) => i !== index));
  };

  const updateBulkRow = (index, field, value) => {
    const updated = [...bulkRows];
    updated[index][field] = value;
    setBulkRows(updated);
    setBulkErrors([]);
  };

  const handleBulkUploadTable = () => {
    const errors = [];
    const newProperties = [];

    bulkRows.forEach((row, index) => {
      const lineNum = index + 1;
      
      // Validate required fields
      if (!row.name.trim()) {
        errors.push(`Row ${lineNum}: Missing property name`);
        return;
      }
      if (!row.totalSqm || parseFloat(row.totalSqm) <= 0) {
        errors.push(`Row ${lineNum}: Invalid totalSqm (must be a positive number)`);
        return;
      }
      if (!row.ownerId) {
        errors.push(`Row ${lineNum}: Missing owner selection`);
        return;
      }

      // Check if owner exists
      const owner = persons.find(p => p.id === row.ownerId);
      if (!owner) {
        errors.push(`Row ${lineNum}: Owner not found`);
        return;
      }

      newProperties.push({
        id: `pr_${Date.now()}_${index}`,
        name: row.name.trim(),
        type: row.type || 'Land',
        classification: row.classification || 'Conjugal',
        totalSqm: parseFloat(row.totalSqm),
        ownerId: row.ownerId,
        location: row.location || '',
        description: row.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    if (errors.length > 0) {
      setBulkErrors(errors);
      return;
    }

    // Clear errors and add properties
    setBulkErrors([]);
    onUpdate([...properties, ...newProperties]);
    setBulkRows([{ 
      name: '', 
      totalSqm: '', 
      ownerId: '', 
      type: 'Land', 
      classification: 'Conjugal', 
      location: '', 
      description: '' 
    }]);
    setShowBulkUpload(false);
    
    alert(`✅ Successfully added ${newProperties.length} property(ies)!`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a property name.');
      return;
    }
    if (!formData.totalSqm || parseFloat(formData.totalSqm) <= 0) {
      alert('Please enter a valid total size in square meters.');
      return;
    }
    if (!formData.ownerId) {
      alert('Please select an owner.');
      return;
    }

    const newProperty = {
      id: `pr_${Date.now()}`,
      ...formData,
      totalSqm: parseFloat(formData.totalSqm),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingProperty) {
      onUpdate(properties.map(p => p.id === editingProperty.id ? { ...newProperty, id: p.id, createdAt: p.createdAt } : p));
    } else {
      onUpdate([...properties, newProperty]);
    }

    setFormData({
      name: '',
      type: 'Land',
      classification: 'Conjugal',
      totalSqm: '',
      ownerId: selectedPersonId || '',
      location: '',
      description: ''
    });
    setShowAddForm(false);
    setEditingProperty(null);
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name || '',
      type: property.type || 'Land',
      classification: property.classification || 'Conjugal',
      totalSqm: property.totalSqm || '',
      ownerId: property.ownerId || '',
      location: property.location || '',
      description: property.description || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      onUpdate(properties.filter(p => p.id !== propertyId));
      if (selectedProperty?.id === propertyId) setSelectedProperty(null);
    }
  };

  const getTotalEstate = () => {
    return properties.reduce((sum, p) => sum + (p.totalSqm || 0), 0);
  };

  const getConjugalTotal = () => {
    return properties
      .filter(p => p.classification === 'Conjugal')
      .reduce((sum, p) => sum + (p.totalSqm || 0), 0);
  };

  const getExclusiveTotal = () => {
    return properties
      .filter(p => p.classification === 'Exclusive')
      .reduce((sum, p) => sum + (p.totalSqm || 0), 0);
  };

  const totalEstate = getTotalEstate();
  const conjugalTotal = getConjugalTotal();
  const exclusiveTotal = getExclusiveTotal();

  return (
    <div className="pr-wrapper">
      <div className="pr-header">
        <div className="pr-header-left">
          <h1 className="pr-title">🏠 Properties</h1>
          <span className="pr-stats-inline">
            📦 {properties.length} · 💑 {conjugalTotal > 0 ? `${formatNumber(conjugalTotal)} sqm` : '0'} · 🏛️ {exclusiveTotal > 0 ? `${formatNumber(exclusiveTotal)} sqm` : '0'}
          </span>
        </div>
        
        <div className="pr-header-center">
          <input
            type="text"
            placeholder="🔍 Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-search"
          />
        </div>
        
        <div className="pr-header-actions">
          <button 
            className="pr-btn pr-btn-secondary"
            onClick={() => {
              setBulkRows([{ 
                name: '', 
                totalSqm: '', 
                ownerId: '', 
                type: 'Land', 
                classification: 'Conjugal', 
                location: '', 
                description: '' 
              }]);
              setBulkErrors([]);
              setShowBulkUpload(true);
            }}
          >
            📤 Bulk Upload
          </button>
          <button 
            className="pr-btn pr-btn-primary" 
            onClick={() => {
              setEditingProperty(null);
              setFormData({
                name: '',
                type: 'Land',
                classification: 'Conjugal',
                totalSqm: '',
                ownerId: selectedPersonId || '',
                location: '',
                description: ''
              });
              setShowAddForm(true);
            }}
          >
            + Add Property
          </button>
        </div>
      </div>

      <div className="pr-filters">
        <button 
          className={`pr-filter-btn ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          All ({properties.length})
        </button>
        <button 
          className={`pr-filter-btn ${filterType === 'Conjugal' ? 'active' : ''}`}
          onClick={() => setFilterType('Conjugal')}
        >
          💑 Conjugal ({properties.filter(p => p.classification === 'Conjugal').length})
        </button>
        <button 
          className={`pr-filter-btn ${filterType === 'Exclusive' ? 'active' : ''}`}
          onClick={() => setFilterType('Exclusive')}
        >
          🏛️ Exclusive ({properties.filter(p => p.classification === 'Exclusive').length})
        </button>
        <span className="pr-total-estate">
          Total: {formatNumber(totalEstate)} sqm
        </span>
      </div>

      <div className="pr-grid">
        {filteredProperties.length > 0 ? (
          filteredProperties.map((property) => {
            const isSelected = selectedProperty?.id === property.id;
            const ownerName = getOwnerName(property.ownerId);
            const coOwner = getCoOwnerName(property.ownerId, property.classification);
            
            return (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`pr-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedProperty(property)}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="pr-card-header">
                  <div className="pr-card-icon">
                    {property.type === 'Building' ? '🏢' : '🌾'}
                  </div>
                  <div>
                    <h3 className="pr-card-name">{property.name}</h3>
                    <p className="pr-card-type">{property.type || 'Property'}</p>
                  </div>
                  <div className="pr-card-size">{formatNumber(property.totalSqm)} sqm</div>
                </div>
                
                <div className="pr-card-details">
                  <span className={`pr-badge pr-badge-${property.classification?.toLowerCase() || 'unknown'}`}>
                    {property.classification || 'Unknown'}
                  </span>
                  <span className="pr-badge pr-badge-muted">
                    👤 {ownerName}{coOwner}
                  </span>
                  {property.location && (
                    <span className="pr-badge pr-badge-location">
                      📍 {property.location}
                    </span>
                  )}
                  <span className="pr-badge pr-badge-date">
                    📅 Added: {formatDate(property.createdAt)}
                  </span>
                </div>

                <div className="pr-card-actions">
                  <button 
                    className="pr-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(property);
                    }}
                  >
                    ✏️
                  </button>
                  <button 
                    className="pr-icon-btn pr-icon-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(property.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="pr-empty-state">
            <div className="pr-empty-icon">🏠</div>
            <h3>No properties added yet</h3>
            <p>Click the "Add Property" button to start adding properties</p>
          </div>
        )}
      </div>

      {/* Add/Edit Property Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pr-modal-overlay"
            onClick={() => {
              setShowAddForm(false);
              setEditingProperty(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="pr-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="pr-modal-title">
                {editingProperty ? '✏️ Edit Property' : '➕ Add Property'}
              </h2>
              <p className="pr-modal-subtitle">
                {editingProperty 
                  ? 'Update the property details' 
                  : 'Enter the details of the property to add'}
              </p>

              <form onSubmit={handleSubmit}>
                <div className="pr-form-group">
                  <label className="pr-form-label">Property Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Family House, Farm Land"
                    className="pr-form-input"
                    required
                  />
                </div>

                <div className="pr-form-row">
                  <div className="pr-form-group">
                    <label className="pr-form-label">Property Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="pr-form-select"
                    >
                      <option value="Land">🌾 Land</option>
                      <option value="Building">🏢 Building</option>
                    </select>
                  </div>
                  <div className="pr-form-group">
                    <label className="pr-form-label">Classification *</label>
                    <select
                      value={formData.classification}
                      onChange={(e) => setFormData({...formData, classification: e.target.value})}
                      className="pr-form-select"
                    >
                      <option value="Conjugal">💑 Conjugal</option>
                      <option value="Exclusive">🏛️ Exclusive</option>
                    </select>
                  </div>
                </div>

                <div className="pr-form-row">
                  <div className="pr-form-group">
                    <label className="pr-form-label">Total Size (sqm) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.totalSqm}
                      onChange={(e) => setFormData({...formData, totalSqm: e.target.value})}
                      placeholder="e.g., 250.50"
                      className="pr-form-input"
                      required
                    />
                  </div>
                  <div className="pr-form-group">
                    <label className="pr-form-label">Owner *</label>
                    <select
                      value={formData.ownerId}
                      onChange={(e) => setFormData({...formData, ownerId: e.target.value})}
                      className="pr-form-select"
                    >
                      <option value="">— Select owner —</option>
                      {persons.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.isDeceased ? '⚰️' : '💚'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pr-form-group">
                  <label className="pr-form-label">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Manila, Philippines"
                    className="pr-form-input"
                  />
                </div>

                <div className="pr-form-group">
                  <label className="pr-form-label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Additional details about the property..."
                    className="pr-form-textarea"
                  />
                </div>

                <div className="pr-form-actions">
                  <button
                    type="button"
                    className="pr-btn pr-btn-secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingProperty(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="pr-btn pr-btn-primary">
                    {editingProperty ? 'Update Property' : 'Add Property'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Upload Modal */}
      <AnimatePresence>
        {showBulkUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pr-modal-overlay"
            onClick={() => {
              setShowBulkUpload(false);
              setBulkErrors([]);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="pr-modal pr-modal-wide"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="pr-modal-title">📤 Bulk Upload Properties</h2>
              <p className="pr-modal-subtitle">
                Add multiple properties at once using the table below. Each row represents one property.
              </p>

              <div className="pr-bulk-table-container">
                <div className="pr-bulk-table-scroll">
                  <table className="pr-bulk-table">
                    <thead>
                      <tr>
                        <th>Name *</th>
                        <th>Total Sqm *</th>
                        <th>Owner *</th>
                        <th>Type</th>
                        <th>Classification</th>
                        <th>Location</th>
                        <th>Description</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkRows.map((row, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => updateBulkRow(index, 'name', e.target.value)}
                              placeholder="Property name"
                              className="pr-bulk-input"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              value={row.totalSqm}
                              onChange={(e) => updateBulkRow(index, 'totalSqm', e.target.value)}
                              placeholder="0.00"
                              className="pr-bulk-input pr-bulk-number"
                            />
                          </td>
                          <td>
                            <select
                              value={row.ownerId}
                              onChange={(e) => updateBulkRow(index, 'ownerId', e.target.value)}
                              className="pr-bulk-select"
                            >
                              <option value="">Select</option>
                              {persons.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} {p.isDeceased ? '⚰️' : ''}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              value={row.type}
                              onChange={(e) => updateBulkRow(index, 'type', e.target.value)}
                              className="pr-bulk-select"
                            >
                              <option value="Land">Land</option>
                              <option value="Building">Building</option>
                            </select>
                          </td>
                          <td>
                            <select
                              value={row.classification}
                              onChange={(e) => updateBulkRow(index, 'classification', e.target.value)}
                              className="pr-bulk-select"
                            >
                              <option value="Conjugal">Conjugal</option>
                              <option value="Exclusive">Exclusive</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.location}
                              onChange={(e) => updateBulkRow(index, 'location', e.target.value)}
                              placeholder="Location"
                              className="pr-bulk-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.description}
                              onChange={(e) => updateBulkRow(index, 'description', e.target.value)}
                              placeholder="Description"
                              className="pr-bulk-input"
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="pr-bulk-remove-row"
                              onClick={() => removeBulkRow(index)}
                              disabled={bulkRows.length <= 1}
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

              {bulkErrors.length > 0 && (
                <div className="pr-bulk-errors">
                  <h4>❌ Errors Found:</h4>
                  <ul>
                    {bulkErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pr-bulk-actions">
                <button
                  type="button"
                  className="pr-btn pr-btn-secondary"
                  onClick={addBulkRow}
                >
                  + Add Row
                </button>
                <span className="pr-bulk-row-count">{bulkRows.length} row{bulkRows.length > 1 ? 's' : ''}</span>
              </div>

              <div className="pr-form-actions">
                <button
                  type="button"
                  className="pr-btn pr-btn-secondary"
                  onClick={() => {
                    setShowBulkUpload(false);
                    setBulkErrors([]);
                    setBulkRows([{ 
                      name: '', 
                      totalSqm: '', 
                      ownerId: '', 
                      type: 'Land', 
                      classification: 'Conjugal', 
                      location: '', 
                      description: '' 
                    }]);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="pr-btn pr-btn-primary"
                  onClick={handleBulkUploadTable}
                >
                  Upload {bulkRows.length} Properties
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .pr-wrapper {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: var(--bg-primary);
          color: var(--text-primary);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .pr-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .pr-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .pr-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
        }

        .pr-stats-inline {
          font-size: 13px;
          color: var(--text-secondary);
          background: var(--bg-secondary);
          padding: 4px 12px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          white-space: nowrap;
        }

        .pr-header-center {
          flex: 1;
          max-width: 300px;
          min-width: 120px;
        }

        .pr-search {
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

        .pr-search:focus {
          border-color: #667eea;
        }

        .pr-header-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .pr-btn {
          padding: 8px 18px;
          border-radius: 8px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .pr-btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #ffffff;
        }

        .pr-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .pr-btn-secondary {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .pr-btn-secondary:hover {
          background: var(--border-color);
        }

        .pr-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pr-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          padding: 8px 0;
        }

        .pr-filter-btn {
          padding: 4px 14px;
          border-radius: 20px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .pr-filter-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #ffffff;
          border-color: transparent;
        }

        .pr-filter-btn:hover:not(.active) {
          background: var(--border-color);
        }

        .pr-total-estate {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-left: auto;
          padding: 4px 12px;
          background: var(--bg-secondary);
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }

        .pr-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          flex: 1;
          align-content: start;
        }

        .pr-card {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 16px 18px;
          border: 2px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow);
          position: relative;
        }

        .pr-card.selected {
          border-color: #667eea;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
        }

        .pr-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .pr-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .pr-card-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .pr-card-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .pr-card-type {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
        }

        .pr-card-size {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin-left: auto;
          white-space: nowrap;
        }

        .pr-card-details {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          font-size: 11px;
        }

        .pr-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          display: inline-block;
        }

        .pr-badge-conjugal {
          background: #eff6ff;
          color: #3b82f6;
        }

        .pr-badge-exclusive {
          background: #fef2f2;
          color: #dc2626;
        }

        .pr-badge-muted {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .pr-badge-location {
          background: #fef3c7;
          color: #d97706;
        }

        .pr-badge-date {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .dark .pr-badge-conjugal {
          background: #1a2a3a;
          color: #60a5fa;
        }

        .dark .pr-badge-exclusive {
          background: #2d1f1f;
          color: #f87171;
        }

        .dark .pr-badge-location {
          background: #3d2a1a;
          color: #fbbf24;
        }

        .pr-card-actions {
          position: absolute;
          top: 6px;
          right: 6px;
          display: flex;
          gap: 2px;
        }

        .pr-icon-btn {
          padding: 3px 6px;
          border-radius: 4px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 12px;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }

        .pr-icon-btn:hover {
          background: var(--border-color);
        }

        .pr-icon-delete:hover {
          color: #dc2626;
        }

        .pr-empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          color: var(--text-secondary);
        }

        .pr-empty-icon {
          font-size: 56px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .pr-empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 6px 0;
        }

        .pr-empty-state p {
          font-size: 14px;
          margin: 0;
          color: var(--text-secondary);
        }

        /* Modal Styles */
        .pr-modal-overlay {
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

        .pr-modal {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 28px;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
        }

        .pr-modal-wide {
          max-width: 820px;
        }

        .pr-modal-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px 0;
        }

        .pr-modal-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 20px 0;
        }

        .pr-form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 14px;
        }

        .pr-form-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .pr-form-input,
        .pr-form-select {
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

        .pr-form-input:focus,
        .pr-form-select:focus {
          border-color: #667eea;
        }

        .pr-form-textarea {
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          font-size: 14px;
          outline: none;
          background: var(--bg-secondary);
          color: var(--text-primary);
          min-height: 80px;
          resize: vertical;
          width: 100%;
          box-sizing: border-box;
        }

        .pr-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .pr-form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        /* Bulk Table Styles */
        .pr-bulk-table-container {
          border: 1px solid var(--border-color);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .pr-bulk-table-scroll {
          overflow-x: auto;
          max-height: 400px;
          overflow-y: auto;
        }

        .pr-bulk-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 700px;
        }

        .pr-bulk-table thead {
          background: var(--bg-secondary);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .pr-bulk-table th {
          padding: 8px 6px;
          text-align: left;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: var(--text-secondary);
          border-bottom: 2px solid var(--border-color);
          white-space: nowrap;
        }

        .pr-bulk-table td {
          padding: 4px 4px;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }

        .pr-bulk-table tr:last-child td {
          border-bottom: none;
        }

        .pr-bulk-input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid transparent;
          border-radius: 4px;
          font-size: 12px;
          background: transparent;
          color: var(--text-primary);
          transition: all 0.2s;
          min-width: 60px;
        }

        .pr-bulk-input:hover {
          background: var(--bg-secondary);
        }

        .pr-bulk-input:focus {
          border-color: #667eea;
          background: var(--bg-secondary);
          outline: none;
        }

        .pr-bulk-number {
          text-align: right;
          font-variant-numeric: tabular-nums;
          min-width: 70px;
        }

        .pr-bulk-select {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid transparent;
          border-radius: 4px;
          font-size: 12px;
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
          min-width: 70px;
        }

        .pr-bulk-select:hover {
          background: var(--bg-secondary);
        }

        .pr-bulk-select:focus {
          border-color: #667eea;
          background: var(--bg-secondary);
          outline: none;
        }

        .pr-bulk-remove-row {
          padding: 2px 6px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .pr-bulk-remove-row:hover:not(:disabled) {
          background: rgba(220, 38, 38, 0.1);
          color: #dc2626;
        }

        .pr-bulk-remove-row:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .pr-bulk-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .pr-bulk-row-count {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .pr-bulk-errors {
          background: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }

        .pr-bulk-errors h4 {
          font-size: 13px;
          font-weight: 600;
          color: #dc2626;
          margin: 0 0 6px 0;
        }

        .pr-bulk-errors ul {
          margin: 0;
          padding-left: 20px;
          font-size: 12px;
          color: #dc2626;
        }

        .pr-bulk-errors li {
          margin: 2px 0;
        }

        /* Dark mode */
        [data-theme="dark"] .pr-bulk-table thead {
          background: var(--bg-primary);
        }

        [data-theme="dark"] .pr-bulk-input,
        [data-theme="dark"] .pr-bulk-select {
          color: var(--text-primary);
        }

        [data-theme="dark"] .pr-bulk-input:hover,
        [data-theme="dark"] .pr-bulk-select:hover {
          background: var(--bg-secondary);
        }

        @media (max-width: 768px) {
          .pr-wrapper {
            gap: 16px;
          }

          .pr-header {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .pr-header-left {
            justify-content: space-between;
          }

          .pr-header-center {
            max-width: 100%;
          }

          .pr-header-actions {
            width: 100%;
          }

          .pr-header-actions .pr-btn {
            flex: 1;
            text-align: center;
            font-size: 12px;
            padding: 6px 12px;
          }

          .pr-title {
            font-size: 20px;
          }

          .pr-stats-inline {
            font-size: 11px;
            padding: 2px 8px;
          }

          .pr-filters {
            justify-content: center;
          }

          .pr-total-estate {
            width: 100%;
            text-align: center;
          }

          .pr-grid {
            grid-template-columns: 1fr;
          }

          .pr-card {
            padding: 14px;
          }

          .pr-card-name {
            font-size: 14px;
          }

          .pr-modal {
            padding: 20px;
            max-width: 100%;
          }

          .pr-modal-wide {
            max-width: 100%;
          }

          .pr-form-row {
            grid-template-columns: 1fr;
          }

          .pr-form-actions .pr-btn {
            flex: 1;
          }

          .pr-empty-icon {
            font-size: 40px;
          }

          .pr-empty-state h3 {
            font-size: 16px;
          }

          .pr-search {
            font-size: 12px;
            padding: 5px 10px;
            height: 30px;
          }

          .pr-bulk-table {
            font-size: 11px;
            min-width: 500px;
          }
          
          .pr-bulk-input,
          .pr-bulk-select {
            font-size: 11px;
            padding: 4px 6px;
            min-width: 50px;
          }
          
          .pr-bulk-table th {
            font-size: 9px;
            padding: 6px 4px;
          }
          
          .pr-bulk-table td {
            padding: 3px 3px;
          }
        }

        @media (max-width: 480px) {
          .pr-modal {
            padding: 16px;
          }

          .pr-modal-title {
            font-size: 18px;
          }

          .pr-btn {
            font-size: 12px;
            padding: 6px 12px;
          }

          .pr-filter-btn {
            font-size: 11px;
            padding: 3px 10px;
          }

          .pr-bulk-table {
            font-size: 10px;
            min-width: 400px;
          }
          
          .pr-bulk-input,
          .pr-bulk-select {
            font-size: 10px;
            padding: 3px 4px;
            min-width: 40px;
          }
          
          .pr-bulk-table th {
            font-size: 8px;
            padding: 4px 3px;
          }
        }
      `}</style>
    </div>
  );
};

export default PropertyManager;