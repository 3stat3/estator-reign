// src/components/PropertyDivider/PropertyDivider.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const PropertyDivider = ({ darkMode = false }) => {
  // Placeholder data
  const placeholderPeople = [
    {
      id: '1',
      name: 'John Smith',
      gender: 'Male',
      isDeceased: false,
      relationship: 'Father',
      properties: [{ name: 'Main House', totalSqm: 250, classification: 'Residential' }]
    },
    {
      id: '2',
      name: 'Mary Smith',
      gender: 'Female',
      isDeceased: false,
      relationship: 'Mother',
      properties: [{ name: 'Beach House', totalSqm: 180, classification: 'Residential' }]
    },
    {
      id: '3',
      name: 'James Smith',
      gender: 'Male',
      isDeceased: false,
      relationship: 'Son',
      properties: []
    },
    {
      id: '4',
      name: 'Sarah Johnson',
      gender: 'Female',
      isDeceased: true,
      dod: '2023-05-15',
      relationship: 'Aunt',
      properties: [{ name: 'City Apartment', totalSqm: 120, classification: 'Condominium' }]
    },
    {
      id: '5',
      name: 'Robert Brown',
      gender: 'Male',
      isDeceased: false,
      relationship: 'Uncle',
      properties: [{ name: 'Farm Land', totalSqm: 500, classification: 'Agricultural' }]
    }
  ];

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPeople = placeholderPeople.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (person) => {
    if (person.isDeceased) return '⚰️';
    return '💚';
  };

  const getGenderColor = (gender) => {
    if (gender === 'Female') return '#ec4899';
    return '#3b82f6';
  };

  const getTotalProperties = (person) => {
    return person.properties?.reduce((sum, p) => sum + (p.totalSqm || 0), 0) || 0;
  };

  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      width: '100vw',
      background: darkMode ? '#0a0c10' : '#f0f4f8',
      fontFamily: "'Inter', -apple-system, sans-serif",
      overflow: 'hidden',
      transition: 'background 0.3s ease',
    },
    mainContent: {
      flex: 1,
      padding: '24px',
      overflow: 'auto',
    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: '28px',
      fontWeight: 700,
      color: darkMode ? '#ffffff' : '#1a202c',
      margin: '0 0 8px 0',
    },
    subtitle: {
      fontSize: '14px',
      color: darkMode ? '#94a3b8' : '#64748b',
      margin: 0,
    },
    searchBar: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      flexWrap: 'wrap',
    },
    searchInput: {
      flex: 1,
      minWidth: '200px',
      padding: '10px 16px',
      border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
      borderRadius: '10px',
      fontSize: '14px',
      outline: 'none',
      background: darkMode ? '#14161f' : '#ffffff',
      color: darkMode ? '#ffffff' : '#000000',
      transition: 'border 0.2s',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
    },
    card: {
      background: darkMode ? '#14161f' : '#ffffff',
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    },
    avatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      fontWeight: 700,
      color: 'white',
      flexShrink: 0,
    },
    cardName: {
      fontSize: '16px',
      fontWeight: 600,
      color: darkMode ? '#ffffff' : '#1a202c',
      margin: 0,
    },
    cardRelationship: {
      fontSize: '13px',
      color: darkMode ? '#94a3b8' : '#64748b',
      margin: '2px 0 0 0',
    },
    cardDetails: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      fontSize: '13px',
      color: darkMode ? '#94a3b8' : '#64748b',
    },
    badge: {
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      display: 'inline-block',
    },
    sidebar: {
      width: '380px',
      background: darkMode ? '#14161f' : '#ffffff',
      borderLeft: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
      height: '100vh',
      overflow: 'auto',
      padding: '24px',
    },
    sidebarTitle: {
      fontSize: '18px',
      fontWeight: 600,
      color: darkMode ? '#ffffff' : '#1a202c',
      margin: '0 0 16px 0',
    },
    detailSection: {
      background: darkMode ? '#1a1c2e' : '#f8fafc',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
    },
    detailLabel: {
      fontSize: '12px',
      fontWeight: 500,
      color: darkMode ? '#94a3b8' : '#64748b',
      margin: '0 0 4px 0',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    detailValue: {
      fontSize: '14px',
      color: darkMode ? '#ffffff' : '#1a202c',
      margin: 0,
    },
    emptyState: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: darkMode ? '#94a3b8' : '#94a3b8',
      textAlign: 'center',
      padding: '40px 20px',
    },
    emptyStateTitle: {
      fontSize: '18px',
      fontWeight: 600,
      color: darkMode ? '#cbd5e1' : '#475569',
      margin: '0 0 8px 0',
    },
    emptyStateText: {
      fontSize: '14px',
      margin: 0,
    },
  };

  const handleCardClick = (person) => {
    setSelectedPerson(person);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div style={styles.container}>
      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h1 style={styles.title}>🏛️ Estate Divider</h1>
          <p style={styles.subtitle}>Manage and visualize family estate distribution</p>
        </div>

        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="🔍 Search people..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={styles.searchInput}
          />
          <div style={{ 
            padding: '10px 16px', 
            background: darkMode ? '#14161f' : '#ffffff',
            border: `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}`,
            borderRadius: '10px',
            fontSize: '14px',
            color: darkMode ? '#94a3b8' : '#64748b',
          }}>
            👥 {filteredPeople.length} people
          </div>
        </div>

        <div style={styles.grid}>
          {filteredPeople.length > 0 ? (
            filteredPeople.map((person) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  ...styles.card,
                  borderColor: selectedPerson?.id === person.id 
                    ? '#8b5cf6' 
                    : darkMode ? '#1e2d3d' : '#e2e8f0',
                }}
                onClick={() => handleCardClick(person)}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <div style={styles.cardHeader}>
                  <div style={{
                    ...styles.avatar,
                    background: person.isDeceased 
                      ? '#dc2626' 
                      : `linear-gradient(135deg, ${getGenderColor(person.gender)}, ${getGenderColor(person.gender)}dd)`,
                  }}>
                    {person.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h3 style={styles.cardName}>
                      {person.name} {getStatusIcon(person)}
                    </h3>
                    <p style={styles.cardRelationship}>
                      {person.relationship || 'Family Member'}
                    </p>
                  </div>
                </div>
                <div style={styles.cardDetails}>
                  <span>{person.gender || 'Unknown'}</span>
                  <span>•</span>
                  <span style={{
                    ...styles.badge,
                    background: person.isDeceased 
                      ? (darkMode ? '#2d1f1f' : '#fef2f2') 
                      : (darkMode ? '#1a2a1a' : '#f0fdf4'),
                    color: person.isDeceased ? '#dc2626' : '#16a34a',
                  }}>
                    {person.isDeceased ? 'Deceased' : 'Living'}
                  </span>
                  {person.isDeceased && person.dod && (
                    <>
                      <span>•</span>
                      <span>⚰️ {new Date(person.dod).toLocaleDateString()}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>📦 {person.properties?.length || 0} properties</span>
                  {getTotalProperties(person) > 0 && (
                    <>
                      <span>•</span>
                      <span>{getTotalProperties(person)} sqm</span>
                    </>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={styles.emptyState}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h3 style={styles.emptyStateTitle}>No results found</h3>
                <p style={styles.emptyStateText}>
                  Try adjusting your search terms
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - Person Details */}
      <div style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>👤 Person Details</h2>
        
        {selectedPerson ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Basic Info */}
            <div style={styles.detailSection}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                color: darkMode ? '#ffffff' : '#1a202c',
                margin: '0 0 4px 0',
              }}>
                {selectedPerson.name} {getStatusIcon(selectedPerson)}
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: darkMode ? '#94a3b8' : '#64748b',
                margin: '0 0 12px 0',
              }}>
                {selectedPerson.relationship || 'Family Member'}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  ...styles.badge,
                  background: selectedPerson.gender === 'Female' 
                    ? '#fdf2f8' 
                    : '#eff6ff',
                  color: selectedPerson.gender === 'Female' ? '#ec4899' : '#3b82f6',
                }}>
                  {selectedPerson.gender || 'Unknown'}
                </span>
                <span style={{
                  ...styles.badge,
                  background: selectedPerson.isDeceased ? '#fef2f2' : '#f0fdf4',
                  color: selectedPerson.isDeceased ? '#dc2626' : '#16a34a',
                }}>
                  {selectedPerson.isDeceased ? '⚰️ Deceased' : '💚 Living'}
                </span>
              </div>
            </div>

            {/* Properties */}
            <div style={styles.detailSection}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: darkMode ? '#ffffff' : '#1a202c',
                margin: '0 0 12px 0',
              }}>
                📦 Properties ({selectedPerson.properties?.length || 0})
              </h4>
              {selectedPerson.properties?.length > 0 ? (
                selectedPerson.properties.map((prop, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: index < selectedPerson.properties.length - 1 
                        ? `1px solid ${darkMode ? '#1e2d3d' : '#e2e8f0'}` 
                        : 'none',
                    }}
                  >
                    <div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 500,
                        color: darkMode ? '#ffffff' : '#1a202c',
                      }}>
                        {prop.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: darkMode ? '#94a3b8' : '#64748b',
                      }}>
                        {prop.classification || 'Property'}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 600,
                      color: darkMode ? '#f59e0b' : '#d97706',
                    }}>
                      {prop.totalSqm} sqm
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ 
                  fontSize: '13px', 
                  color: darkMode ? '#94a3b8' : '#94a3b8',
                  margin: 0,
                }}>
                  No properties assigned
                </p>
              )}
            </div>

            {/* Total Estate */}
            {getTotalProperties(selectedPerson) > 0 && (
              <div style={{
                ...styles.detailSection,
                background: darkMode ? '#1a2a1a' : '#f0fdf4',
                borderColor: '#16a34a',
              }}>
                <p style={{ 
                  fontSize: '14px', 
                  fontWeight: 600,
                  color: '#16a34a',
                  margin: 0,
                }}>
                  Total Estate: {getTotalProperties(selectedPerson)} sqm
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👆</div>
            <h3 style={styles.emptyStateTitle}>Select a person</h3>
            <p style={styles.emptyStateText}>
              Click on any person card<br />
              to view their details and properties
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyDivider;