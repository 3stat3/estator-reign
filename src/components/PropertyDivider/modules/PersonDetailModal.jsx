// src/components/PropertyDivider/modules/PersonDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PersonDetailModal = ({ 
  darkMode = false, 
  person, 
  persons = [], 
  properties = [], 
  onClose,
  onAddProperty,
  onUpdatePerson 
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!person) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return Number(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const getSpouseName = () => {
    if (!person.spouseId) return 'None';
    const spouse = persons.find(p => p.id === person.spouseId);
    return spouse ? spouse.name : 'Unknown';
  };

  const getParentName = (parentId) => {
    if (!parentId) return 'Unknown';
    const parent = persons.find(p => p.id === parentId);
    return parent ? parent.name : 'Unknown';
  };

  const getChildren = () => {
    return persons.filter(p => p.fatherId === person.id || p.motherId === person.id);
  };

  const getExclusiveProperties = () => {
    return properties.filter(p => 
      p.classification === 'Exclusive' && 
      p.ownerId === person.id
    );
  };

  const getConjugalProperties = () => {
    return properties.filter(p => {
      if (p.classification !== 'Conjugal') return false;
      if (p.ownerId === person.id) return true;
      const owner = persons.find(per => per.id === p.ownerId);
      if (owner && owner.spouseId === person.id) return true;
      return false;
    });
  };

  const getTotalEstate = () => {
    const exclusiveTotal = getExclusiveProperties().reduce((sum, p) => sum + (p.totalSqm || 0), 0);
    const conjugalTotal = getConjugalProperties().reduce((sum, p) => sum + (p.totalSqm || 0), 0);
    return exclusiveTotal + conjugalTotal;
  };

  const getPropertyAuditTrail = (property) => {
    if (!property.ownershipHistory || property.ownershipHistory.length === 0) {
      return [
        {
          owner: person.name,
          fromDate: 'Unknown',
          toDate: person.isDeceased ? formatDate(person.dateOfDeath) : 'Present',
          share: property.classification === 'Conjugal' ? '50%' : '100%',
          source: 'Acquired'
        }
      ];
    }
    return property.ownershipHistory.map(record => ({
      owner: persons.find(p => p.id === record.ownerId)?.name || 'Unknown',
      fromDate: record.fromDate ? formatDate(record.fromDate) : 'Unknown',
      toDate: record.toDate ? formatDate(record.toDate) : 'Present',
      share: record.share ? `${record.share * 100}%` : '100%',
      source: record.source || 'Acquired'
    }));
  };

  const children = getChildren();
  const exclusiveProps = getExclusiveProperties();
  const conjugalProps = getConjugalProperties();
  const totalEstate = getTotalEstate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pdm-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="pdm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pdm-header">
          <div className="pdm-header-left">
            <div className={`pdm-avatar ${person.isDeceased ? 'deceased' : ''}`} style={{
              background: person.isDeceased 
                ? 'linear-gradient(135deg, #dc2626, #991b1b)' 
                : person.gender === 'Female' 
                  ? 'linear-gradient(135deg, #ec4899, #be185d)'
                  : 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
            }}>
              {person.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h2 className="pdm-title">
                {person.name}
                {person.isDeceased && ' ⚰️'}
              </h2>
              <p className="pdm-subtitle">
                {person.isDeceased ? `Died: ${formatDate(person.dateOfDeath)}` : 'Living'} · {person.gender}
                {person.generation && ` · ${person.generation}${person.generation === 1 ? 'st' : person.generation === 2 ? 'nd' : person.generation === 3 ? 'rd' : 'th'} Generation`}
              </p>
            </div>
          </div>
          <button className="pdm-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Quick Stats */}
        <div className="pdm-stats">
          <div className="pdm-stat-item">
            <span className="pdm-stat-value">{totalEstate > 0 ? formatNumber(totalEstate) : '0'}</span>
            <span className="pdm-stat-label">Total Estate (sqm)</span>
          </div>
          <div className="pdm-stat-item">
            <span className="pdm-stat-value">{exclusiveProps.length + conjugalProps.length}</span>
            <span className="pdm-stat-label">Properties</span>
          </div>
          <div className="pdm-stat-item">
            <span className="pdm-stat-value">{children.length}</span>
            <span className="pdm-stat-label">Children</span>
          </div>
          <div className="pdm-stat-item">
            <span className="pdm-stat-value">{person.isDeceased ? 'Deceased' : 'Living'}</span>
            <span className="pdm-stat-label">Status</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="pdm-tabs">
          <button className={`pdm-tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
            📋 Details
          </button>
          <button className={`pdm-tab ${activeTab === 'exclusive' ? 'active' : ''}`} onClick={() => setActiveTab('exclusive')}>
            🏠 Exclusive ({exclusiveProps.length})
          </button>
          <button className={`pdm-tab ${activeTab === 'conjugal' ? 'active' : ''}`} onClick={() => setActiveTab('conjugal')}>
            💑 Conjugal ({conjugalProps.length})
          </button>
          <button className={`pdm-tab ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
            📜 Audit Trail
          </button>
        </div>

        {/* Body */}
        <div className="pdm-body">
          {activeTab === 'details' && (
            <>
              {/* Personal Information */}
              <div className="pdm-section">
                <h3 className="pdm-section-title">
                  <span className="pdm-section-icon">👤</span>
                  Personal Information
                </h3>
                <div className="pdm-info-grid">
                  <div className="pdm-info-item">
                    <span className="pdm-info-label">Full Name</span>
                    <span className="pdm-info-value">{person.name}</span>
                  </div>
                  <div className="pdm-info-item">
                    <span className="pdm-info-label">Gender</span>
                    <span className="pdm-info-value">{person.gender}</span>
                  </div>
                  <div className="pdm-info-item">
                    <span className="pdm-info-label">Status</span>
                    <span className="pdm-info-value">
                      <span className={`pdm-status-badge ${person.isDeceased ? 'deceased' : 'living'}`}>
                        {person.isDeceased ? '⚰️ Deceased' : '✅ Living'}
                      </span>
                      {person.isDeceased && ` (${formatDate(person.dateOfDeath)})`}
                    </span>
                  </div>
                  <div className="pdm-info-item">
                    <span className="pdm-info-label">Generation</span>
                    <span className="pdm-info-value">
                      {person.generation ? `${person.generation}${person.generation === 1 ? 'st' : person.generation === 2 ? 'nd' : person.generation === 3 ? 'rd' : 'th'} Generation` : 'Unknown'}
                    </span>
                  </div>
                  <div className="pdm-info-item">
                    <span className="pdm-info-label">Spouse</span>
                    <span className="pdm-info-value">{getSpouseName()}</span>
                  </div>
                  <div className="pdm-info-item">
                    <span className="pdm-info-label">Father</span>
                    <span className="pdm-info-value">{getParentName(person.fatherId)}</span>
                  </div>
                  <div className="pdm-info-item">
                    <span className="pdm-info-label">Mother</span>
                    <span className="pdm-info-value">{getParentName(person.motherId)}</span>
                  </div>
                  <div className="pdm-info-item">
                    <span className="pdm-info-label">Children</span>
                    <span className="pdm-info-value">{children.length}</span>
                  </div>
                </div>
              </div>

              {/* Children */}
              {children.length > 0 && (
                <div className="pdm-section">
                  <h3 className="pdm-section-title">
                    <span className="pdm-section-icon">👶</span>
                    Children
                  </h3>
                  <div className="pdm-children-grid">
                    {children.map(child => (
                      <div key={child.id} className="pdm-child-item">
                        <span className="pdm-child-name">{child.name}</span>
                        <span className={`pdm-child-status ${child.isDeceased ? 'deceased' : 'living'}`}>
                          {child.isDeceased ? '⚰️' : '✅'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'exclusive' && (
            <div className="pdm-section">
              <div className="pdm-section-header">
                <h3 className="pdm-section-title">
                  <span className="pdm-section-icon">🏠</span>
                  Exclusive Properties
                </h3>
                <button 
                  className="pdm-add-btn"
                  onClick={() => {
                    if (onAddProperty) {
                      onAddProperty(person);
                    } else {
                      alert('Add property functionality coming soon!');
                    }
                  }}
                >
                  + Add Property
                </button>
              </div>
              {exclusiveProps.length === 0 ? (
                <div className="pdm-empty-state">
                  <div className="pdm-empty-icon">🏠</div>
                  <p>No exclusive properties assigned to this person.</p>
                </div>
              ) : (
                <div className="pdm-property-list">
                  {exclusiveProps.map(prop => (
                    <div key={prop.id} className="pdm-property-card">
                      <div className="pdm-property-header">
                        <h4 className="pdm-property-name">{prop.name}</h4>
                        <span className="pdm-property-badge pdm-badge-exclusive">
                          Exclusive
                        </span>
                      </div>
                      <div className="pdm-property-details">
                        <span className="pdm-property-area">📏 {formatNumber(prop.totalSqm)} sqm</span>
                        {prop.location && <span>📍 {prop.location}</span>}
                        {prop.description && <span className="pdm-property-desc">{prop.description}</span>}
                      </div>
                    </div>
                  ))}
                  <div className="pdm-property-total">
                    <span>Total Exclusive Estate</span>
                    <span>{formatNumber(exclusiveProps.reduce((sum, p) => sum + (p.totalSqm || 0), 0))} sqm</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'conjugal' && (
            <div className="pdm-section">
              <div className="pdm-section-header">
                <h3 className="pdm-section-title">
                  <span className="pdm-section-icon">💑</span>
                  Conjugal Properties
                </h3>
                <button 
                  className="pdm-add-btn"
                  onClick={() => {
                    if (onAddProperty) {
                      onAddProperty(person);
                    } else {
                      alert('Add property functionality coming soon!');
                    }
                  }}
                >
                  + Add Property
                </button>
              </div>
              {conjugalProps.length === 0 ? (
                <div className="pdm-empty-state">
                  <div className="pdm-empty-icon">💑</div>
                  <p>No conjugal properties assigned to this person.</p>
                </div>
              ) : (
                <div className="pdm-property-list">
                  {conjugalProps.map(prop => {
                    const owner = persons.find(p => p.id === prop.ownerId);
                    const spouse = owner ? persons.find(p => p.id === owner.spouseId) : null;
                    const isOwner = prop.ownerId === person.id;
                    
                    return (
                      <div key={prop.id} className="pdm-property-card pdm-conjugal-card">
                        <div className="pdm-property-header">
                          <h4 className="pdm-property-name">{prop.name}</h4>
                          <span className="pdm-property-badge pdm-badge-conjugal">
                            Conjugal
                          </span>
                        </div>
                        <div className="pdm-property-details">
                          <span className="pdm-property-area">📏 {formatNumber(prop.totalSqm)} sqm</span>
                          {owner && <span>👤 Owner: {owner.name}</span>}
                          {spouse && <span>💍 Spouse: {spouse.name}</span>}
                          {prop.location && <span>📍 {prop.location}</span>}
                          <span className="pdm-conjugal-share">
                            {isOwner 
                              ? `Your share: 50% (${formatNumber(prop.totalSqm / 2)} sqm)`
                              : `Your share: 50% (${formatNumber(prop.totalSqm / 2)} sqm)`
                            }
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="pdm-property-total">
                    <span>Total Conjugal Estate</span>
                    <span>{formatNumber(conjugalProps.reduce((sum, p) => sum + (p.totalSqm || 0), 0))} sqm</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="pdm-section">
              <h3 className="pdm-section-title">
                <span className="pdm-section-icon">📜</span>
                Property Audit Trail
              </h3>
              <p className="pdm-audit-description">
                Complete ownership history of all properties associated with {person.name}
              </p>
              
              {properties.filter(p => p.ownerId === person.id).length === 0 ? (
                <div className="pdm-empty-state">
                  <div className="pdm-empty-icon">📜</div>
                  <p>No properties found for this person.</p>
                </div>
              ) : (
                <div className="pdm-audit-list">
                  {properties.filter(p => p.ownerId === person.id).map(prop => {
                    const auditTrail = getPropertyAuditTrail(prop);
                    return (
                      <div key={prop.id} className="pdm-audit-card">
                        <div className="pdm-audit-card-header">
                          <h4 className="pdm-property-name">{prop.name}</h4>
                          <span className={`pdm-audit-classification ${prop.classification === 'Conjugal' ? 'conjugal' : 'exclusive'}`}>
                            {prop.classification || 'Property'}
                          </span>
                        </div>
                        <div className="pdm-audit-trail">
                          {auditTrail.map((record, idx) => (
                            <div key={idx} className="pdm-audit-item">
                              <span className="pdm-audit-label">
                                <span className="pdm-audit-owner">{record.owner}</span>
                                <span className="pdm-audit-source">· {record.source}</span>
                              </span>
                              <span className="pdm-audit-value">
                                {record.fromDate} → {record.toDate}
                                <span className="pdm-audit-share">({record.share})</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pdm-footer">
          <button className="pdm-footer-btn pdm-footer-secondary" onClick={onClose}>
            Close
          </button>
          <button 
            className="pdm-footer-btn pdm-footer-primary"
            onClick={() => {
              onClose();
              if (onUpdatePerson) {
                onUpdatePerson({ ...person, _edit: true });
              }
            }}
          >
            ✏️ Edit Person
          </button>
        </div>
      </motion.div>

      <style>{`
        /* ============================================================
           PersonDetailModal - Professional Layout
           ============================================================ */
        .pdm-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }

        .pdm-modal {
          background: var(--card-bg, #ffffff);
          border-radius: 20px;
          max-width: 960px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid var(--border-color, #e2e8f0);
          display: flex;
          flex-direction: column;
        }

        /* ============================================================
           HEADER
           ============================================================ */
        .pdm-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
          background: var(--bg-secondary, #f8fafc);
        }

        .pdm-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .pdm-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .pdm-avatar.deceased {
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        .pdm-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          margin: 0;
        }

        .pdm-subtitle {
          font-size: 13px;
          color: var(--text-secondary, #64748b);
          margin: 2px 0 0 0;
        }

        .pdm-close-btn {
          background: none;
          border: none;
          font-size: 22px;
          color: var(--text-secondary, #64748b);
          cursor: pointer;
          padding: 4px 10px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .pdm-close-btn:hover {
          background: var(--border-color, #e2e8f0);
        }

        /* ============================================================
           QUICK STATS
           ============================================================ */
        .pdm-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 16px 24px;
          background: var(--bg-primary, #ffffff);
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .pdm-stat-item {
          text-align: center;
          padding: 8px 12px;
          background: var(--bg-secondary, #f8fafc);
          border-radius: 10px;
          border: 1px solid var(--border-color, #e2e8f0);
        }

        .pdm-stat-value {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
        }

        .pdm-stat-label {
          display: block;
          font-size: 10px;
          font-weight: 500;
          color: var(--text-secondary, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        /* ============================================================
           TABS
           ============================================================ */
        .pdm-tabs {
          display: flex;
          gap: 4px;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          flex-shrink: 0;
          overflow-x: auto;
          background: var(--bg-primary, #ffffff);
        }

        .pdm-tab {
          padding: 8px 16px;
          border-radius: 10px;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: var(--text-secondary, #64748b);
          white-space: nowrap;
        }

        .pdm-tab.active {
          background: var(--border-color, #e2e8f0);
          color: var(--text-primary, #0f172a);
        }

        .pdm-tab:hover:not(.active) {
          background: var(--border-color, #e2e8f0);
        }

        /* ============================================================
           BODY
           ============================================================ */
        .pdm-body {
          padding: 20px 24px;
          overflow-y: auto;
          flex: 1;
          background: var(--bg-primary, #ffffff);
        }

        .pdm-section {
          margin-bottom: 24px;
        }

        .pdm-section:last-child {
          margin-bottom: 0;
        }

        .pdm-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .pdm-section-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pdm-section-icon {
          font-size: 16px;
        }

        .pdm-section-header .pdm-section-title {
          margin: 0;
        }

        /* ============================================================
           INFO GRID
           ============================================================ */
        .pdm-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 12px;
        }

        .pdm-info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 10px 14px;
          background: var(--bg-secondary, #f8fafc);
          border-radius: 10px;
          border: 1px solid var(--border-color, #e2e8f0);
        }

        .pdm-info-label {
          font-size: 9px;
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pdm-info-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .pdm-status-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .pdm-status-badge.living {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }

        .pdm-status-badge.deceased {
          background: rgba(220, 38, 38, 0.12);
          color: #dc2626;
        }

        /* ============================================================
           CHILDREN
           ============================================================ */
        .pdm-children-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 8px;
        }

        .pdm-child-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          background: var(--bg-secondary, #f8fafc);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e2e8f0);
        }

        .pdm-child-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #0f172a);
        }

        .pdm-child-status {
          font-size: 14px;
        }

        /* ============================================================
           PROPERTY LIST
           ============================================================ */
        .pdm-property-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pdm-property-card {
          background: var(--bg-secondary, #f8fafc);
          border-radius: 12px;
          padding: 14px 16px;
          border: 1px solid var(--border-color, #e2e8f0);
          transition: all 0.2s;
        }

        .pdm-property-card:hover {
          border-color: rgba(99, 102, 241, 0.2);
        }

        .pdm-conjugal-card {
          border-left: 3px solid #8b5cf6;
        }

        .pdm-property-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          flex-wrap: wrap;
          gap: 4px;
        }

        .pdm-property-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          margin: 0;
        }

        .pdm-property-badge {
          padding: 2px 12px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .pdm-badge-exclusive {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .pdm-badge-conjugal {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .pdm-property-details {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 4px 16px;
          font-size: 12px;
          color: var(--text-secondary, #64748b);
        }

        .pdm-property-area {
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .pdm-property-desc {
          grid-column: 1 / -1;
          font-style: italic;
        }

        .pdm-conjugal-share {
          grid-column: 1 / -1;
          color: #8b5cf6;
          font-weight: 500;
          font-size: 12px;
          padding-top: 4px;
          border-top: 1px dashed var(--border-color, #e2e8f0);
        }

        .pdm-property-total {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(99, 102, 241, 0.04);
          border-radius: 10px;
          border: 2px solid var(--border-color, #e2e8f0);
          font-weight: 700;
          font-size: 14px;
          color: var(--text-primary, #0f172a);
          margin-top: 4px;
        }

        .pdm-property-total span:last-child {
          color: #6366f1;
        }

        /* ============================================================
           ADD BUTTON
           ============================================================ */
        .pdm-add-btn {
          padding: 6px 16px;
          border-radius: 8px;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pdm-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        /* ============================================================
           EMPTY STATE
           ============================================================ */
        .pdm-empty-state {
          text-align: center;
          padding: 40px 16px;
          color: var(--text-secondary, #64748b);
        }

        .pdm-empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .pdm-empty-state p {
          margin: 0;
          font-size: 14px;
        }

        /* ============================================================
           AUDIT TRAIL
           ============================================================ */
        .pdm-audit-description {
          font-size: 13px;
          color: var(--text-secondary, #64748b);
          margin-bottom: 16px;
        }

        .pdm-audit-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pdm-audit-card {
          background: var(--bg-secondary, #f8fafc);
          border-radius: 12px;
          padding: 14px 16px;
          border: 1px solid var(--border-color, #e2e8f0);
        }

        .pdm-audit-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .pdm-audit-classification {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          padding: 2px 12px;
          border-radius: 12px;
        }

        .pdm-audit-classification.exclusive {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .pdm-audit-classification.conjugal {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .pdm-audit-trail {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pdm-audit-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          font-size: 12px;
          flex-wrap: wrap;
          gap: 4px;
        }

        .pdm-audit-item:last-child {
          border-bottom: none;
        }

        .pdm-audit-label {
          color: var(--text-secondary, #64748b);
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .pdm-audit-owner {
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .pdm-audit-source {
          color: var(--text-secondary, #64748b);
          font-size: 11px;
        }

        .pdm-audit-value {
          color: var(--text-primary, #0f172a);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pdm-audit-share {
          font-size: 11px;
          color: var(--text-secondary, #64748b);
          font-weight: 400;
        }

        /* ============================================================
           FOOTER
           ============================================================ */
        .pdm-footer {
          padding: 14px 24px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-shrink: 0;
          background: var(--bg-secondary, #f8fafc);
        }

        .pdm-footer-btn {
          padding: 8px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pdm-footer-secondary {
          background: transparent;
          color: var(--text-primary, #0f172a);
          border: 1px solid var(--border-color, #e2e8f0);
        }

        .pdm-footer-secondary:hover {
          background: var(--border-color, #e2e8f0);
        }

        .pdm-footer-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          border: none;
        }

        .pdm-footer-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
        }

        /* ============================================================
           DARK MODE
           ============================================================ */
        [data-theme="dark"] .pdm-modal {
          --bg-primary: #0f172a;
          --bg-secondary: #1e293b;
          --card-bg: #1e293b;
          --text-primary: #f1f5f9;
          --text-secondary: #94a3b8;
          --border-color: #334155;
        }

        [data-theme="dark"] .pdm-status-badge.living {
          background: rgba(16, 185, 129, 0.2);
        }

        [data-theme="dark"] .pdm-status-badge.deceased {
          background: rgba(220, 38, 38, 0.2);
        }

        [data-theme="dark"] .pdm-badge-exclusive {
          background: rgba(59, 130, 246, 0.2);
        }

        [data-theme="dark"] .pdm-badge-conjugal {
          background: rgba(139, 92, 246, 0.2);
        }

        [data-theme="dark"] .pdm-audit-classification.exclusive {
          background: rgba(59, 130, 246, 0.2);
        }

        [data-theme="dark"] .pdm-audit-classification.conjugal {
          background: rgba(139, 92, 246, 0.2);
        }

        /* ============================================================
           RESPONSIVE
           ============================================================ */
        @media (max-width: 768px) {
          .pdm-overlay {
            padding: 10px;
          }

          .pdm-modal {
            max-width: 100%;
            max-height: 95vh;
          }

          .pdm-header {
            padding: 14px 16px;
          }

          .pdm-avatar {
            width: 40px;
            height: 40px;
            font-size: 14px;
          }

          .pdm-title {
            font-size: 17px;
          }

          .pdm-stats {
            grid-template-columns: repeat(2, 1fr);
            padding: 12px 16px;
          }

          .pdm-stat-value {
            font-size: 17px;
          }

          .pdm-tabs {
            padding: 6px 12px;
          }

          .pdm-tab {
            font-size: 11px;
            padding: 6px 12px;
          }

          .pdm-body {
            padding: 14px 16px;
          }

          .pdm-info-grid {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .pdm-info-item {
            padding: 8px 12px;
          }

          .pdm-info-value {
            font-size: 13px;
          }

          .pdm-property-details {
            grid-template-columns: 1fr 1fr;
          }

          .pdm-footer {
            padding: 10px 16px;
            flex-wrap: wrap;
          }

          .pdm-footer-btn {
            padding: 6px 16px;
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .pdm-header {
            padding: 10px 12px;
          }

          .pdm-avatar {
            width: 34px;
            height: 34px;
            font-size: 12px;
          }

          .pdm-title {
            font-size: 15px;
          }

          .pdm-subtitle {
            font-size: 11px;
          }

          .pdm-stats {
            grid-template-columns: 1fr 1fr;
            padding: 8px 12px;
            gap: 6px;
          }

          .pdm-stat-item {
            padding: 6px 10px;
          }

          .pdm-stat-value {
            font-size: 15px;
          }

          .pdm-stat-label {
            font-size: 9px;
          }

          .pdm-info-grid {
            grid-template-columns: 1fr;
          }

          .pdm-property-details {
            grid-template-columns: 1fr;
          }

          .pdm-property-card {
            padding: 10px 12px;
          }

          .pdm-body {
            padding: 10px 12px;
          }

          .pdm-tab {
            font-size: 10px;
            padding: 4px 10px;
          }

          .pdm-footer {
            flex-direction: column;
          }

          .pdm-footer-btn {
            width: 100%;
            text-align: center;
          }

          .pdm-audit-item {
            flex-direction: column;
            gap: 2px;
          }

          .pdm-audit-value {
            padding-left: 8px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default PersonDetailModal;