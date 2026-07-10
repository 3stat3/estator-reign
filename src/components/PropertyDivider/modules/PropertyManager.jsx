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
  const [editingProperty, setEditingProperty] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedProperty, setSelectedProperty] = useState(null);

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

  const getCoOwnerName = (ownerId) => {
    if (!ownerId) return '';
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
            const coOwner = getCoOwnerName(property.ownerId);
            
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
        }
      `}</style>
    </div>
  );
};

export default PropertyManager;