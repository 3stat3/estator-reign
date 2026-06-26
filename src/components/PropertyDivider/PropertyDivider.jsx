// src/components/PropertyDivider/PropertyDivider.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserGroupIcon,
  BuildingOffice2Icon,
  ClockIcon,
  UserPlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  HeartIcon,
  UsersIcon,
  CalendarIcon,
  SparklesIcon,
  InformationCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const PropertyDivider = ({ 
  people = [], 
  totalEstateValue = 0,
  onAddPerson,
  onBulkAdd,
  onClearAll,
  onEditPerson,
  onDeletePerson,
  onViewPerson,
  onAddProperty,
  onEditProperty,
  onDeleteProperty,
  darkMode = false
}) => {
  const [viewMode, setViewMode] = useState('portfolio');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [editPersonName, setEditPersonName] = useState('');
  const [editingPerson, setEditingPerson] = useState(null);

  // Log people for debugging
  console.log('People in PropertyDivider:', people);

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter people
  const filteredPeople = people.filter(person => {
    const matchesSearch = person.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    if (filter === 'all') return matchesSearch;
    if (filter === 'deceased') return matchesSearch && person.isDeceased;
    if (filter === 'living') return matchesSearch && !person.isDeceased;
    return matchesSearch;
  });

  // Handlers
  const handleViewPerson = (person) => {
    setSelectedPerson(person);
    setShowDetailModal(true);
    onViewPerson?.(person);
  };

  const handleEditPerson = (person) => {
    setEditingPerson(person);
    setEditPersonName(person.name);
    setShowAddPersonModal(true);
  };

  const handleDeletePerson = (person) => {
    if (window.confirm(`Are you sure you want to delete ${person.name}?`)) {
      onDeletePerson?.(person);
      if (selectedPerson?.id === person.id) {
        setSelectedPerson(null);
        setShowDetailModal(false);
      }
    }
  };

  const handleAddProperty = (person) => {
    onAddProperty?.(person);
  };

  const handleClearAll = () => {
    onClearAll?.();
    setShowClearConfirm(false);
  };

  const handleSavePerson = () => {
    if (!newPersonName.trim()) {
      alert('Please enter a name');
      return;
    }

    const name = newPersonName.trim();
    
    if (editingPerson) {
      // Edit existing person
      onEditPerson?.({ 
        ...editingPerson, 
        name: name 
      });
    } else {
      // Add new person - pass the name, parent component will create the full object
      onAddPerson?.(name);
    }
    
    setNewPersonName('');
    setEditPersonName('');
    setEditingPerson(null);
    setShowAddPersonModal(false);
  };

  // Hero Stats
  const HeroStats = () => {
    const totalProperties = people.reduce((sum, p) => sum + (p.properties?.length || 0), 0);
    const deceasedCount = people.filter(p => p.isDeceased).length;
    const livingCount = people.filter(p => !p.isDeceased).length;
    const topDecedent = people
      .filter(p => p.isDeceased && p.properties?.length > 0)
      .sort((a, b) => (b.properties?.length || 0) - (a.properties?.length || 0))[0];

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '20px',
          borderRadius: '16px',
          background: darkMode ? 'rgba(30,30,46,0.8)' : 'rgba(255,255,255,0.9)',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 500 }}>Total Estate</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: darkMode ? '#fff' : '#1a1a2e', marginTop: '4px' }}>
            {formatNumber(totalEstateValue)} <span style={{ fontSize: '14px', fontWeight: 400, color: darkMode ? '#94a3b8' : '#64748b' }}>sqm</span>
          </div>
        </div>

        <div style={{
          padding: '20px',
          borderRadius: '16px',
          background: darkMode ? 'rgba(30,30,46,0.8)' : 'rgba(255,255,255,0.9)',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 500 }}>Total Properties</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: darkMode ? '#fff' : '#1a1a2e', marginTop: '4px' }}>
            {totalProperties}
          </div>
          <div style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px' }}>
            Across {people.length} people
          </div>
        </div>

        <div style={{
          padding: '20px',
          borderRadius: '16px',
          background: darkMode ? 'rgba(30,30,46,0.8)' : 'rgba(255,255,255,0.9)',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 500 }}>Family Members</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: darkMode ? '#fff' : '#1a1a2e', marginTop: '4px' }}>
            {people.length}
          </div>
          <div style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px' }}>
            {deceasedCount} deceased, {livingCount} living
          </div>
        </div>

        {topDecedent && (
          <div style={{
            padding: '20px',
            borderRadius: '16px',
            background: darkMode ? 'rgba(30,30,46,0.8)' : 'rgba(255,255,255,0.9)',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 500 }}>Largest Estate</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: darkMode ? '#fff' : '#1a1a2e', marginTop: '4px' }}>
              {topDecedent.name}
            </div>
            <div style={{ fontSize: '14px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
              {topDecedent.properties?.length || 0} properties
            </div>
          </div>
        )}
      </div>
    );
  };

  // Person Card
  const PersonCard = ({ person }) => {
    const isDeceased = person.isDeceased;
    const totalSqm = person.properties?.reduce((sum, p) => sum + (p.totalSqm || 0), 0) || 0;
    const conjugalShare = person.properties?.filter(p => p.classification === 'Conjugal')
      .reduce((sum, p) => sum + ((p.totalSqm || 0) / 2), 0) || 0;
    const hasSpouse = !!person.spouse;
    const hasChildren = person.children?.length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          borderRadius: '16px',
          background: darkMode ? 'rgba(30,30,46,0.8)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        whileHover={{ boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
        onClick={() => handleViewPerson(person)}
      >
        {/* Card Header */}
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: isDeceased 
              ? 'linear-gradient(135deg, #f093fb, #f5576c)'
              : 'linear-gradient(135deg, #4facfe, #00f2fe)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0,
            color: 'white',
            fontWeight: 700
          }}>
            {getInitials(person.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 600,
              color: darkMode ? '#fff' : '#1a1a2e',
              fontSize: '16px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {person.name}
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '2px'
            }}>
              <span style={{
                fontSize: '11px',
                padding: '2px 10px',
                borderRadius: '20px',
                background: isDeceased ? '#ef444422' : '#22c55e22',
                color: isDeceased ? '#ef4444' : '#22c55e'
              }}>
                {isDeceased ? 'Deceased' : 'Living'}
              </span>
              {person.isOriginalOwner && (
                <span style={{
                  fontSize: '11px',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  background: '#f59e0b22',
                  color: '#f59e0b'
                }}>
                  ⭐ Owner
                </span>
              )}
            </div>
          </div>
          <div style={{
            fontSize: '12px',
            color: darkMode ? '#94a3b8' : '#64748b',
            textAlign: 'right'
          }}>
            {person.properties?.length || 0} props
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleEditPerson(person); }}
              style={{
                padding: '4px 8px',
                border: 'none',
                borderRadius: '6px',
                background: 'transparent',
                color: darkMode ? '#94a3b8' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <PencilIcon style={{ width: '16px', height: '16px' }} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeletePerson(person); }}
              style={{
                padding: '4px 8px',
                border: 'none',
                borderRadius: '6px',
                background: 'transparent',
                color: '#ef4444',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <TrashIcon style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        {/* Card Stats */}
        <div style={{
          padding: '12px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
              {formatNumber(totalSqm)}
            </div>
            <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b' }}>Total Sqm</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
              {conjugalShare > 0 ? formatNumber(conjugalShare) : '-'}
            </div>
            <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b' }}>Conjugal Share</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
              {isDeceased ? formatNumber(totalSqm) : '-'}
            </div>
            <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b' }}>{isDeceased ? 'Estate' : 'N/A'}</div>
          </div>
        </div>

        {/* Relationship Tags */}
        <div style={{
          padding: '10px 20px',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap'
        }}>
          {hasSpouse && (
            <span style={{
              fontSize: '11px',
              padding: '2px 10px',
              borderRadius: '20px',
              background: darkMode ? '#1e2d3d' : '#eef2ff',
              color: darkMode ? '#94a3b8' : '#64748b'
            }}>
              💍 {person.spouse}
            </span>
          )}
          {hasChildren && (
            <span style={{
              fontSize: '11px',
              padding: '2px 10px',
              borderRadius: '20px',
              background: darkMode ? '#1e2d3d' : '#eef2ff',
              color: darkMode ? '#94a3b8' : '#64748b'
            }}>
              👨‍👧‍👦 {person.children.length} children
            </span>
          )}
          {person.dod && (
            <span style={{
              fontSize: '11px',
              padding: '2px 10px',
              borderRadius: '20px',
              background: darkMode ? '#1e2d3d' : '#eef2ff',
              color: darkMode ? '#94a3b8' : '#64748b'
            }}>
              ⚰️ {formatDate(person.dod)}
            </span>
          )}
        </div>

        {/* Click indicator */}
        <div style={{
          padding: '8px 20px',
          textAlign: 'center',
          fontSize: '11px',
          color: darkMode ? '#64748b' : '#94a3b8',
          borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`
        }}>
          Click to view details →
        </div>
      </motion.div>
    );
  };

  // Detail Modal
  const DetailModal = ({ person, onClose }) => {
    if (!person) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
      >
        <div style={{
          background: darkMode ? '#1e1e2e' : '#ffffff',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: darkMode ? '#94a3b8' : '#64748b'
            }}
          >
            ✕
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: person.isDeceased 
                ? 'linear-gradient(135deg, #f093fb, #f5576c)'
                : 'linear-gradient(135deg, #4facfe, #00f2fe)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'white',
              fontWeight: 700
            }}>
              {getInitials(person.name)}
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: darkMode ? '#fff' : '#1a1a2e' }}>{person.name}</h2>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <span style={{
                  fontSize: '12px',
                  padding: '2px 12px',
                  borderRadius: '20px',
                  background: person.isDeceased ? '#ef444422' : '#22c55e22',
                  color: person.isDeceased ? '#ef4444' : '#22c55e'
                }}>
                  {person.isDeceased ? 'Deceased' : 'Living'}
                </span>
                {person.isOriginalOwner && (
                  <span style={{
                    fontSize: '12px',
                    padding: '2px 12px',
                    borderRadius: '20px',
                    background: '#f59e0b22',
                    color: '#f59e0b'
                  }}>
                    ⭐ Owner
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: darkMode ? '#fff' : '#1a1a2e' }}>Personal Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b' }}>Spouse</span>
                <div style={{ fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}>{person.spouse || 'None'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b' }}>Children</span>
                <div style={{ fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}>{person.children?.length || 0}</div>
              </div>
              {person.dod && (
                <div>
                  <span style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b' }}>Date of Death</span>
                  <div style={{ fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}>{formatDate(person.dod)}</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: darkMode ? '#fff' : '#1a1a2e' }}>Properties</h3>
            <button
              onClick={() => { handleAddProperty(person); }}
              style={{
                padding: '4px 12px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                fontSize: '12px',
                cursor: 'pointer',
                marginBottom: '8px'
              }}
            >
              + Add Property
            </button>
            {person.properties?.length > 0 ? (
              person.properties.map(prop => (
                <div key={prop.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: darkMode ? '#0a0c10' : '#f8fafc',
                  borderRadius: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{ color: darkMode ? '#fff' : '#1a1a2e' }}>{prop.name}</span>
                  <span style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>{prop.totalSqm} sqm • {prop.classification}</span>
                </div>
              ))
            ) : (
              <p style={{ color: darkMode ? '#64748b' : '#94a3b8', fontSize: '13px' }}>No properties</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { handleEditPerson(person); onClose(); }}
              style={{
                padding: '8px 16px',
                background: darkMode ? '#2d2d44' : '#f3f4f6',
                border: `1px solid ${darkMode ? '#334155' : '#e5e7eb'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: darkMode ? '#fff' : '#1a1a2e',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#3d3d5c' : '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f3f4f6'}
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => { handleDeletePerson(person); onClose(); }}
              style={{
                padding: '8px 16px',
                background: darkMode ? '#2d1f1f' : '#fee2e2',
                border: `1px solid ${darkMode ? '#4a1f1f' : '#fecaca'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: '#dc2626',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#4a2f2f' : '#fecaca'}
              onMouseLeave={(e) => e.currentTarget.style.background = darkMode ? '#2d1f1f' : '#fee2e2'}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add Person Modal
  const AddPersonModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}
    onClick={() => {
      setShowAddPersonModal(false);
      setEditingPerson(null);
      setNewPersonName('');
      setEditPersonName('');
    }}
    >
      <div style={{
        background: darkMode ? '#1e1e2e' : '#ffffff',
        borderRadius: '24px',
        padding: '32px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: darkMode ? '#fff' : '#1a1a2e' }}>
          {editingPerson ? 'Edit Person' : 'Add New Person'}
        </h3>
        <input
          type="text"
          placeholder="Enter person name..."
          value={editingPerson ? editPersonName : newPersonName}
          onChange={(e) => {
            if (editingPerson) {
              setEditPersonName(e.target.value);
            } else {
              setNewPersonName(e.target.value);
            }
          }}
          style={{
            width: '100%',
            padding: '12px',
            border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
            borderRadius: '12px',
            background: darkMode ? '#0f1220' : '#fff',
            color: darkMode ? '#fff' : '#000',
            fontSize: '14px',
            outline: 'none',
            marginBottom: '16px'
          }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              setShowAddPersonModal(false);
              setEditingPerson(null);
              setNewPersonName('');
              setEditPersonName('');
            }}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
              borderRadius: '40px',
              color: darkMode ? '#fff' : '#1a1a2e',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSavePerson}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '40px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {editingPerson ? 'Save Changes' : 'Add Person'}
          </button>
        </div>
      </div>
    </div>
  );

  // Empty State
  const EmptyState = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '40px',
      color: darkMode ? '#94a3b8' : '#64748b',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>🏛️</div>
      <h3 style={{ fontSize: '24px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e', marginBottom: '12px' }}>
        Estate Portfolio
      </h3>
      <p style={{ maxWidth: '400px', marginBottom: '24px' }}>
        Start by adding people to your family tree. Build your estate portfolio view.
      </p>
      <button
        onClick={() => {
          setEditingPerson(null);
          setNewPersonName('');
          setShowAddPersonModal(true);
        }}
        style={{
          padding: '10px 24px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          borderRadius: '40px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        + Add First Person
      </button>
    </div>
  );

  // Portfolio View
  const PortfolioView = () => {
    if (people.length === 0) return <EmptyState />;

    return (
      <div style={{
        height: '100%',
        overflow: 'auto',
        padding: '20px',
        background: darkMode ? '#0a0c10' : '#f8fafc'
      }}>
        <HeroStats />

        {/* Controls */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: darkMode ? 'rgba(30,30,46,0.6)' : 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
        }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {['all', 'deceased', 'living'].map(opt => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                style={{
                  padding: '4px 14px',
                  borderRadius: '40px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: filter === opt ? (darkMode ? '#667eea' : '#667eea') : 'transparent',
                  color: filter === opt ? '#fff' : (darkMode ? '#94a3b8' : '#64748b'),
                  transition: 'all 0.2s'
                }}
              >
                {opt === 'all' ? 'All' : opt === 'deceased' ? '⚰️ Deceased' : '💚 Living'}
              </button>
            ))}
          </div>
        </div>

        {/* Person Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {filteredPeople.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>

        {filteredPeople.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: darkMode ? '#94a3b8' : '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '20px', fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e', marginBottom: '8px' }}>
              No people found
            </h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    );
  };

  // Map View
  const MapView = () => (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: darkMode ? '#0a0c10' : '#f8fafc',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ fontSize: '64px' }}>🗺️</div>
      <h3 style={{ fontSize: '20px', fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}>Family Map View</h3>
      <p style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>Interactive family tree visualization</p>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: darkMode ? '#0a0c10' : '#f8fafc',
      fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      overflow: 'hidden'
    }}>
      {/* Top Toolbar */}
      <div style={{
        padding: '12px 20px',
        background: darkMode ? '#14161f' : '#ffffff',
        borderBottom: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🏛️</span>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: darkMode ? '#fff' : '#1a1a2e', margin: 0 }}>
            Estate Portfolio
          </h1>
          <div style={{
            display: 'flex',
            gap: '4px',
            background: darkMode ? '#0a0c10' : '#f1f5f9',
            borderRadius: '40px',
            padding: '3px',
            marginLeft: '8px'
          }}>
            <button
              onClick={() => setViewMode('portfolio')}
              style={{
                padding: '4px 14px',
                borderRadius: '40px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                background: viewMode === 'portfolio' ? (darkMode ? '#667eea' : '#667eea') : 'transparent',
                color: viewMode === 'portfolio' ? '#fff' : (darkMode ? '#94a3b8' : '#64748b'),
                transition: 'all 0.2s'
              }}
            >
              📊 Portfolio
            </button>
            <button
              onClick={() => setViewMode('map')}
              style={{
                padding: '4px 14px',
                borderRadius: '40px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                background: viewMode === 'map' ? (darkMode ? '#667eea' : '#667eea') : 'transparent',
                color: viewMode === 'map' ? '#fff' : (darkMode ? '#94a3b8' : '#64748b'),
                transition: 'all 0.2s'
              }}
            >
              🗺️ Map
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setEditingPerson(null);
              setNewPersonName('');
              setShowAddPersonModal(true);
            }}
            style={{
              padding: '6px 16px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '40px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            + Add Person
          </button>
          <button
            onClick={onBulkAdd}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              color: darkMode ? '#94a3b8' : '#64748b',
              border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
              borderRadius: '40px',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Bulk Add
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              color: '#ef4444',
              border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
              borderRadius: '40px',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{
        padding: '8px 20px',
        background: darkMode ? '#14161f' : '#ffffff',
        borderBottom: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0
      }}>
        <input
          type="text"
          placeholder="🔍 Search people..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            maxWidth: '300px',
            padding: '6px 14px',
            border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
            borderRadius: '40px',
            background: darkMode ? '#0a0c10' : '#f8fafc',
            color: darkMode ? '#fff' : '#000',
            fontSize: '13px',
            outline: 'none'
          }}
        />
        <div style={{ 
          fontSize: '12px', 
          color: darkMode ? '#94a3b8' : '#64748b',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <span>👤 {people.length}</span>
          <span>🏠 {people.reduce((sum, p) => sum + (p.properties?.length || 0), 0)}</span>
          {totalEstateValue > 0 && (
            <span style={{ fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
              💰 {formatNumber(totalEstateValue)} sqm
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        background: darkMode ? '#0a0c10' : '#f8fafc',
        minHeight: 0
      }}>
        {viewMode === 'portfolio' ? <PortfolioView /> : <MapView />}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPerson && (
        <DetailModal 
          person={selectedPerson} 
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPerson(null);
          }} 
        />
      )}

      {/* Add/Edit Person Modal */}
      {showAddPersonModal && <AddPersonModal />}

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}
        onClick={() => setShowClearConfirm(false)}
        >
          <div style={{
            background: darkMode ? '#1e1e2e' : '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '400px',
            width: '100%'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: darkMode ? '#fff' : '#1a1a2e' }}>
              ⚠️ Clear All Data?
            </h3>
            <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '24px' }}>
              This will permanently delete all people and properties. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '40px',
                  color: darkMode ? '#fff' : '#1a1a2e',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                style={{
                  padding: '10px 24px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '40px',
                  cursor: 'pointer'
                }}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDivider;