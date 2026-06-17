// src/components/PropertyDivider/PropertyDivider.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { calculateAllInheritance, AssetLedger } from './inheritance/index.js';

// ==================== PERSON MODAL COMPONENT ====================
const PersonModalComponent = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingPerson, 
  decedents, 
  darkMode, 
  isMobile 
}) => {
  const [localForm, setLocalForm] = useState({
    name: '',
    dod: '',
    gender: 'Male',
    spouseId: null,
    parentId: null,
    isDeceased: false
  });

  useEffect(() => {
    if (isOpen) {
      if (editingPerson) {
        setLocalForm({
          name: editingPerson.name || '',
          dod: editingPerson.dod || '',
          gender: editingPerson.gender || 'Male',
          spouseId: editingPerson.spouseId || null,
          parentId: editingPerson.parentId || null,
          isDeceased: editingPerson.isDeceased || false
        });
      } else {
        setLocalForm({
          name: '',
          dod: '',
          gender: 'Male',
          spouseId: null,
          parentId: null,
          isDeceased: false
        });
      }
    }
  }, [isOpen, editingPerson]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setLocalForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (!localForm.name.trim()) {
      alert('Please enter a name');
      return;
    }
    onSave(localForm);
  };

  const availablePeople = useMemo(() => {
    return decedents.filter(p => {
      if (editingPerson && p.id === editingPerson.id) return false;
      return true;
    });
  }, [decedents, editingPerson]);

  return (
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
      zIndex: 9999, 
      backdropFilter: 'blur(8px)', 
      padding: '16px' 
    }}>
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
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
          {editingPerson ? 'Edit Person' : 'Add New Person'}
        </h3>
        
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>Full Name *</label>
        <input 
          type="text" 
          placeholder="e.g., Juan Dela Cruz" 
          value={localForm.name} 
          onChange={(e) => handleChange('name', e.target.value)} 
          style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '14px' }} 
          autoFocus
        />
        
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>⚰️ Date of Death (leave blank if still alive)</label>
        <input 
          type="date" 
          value={localForm.dod} 
          onChange={(e) => {
            const value = e.target.value;
            handleChange('dod', value);
            handleChange('isDeceased', !!value);
          }} 
          style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }} 
        />
        
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>Gender</label>
        <select 
          value={localForm.gender} 
          onChange={(e) => handleChange('gender', e.target.value)} 
          style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }}
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>💍 Spouse (if married)</label>
        <select 
          value={localForm.spouseId ?? ''} 
          onChange={(e) => {
            const value = e.target.value;
            handleChange('spouseId', value ? Number(value) : null);
          }} 
          style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }}
        >
          <option value="">No Spouse / Select Spouse</option>
          {availablePeople.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} {p.dod ? '⚰️ Deceased' : '💚 Alive'}
            </option>
          ))}
        </select>
        
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>👪 Parent</label>
        <select 
          value={localForm.parentId ?? ''} 
          onChange={(e) => {
            const value = e.target.value;
            handleChange('parentId', value ? Number(value) : null);
          }} 
          style={{ width: '100%', padding: '12px', marginBottom: '20px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }}
        >
          <option value="">No Parent / Select Parent</option>
          {availablePeople.map(p => (
            <option key={p.id} value={p.id}>{p.name} {p.dod ? '⚰️ Deceased' : '💚 Alive'}</option>
          ))}
        </select>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
          <button 
            onClick={onClose} 
            type="button"
            style={{ padding: '10px 20px', cursor: 'pointer', background: 'transparent', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '40px', fontSize: '13px', fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            type="button"
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '40px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Save Person
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ==================== PROPERTY MODAL COMPONENT ====================
const PropertyModalComponent = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingProperty, 
  darkMode, 
  isMobile 
}) => {
  const [localForm, setLocalForm] = useState({
    name: '',
    type: 'Land',
    totalSqm: '',
    classification: 'Conjugal'
  });

  useEffect(() => {
    if (isOpen) {
      if (editingProperty) {
        setLocalForm({
          name: editingProperty.name || '',
          type: editingProperty.type || 'Land',
          totalSqm: editingProperty.totalSqm || '',
          classification: editingProperty.classification || 'Conjugal'
        });
      } else {
        setLocalForm({
          name: '',
          type: 'Land',
          totalSqm: '',
          classification: 'Conjugal'
        });
      }
    }
  }, [isOpen, editingProperty]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setLocalForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (!localForm.name.trim() || !localForm.totalSqm) {
      alert('Please fill all property fields');
      return;
    }
    onSave(localForm);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)', padding: '16px' }}>
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
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
          {editingProperty ? 'Edit Property' : 'Add Property'}
        </h3>
        
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>Property Name</label>
        <input type="text" placeholder="e.g., Family Home, Lot A" value={localForm.name} onChange={(e) => handleChange('name', e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }} />
        
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>Property Type</label>
        <select value={localForm.type} onChange={(e) => handleChange('type', e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }}>
          <option value="Land">Land</option>
          <option value="Building">Building</option>
          <option value="Land & Building">Land & Building</option>
        </select>
        
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>Total Area (Square Meters)</label>
        <input type="number" placeholder="e.g., 300" value={localForm.totalSqm} onChange={(e) => handleChange('totalSqm', e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }} />
        
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: darkMode ? '#94a3b8' : '#64748b' }}>Classification</label>
        <select value={localForm.classification} onChange={(e) => handleChange('classification', e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: darkMode ? '#0f1220' : '#fff', color: darkMode ? '#fff' : '#000' }}>
          <option value="Exclusive">Exclusive - 100% belongs to decedent</option>
          <option value="Conjugal">Conjugal/Community - 50% to spouse, 50% to estate</option>
        </select>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
          <button onClick={onClose} type="button" style={{ padding: '10px 20px', cursor: 'pointer', background: 'transparent', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '40px', fontSize: '13px', fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}>Cancel</button>
          <button onClick={handleSave} type="button" style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '40px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Save Property</button>
        </div>
      </motion.div>
    </div>
  );
};

// ==================== PERSON DETAIL MODAL ====================
const PersonDetailModal = ({ 
  person, 
  decedents, 
  inheritanceResult, 
  inheritanceTransfers,
  totalEstateValue,
  onClose, 
  onEdit, 
  onAddProperty, 
  onEditProperty, 
  onDeleteProperty,
  darkMode,
  formatNumber
}) => {
  if (!person) return null;

  const spouse = decedents.find(p => p.id === person.spouseId);
  const children = decedents.filter(p => p.parentId === person.id);
  const hasChildren = children.length > 0;
  const parents = decedents.filter(p => p.id === person.parentId);

  // Calculate conjugal properties for this person
  const conjugalProperties = person.properties?.filter(p => p.classification === 'Conjugal') || [];
  const exclusiveProperties = person.properties?.filter(p => p.classification === 'Exclusive') || [];
  
  // Calculate total conjugal share (50% of conjugal properties)
  const totalConjugalShare = conjugalProperties.reduce((sum, prop) => sum + (prop.totalSqm / 2), 0);
  const totalExclusive = exclusiveProperties.reduce((sum, prop) => sum + prop.totalSqm, 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9998,
      padding: '20px'
    }}
    onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        style={{
          background: darkMode ? '#1e1e2e' : '#ffffff',
          borderRadius: '24px',
          padding: '32px',
          width: '700px',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: darkMode ? '#94a3b8' : '#64748b',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f0f0f0'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          ✕
        </button>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: darkMode ? '#fff' : '#1a1a2e', margin: 0 }}>
              {person.name}
            </h2>
            <span style={{ fontSize: '24px' }}>
              {person.isDeceased ? '⚰️' : '💚'}
            </span>
            <button
              onClick={() => { onEdit(person); }}
              type="button"
              style={{
                padding: '6px 14px',
                background: 'transparent',
                border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                borderRadius: '40px',
                fontSize: '12px',
                cursor: 'pointer',
                color: darkMode ? '#94a3b8' : '#64748b'
              }}
            >
              ✏️ Edit
            </button>
          </div>
          
          <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '14px', margin: 0 }}>
            {person.dod ? `Died: ${new Date(person.dod).toLocaleDateString()}` : 'Still Alive'}
          </p>
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
            {spouse && (
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: '20px', 
                background: darkMode ? '#1e2d3d' : '#eef2ff',
                color: darkMode ? '#94a3b8' : '#64748b',
                fontSize: '13px'
              }}>
                💍 Spouse: {spouse.name}
              </span>
            )}
            {parents.length > 0 && (
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: '20px', 
                background: darkMode ? '#1e2d3d' : '#eef2ff',
                color: darkMode ? '#94a3b8' : '#64748b',
                fontSize: '13px'
              }}>
                👪 Parent: {parents[0].name}
              </span>
            )}
            {hasChildren && (
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: '20px', 
                background: darkMode ? '#1e2d3d' : '#eef2ff',
                color: darkMode ? '#94a3b8' : '#64748b',
                fontSize: '13px'
              }}>
                👨‍👧‍👦 {children.length} children
              </span>
            )}
            {person.properties?.length > 0 && (
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: '20px', 
                background: darkMode ? '#1e2d3d' : '#eef2ff',
                color: darkMode ? '#94a3b8' : '#64748b',
                fontSize: '13px'
              }}>
                📦 {person.properties.length} properties
              </span>
            )}
          </div>
        </div>

        <div style={{
          background: darkMode ? '#14161f' : '#f8fafc',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e', margin: 0 }}>
              📋 Properties
            </h3>
            <button
              onClick={() => { onAddProperty(); }}
              type="button"
              style={{
                padding: '6px 16px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '40px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              + Add Property
            </button>
          </div>
          
          {person.properties && person.properties.length > 0 ? (
            <div>
              {person.properties.map(prop => (
                <div key={prop.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  marginBottom: '6px',
                  borderRadius: '8px',
                  background: darkMode ? '#0a0c10' : '#ffffff',
                  border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`
                }}>
                  <div>
                    <div style={{ fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e', fontSize: '14px' }}>
                      {prop.name}
                    </div>
                    <div style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                      {prop.type} • {prop.totalSqm} sqm • {prop.classification}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => { onEditProperty(prop); }}
                      type="button"
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: 'none',
                        color: darkMode ? '#94a3b8' : '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDeleteProperty(prop.id)}
                      type="button"
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: darkMode ? '#64748b' : '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
              No properties added yet
            </p>
          )}
        </div>

        {/* Enhanced Inheritance Summary - Now includes all transfer details */}
        {inheritanceResult && (
          <div style={{
            background: darkMode ? '#14161f' : '#f8fafc',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e', marginBottom: '12px' }}>
              💰 Inheritance Summary
            </h3>
            
            {/* Show total estate for decedents */}
            {inheritanceResult.isDecedent ? (
              <div>
                <div style={{ 
                  padding: '12px',
                  background: darkMode ? '#1e2d3d' : '#eef2ff',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '14px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                    Total Estate Value
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
                    {formatNumber(inheritanceResult.decedentEstate)} sqm
                  </div>
                  <div style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px' }}>
                    {inheritanceResult.isHeir ? `Also an heir: ${inheritanceResult.heirRelationship}` : 'Decedent'}
                  </div>
                </div>
                
                {inheritanceResult.transfers && inheritanceResult.transfers.length > 0 && (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: darkMode ? '#fff' : '#1a1a2e' }}>
                      📤 Distributions:
                    </div>
                    {inheritanceResult.transfers.map((t, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        marginBottom: '4px',
                        borderRadius: '6px',
                        background: darkMode ? '#0a0c10' : '#ffffff',
                        borderLeft: `4px solid ${t.conjugal ? '#4CAF50' : '#2196F3'}`
                      }}>
                        <span style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                          → {t.toName} 
                          {t.conjugal ? ' (Conjugal Share)' : ' (Inheritance)'}
                          {t.represents && ` (${t.represents})`}
                        </span>
                        <span style={{ fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}>
                          {formatNumber(t.amount)} sqm
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : inheritanceResult.isHeir ? (
  <div>
    {/* Show total inherited estate */}
    <div style={{ 
      padding: '12px',
      background: darkMode ? '#1e2d3d' : '#eef2ff',
      borderRadius: '8px',
      marginBottom: '12px'
    }}>
      <div style={{ fontSize: '14px', color: darkMode ? '#94a3b8' : '#64748b' }}>
        Total Estate Holdings
      </div>
      <div style={{ fontSize: '24px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
        {formatNumber(inheritanceResult.totalEstateValue || 0)} sqm
      </div>
      <div style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px' }}>
        {inheritanceResult.heirRelationship}
      </div>
    </div>
    
    {/* Show conjugal share owned by this person (automatic 50% of conjugal properties) */}
    {inheritanceResult.conjugalShareOwned > 0 && (
      <div style={{
        padding: '10px 14px',
        marginBottom: '10px',
        borderRadius: '8px',
        background: darkMode ? '#1e2d3d' : '#eef2ff',
        border: `1px solid ${darkMode ? '#2d3d4d' : '#dde6ff'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>
            💍 Conjugal Share Owned (50% of conjugal properties)
          </span>
          <span style={{ fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
            {formatNumber(inheritanceResult.conjugalShareOwned)} sqm
          </span>
        </div>
        <div style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '4px' }}>
          This is the spouse's automatic 50% share of conjugal properties
        </div>
      </div>
    )}
    
    {/* Show conjugal share received from inheritance */}
    {inheritanceResult.totalConjugal > 0 && (
      <div style={{
        padding: '10px 14px',
        marginBottom: '10px',
        borderRadius: '8px',
        background: darkMode ? '#1e2d3d' : '#eef2ff',
        border: `1px solid ${darkMode ? '#2d3d4d' : '#dde6ff'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>
            💍 Conjugal Share (from deceased spouse's estate)
          </span>
          <span style={{ fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
            {formatNumber(inheritanceResult.totalConjugal)} sqm
          </span>
        </div>
        <div style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '4px' }}>
          Inherited conjugal share from deceased spouse
        </div>
      </div>
    )}
    
    {/* Show inheritance received */}
    {inheritanceResult.totalInherited > 0 && (
      <div style={{
        padding: '10px 14px',
        marginBottom: '10px',
        borderRadius: '8px',
        background: darkMode ? '#0a0c10' : '#ffffff',
        border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>
            📦 Inheritance Received
          </span>
          <span style={{ fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
            {formatNumber(inheritanceResult.totalInherited)} sqm
          </span>
        </div>
        <div style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '4px' }}>
          Inheritance from deceased spouse's estate
        </div>
      </div>
    )}
    
    {/* Show exclusive properties owned */}
    {totalExclusive > 0 && !person.isDeceased && (
      <div style={{
        padding: '10px 14px',
        marginBottom: '10px',
        borderRadius: '8px',
        background: darkMode ? '#0a0c10' : '#ffffff',
        border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>
            📦 Exclusive Properties Owned
          </span>
          <span style={{ fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
            {formatNumber(totalExclusive)} sqm
          </span>
        </div>
      </div>
    )}
    
    {/* Show breakdown of inheritance received */}
    {inheritanceResult.transfers && inheritanceResult.transfers.filter(t => t.toId === inheritanceResult.person.id).length > 0 && (
      <div>
        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: darkMode ? '#fff' : '#1a1a2e' }}>
          📥 Received From:
        </div>
        {inheritanceResult.transfers.filter(t => t.toId === inheritanceResult.person.id).map((t, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 12px',
            marginBottom: '4px',
            borderRadius: '6px',
            background: darkMode ? '#0a0c10' : '#ffffff',
            borderLeft: `4px solid ${t.conjugal ? '#4CAF50' : '#2196F3'}`
          }}>
            <span style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
              ← {t.fromName} 
              {t.conjugal ? ' (Conjugal Share)' : ' (Inheritance)'}
              {t.represents && ` (${t.represents})`}
            </span>
            <span style={{ fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}>
              {formatNumber(t.amount)} sqm
            </span>
          </div>
        ))}
      </div>
    )}
    
    {/* Show what they gave (if they are also a decedent) */}
    {inheritanceResult.transfers.filter(t => t.fromId === inheritanceResult.person.id).length > 0 && (
      <div style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: darkMode ? '#fff' : '#1a1a2e' }}>
          📤 Distributed To Others:
        </div>
        {inheritanceResult.transfers.filter(t => t.fromId === inheritanceResult.person.id).map((t, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 12px',
            marginBottom: '4px',
            borderRadius: '6px',
            background: darkMode ? '#0a0c10' : '#ffffff',
            borderLeft: `4px solid ${t.conjugal ? '#4CAF50' : '#FF9800'}`
          }}>
            <span style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
              → {t.toName} 
              {t.conjugal ? ' (Conjugal Share)' : ' (Inheritance)'}
            </span>
            <span style={{ fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}>
              {formatNumber(t.amount)} sqm
            </span>
          </div>
        ))}
      </div>
    )}
    
    {/* Net inheritance */}
    <div style={{
      marginTop: '12px',
      padding: '12px 14px',
      borderRadius: '8px',
      background: darkMode ? '#1e2d3d' : '#eef2ff',
      border: `1px solid ${darkMode ? '#2d3d4d' : '#dde6ff'}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>
          Net Inheritance (Received - Given):
        </span>
        <strong style={{ color: darkMode ? '#fff' : '#1a1a2e' }}>
          {formatNumber((inheritanceResult.totalInherited || 0) + (inheritanceResult.totalConjugal || 0) - (inheritanceResult.totalGiven || 0))} sqm
        </strong>
      </div>
      <div style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '4px' }}>
        This includes conjugal share, inheritance, and excludes what was given
      </div>
    </div>
  </div>
            ) : (
              <p style={{ color: darkMode ? '#64748b' : '#94a3b8', textAlign: 'center', padding: '10px 0' }}>
                No inheritance records found
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ==================== FAMILY MAP - REACT FLOW ====================
const FamilyMap = ({ decedents, selectedPersonId, onSelectPerson, darkMode }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const newNodes = [];
    const newEdges = [];
    
    decedents.forEach((person, index) => {
      const isSelected = selectedPersonId === person.id;
      const isDeceased = person.isDeceased;
      
      newNodes.push({
        id: String(person.id),
        data: { 
          label: person.name,
          deceased: isDeceased,
          dod: person.dod,
          properties: person.properties?.length || 0,
          hasChildren: decedents.some(c => c.parentId === person.id),
          hasSpouse: !!person.spouseId
        },
        position: { 
          x: (index % 5) * 200 + 50, 
          y: Math.floor(index / 5) * 120 + 50 
        },
        style: {
          background: isSelected 
            ? 'linear-gradient(135deg, #667eea, #764ba2)'
            : isDeceased 
              ? 'linear-gradient(135deg, #f093fb, #f5576c)'
              : 'linear-gradient(135deg, #4facfe, #00f2fe)',
          color: 'white',
          borderRadius: '16px',
          width: 100,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 10,
          fontSize: 13,
          fontWeight: 600,
          border: isSelected ? '3px solid #fff' : 'none',
          boxShadow: isSelected 
            ? '0 8px 32px rgba(102, 126, 234, 0.4)'
            : '0 4px 16px rgba(0,0,0,0.15)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }
      });
      
      if (person.spouseId) {
        newEdges.push({
          id: `spouse-${person.id}-${person.spouseId}`,
          source: String(person.id),
          target: String(person.spouseId),
          type: 'smoothstep',
          style: { stroke: '#ff6b6b', strokeWidth: 2 },
          label: '💍',
          labelStyle: { fill: '#ff6b6b', fontSize: 16 },
          labelBgStyle: { fill: 'transparent' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#ff6b6b',
          }
        });
      }
      
      if (person.parentId) {
        const parentExists = decedents.some(p => p.id === person.parentId);
        if (parentExists) {
          newEdges.push({
            id: `parent-${person.id}-${person.parentId}`,
            source: String(person.parentId),
            target: String(person.id),
            type: 'smoothstep',
            style: { stroke: '#4a9eff', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#4a9eff',
            }
          });
        }
      }
    });
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [decedents, selectedPersonId]);

  const onNodeClick = useCallback((_, node) => {
    const person = decedents.find(p => String(p.id) === node.id);
    if (person) onSelectPerson(person);
  }, [decedents, onSelectPerson]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  const nodeTypes = useMemo(() => ({}), []);
  const edgeTypes = useMemo(() => ({}), []);

  if (decedents.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: darkMode ? '#64748b' : '#94a3b8'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📖</div>
        <h3 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px', color: darkMode ? '#fff' : '#1a1a2e' }}>
          No Story Yet
        </h3>
        <p>Click "Add Person" to start your family estate story</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-left"
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background 
          color={darkMode ? '#1a1a2e' : '#f0f0f0'} 
          gap={16} 
          size={1}
        />
        <Controls 
          style={{
            background: darkMode ? '#1e1e2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
            borderRadius: '8px',
          }}
        />
        <MiniMap 
          nodeColor={(node) => node.data?.deceased ? '#f5576c' : '#4facfe'}
          maskColor={darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'}
          style={{
            background: darkMode ? '#0a0c10' : '#ffffff',
            border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
            borderRadius: '8px',
          }}
        />
      </ReactFlow>
    </div>
  );
};

// ==================== BULK ADD MODAL ====================
const BulkAddModal = ({ isOpen, onClose, onSave, darkMode }) => {
  const [rows, setRows] = useState([
    { id: 1, name: '', dod: '', gender: 'Male', spouse: '', parent: '' }
  ]);
  const [nextId, setNextId] = useState(2);

  if (!isOpen) return null;

  const addRow = () => {
    setRows([...rows, { id: nextId, name: '', dod: '', gender: 'Male', spouse: '', parent: '' }]);
    setNextId(nextId + 1);
  };

  const removeRow = (id) => {
    if (rows.length <= 1) return;
    setRows(rows.filter(row => row.id !== id));
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleSave = () => {
    const validRows = rows.filter(row => row.name.trim());
    if (validRows.length === 0) {
      alert('Please enter at least one person with a name');
      return;
    }
    onSave(rows);
    setRows([{ id: 1, name: '', dod: '', gender: 'Male', spouse: '', parent: '' }]);
    setNextId(2);
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData('text');
    const lines = pastedData.split('\n').filter(line => line.trim());
    const newRows = [];
    
    lines.forEach((line, index) => {
      const parts = line.split('\t').map(s => s.trim());
      if (parts.length >= 1 && parts[0]) {
        newRows.push({
          id: nextId + index,
          name: parts[0] || '',
          dod: parts[1] || '',
          gender: parts[2] || 'Male',
          spouse: parts[3] || '',
          parent: parts[4] || ''
        });
      }
    });
    
    if (newRows.length > 0) {
      setRows(newRows);
      setNextId(nextId + newRows.length);
    }
    e.preventDefault();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)', padding: '16px' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: darkMode ? '#1e1e2e' : '#ffffff',
          borderRadius: '24px',
          padding: '24px',
          width: '800px',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
            📋 Bulk Add People
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={addRow}
              type="button"
              style={{
                padding: '6px 16px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '40px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              + Add Row
            </button>
          </div>
        </div>
        
        <div style={{ 
          fontSize: '13px', 
          color: darkMode ? '#94a3b8' : '#64748b', 
          marginBottom: '12px',
          padding: '12px',
          background: darkMode ? '#0a0c10' : '#f8fafc',
          borderRadius: '8px'
        }}>
          💡 Enter people below. You can also paste from Excel (copy columns: Name, Date of Death, Gender, Spouse, Parent)
        </div>
        
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
          borderRadius: '12px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ 
              background: darkMode ? '#0a0c10' : '#f8fafc',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: darkMode ? '#94a3b8' : '#64748b' }}>Name *</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: darkMode ? '#94a3b8' : '#64748b' }}>Date of Death</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: darkMode ? '#94a3b8' : '#64748b' }}>Gender</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: darkMode ? '#94a3b8' : '#64748b' }}>Spouse</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: darkMode ? '#94a3b8' : '#64748b' }}>Parent</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: darkMode ? '#94a3b8' : '#64748b' }}></th>
              </tr>
            </thead>
            <tbody onPaste={handlePaste}>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderTop: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}` }}>
                  <td style={{ padding: '6px 8px' }}>
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                      placeholder="Full name..."
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                        borderRadius: '6px',
                        background: darkMode ? '#0f1220' : '#fff',
                        color: darkMode ? '#fff' : '#000',
                        fontSize: '13px'
                      }}
                    />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input
                      type="date"
                      value={row.dod}
                      onChange={(e) => updateRow(row.id, 'dod', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                        borderRadius: '6px',
                        background: darkMode ? '#0f1220' : '#fff',
                        color: darkMode ? '#fff' : '#000',
                        fontSize: '13px'
                      }}
                    />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <select
                      value={row.gender}
                      onChange={(e) => updateRow(row.id, 'gender', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                        borderRadius: '6px',
                        background: darkMode ? '#0f1220' : '#fff',
                        color: darkMode ? '#fff' : '#000',
                        fontSize: '13px'
                      }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input
                      type="text"
                      value={row.spouse}
                      onChange={(e) => updateRow(row.id, 'spouse', e.target.value)}
                      placeholder="Spouse name..."
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                        borderRadius: '6px',
                        background: darkMode ? '#0f1220' : '#fff',
                        color: darkMode ? '#fff' : '#000',
                        fontSize: '13px'
                      }}
                    />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input
                      type="text"
                      value={row.parent}
                      onChange={(e) => updateRow(row.id, 'parent', e.target.value)}
                      placeholder="Parent name..."
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                        borderRadius: '6px',
                        background: darkMode ? '#0f1220' : '#fff',
                        color: darkMode ? '#fff' : '#000',
                        fontSize: '13px'
                      }}
                    />
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                    <button
                      onClick={() => removeRow(row.id)}
                      type="button"
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button 
            onClick={onClose} 
            type="button"
            style={{ padding: '10px 20px', cursor: 'pointer', background: 'transparent', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '40px', fontSize: '13px', fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            type="button"
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '40px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Add {rows.filter(r => r.name.trim()).length} People
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ==================== STORY MODE COMPONENT ====================
const StoryMode = ({ decedents, inheritanceSummary, inheritanceTransfers, totalEstateValue, darkMode, formatNumber, onSelectPerson }) => {
  const [expandedChapter, setExpandedChapter] = useState(null);
  
  if (decedents.length === 0) {
    return (
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
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>📖</div>
        <h3 style={{ fontSize: '24px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e', marginBottom: '12px' }}>
          Estate Story
        </h3>
        <p style={{ maxWidth: '400px' }}>
          Start by adding people to your family tree. The story of your estate will unfold here.
        </p>
      </div>
    );
  }

  // Find the decedent (first deceased person with properties or first in list)
  const decedent = decedents.find(p => p.isDeceased && p.properties?.length > 0) || decedents[0];
  const spouse = decedents.find(p => p.id === decedent?.spouseId);
  const children = decedents.filter(p => p.parentId === decedent?.id);
  const parents = decedents.filter(p => p.id === decedent?.parentId);
  
  // Get inheritance for decedent
  const decedentInheritance = inheritanceSummary.find(s => s.decedentId === decedent?.id);
  const hasInheritance = decedentInheritance && decedentInheritance.heirs.length > 0;

  const chapters = [
    {
      id: 'decedent',
      icon: '👤',
      title: 'The Decedent',
      content: (
        <div>
          <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '8px' }}>
            <strong style={{ color: darkMode ? '#fff' : '#1a1a2e' }}>{decedent?.name}</strong>
            {decedent?.dod ? ` passed away on ${new Date(decedent.dod).toLocaleDateString()}.` : ' is the central figure of this estate.'}
          </p>
          {decedent?.dod && (
            <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '14px' }}>
              ⚰️ Age at passing: {Math.floor((new Date(decedent.dod) - new Date(new Date().getFullYear() - 80, 0, 1)) / (1000 * 60 * 60 * 24 * 365.25))} years
            </p>
          )}
        </div>
      )
    },
    {
      id: 'family',
      icon: '👨‍👩‍👧‍👦',
      title: 'The Family',
      content: (
        <div>
          {spouse && (
            <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>
              💍 <strong style={{ color: darkMode ? '#fff' : '#1a1a2e' }}>{spouse.name}</strong> - Spouse
              {spouse.isDeceased ? ' ⚰️ (Deceased)' : ' 💚 (Living)'}
            </p>
          )}
          {parents.length > 0 && parents.map(p => (
            <p key={p.id} style={{ color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>
              👪 <strong style={{ color: darkMode ? '#fff' : '#1a1a2e' }}>{p.name}</strong> - Parent
              {p.isDeceased ? ' ⚰️ (Deceased)' : ' 💚 (Living)'}
            </p>
          ))}
          {children.length > 0 && children.map(c => (
            <p key={c.id} style={{ color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>
              👨‍👧‍👦 <strong style={{ color: darkMode ? '#fff' : '#1a1a2e' }}>{c.name}</strong> - Child
              {c.isDeceased ? ' ⚰️ (Deceased)' : ' 💚 (Living)'}
            </p>
          ))}
          {!spouse && parents.length === 0 && children.length === 0 && (
            <p style={{ color: darkMode ? '#64748b' : '#94a3b8', fontStyle: 'italic' }}>
              No family members linked yet. Add relationships to build the family story.
            </p>
          )}
        </div>
      )
    },
    {
      id: 'estate',
      icon: '🏠',
      title: 'The Estate',
      content: (
        <div>
          {decedent?.properties && decedent.properties.length > 0 ? (
            <div>
              <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '12px' }}>
                <strong style={{ color: darkMode ? '#fff' : '#1a1a2e' }}>{decedent.name}</strong> left behind:
              </p>
              {decedent.properties.map(prop => (
                <div key={prop.id} style={{
                  padding: '10px 14px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  background: darkMode ? '#0a0c10' : '#f8fafc',
                  border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`
                }}>
                  <div style={{ fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
                    {prop.name}
                  </div>
                  <div style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                    {prop.type} • {prop.totalSqm} sqm • {prop.classification}
                  </div>
                </div>
              ))}
              <div style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: darkMode ? '#1e2d3d' : '#eef2ff',
                border: `1px solid ${darkMode ? '#2d3d4d' : '#dde6ff'}`
              }}>
                <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>
                  Total Estate Value:
                </span>
                <strong style={{ color: darkMode ? '#fff' : '#1a1a2e', fontSize: '18px', display: 'block', marginTop: '4px' }}>
                  {formatNumber(totalEstateValue)} sqm
                </strong>
              </div>
            </div>
          ) : (
            <p style={{ color: darkMode ? '#64748b' : '#94a3b8', fontStyle: 'italic' }}>
              No properties added yet. Add properties to build the estate story.
            </p>
          )}
        </div>
      )
    },
    {
      id: 'distribution',
      icon: '💰',
      title: 'Distribution',
      content: (
        <div>
          {hasInheritance && decedentInheritance.heirs.length > 0 ? (
            <div>
              <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '12px' }}>
                The estate of <strong style={{ color: darkMode ? '#fff' : '#1a1a2e' }}>{decedent.name}</strong> is distributed as follows:
              </p>
              {decedentInheritance.heirs.map((heir, index) => {
                const person = decedents.find(p => p.id === heir.id);
                return (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    marginBottom: '8px',
                    borderRadius: '8px',
                    background: darkMode ? '#0a0c10' : '#f8fafc',
                    border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
                    cursor: person ? 'pointer' : 'default',
                  }}
                  onClick={() => person && onSelectPerson(person)}
                  >
                    <div>
                      <span style={{ fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}>
                        {heir.name}
                      </span>
                      <span style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', marginLeft: '8px' }}>
                        {heir.relationship}
                        {heir.isRepresentative && ` (Represents ${heir.represents})`}
                      </span>
                    </div>
                    <span style={{ fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
                      {formatNumber(heir.share)} sqm
                      {heir.conjugalShare > 0 && ` (${formatNumber(heir.conjugalShare)} conjugal)`}
                    </span>
                  </div>
                );
              })}
              <div style={{
                marginTop: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: darkMode ? '#1e2d3d' : '#eef2ff',
                border: `1px solid ${darkMode ? '#2d3d4d' : '#dde6ff'}`
              }}>
                <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>
                  Total Distributed:
                </span>
                <strong style={{ color: darkMode ? '#fff' : '#1a1a2e', display: 'block', marginTop: '4px' }}>
                  {formatNumber(decedentInheritance.totalAssets)} sqm
                </strong>
              </div>
            </div>
          ) : (
            <p style={{ color: darkMode ? '#64748b' : '#94a3b8', fontStyle: 'italic' }}>
              No inheritance distribution calculated yet. Add properties and relationships to see the distribution.
            </p>
          )}
        </div>
      )
    },
    {
      id: 'audit',
      icon: '📋',
      title: 'Audit Trail',
      content: (
        <div>
          {inheritanceTransfers.length > 0 ? (
            <div>
              <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '12px' }}>
                Transaction history of all inheritance transfers:
              </p>
              {inheritanceTransfers.slice(0, 10).map((t, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 14px',
                  marginBottom: '6px',
                  borderRadius: '6px',
                  background: darkMode ? '#0a0c10' : '#ffffff',
                  borderLeft: `4px solid ${t.conjugal ? '#4CAF50' : t.represents ? '#FF9800' : '#2196F3'}`
                }}>
                  <div>
                    <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px' }}>
                      {t.fromName} → {t.toName}
                    </span>
                    {t.represents && (
                      <span style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', marginLeft: '8px' }}>
                        (Representing {t.represents})
                      </span>
                    )}
                  </div>
                  <span style={{ fontWeight: 500, color: darkMode ? '#fff' : '#1a1a2e' }}>
                    {formatNumber(t.amount)} sqm
                  </span>
                </div>
              ))}
              {inheritanceTransfers.length > 10 && (
                <p style={{ color: darkMode ? '#64748b' : '#94a3b8', fontSize: '13px', textAlign: 'center', marginTop: '8px' }}>
                  + {inheritanceTransfers.length - 10} more transfers
                </p>
              )}
            </div>
          ) : (
            <p style={{ color: darkMode ? '#64748b' : '#94a3b8', fontStyle: 'italic' }}>
              No transactions recorded yet.
            </p>
          )}
        </div>
      )
    }
  ];

  const toggleChapter = (id) => {
    setExpandedChapter(expandedChapter === id ? null : id);
  };

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: '20px',
      background: darkMode ? '#0a0c10' : '#f8fafc',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        textAlign: 'center',
        padding: '20px',
        borderRadius: '16px',
        background: darkMode ? 'rgba(30,30,46,0.6)' : 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
      }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>📖</div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: darkMode ? '#fff' : '#1a1a2e', margin: 0 }}>
          Estate Story
        </h2>
        <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '14px', marginTop: '4px' }}>
          The narrative of your family's legacy and inheritance
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {[
          { icon: '👤', label: 'Members', value: decedents.length },
          { icon: '🏠', label: 'Properties', value: decedents.reduce((sum, p) => sum + (p.properties?.length || 0), 0) },
          { icon: '💰', label: 'Total Estate', value: formatNumber(totalEstateValue) + ' sqm' },
          { icon: '💍', label: 'Couples', value: Math.floor(decedents.filter(p => p.spouseId).length / 2) },
        ].map((stat, index) => (
          <div key={index} style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: darkMode ? 'rgba(30,30,46,0.4)' : 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px' }}>{stat.icon}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: darkMode ? '#fff' : '#1a1a2e' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Story Chapters */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {chapters.map((chapter, index) => (
          <motion.div
            key={chapter.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{
              borderRadius: '16px',
              background: darkMode ? 'rgba(30,30,46,0.6)' : 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}
          >
            <div
              onClick={() => toggleChapter(chapter.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                ...(expandedChapter === chapter.id ? {
                  background: darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)',
                } : {})
              }}
              onMouseEnter={(e) => {
                if (expandedChapter !== chapter.id) {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (expandedChapter !== chapter.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{chapter.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, color: darkMode ? '#fff' : '#1a1a2e' }}>
                    Chapter {index + 1}: {chapter.title}
                  </div>
                  <div style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                    {expandedChapter === chapter.id ? 'Click to collapse' : 'Click to expand'}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '20px',
                color: darkMode ? '#94a3b8' : '#64748b',
                transform: expandedChapter === chapter.id ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}>
                ▼
              </div>
            </div>
            
            <AnimatePresence>
              {expandedChapter === chapter.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  style={{
                    overflow: 'hidden',
                    padding: '0 20px 20px 20px',
                    borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                  }}
                >
                  {chapter.content}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        textAlign: 'center',
        borderRadius: '12px',
        background: darkMode ? 'rgba(30,30,46,0.3)' : 'rgba(255,255,255,0.4)',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`
      }}>
        <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8' }}>
          💡 Click on any name to view their detailed profile and inheritance information
        </p>
      </div>
    </div>
  );
};

// ==================== MAIN PROPERTY DIVIDER COMPONENT ====================
const PropertyDivider = () => {
  const { darkMode } = useAuth();
  
  const [decedents, setDecedents] = useState(() => {
    const saved = localStorage.getItem('propertyDividerData');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [inheritanceResult, setInheritanceResult] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inheritanceSummary, setInheritanceSummary] = useState([]);
  const [inheritanceTransfers, setInheritanceTransfers] = useState([]);
  const [inheritanceDetails, setInheritanceDetails] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [totalEstateValue, setTotalEstateValue] = useState(0);
  const [viewMode, setViewMode] = useState('story'); // 'story' or 'map'
  const previousDecedentsRef = useRef();

  const selectedPerson = useMemo(() => 
    decedents.find(p => p.id === selectedPersonId) || null,
    [decedents, selectedPersonId]
  );
  
  const editingPerson = useMemo(() => 
    decedents.find(p => p.id === editingPersonId) || null,
    [decedents, editingPersonId]
  );

  useEffect(() => {
    localStorage.setItem('propertyDividerData', JSON.stringify(decedents));
    
    const decedentsChanged = JSON.stringify(previousDecedentsRef.current) !== JSON.stringify(decedents);
    if (decedentsChanged && !isCalculating) {
      previousDecedentsRef.current = JSON.parse(JSON.stringify(decedents));
      calculateAllInheritances();
    }
  }, [decedents]);

  useEffect(() => {
    if (selectedPersonId && inheritanceSummary.length > 0) {
      const personExists = decedents.some(p => p.id === selectedPersonId);
      if (personExists) {
        updateSelectedPersonData(selectedPersonId, inheritanceSummary, inheritanceTransfers);
      }
    }
  }, [inheritanceSummary, inheritanceTransfers, selectedPersonId]);

  const formatNumber = useCallback((num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  const clearAllData = useCallback(() => {
    localStorage.removeItem('propertyDividerData');
    setDecedents([]);
    setSelectedPersonId(null);
    setInheritanceResult(null);
    setInheritanceSummary([]);
    setInheritanceTransfers([]);
    setInheritanceDetails(null);
    setTotalEstateValue(0);
    setShowClearConfirm(false);
  }, []);

  const deletePerson = useCallback((personId) => {
    const person = decedents.find(p => p.id === personId);
    if (!person) return;
    
    const hasSpouse = decedents.some(p => p.spouseId === personId);
    const hasChildren = decedents.some(p => p.parentId === personId);
    
    if (hasSpouse || hasChildren) {
      if (!window.confirm(`⚠️ ${person.name} is linked as a spouse or parent to other persons. Deleting them will remove these relationships. Continue?`)) {
        return;
      }
    }
    
    let updatedDecedents = decedents
      .filter(p => p.id !== personId)
      .map(p => {
        if (p.spouseId === personId) {
          return { ...p, spouseId: null };
        }
        if (p.parentId === personId) {
          return { ...p, parentId: null };
        }
        return p;
      });
    
    setDecedents(updatedDecedents);
    
    if (selectedPersonId === personId) {
      setSelectedPersonId(null);
      setInheritanceResult(null);
      setShowDetailModal(false);
    }
    
    setShowDeleteConfirm(false);
    setPersonToDelete(null);
  }, [decedents, selectedPersonId]);

  const handleBulkAdd = useCallback((rows) => {
    const newPeople = [];
    let nextId = Math.max(...decedents.map(p => p.id), 0) + 1;
    
    const nameToId = {};
    rows.forEach(row => {
      if (!row.name.trim()) return;
      const id = nextId++;
      nameToId[row.name.trim()] = id;
      newPeople.push({
        id: id,
        name: row.name.trim(),
        dod: row.dod || null,
        gender: row.gender || 'Male',
        spouseId: null,
        parentId: null,
        isDeceased: !!row.dod,
        properties: [],
        heirs: []
      });
    });
    
    rows.forEach(row => {
      if (!row.name.trim()) return;
      const person = newPeople.find(p => p.name === row.name.trim());
      if (!person) return;
      
      if (row.spouse && nameToId[row.spouse]) {
        person.spouseId = nameToId[row.spouse];
      }
      if (row.parent && nameToId[row.parent]) {
        person.parentId = nameToId[row.parent];
      }
    });
    
    if (newPeople.length > 0) {
      setDecedents(prev => [...prev, ...newPeople]);
    }
    setShowBulkModal(false);
  }, [decedents]);

  const calculateAllInheritances = useCallback(() => {
    if (decedents.length === 0) {
      setInheritanceSummary([]);
      setInheritanceTransfers([]);
      setInheritanceDetails(null);
      setTotalEstateValue(0);
      return;
    }
    
    setIsCalculating(true);
    
    try {
      const result = calculateAllInheritance(decedents);
      
      setInheritanceDetails(result);
      
      const summary = [];
      const transfers = [];
      let totalEstate = 0;
      
      if (result.results && result.results.length > 0) {
        result.results.forEach(r => {
          const decedent = decedents.find(p => p.id === r.decedent);
          if (!decedent) return;
          
          totalEstate += r.assets?.totalEstate || 0;
          
          const summaryEntry = {
            decedent: decedent.name,
            decedentId: r.decedent,
            deathDate: r.deathDate,
            totalAssets: r.assets?.totalEstate || 0,
            conjugalShare: r.assets?.conjugalShare || 0,
            exclusiveTotal: r.assets?.exclusiveTotal || 0,
            inheritedAmount: r.assets?.inheritedAmount || 0,
            heirs: []
          };
          
          if (r.distribution && r.distribution.heirs) {
            r.distribution.heirs.forEach(h => {
              const heirName = decedents.find(p => p.id === h.id)?.name || h.name || `Person ${h.id}`;
              summaryEntry.heirs.push({
                id: h.id,
                name: heirName,
                relationship: h.relationship || 'Heir',
                share: h.totalShare || h.share || 0,
                conjugalShare: h.conjugalShare || 0,
                isRepresentative: h.isRepresentative || false,
                represents: h.represents || null
              });
            });
          }
          
          summary.push(summaryEntry);
          
          if (r.transfers && r.transfers.length > 0) {
            r.transfers.forEach(t => {
              const from = decedents.find(p => p.id === t.from);
              const to = decedents.find(p => p.id === t.to);
              
              transfers.push({
                fromId: t.from,
                fromName: from?.name || t.from,
                toId: t.to,
                toName: to?.name || t.to,
                amount: t.amount,
                relationship: t.relationship || 'Unknown',
                conjugal: t.conjugal || false,
                represents: t.represents || null,
                decedent: decedent.name,
                type: t.conjugal ? 'Conjugal Share' : t.represents ? 'Representation' : 'Inheritance'
              });
            });
          }
        });
      }
      
      setTotalEstateValue(totalEstate);
      setInheritanceSummary(summary);
      setInheritanceTransfers(transfers);
      
      if (selectedPersonId) {
        updateSelectedPersonData(selectedPersonId, summary, transfers);
      }
      
    } catch (error) {
      console.error('Error calculating inheritance:', error);
      alert('Error calculating inheritance: ' + error.message);
    } finally {
      setIsCalculating(false);
    }
  }, [decedents, selectedPersonId]);

  // In the main PropertyDivider component, update the updateSelectedPersonData function:

const updateSelectedPersonData = useCallback((personId, records, transfers) => {
  const person = decedents.find(p => p.id === personId);
  if (!person) return;
  
  // Find all inheritance records where this person is involved
  const personInheritance = records.find(r => 
    r.decedent === person.name || 
    r.decedentId === personId ||
    r.heirs.some(h => h.id === personId || h.name === person.name)
  );
  
  // Find all transfers involving this person
  const personTransfers = transfers.filter(t => 
    t.fromId === personId || t.toId === personId
  );
  
  // Calculate total received (all amounts going TO this person)
  const totalReceived = personTransfers
    .filter(t => t.toId === personId)
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate total given (all amounts going FROM this person)
  const totalGiven = personTransfers
    .filter(t => t.fromId === personId)
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Find if this person is a decedent
  const isDecedent = records.some(r => r.decedentId === personId);
  
  // Find if this person is an heir
  const heirInfo = records.flatMap(r => r.heirs).find(h => h.id === personId);
  const isHeir = !!heirInfo;
  
  // Get the decedent's estate if this person is a decedent
  const decedentRecord = records.find(r => r.decedentId === personId);
  const decedentEstate = decedentRecord?.totalAssets || 0;
  
  // Calculate total inherited amount (for heirs)
  const totalInherited = personTransfers
    .filter(t => t.toId === personId && !t.conjugal)
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate conjugal share received
  const totalConjugalReceived = personTransfers
    .filter(t => t.toId === personId && t.conjugal)
    .reduce((sum, t) => sum + t.amount, 0);
  
  // --- NEW: Calculate the spouse's conjugal share from their own properties ---
  // A living spouse always owns 50% of conjugal properties
  let conjugalShareOwned = 0;
  if (!person.isDeceased) {
    // Calculate 50% of all conjugal properties owned by this person
    // This represents the spouse's share of conjugal properties
    person.properties?.forEach(prop => {
      if (prop.classification === 'Conjugal') {
        conjugalShareOwned += prop.totalSqm / 2;
      }
    });
  }
  
  // The total estate value for this person
  let totalEstate = 0;
  let heirShare = 0;
  let heirRelationship = null;
  
  if (isDecedent) {
    totalEstate = decedentEstate;
  } else if (isHeir) {
    heirShare = totalInherited;
    heirRelationship = heirInfo?.relationship || 'Heir';
    totalEstate = totalInherited + totalConjugalReceived + conjugalShareOwned;
  } else {
    // If not an heir and not a decedent, still show their conjugal share
    totalEstate = conjugalShareOwned;
  }
  
  const result = {
    person: person,
    isDecedent: isDecedent,
    isHeir: isHeir,
    heirShare: heirShare,
    heirRelationship: heirRelationship,
    totalInherited: totalInherited,
    totalConjugal: totalConjugalReceived,
    totalGiven: totalGiven,
    netInheritance: totalInherited + totalConjugalReceived - totalGiven,
    transfers: personTransfers,
    decedentEstate: decedentEstate,
    totalEstateValue: totalEstate,
    conjugalShareOwned: conjugalShareOwned, // Add this to track owned conjugal share
  };
  
  setInheritanceResult(result);
}, [decedents]);

  const handleSelectPerson = useCallback((person) => {
    setSelectedPersonId(person.id);
    updateSelectedPersonData(person.id, inheritanceSummary, inheritanceTransfers);
    setShowDetailModal(true);
  }, [inheritanceSummary, inheritanceTransfers, updateSelectedPersonData]);

  const addNewPerson = useCallback(() => {
    setEditingPersonId(null);
    setShowPersonModal(true);
  }, []);

  const editPerson = useCallback((person) => {
    setEditingPersonId(person.id);
    setShowDetailModal(false);
    setTimeout(() => setShowPersonModal(true), 100);
  }, []);

  const handleSavePerson = useCallback((formData) => {
    const newPersonId = editingPersonId || Date.now();
    const newPerson = {
      id: newPersonId,
      name: formData.name.trim(),
      dod: formData.dod || null,
      gender: formData.gender,
      spouseId: formData.spouseId,
      parentId: formData.parentId,
      isDeceased: !!formData.dod,
      properties: editingPerson?.properties || [],
      heirs: editingPerson?.heirs || []
    };
    
    let updatedDecedents;
    if (editingPersonId) {
      updatedDecedents = decedents.map(p => p.id === editingPersonId ? newPerson : p);
    } else {
      updatedDecedents = [...decedents, newPerson];
    }
    
    if (newPerson.spouseId) {
      updatedDecedents = updatedDecedents.map(p => {
        if (p.id === newPerson.spouseId) {
          return { ...p, spouseId: newPerson.id };
        }
        return p;
      });
    }
    
    if (editingPersonId && editingPerson?.spouseId !== newPerson.spouseId) {
      if (editingPerson?.spouseId) {
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
    setEditingPersonId(null);
    
    const savedPerson = updatedDecedents.find(p => p.id === newPersonId);
    if (savedPerson) {
      setSelectedPersonId(savedPerson.id);
      setShowDetailModal(true);
    }
  }, [editingPersonId, decedents, editingPerson]);

  const addPropertyToPerson = useCallback(() => {
    if (!selectedPerson) return;
    setEditingProperty(null);
    setShowPropertyModal(true);
  }, [selectedPerson]);

  const handleSaveProperty = useCallback((formData) => {
    const newProperty = {
      id: editingProperty?.id || Date.now(),
      name: formData.name.trim(),
      type: formData.type,
      totalSqm: parseFloat(formData.totalSqm),
      classification: formData.classification
    };
    
    let updatedDecedents = decedents.map(p => {
      if (p.id === selectedPersonId) {
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
    setEditingProperty(null);
  }, [editingProperty, decedents, selectedPersonId]);

  const editProperty = useCallback((prop) => {
    setEditingProperty(prop);
    setShowPropertyModal(true);
  }, []);

  const deleteProperty = useCallback((propertyId) => {
    if (window.confirm('Remove this property?')) {
      let updatedDecedents = decedents.map(p => {
        if (p.id === selectedPersonId) {
          return { ...p, properties: p.properties.filter(prop => prop.id !== propertyId) };
        }
        return p;
      });
      setDecedents(updatedDecedents);
    }
  }, [decedents, selectedPersonId]);

  const filteredDecedents = useMemo(() => 
    decedents.filter(person =>
      person.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [decedents, searchQuery]
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
            Estate Divider
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
              onClick={() => setViewMode('story')}
              type="button"
              style={{
                padding: '4px 14px',
                borderRadius: '40px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                background: viewMode === 'story' ? (darkMode ? '#667eea' : '#667eea') : 'transparent',
                color: viewMode === 'story' ? '#fff' : (darkMode ? '#94a3b8' : '#64748b'),
                transition: 'all 0.2s'
              }}
            >
              📖 Story
            </button>
            <button
              onClick={() => setViewMode('map')}
              type="button"
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
            onClick={addNewPerson}
            type="button"
            style={{
              padding: '6px 16px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '40px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            + Add Person
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            type="button"
            style={{
              padding: '6px 14px',
              background: 'transparent',
              color: darkMode ? '#94a3b8' : '#64748b',
              border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
              borderRadius: '40px',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Bulk Add
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            type="button"
            style={{
              padding: '6px 14px',
              background: 'transparent',
              color: '#ef4444',
              border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
              borderRadius: '40px',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
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
          <span>👤 {decedents.length}</span>
          <span>🏠 {decedents.reduce((sum, p) => sum + (p.properties?.length || 0), 0)}</span>
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
        {viewMode === 'story' ? (
          <StoryMode 
            decedents={decedents}
            inheritanceSummary={inheritanceSummary}
            inheritanceTransfers={inheritanceTransfers}
            totalEstateValue={totalEstateValue}
            darkMode={darkMode}
            formatNumber={formatNumber}
            onSelectPerson={handleSelectPerson}
          />
        ) : (
          <FamilyMap 
            decedents={filteredDecedents}
            selectedPersonId={selectedPersonId}
            onSelectPerson={handleSelectPerson}
            darkMode={darkMode}
          />
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showDetailModal && selectedPerson && (
          <PersonDetailModal
            person={selectedPerson}
            decedents={decedents}
            inheritanceResult={inheritanceResult}
            inheritanceTransfers={inheritanceTransfers}
            totalEstateValue={totalEstateValue}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedPersonId(null);
            }}
            onEdit={editPerson}
            onAddProperty={addPropertyToPerson}
            onEditProperty={editProperty}
            onDeleteProperty={deleteProperty}
            darkMode={darkMode}
            formatNumber={formatNumber}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPersonModal && (
          <PersonModalComponent 
            key={editingPersonId || 'new'}
            isOpen={showPersonModal}
            onClose={() => {
              setShowPersonModal(false);
              setEditingPersonId(null);
            }}
            onSave={handleSavePerson}
            editingPerson={editingPerson}
            decedents={decedents}
            darkMode={darkMode}
            isMobile={false}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPropertyModal && (
          <PropertyModalComponent
            isOpen={showPropertyModal}
            onClose={() => {
              setShowPropertyModal(false);
              setEditingProperty(null);
            }}
            onSave={handleSaveProperty}
            editingProperty={editingProperty}
            darkMode={darkMode}
            isMobile={false}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkModal && (
          <BulkAddModal
            isOpen={showBulkModal}
            onClose={() => setShowBulkModal(false)}
            onSave={handleBulkAdd}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>

      {/* Clear All Confirmation */}
      <AnimatePresence>
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
                  type="button"
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
                  onClick={clearAllData}
                  type="button"
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
      </AnimatePresence>

      {/* Delete Person Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && personToDelete && (
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
          onClick={() => {
            setShowDeleteConfirm(false);
            setPersonToDelete(null);
          }}
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
                Delete {personToDelete.name}?
              </h3>
              <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '24px' }}>
                This will remove {personToDelete.name} and any relationships they have.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPersonToDelete(null);
                  }}
                  type="button"
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
                  onClick={() => deletePerson(personToDelete.id)}
                  type="button"
                  style={{
                    padding: '10px 24px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '40px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PropertyDivider;