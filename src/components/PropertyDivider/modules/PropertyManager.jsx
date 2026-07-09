// src/components/PropertyDivider/modules/PropertyManager.jsx
import React from 'react';

const PropertyManager = ({ darkMode = false, properties = [], persons = [], onUpdate }) => {
  const handleAddProperty = () => {
    alert('Property Manager - Coming soon!');
  };

  return (
    <div>
      <h2>🏠 Property Manager</h2>
      <p>Add and classify properties for estate division</p>
      <p>Properties: {properties.length} | Persons: {persons.length}</p>
      <button onClick={handleAddProperty}>+ Add Property</button>
      <p>⏳ Property management will be implemented after PersonManager</p>
    </div>
  );
};

export default PropertyManager;