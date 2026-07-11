// src/components/PropertyDivider/modules/DivisionEngine.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DivisionEngine = ({ 
  persons = [], 
  properties = [],
  propositusId = null
}) => {
  const [divisionResults, setDivisionResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // ============================================================
  // HELPER FUNCTIONS (UNCHANGED - KEPT EXACTLY AS IS)
  // ============================================================

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
    const spouse = getSpouse(person.id);
    if (spouse && !isDeceasedAtDate(spouse, currentDate)) {
      heirs.push(spouse);
    }
    const children = getChildren(person.id);
    for (const child of children) {
      if (!isDeceasedAtDate(child, currentDate)) {
        heirs.push(child);
      }
    }
    return heirs;
  };

  // ============================================================
  // MAIN CALCULATION (UNCHANGED - KEPT EXACTLY AS IS)
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

      const conjugalProperties = properties.filter(p => p.classification === 'Conjugal');
      const conjugalTotal = conjugalProperties.reduce((sum, p) => sum + (p.totalSqm || 0), 0);
      
      if (conjugalTotal > 0) {
        const spouse = getSpouse(propositusId);
        if (spouse) {
          conjugalShareMap[propositusId] = conjugalTotal / 2;
          conjugalShareMap[spouse.id] = conjugalTotal / 2;
        } else {
          conjugalShareMap[propositusId] = conjugalTotal;
        }
      }

      const exclusiveProperties = properties.filter(p => p.classification === 'Exclusive');
      exclusiveProperties.forEach(prop => {
        if (prop.ownerId) {
          exclusivePropertyMap[prop.ownerId] = (exclusivePropertyMap[prop.ownerId] || 0) + prop.totalSqm;
          if (!inheritanceHistory[prop.ownerId]) inheritanceHistory[prop.ownerId] = [];
          inheritanceHistory[prop.ownerId].push({
            source: 'Own Exclusive Property',
            amount: prop.totalSqm,
            propertyName: prop.name
          });
        }
      });

      const deceasedPersons = persons
        .filter(p => isActuallyDeceased(p))
        .sort((a, b) => new Date(a.dateOfDeath) - new Date(b.dateOfDeath));

      const deathEvents = [];

      for (const deceased of deceasedPersons) {
        if (excludedSet.has(deceased.id)) {
          deathEvents.push({
            person: deceased,
            conjugalShare: 0,
            exclusiveProperty: 0,
            totalEstate: 0,
            heirs: [],
            distribution: [],
            isExcluded: true
          });
          continue;
        }

        const conjugalShare = conjugalShareMap[deceased.id] || 0;
        const exclusiveProp = exclusivePropertyMap[deceased.id] || 0;
        const totalEstate = conjugalShare + exclusiveProp;

        if (totalEstate === 0) {
          const isPreDeceased = new Date(deceased.dateOfDeath) < new Date(propositus.dateOfDeath);
          if (isPreDeceased) {
            const children = getChildren(deceased.id);
            const hasLivingKids = children.some(c => !isActuallyDeceased(c));
            if (!hasLivingKids) {
              excludedSet.add(deceased.id);
            }
          }
          delete conjugalShareMap[deceased.id];
          delete exclusivePropertyMap[deceased.id];
          
          deathEvents.push({
            person: deceased,
            conjugalShare: conjugalShare,
            exclusiveProperty: exclusiveProp,
            totalEstate: 0,
            heirs: [],
            distribution: [],
            isExcluded: excludedSet.has(deceased.id)
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
        }

        const children = getChildren(deceased.id);
        const livingChildren = children.filter(c => !isDeceasedAtDate(c, currentDeathDate));
        const deceasedChildren = children.filter(c => isDeceasedAtDate(c, currentDeathDate));
        
        for (const child of livingChildren) {
          if (!excludedSet.has(child.id)) {
            heirs.push(child);
            heirDetails.push({ person: child, type: 'Child', representation: null, share: 0 });
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
          } else {
            excludedSet.add(child.id);
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
            }
          }
        }

        delete conjugalShareMap[deceased.id];
        delete exclusivePropertyMap[deceased.id];

        if (heirs.length === 0) {
          deathEvents.push({
            person: deceased,
            conjugalShare: conjugalShare,
            exclusiveProperty: exclusiveProp,
            totalEstate: totalEstate,
            heirs: [],
            distribution: [],
            isAbandoned: true
          });
          continue;
        }

        const sharePerHeir = totalEstate / heirs.length;
        const distribution = [];
        
        for (let i = 0; i < heirs.length; i++) {
          const heir = heirs[i];
          const detail = heirDetails[i];
          const shareAmount = sharePerHeir;
          
          if (detail && (detail.type === 'Represented Child' || detail.type === 'Represented Sibling')) {
            exclusivePropertyMap[heir.id] = (exclusivePropertyMap[heir.id] || 0) + shareAmount;
            if (!inheritanceHistory[heir.id]) inheritanceHistory[heir.id] = [];
            inheritanceHistory[heir.id].push({
              source: `Inherited from ${deceased.name}`,
              amount: shareAmount
            });
            
            const repShare = shareAmount / detail.representation.length;
            for (const rep of detail.representation) {
              exclusivePropertyMap[rep.id] = (exclusivePropertyMap[rep.id] || 0) + repShare;
              if (!inheritanceHistory[rep.id]) inheritanceHistory[rep.id] = [];
              inheritanceHistory[rep.id].push({
                source: `Inherited from ${deceased.name} (through ${heir.name})`,
                amount: repShare
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
              amount: shareAmount
            });
            
            distribution.push({
              heir: heir,
              type: detail ? detail.type : 'Heir',
              share: shareAmount,
              passedTo: null
            });
          }
        }

        deathEvents.push({
          person: deceased,
          conjugalShare: conjugalShare,
          exclusiveProperty: exclusiveProp,
          totalEstate: totalEstate,
          heirs: heirs,
          distribution: distribution,
          sharePerHeir: sharePerHeir
        });
      }

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

      setDivisionResults({
        heirs: finalHeirs,
        totalEstate: totalEstate,
        deathEvents: deathEvents,
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
  // UI HELPERS
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
        <h3 className="de-section-title">
          <span className="de-section-icon">📅</span>
          Death Timeline
        </h3>
        <div className="de-timeline-list">
          {deathEvents.map((event, index) => (
            <motion.div
              key={index}
              className={`de-timeline-item ${event.isExcluded ? 'de-timeline-excluded' : ''} ${event.isAbandoned ? 'de-timeline-abandoned' : ''}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => {
                if (event.distribution && event.distribution.length > 0) {
                  setSelectedEvent(event);
                  setShowEventModal(true);
                }
              }}
              style={{ cursor: event.distribution && event.distribution.length > 0 ? 'pointer' : 'default' }}
            >
              <div className="de-timeline-marker">
                <span className="de-timeline-number">{index + 1}</span>
              </div>
              <div className="de-timeline-content">
                <div className="de-timeline-header">
                  <span className="de-timeline-name">
                    {event.person.name}
                    {event.isExcluded && <span className="de-badge de-badge-excluded">Excluded</span>}
                    {event.isAbandoned && <span className="de-badge de-badge-abandoned">Abandoned</span>}
                  </span>
                  <span className="de-timeline-date">{formatDate(event.person.dateOfDeath)}</span>
                </div>
                <div className="de-timeline-details">
                  <span className="de-timeline-estate">
                    Estate: <strong>{formatNumber(event.totalEstate)}</strong> sqm
                  </span>
                  <span className="de-timeline-heirs">
                    Heirs: <strong>{event.heirs?.length || 0}</strong>
                  </span>
                  {event.distribution && event.distribution.length > 0 && (
                    <span className="de-timeline-click">Click to view →</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderHeirsList = () => {
    if (!divisionResults) return null;
    const { heirs, totalEstate } = divisionResults;

    return (
      <div className="de-heirs-section">
        <h3 className="de-section-title">
          <span className="de-section-icon">👥</span>
          Heirs & Their Shares
        </h3>
        <div className="de-heirs-list">
          {heirs.map((heir, index) => {
            const pct = (heir.total / totalEstate) * 100;
            const color = getTypeColor('Heir');
            
            return (
              <motion.div
                key={heir.person.id}
                className="de-heir-card"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
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
                        background: color.bg,
                        color: color.color,
                      }}>
                        Exclusive
                      </span>
                    </div>
                    <div className="de-heir-source">
                      {heir.inheritanceHistory && heir.inheritanceHistory.length > 0 && (
                        heir.inheritanceHistory.map((item, idx) => (
                          <span key={idx}>
                            {idx > 0 && ' + '}
                            <span className="de-source-item">
                              {item.source}: {formatNumber(item.amount)} sqm
                            </span>
                          </span>
                        ))
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
                </div>
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
                <div>
                  <h2 className="de-modal-title">{selectedEvent.person.name}</h2>
                  <p className="de-modal-subtitle">
                    Died: {formatDate(selectedEvent.person.dateOfDeath)}
                  </p>
                </div>
                <button className="de-modal-close" onClick={() => setShowEventModal(false)}>✕</button>
              </div>

              <div className="de-modal-body">
                <div className="de-modal-estate">
                  <div className="de-modal-estate-item">
                    <span className="de-modal-estate-label">Total Estate</span>
                    <span className="de-modal-estate-value">{formatNumber(selectedEvent.totalEstate)} sqm</span>
                  </div>
                  <div className="de-modal-estate-item">
                    <span className="de-modal-estate-label">Conjugal Share</span>
                    <span className="de-modal-estate-value">{formatNumber(selectedEvent.conjugalShare)} sqm</span>
                  </div>
                  <div className="de-modal-estate-item">
                    <span className="de-modal-estate-label">Exclusive Property</span>
                    <span className="de-modal-estate-value">{formatNumber(selectedEvent.exclusiveProperty)} sqm</span>
                  </div>
                </div>

                <div className="de-modal-distribution">
                  <h4 className="de-modal-section-title">Distribution</h4>
                  {selectedEvent.distribution.map((dist, idx) => {
                    const color = getTypeColor(dist.type);
                    return (
                      <div key={idx} className="de-modal-dist-item">
                        <div className="de-modal-dist-left">
                          <span className="de-modal-dist-name">{dist.heir.name}</span>
                          <span className="de-modal-dist-type" style={{
                            background: color.bg,
                            color: color.color,
                          }}>
                            {dist.type}
                          </span>
                        </div>
                        <div className="de-modal-dist-right">
                          <span className="de-modal-dist-share">{formatNumber(dist.share)} sqm</span>
                          {dist.passedTo && (
                            <div className="de-modal-dist-passed">
                              → {dist.passedTo.map(p => 
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

              <div className="de-modal-footer">
                <button className="de-modal-btn" onClick={() => setShowEventModal(false)}>
                  Close
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
    <div className="de-wrapper">
      <div className="de-header">
        <div className="de-header-left">
          <h1 className="de-title">⚖️ Division Engine</h1>
          <p className="de-subtitle">Philippine Intestate Succession System</p>
          <span className="de-badge-intestate">Intestate Only</span>
        </div>
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

      {divisionResults ? (
        <div className="de-results">
          {renderSummaryCards()}
          
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
            <span>🎯 {propositusId ? persons.find(p => p.id === propositusId)?.name : 'None'}</span>
          </div>
        </div>
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
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          padding: 18px 24px;
          background: var(--card-bg, #ffffff);
          border-radius: 14px;
          border: 1px solid var(--border-color, #e2e8f0);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .de-header-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .de-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary, #0f172a);
          margin: 0;
          letter-spacing: -0.5px;
        }

        .de-subtitle {
          font-size: 13px;
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
          border-radius: 12px;
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
          border: 1px solid rgba(139, 92, 246, 0.2);
          margin-top: 3px;
          width: fit-content;
        }

        /* ============================================================
           BUTTONS
           ============================================================ */
        .de-btn {
          padding: 10px 28px;
          border-radius: 10px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
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

        .de-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .de-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
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
           SUMMARY CARDS
           ============================================================ */
        .de-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 12px;
        }

        .de-summary-card {
          background: var(--card-bg, #ffffff);
          border-radius: 12px;
          padding: 16px 18px;
          border: 1px solid var(--border-color, #e2e8f0);
          text-align: center;
          transition: all 0.2s ease;
        }

        .de-summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .de-summary-highlight {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.06));
          border-color: rgba(99, 102, 241, 0.15);
        }

        .de-summary-icon {
          font-size: 18px;
          margin-bottom: 2px;
        }

        .de-summary-value {
          display: block;
          font-size: 26px;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
        }

        .de-summary-label {
          display: block;
          font-size: 11px;
          color: var(--text-secondary, #64748b);
          margin-top: 2px;
          font-weight: 500;
        }

        .de-summary-unit {
          display: block;
          font-size: 10px;
          color: var(--text-secondary, #64748b);
          margin-top: 1px;
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
        .de-timeline-heirs strong {
          color: var(--text-primary, #0f172a);
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

          .de-btn {
            width: 100%;
            justify-content: center;
          }

          .de-summary-grid {
            grid-template-columns: 1fr 1fr;
          }

          .de-summary-value {
            font-size: 22px;
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
        }

        @media (max-width: 480px) {
          .de-summary-grid {
            grid-template-columns: 1fr;
          }

          .de-title {
            font-size: 20px;
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
        `}</style>
    </div>
  );
};

export default DivisionEngine;