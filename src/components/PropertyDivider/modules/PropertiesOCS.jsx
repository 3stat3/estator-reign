// src/components/PropertyDivider/modules/PropertiesOCS.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PropertiesOCS = ({ 
  darkMode = false,
  persons = [],
  properties = [],
  deathEvents = [],
  propositusId = null,
  isOpen = false,
  onClose = () => {}
}) => {
  const [personData, setPersonData] = useState([]);
  const [editingZV, setEditingZV] = useState({});
  const [editingFMV, setEditingFMV] = useState({});
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [expandedAll, setExpandedAll] = useState(false);

  // Format number with commas
  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return Number(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Format currency
  const formatCurrency = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '₱0.00';
    return '₱' + Number(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Get ZV per sqm
  const getZVPerSqm = (propertyId) => {
    return editingZV[propertyId] || 0;
  };

  // Calculate Total ZV
  const calculateTotalZV = (property) => {
    const zvPerSqm = getZVPerSqm(property.id);
    return (property.totalSqm || 0) * zvPerSqm;
  };

  // Get highest value (Total ZV vs FMV)
  const getHighestValue = (property) => {
    const totalZV = calculateTotalZV(property);
    const fmv = editingFMV[property.id] || 0;
    return Math.max(totalZV, fmv);
  };

// Initialize person data from death events
useEffect(() => {
  if (!isOpen) return;

  const data = deathEvents
    .filter(event => event.totalEstate > 0)
    .map(event => {
      // Check if this person is the propositus
      const isPropositus = event.person.id === propositusId;
      
      // Find properties owned by this person
      const personProperties = properties.filter(p => p.ownerId === event.person.id);
      
      // For conjugal properties, we need special handling
      let conjugalProperties = [];
      
      if (isPropositus) {
        // For the Propositus: show the FULL conjugal property (100%)
        conjugalProperties = properties.filter(p => 
          p.classification === 'Conjugal' && 
          (p.ownerId === event.person.id || p.ownerId === event.person.spouseId)
        ).map(p => ({
          ...p,
          // Keep the full totalSqm, don't split
          totalSqm: p.totalSqm,
          isFullProperty: true // Flag to indicate this is the full property
        }));
      } else {
        // For other persons: show only their conjugal share (50%)
        conjugalProperties = properties.filter(p => 
          p.classification === 'Conjugal' && 
          (p.ownerId === event.person.id || p.ownerId === event.person.spouseId)
        ).map(p => ({
          ...p,
          // Only show their 50% share
          totalSqm: p.totalSqm / 2,
          isHalfShare: true // Flag to indicate this is a half share
        }));
      }

      // Combine all properties
      let allProperties = [...personProperties, ...conjugalProperties];
      
      // Remove duplicates (if a property appears in both lists)
      const uniqueProperties = allProperties.filter((p, index, self) => 
        index === self.findIndex(t => t.id === p.id)
      );

      // If the person has estate but no direct properties, create a virtual property
      if (uniqueProperties.length === 0 && event.totalEstate > 0) {
        const virtualProperty = {
          id: `virtual_${event.person.id}`,
          name: 'Inherited Estate',
          type: 'Inherited',
          classification: 'Inherited',
          totalSqm: event.totalEstate,
          ownerId: event.person.id,
          isVirtual: true
        };
        uniqueProperties.push(virtualProperty);
      }

      return {
        person: event.person,
        properties: uniqueProperties,
        totalEstate: event.totalEstate,
        isPropositus: isPropositus
      };
    });

  setPersonData(data);

}, [isOpen, deathEvents, properties, propositusId]);

  // Handle ZV change
  const handleZVChange = (propertyId, value) => {
    const numValue = parseFloat(value) || 0;
    setEditingZV(prev => ({
      ...prev,
      [propertyId]: numValue
    }));
  };

  // Handle FMV change
  const handleFMVChange = (propertyId, value) => {
    const numValue = parseFloat(value) || 0;
    setEditingFMV(prev => ({
      ...prev,
      [propertyId]: numValue
    }));
  };

  // Calculate totals for a person
  const calculatePersonTotals = (properties) => {
    let totalZV = 0;
    let totalFMV = 0;
    let totalHighest = 0;

    properties.forEach(p => {
      const zv = calculateTotalZV(p);
      const fmv = editingFMV[p.id] || 0;
      totalZV += zv;
      totalFMV += fmv;
      totalHighest += Math.max(zv, fmv);
    });

    return { totalZV, totalFMV, totalHighest };
  };

  // Toggle expand all
  const toggleExpandAll = () => {
    setExpandedAll(!expandedAll);
    if (!expandedAll) {
      setSelectedPerson(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="ocs-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="ocs-modal"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ocs-modal-header">
              <div className="ocs-modal-header-left">
                <div className="ocs-modal-icon">📄</div>
                <div>
                  <h2 className="ocs-modal-title">Properties for OCS</h2>
                  <p className="ocs-modal-subtitle">
                    Properties to appear in the Office of the City/Municipal Assessor
                  </p>
                </div>
              </div>
              <button className="ocs-modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="ocs-modal-body">
              {personData.length === 0 ? (
                <div className="ocs-empty-state">
                  <div className="ocs-empty-icon">📄</div>
                  <h3>No properties found</h3>
                  <p>No deceased persons with properties to display.</p>
                </div>
              ) : (
                <>
                  <div className="ocs-controls">
                    <button 
                      className="ocs-btn ocs-btn-expand"
                      onClick={toggleExpandAll}
                    >
                      {expandedAll ? '🔼 Collapse All' : '🔽 Expand All'}
                    </button>
                    <span className="ocs-controls-info">
                      {personData.length} person{personData.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {personData.map((item, personIndex) => {
                    const { totalZV, totalFMV, totalHighest } = calculatePersonTotals(item.properties);
                    const isExpanded = expandedAll || selectedPerson === personIndex;

                    return (
                      <div key={personIndex} className="ocs-person-section">
                        <div 
                          className={`ocs-person-header ${isExpanded ? 'ocs-person-header-expanded' : ''}`}
                          onClick={() => {
                            if (!expandedAll) {
                              setSelectedPerson(isExpanded ? null : personIndex);
                            }
                          }}
                          style={{ cursor: expandedAll ? 'default' : 'pointer' }}
                        >
                          <div className="ocs-person-info">
                            <span className="ocs-person-avatar" style={{
                              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                            }}>
                              {item.person.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                            <div>
                              <span className="ocs-person-name">{item.person.name}</span>
                              <span className="ocs-person-death">⚰️ Died: {item.person.dateOfDeath ? new Date(item.person.dateOfDeath).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}</span>
                            </div>
                          </div>
                          <div className="ocs-person-totals">
                            <span className="ocs-person-total">Total: {formatCurrency(totalHighest)}</span>
                            {!expandedAll && (
                              <span className="ocs-expand-icon">{isExpanded ? '▲' : '▼'}</span>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="ocs-table-wrapper">
                            <div className="ocs-table-scroll">
                              <table className="ocs-table">
                                <thead>
                                  <tr>
                                    <th>Property(ies)</th>
                                    <th>Exclusive</th>
                                    <th>Conjugal</th>
                                    <th>ZV</th>
                                    <th>Total ZV</th>
                                    <th>Fair Market Value</th>
                                    <th>Highest</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.properties.map((prop, propIndex) => {
                                    const zvPerSqm = getZVPerSqm(prop.id);
                                    const totalZV = calculateTotalZV(prop);
                                    const fmv = editingFMV[prop.id] || 0;
                                    const highest = Math.max(totalZV, fmv);
                                    const isConjugal = prop.classification === 'Conjugal';
                                    const isExclusive = prop.classification === 'Exclusive';

                                    return (
                                      <tr key={prop.id || propIndex}>
                                        <td className="ocs-prop-name">
                                            {propIndex + 1}. {prop.name || 'Unnamed Property'}
                                            {prop.isFullProperty && <span className="ocs-prop-badge ocs-prop-badge-full">100%</span>}
                                            {prop.isHalfShare && <span className="ocs-prop-badge ocs-prop-badge-half">50% Share</span>}
                                            {prop.isVirtual && <span className="ocs-prop-badge ocs-prop-badge-inherited">Inherited</span>}
                                        </td>
                                        <td className="ocs-prop-exclusive">
                                          {isExclusive ? `${formatNumber(prop.totalSqm)} sqm` : ''}
                                        </td>
                                        <td className="ocs-prop-conjugal">
                                          {isConjugal ? `${formatNumber(prop.totalSqm)} sqm` : ''}
                                        </td>
                                        <td className="ocs-prop-zv">
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={zvPerSqm || ''}
                                            onChange={(e) => handleZVChange(prop.id, e.target.value)}
                                            placeholder="0.00"
                                            className="ocs-zv-input"
                                          />
                                        </td>
                                        <td className="ocs-prop-total-zv">
                                          {totalZV > 0 ? formatCurrency(totalZV) : '—'}
                                        </td>
                                        <td className="ocs-prop-fmv">
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={fmv || ''}
                                            onChange={(e) => handleFMVChange(prop.id, e.target.value)}
                                            placeholder="Enter FMV"
                                            className="ocs-fmv-input"
                                          />
                                        </td>
                                        <td className="ocs-prop-highest">
                                          <strong>{formatCurrency(highest)}</strong>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {/* Totals Row */}
                                  <tr className="ocs-total-row">
                                    <td colSpan="4" className="ocs-total-label">
                                      <strong>TOTAL</strong>
                                    </td>
                                    <td className="ocs-total-value">
                                      <strong>{formatCurrency(totalZV)}</strong>
                                    </td>
                                    <td className="ocs-total-value">
                                      <strong>{formatCurrency(totalFMV)}</strong>
                                    </td>
                                    <td className="ocs-total-value ocs-total-highlight">
                                      <strong>{formatCurrency(totalHighest)}</strong>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="ocs-modal-footer">
              <div className="ocs-footer-left">
                <span className="ocs-footer-note">
                  💡 Click on a person to expand/collapse their properties
                </span>
              </div>
              <div className="ocs-footer-right">
                <button className="ocs-btn ocs-btn-secondary" onClick={onClose}>
                  Close
                </button>
                <button className="ocs-btn ocs-btn-primary" onClick={() => {
                  // TODO: Export or save functionality
                  alert('📤 Export to OCS format coming soon!');
                }}>
                  📤 Export
                </button>
              </div>
            </div>

            <style>{`
              /* ============================================================
                 OCS MODAL - OVERLAY
                 ============================================================ */
              .ocs-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(15, 23, 42, 0.6);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 3000;
                padding: 20px;
              }

              .ocs-modal {
                background: var(--card-bg, #ffffff);
                border-radius: 16px;
                max-width: 1100px;
                width: 100%;
                max-height: 92vh;
                overflow: hidden;
                box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
                border: 1px solid var(--border-color, #e2e8f0);
                display: flex;
                flex-direction: column;
              }

              /* ============================================================
                 MODAL HEADER
                 ============================================================ */
              .ocs-modal-header {
                padding: 18px 24px;
                border-bottom: 1px solid var(--border-color, #e2e8f0);
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                background: var(--bg-secondary, #f8fafc);
                flex-shrink: 0;
                gap: 12px;
              }

              .ocs-modal-header-left {
                display: flex;
                align-items: center;
                gap: 14px;
              }

              .ocs-modal-icon {
                font-size: 28px;
                flex-shrink: 0;
              }

              .ocs-modal-title {
                font-size: 18px;
                font-weight: 700;
                color: var(--text-primary, #0f172a);
                margin: 0;
              }

              .ocs-modal-subtitle {
                font-size: 13px;
                color: var(--text-secondary, #64748b);
                margin: 2px 0 0 0;
              }

              .ocs-modal-close {
                background: none;
                border: none;
                font-size: 22px;
                color: var(--text-secondary, #64748b);
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 6px;
                transition: all 0.2s;
                line-height: 1;
                flex-shrink: 0;
              }

              .ocs-modal-close:hover {
                background: var(--border-color, #e2e8f0);
              }

              /* ============================================================
                 MODAL BODY
                 ============================================================ */
              .ocs-modal-body {
                padding: 20px 24px;
                overflow-y: auto;
                flex: 1;
              }

              .ocs-modal-body::-webkit-scrollbar {
                width: 6px;
              }

              .ocs-modal-body::-webkit-scrollbar-track {
                background: var(--bg-secondary, #f1f5f9);
                border-radius: 3px;
              }

              .ocs-modal-body::-webkit-scrollbar-thumb {
                background: var(--border-color, #e2e8f0);
                border-radius: 3px;
              }

              /* ============================================================
                 EMPTY STATE
                 ============================================================ */
              .ocs-empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                text-align: center;
                color: var(--text-secondary, #64748b);
              }

              .ocs-empty-icon {
                font-size: 56px;
                margin-bottom: 16px;
                opacity: 0.5;
              }

              .ocs-empty-state h3 {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary, #0f172a);
                margin: 0 0 6px 0;
              }

              .ocs-empty-state p {
                font-size: 14px;
                margin: 0;
              }

              /* ============================================================
                 CONTROLS
                 ============================================================ */
              .ocs-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                flex-wrap: wrap;
                gap: 10px;
              }

              .ocs-controls-info {
                font-size: 13px;
                color: var(--text-secondary, #64748b);
              }

              /* ============================================================
                 PERSON SECTION
                 ============================================================ */
              .ocs-person-section {
                margin-bottom: 12px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 10px;
                overflow: hidden;
                background: var(--card-bg, #ffffff);
              }

              .ocs-person-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: var(--bg-secondary, #f8fafc);
                cursor: pointer;
                transition: all 0.2s ease;
                gap: 12px;
                flex-wrap: wrap;
              }

              .ocs-person-header:hover {
                background: var(--hover-bg, #f1f5f9);
              }

              .ocs-person-header-expanded {
                border-bottom: 1px solid var(--border-color, #e2e8f0);
              }

              .ocs-person-info {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
                min-width: 0;
              }

              .ocs-person-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
                color: white;
                flex-shrink: 0;
              }

              .ocs-person-name {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary, #0f172a);
              }

              .ocs-person-death {
                font-size: 11px;
                color: var(--text-secondary, #64748b);
                display: block;
              }

              .ocs-person-totals {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-shrink: 0;
              }

              .ocs-person-total {
                font-size: 13px;
                font-weight: 600;
                color: #6366f1;
                white-space: nowrap;
              }

              .ocs-expand-icon {
                font-size: 12px;
                color: var(--text-secondary, #64748b);
                transition: transform 0.2s ease;
              }

              /* ============================================================
                 TABLE
                 ============================================================ */
              .ocs-table-wrapper {
                padding: 0;
                overflow: hidden;
              }

              .ocs-table-scroll {
                overflow-x: auto;
                padding: 0 4px 4px 4px;
              }

              .ocs-table-scroll::-webkit-scrollbar {
                height: 4px;
              }

              .ocs-table-scroll::-webkit-scrollbar-track {
                background: var(--bg-secondary, #f1f5f9);
                border-radius: 2px;
              }

              .ocs-table-scroll::-webkit-scrollbar-thumb {
                background: var(--border-color, #e2e8f0);
                border-radius: 2px;
              }

              .ocs-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
                min-width: 680px;
              }

              .ocs-table thead {
                background: var(--bg-secondary, #f8fafc);
              }

              .ocs-table th {
                padding: 10px 12px;
                text-align: left;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.4px;
                color: var(--text-secondary, #64748b);
                border-bottom: 2px solid var(--border-color, #e2e8f0);
                white-space: nowrap;
                position: sticky;
                top: 0;
                background: var(--bg-secondary, #f8fafc);
              }

              .ocs-table td {
                padding: 8px 12px;
                border-bottom: 1px solid var(--border-color, #e2e8f0);
                color: var(--text-primary, #0f172a);
                vertical-align: middle;
              }

              .ocs-table tbody tr:hover {
                background: var(--hover-bg, #f1f5f9);
              }

              .ocs-prop-name {
                font-weight: 500;
                min-width: 120px;
              }

              .ocs-prop-exclusive,
              .ocs-prop-conjugal {
                text-align: center;
                font-size: 12px;
                color: var(--text-secondary, #64748b);
              }

              .ocs-prop-zv,
              .ocs-prop-fmv {
                padding: 4px 8px;
              }

              .ocs-prop-total-zv,
              .ocs-prop-highest {
                font-weight: 500;
                text-align: right;
                min-width: 80px;
              }

              /* ============================================================
                 INPUTS
                 ============================================================ */
              .ocs-zv-input,
              .ocs-fmv-input {
                width: 100%;
                min-width: 70px;
                padding: 4px 8px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 6px;
                font-size: 12px;
                outline: none;
                background: var(--bg-primary, #ffffff);
                color: var(--text-primary, #0f172a);
                transition: border-color 0.2s;
              }

              .ocs-zv-input:focus,
              .ocs-fmv-input:focus {
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
              }

              .ocs-zv-input::placeholder,
              .ocs-fmv-input::placeholder {
                color: var(--text-secondary, #94a3b8);
                font-size: 11px;
              }

              .ocs-zv-input {
                max-width: 80px;
              }

              .ocs-fmv-input {
                max-width: 120px;
              }

              /* ============================================================
                 TOTAL ROW
                 ============================================================ */
              .ocs-total-row {
                background: var(--bg-secondary, #f8fafc);
                font-weight: 600;
              }

              .ocs-total-row td {
                border-top: 2px solid var(--border-color, #e2e8f0);
                padding: 10px 12px;
              }

              .ocs-total-label {
                font-weight: 700;
                color: var(--text-primary, #0f172a);
              }

              .ocs-total-value {
                text-align: right;
                font-weight: 700;
                color: var(--text-primary, #0f172a);
              }

              .ocs-total-highlight {
                color: #6366f1;
                font-size: 14px;
              }

              /* ============================================================
                 MODAL FOOTER
                 ============================================================ */
              .ocs-modal-footer {
                padding: 14px 24px;
                border-top: 1px solid var(--border-color, #e2e8f0);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: var(--bg-secondary, #f8fafc);
                flex-shrink: 0;
                gap: 12px;
                flex-wrap: wrap;
              }

              .ocs-footer-left {
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .ocs-footer-note {
                font-size: 12px;
                color: var(--text-secondary, #64748b);
              }

              .ocs-footer-right {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
              }

              /* ============================================================
                 BUTTONS
                 ============================================================ */
              .ocs-btn {
                padding: 8px 20px;
                border-radius: 8px;
                border: none;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
              }

              .ocs-btn-primary {
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: #ffffff;
                box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
              }

              .ocs-btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
              }

              .ocs-btn-secondary {
                background: var(--border-color, #e2e8f0);
                color: var(--text-primary, #0f172a);
              }

              .ocs-btn-secondary:hover {
                background: var(--hover-bg, #d1d5db);
              }

              .ocs-btn-expand {
                padding: 4px 14px;
                border-radius: 6px;
                border: 1px solid var(--border-color, #e2e8f0);
                background: transparent;
                color: var(--text-secondary, #64748b);
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
              }

              .ocs-btn-expand:hover {
                background: var(--bg-secondary, #f1f5f9);
                border-color: #6366f1;
                color: #6366f1;
              }

              /* ============================================================
                 RESPONSIVE
                 ============================================================ */
              @media (max-width: 1024px) {
                .ocs-modal {
                  max-width: 100%;
                  max-height: 95vh;
                }

                .ocs-modal-body {
                  padding: 16px;
                }
              }

              @media (max-width: 768px) {
                .ocs-modal-header {
                  padding: 14px 16px;
                  flex-wrap: wrap;
                }

                .ocs-modal-header-left {
                  flex: 1;
                  min-width: 0;
                }

                .ocs-modal-title {
                  font-size: 16px;
                }

                .ocs-modal-subtitle {
                  font-size: 12px;
                }

                .ocs-modal-body {
                  padding: 12px 14px;
                }

                .ocs-person-header {
                  padding: 10px 12px;
                  flex-direction: column;
                  align-items: stretch;
                  gap: 6px;
                }

                .ocs-person-info {
                  flex-wrap: wrap;
                }

                .ocs-person-totals {
                  width: 100%;
                  justify-content: space-between;
                }

                .ocs-person-name {
                  font-size: 13px;
                }

                .ocs-table {
                  font-size: 12px;
                  min-width: 580px;
                }

                .ocs-table th,
                .ocs-table td {
                  padding: 6px 8px;
                }

                .ocs-prop-name {
                  min-width: 80px;
                }

                .ocs-prop-badge {
                font-size: 8px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                padding: 1px 8px;
                border-radius: 10px;
                margin-left: 6px;
                display: inline-block;
                }

                .ocs-prop-badge-full {
                background: rgba(16, 185, 129, 0.15);
                color: #10b981;
                border: 1px solid rgba(16, 185, 129, 0.2);
                }

                .ocs-prop-badge-half {
                background: rgba(245, 158, 11, 0.15);
                color: #f59e0b;
                border: 1px solid rgba(245, 158, 11, 0.2);
                }

                .ocs-prop-badge-inherited {
                background: rgba(139, 92, 246, 0.15);
                color: #8b5cf6;
                border: 1px solid rgba(139, 92, 246, 0.2);
                }

                [data-theme="dark"] .ocs-prop-badge-full {
                background: rgba(16, 185, 129, 0.2);
                color: #34d399;
                }

                [data-theme="dark"] .ocs-prop-badge-half {
                background: rgba(245, 158, 11, 0.2);
                color: #fbbf24;
                }

                [data-theme="dark"] .ocs-prop-badge-inherited {
                background: rgba(139, 92, 246, 0.2);
                color: #a78bfa;
                }

                .ocs-zv-input,
                .ocs-fmv-input {
                  min-width: 50px;
                  font-size: 11px;
                  padding: 2px 6px;
                }

                .ocs-zv-input {
                  max-width: 60px;
                }

                .ocs-fmv-input {
                  max-width: 80px;
                }

                .ocs-modal-footer {
                  padding: 10px 14px;
                  flex-direction: column;
                  align-items: stretch;
                  gap: 8px;
                }

                .ocs-footer-left {
                  justify-content: center;
                }

                .ocs-footer-right {
                  justify-content: center;
                }

                .ocs-btn {
                  padding: 6px 14px;
                  font-size: 12px;
                }

                .ocs-controls {
                  flex-direction: column;
                  align-items: stretch;
                  gap: 6px;
                }

                .ocs-controls-info {
                  text-align: center;
                  font-size: 12px;
                }
              }

              @media (max-width: 480px) {
                .ocs-modal {
                  max-height: 100vh;
                  border-radius: 12px;
                }

                .ocs-modal-header {
                  padding: 10px 12px;
                }

                .ocs-modal-body {
                  padding: 8px 10px;
                }

                .ocs-modal-icon {
                  font-size: 22px;
                }

                .ocs-modal-title {
                  font-size: 14px;
                }

                .ocs-modal-subtitle {
                  font-size: 11px;
                }

                .ocs-person-header {
                  padding: 8px 10px;
                }

                .ocs-person-avatar {
                  width: 30px;
                  height: 30px;
                  font-size: 10px;
                }

                .ocs-person-name {
                  font-size: 12px;
                }

                .ocs-person-death {
                  font-size: 10px;
                }

                .ocs-person-total {
                  font-size: 11px;
                }

                .ocs-table {
                  font-size: 11px;
                  min-width: 480px;
                }

                .ocs-table th,
                .ocs-table td {
                  padding: 4px 6px;
                }

                .ocs-zv-input,
                .ocs-fmv-input {
                  min-width: 40px;
                  font-size: 10px;
                  padding: 2px 4px;
                }

                .ocs-zv-input {
                  max-width: 50px;
                }

                .ocs-fmv-input {
                  max-width: 60px;
                }

                .ocs-modal-footer {
                  padding: 8px 10px;
                }

                .ocs-footer-note {
                  font-size: 10px;
                }

                .ocs-btn {
                  padding: 4px 10px;
                  font-size: 11px;
                }
              }

              /* ============================================================
                 DARK MODE
                 ============================================================ */
              [data-theme="dark"] .ocs-modal {
                --bg-primary: #0f172a;
                --bg-secondary: #1e293b;
                --card-bg: #1e293b;
                --text-primary: #f1f5f9;
                --text-secondary: #94a3b8;
                --border-color: #334155;
                --hover-bg: #2d3748;
              }

              [data-theme="dark"] .ocs-modal {
                background: var(--card-bg, #1e293b);
                border-color: var(--border-color, #334155);
              }

              [data-theme="dark"] .ocs-modal-header {
                background: var(--bg-secondary, #1e293b);
                border-color: var(--border-color, #334155);
              }

              [data-theme="dark"] .ocs-modal-close:hover {
                background: var(--border-color, #334155);
              }

              [data-theme="dark"] .ocs-person-section {
                border-color: var(--border-color, #334155);
                background: var(--card-bg, #1e293b);
              }

              [data-theme="dark"] .ocs-person-header {
                background: var(--bg-secondary, #1e293b);
              }

              [data-theme="dark"] .ocs-person-header:hover {
                background: var(--hover-bg, #2d3748);
              }

              [data-theme="dark"] .ocs-table thead {
                background: var(--bg-secondary, #1e293b);
              }

              [data-theme="dark"] .ocs-table th {
                background: var(--bg-secondary, #1e293b);
                border-color: var(--border-color, #334155);
              }

              [data-theme="dark"] .ocs-table td {
                border-color: var(--border-color, #334155);
              }

              [data-theme="dark"] .ocs-table tbody tr:hover {
                background: var(--hover-bg, #2d3748);
              }

              [data-theme="dark"] .ocs-total-row {
                background: var(--bg-secondary, #1e293b);
              }

              [data-theme="dark"] .ocs-total-row td {
                border-color: var(--border-color, #334155);
              }

              [data-theme="dark"] .ocs-modal-footer {
                background: var(--bg-secondary, #1e293b);
                border-color: var(--border-color, #334155);
              }

              [data-theme="dark"] .ocs-btn-secondary {
                background: var(--border-color, #334155);
                color: var(--text-primary, #f1f5f9);
              }

              [data-theme="dark"] .ocs-btn-secondary:hover {
                background: var(--hover-bg, #2d3748);
              }

              [data-theme="dark"] .ocs-btn-expand {
                border-color: var(--border-color, #334155);
                color: var(--text-secondary, #94a3b8);
              }

              [data-theme="dark"] .ocs-btn-expand:hover {
                background: var(--bg-secondary, #1e293b);
                border-color: #6366f1;
                color: #818cf8;
              }

              [data-theme="dark"] .ocs-zv-input,
              [data-theme="dark"] .ocs-fmv-input {
                background: var(--bg-primary, #0f172a);
                border-color: var(--border-color, #334155);
                color: var(--text-primary, #f1f5f9);
              }

              [data-theme="dark"] .ocs-zv-input:focus,
              [data-theme="dark"] .ocs-fmv-input:focus {
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
              }

              [data-theme="dark"] .ocs-zv-input::placeholder,
              [data-theme="dark"] .ocs-fmv-input::placeholder {
                color: var(--text-secondary, #64748b);
              }

              [data-theme="dark"] .ocs-empty-state h3 {
                color: var(--text-primary, #f1f5f9);
              }

              [data-theme="dark"] .ocs-total-highlight {
                color: #818cf8;
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PropertiesOCS;