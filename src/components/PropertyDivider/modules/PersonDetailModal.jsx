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
    // For conjugal properties, show them if:
    // 1. The person is the owner, OR
    // 2. The person is the spouse of the owner
    return properties.filter(p => {
      if (p.classification !== 'Conjugal') return false;
      
      // If this person owns it directly
      if (p.ownerId === person.id) return true;
      
      // If this person is the spouse of the owner
      const owner = persons.find(per => per.id === p.ownerId);
      if (owner && owner.spouseId === person.id) return true;
      
      return false;
    });
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
                ? '#dc2626' 
                : person.gender === 'Female' 
                  ? 'linear-gradient(135deg, #ec4899, #db2777)'
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)'
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
              </p>
            </div>
          </div>
          <button className="pdm-close-btn" onClick={onClose}>✕</button>
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
              <div className="pdm-section">
                <h3 className="pdm-section-title">Personal Information</h3>
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
                      {person.isDeceased ? 'Deceased' : 'Living'}
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

              {children.length > 0 && (
                <div className="pdm-section">
                  <h3 className="pdm-section-title">👶 Children</h3>
                  <div className="pdm-info-grid">
                    {children.map(child => (
                      <div key={child.id} className="pdm-info-item">
                        <span className="pdm-info-value">{child.name}</span>
                        <span className="pdm-info-label">
                          {child.isDeceased ? 'Deceased' : 'Living'}
                          {child.isDeceased && child.dateOfDeath && ` (${formatDate(child.dateOfDeath)})`}
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
                <h3 className="pdm-section-title">🏠 Exclusive Properties</h3>
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
                exclusiveProps.map(prop => (
                  <div key={prop.id} className="pdm-property-card">
                    <div className="pdm-property-header">
                      <h4 className="pdm-property-name">{prop.name}</h4>
                      <span className="pdm-property-badge pdm-badge-exclusive">
                        {prop.type || 'Property'}
                      </span>
                    </div>
                    <div className="pdm-property-details">
                      <span>📏 {prop.totalSqm || 0} sqm</span>
                      <span>📂 Exclusive</span>
                      {prop.location && <span>📍 {prop.location}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'conjugal' && (
            <div className="pdm-section">
              <div className="pdm-section-header">
                <h3 className="pdm-section-title">💑 Conjugal Properties</h3>
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
                conjugalProps.map(prop => {
                  const owner = persons.find(p => p.id === prop.ownerId);
                  const spouse = owner ? persons.find(p => p.id === owner.spouseId) : null;
                  const isOwner = prop.ownerId === person.id;
                  const isSpouse = owner && owner.spouseId === person.id;
                  
                  return (
                    <div key={prop.id} className="pdm-property-card">
                      <div className="pdm-property-header">
                        <h4 className="pdm-property-name">{prop.name}</h4>
                        <span className="pdm-property-badge pdm-badge-conjugal">
                          {prop.type || 'Property'}
                        </span>
                      </div>
                      <div className="pdm-property-details">
                        <span>📏 {prop.totalSqm || 0} sqm</span>
                        <span>📂 Conjugal</span>
                        {owner && <span>👤 Owner: {owner.name}</span>}
                        {spouse && <span>💍 Spouse: {spouse.name}</span>}
                        {prop.location && <span>📍 {prop.location}</span>}
                        <span className="pdm-conjugal-warning">
                          {isOwner 
                            ? `⚠️ You own 50%, ${spouse?.name || 'spouse'} owns 50%`
                            : `⚠️ ${owner?.name || 'Owner'} owns 50%, you own 50%`
                          }
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="pdm-section">
              <h3 className="pdm-section-title">📜 Property Audit Trail</h3>
              <p className="pdm-audit-description">
                Ownership history of all properties associated with {person.name}
              </p>
              
              {properties.filter(p => p.ownerId === person.id).length === 0 ? (
                <div className="pdm-empty-state">
                  <div className="pdm-empty-icon">📜</div>
                  <p>No properties found for this person.</p>
                </div>
              ) : (
                properties.filter(p => p.ownerId === person.id).map(prop => {
                  const auditTrail = getPropertyAuditTrail(prop);
                  return (
                    <div key={prop.id} className="pdm-property-card pdm-audit-card">
                      <h4 className="pdm-property-name">{prop.name}</h4>
                      <div className="pdm-audit-trail">
                        {auditTrail.map((record, idx) => (
                          <div key={idx} className="pdm-audit-item">
                            <span className="pdm-audit-label">
                              {record.owner} · {record.source}
                            </span>
                            <span className="pdm-audit-value">
                              {record.fromDate} → {record.toDate} ({record.share})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
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
              if (onUpdatePerson) {
                onClose();
              }
            }}
          >
            ✏️ Edit Person
          </button>
        </div>
      </motion.div>

      <style>{`
        /* PersonDetailModal - Uses Global CSS Variables */
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
          padding: 10px;
        }

        .pdm-modal {
          background: var(--card-bg);
          border-radius: 16px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .pdm-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
          flex-wrap: wrap;
          gap: 8px;
          background: var(--bg-secondary);
        }

        .pdm-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pdm-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .pdm-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .pdm-subtitle {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 2px 0 0 0;
        }

        .pdm-close-btn {
          background: none;
          border: none;
          font-size: 20px;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .pdm-close-btn:hover {
          background: var(--border-color);
        }

        /* Tabs */
        .pdm-tabs {
          display: flex;
          gap: 4px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
          overflow: auto;
          background: var(--bg-primary);
        }

        .pdm-tab {
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .pdm-tab.active {
          background: var(--border-color);
          color: var(--text-primary);
        }

        .pdm-tab:hover:not(.active) {
          background: var(--border-color);
        }

        /* Body */
        .pdm-body {
          padding: 16px;
          overflow: auto;
          flex: 1;
          background: var(--bg-primary);
        }

        .pdm-section {
          margin-bottom: 20px;
        }

        .pdm-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .pdm-section-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 8px 0;
          padding-bottom: 6px;
          border-bottom: 1px solid var(--border-color);
        }

        .pdm-section-header .pdm-section-title {
          border-bottom: none;
          margin: 0;
          padding: 0;
        }

        /* Info Grid */
        .pdm-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .pdm-info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .pdm-info-label {
          font-size: 9px;
          font-weight: 500;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pdm-info-value {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }

        /* Property Card */
        .pdm-property-card {
          background: var(--bg-secondary);
          border-radius: 10px;
          padding: 12px;
          border: 1px solid var(--border-color);
          margin-bottom: 10px;
        }

        .pdm-property-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          flex-wrap: wrap;
          gap: 4px;
        }

        .pdm-property-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .pdm-property-badge {
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
        }

        .pdm-badge-exclusive {
          background: #eff6ff;
          color: #3b82f6;
        }

        .pdm-badge-conjugal {
          background: #f0fdf4;
          color: #16a34a;
        }

        .dark .pdm-badge-exclusive {
          background: #1a2a3a;
          color: #60a5fa;
        }

        .dark .pdm-badge-conjugal {
          background: #1a2a1a;
          color: #34d399;
        }

        .pdm-property-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .pdm-conjugal-warning {
          grid-column: 1 / -1;
          color: #f59e0b;
          font-size: 11px;
        }

        /* Audit */
        .pdm-audit-description {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .pdm-audit-card {
          margin-bottom: 12px;
        }

        .pdm-audit-trail {
          margin-top: 6px;
        }

        .pdm-audit-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid var(--border-color);
          font-size: 12px;
          flex-wrap: wrap;
          gap: 4px;
        }

        .pdm-audit-label {
          color: var(--text-secondary);
        }

        .pdm-audit-value {
          color: var(--text-primary);
          font-weight: 500;
        }

        /* Add Button */
        .pdm-add-btn {
          padding: 6px 14px;
          border-radius: 8px;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #ffffff;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pdm-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        /* Empty State */
        .pdm-empty-state {
          text-align: center;
          padding: 30px 16px;
          color: var(--text-secondary);
        }

        .pdm-empty-icon {
          font-size: 40px;
          margin-bottom: 10px;
          opacity: 0.5;
        }

        .pdm-empty-state p {
          margin: 0;
          font-size: 13px;
        }

        /* Footer */
        .pdm-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-shrink: 0;
          background: var(--bg-secondary);
          flex-wrap: wrap;
        }

        .pdm-footer-btn {
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pdm-footer-secondary {
          background: transparent;
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .pdm-footer-secondary:hover {
          background: var(--border-color);
        }

        .pdm-footer-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #ffffff;
          border: none;
        }

        .pdm-footer-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        /* Dark mode overrides for specific elements */
        .dark .pdm-close-btn:hover {
          background: var(--border-color);
        }

        .dark .pdm-audit-item {
          border-bottom-color: var(--border-color);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .pdm-modal {
            max-width: 100%;
            max-height: 95vh;
          }

          .pdm-header {
            padding: 12px 14px;
          }

          .pdm-avatar {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }

          .pdm-title {
            font-size: 16px;
          }

          .pdm-subtitle {
            font-size: 11px;
          }

          .pdm-tabs {
            padding: 6px 10px;
          }

          .pdm-tab {
            font-size: 10px;
            padding: 4px 10px;
          }

          .pdm-body {
            padding: 12px;
          }

          .pdm-info-grid {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .pdm-info-value {
            font-size: 12px;
          }

          .pdm-property-details {
            grid-template-columns: 1fr 1fr;
          }

          .pdm-section-title {
            font-size: 13px;
          }

          .pdm-footer {
            padding: 10px 14px;
          }

          .pdm-footer-btn {
            font-size: 11px;
            padding: 5px 12px;
          }
        }

        @media (max-width: 480px) {
          .pdm-header {
            padding: 10px 12px;
          }

          .pdm-avatar {
            width: 32px;
            height: 32px;
            font-size: 12px;
          }

          .pdm-title {
            font-size: 14px;
          }

          .pdm-info-grid {
            grid-template-columns: 1fr;
          }

          .pdm-property-details {
            grid-template-columns: 1fr;
          }

          .pdm-body {
            padding: 10px;
          }

          .pdm-tab {
            font-size: 9px;
            padding: 3px 8px;
          }

          .pdm-footer {
            flex-direction: column;
          }

          .pdm-footer-btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default PersonDetailModal;