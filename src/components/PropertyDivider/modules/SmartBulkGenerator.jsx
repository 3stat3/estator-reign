// src/components/PropertyDivider/modules/SmartBulkGenerator.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Filipino first names for random generation
const FILIPINO_NAMES = {
  male: [
    'Juan', 'Pedro', 'Jose', 'Ramon', 'Manuel', 'Carlos', 'Antonio', 'Miguel',
    'Rafael', 'Gabriel', 'Mateo', 'Lucas', 'Diego', 'Santiago', 'Pablo', 'Cristian',
    'Joaquin', 'Emilio', 'Andres', 'Ricardo', 'Fernando', 'Enrique', 'Arturo', 'Raul',
    'Eduardo', 'Francisco', 'Guillermo', 'Hector', 'Ismael', 'Javier', 'Leandro',
    'Marco', 'Nicolas', 'Orlando', 'Pascual', 'Rogelio', 'Salvador', 'Teodoro',
    'Vicente', 'Wilfredo', 'Alberto', 'Benigno', 'Cesar', 'Dante', 'Elias'
  ],
  female: [
    'Maria', 'Ana', 'Rosa', 'Elena', 'Teresa', 'Carmen', 'Josefina', 'Luz',
    'Gloria', 'Angelina', 'Victoria', 'Sofia', 'Isabella', 'Valentina', 'Camila',
    'Luna', 'Mia', 'Olivia', 'Emma', 'Ava', 'Amelia', 'Clara', 'Isabel', 'Julia',
    'Laura', 'Lydia', 'Martha', 'Nina', 'Paula', 'Rita', 'Sonia', 'Tina',
    'Ursula', 'Vera', 'Wanda', 'Xenia', 'Yvonne', 'Zita', 'Belen', 'Cecilia',
    'Diana', 'Eva', 'Flora', 'Graciela', 'Herminia'
  ]
};

const SURNAMES = [
  'Dela Cruz', 'Santos', 'Reyes', 'Mendoza', 'Garcia', 'Flores', 'Martinez',
  'Perez', 'Gonzales', 'Lopez', 'Castillo', 'Ramirez', 'Torres', 'Rivera',
  'Morales', 'Cruz', 'Ortiz', 'Ramos', 'Santiago', 'Gomez', 'Diaz', 'Reyes',
  'Villanueva', 'Alvarez', 'Gutierrez', 'Castro', 'Fernandez', 'Navarro',
  'Romero', 'Vargas', 'Molina', 'Del Rosario', 'Aquino', 'Bautista', 'Cruz',
  'Domingo', 'Estrada', 'Fernandez', 'Guevarra', 'Hernandez', 'Ibarra',
  'Jacinto', 'Luna', 'Marcos', 'Nieves', 'Ocampo'
];

const SmartBulkGenerator = ({
  darkMode = false,
  isOpen = false,
  onClose = () => {},
  onImport = () => {},
  persons = []
}) => {
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [children, setChildren] = useState([]);
  const [lastName, setLastName] = useState('Dela Cruz');
  const [nextChildId, setNextChildId] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [importedData, setImportedData] = useState(null);

  // Generate random name
  const generateRandomName = (gender) => {
    const names = gender === 'Male' ? FILIPINO_NAMES.male : FILIPINO_NAMES.female;
    const firstName = names[Math.floor(Math.random() * names.length)];
    return `${firstName} ${lastName}`;
  };

  // Generate random gender
  const randomGender = () => {
    return Math.random() > 0.5 ? 'Male' : 'Female';
  };

  // Generate random children
  const generateChildren = (count) => {
    const newChildren = [];
    for (let i = 0; i < count; i++) {
      const gender = randomGender();
      newChildren.push({
        id: nextChildId + i,
        name: generateRandomName(gender),
        gender: gender,
        isDeceased: false,
        dateOfDeath: '',
        isEditing: false
      });
    }
    setNextChildId(nextChildId + count);
    setChildren(newChildren);
  };

  // Regenerate all names
  const regenerateNames = () => {
    if (children.length === 0) {
      generateChildren(3);
      return;
    }
    const updatedChildren = children.map(child => ({
      ...child,
      name: generateRandomName(child.gender)
    }));
    setChildren(updatedChildren);
  };

  // Initialize with default values when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!fatherName) {
        const defaultFather = generateRandomName('Male');
        setFatherName(defaultFather);
      }
      if (!motherName) {
        const defaultMother = generateRandomName('Female');
        setMotherName(defaultMother);
      }
      if (children.length === 0) {
        generateChildren(3);
      }
    }
  }, [isOpen]);

  // Add child
  const addChild = () => {
    const gender = randomGender();
    const newChild = {
      id: nextChildId,
      name: generateRandomName(gender),
      gender: gender,
      isDeceased: false,
      dateOfDeath: '',
      isEditing: false
    };
    setChildren([...children, newChild]);
    setNextChildId(nextChildId + 1);
  };

  // Remove child
  const removeChild = (id) => {
    if (children.length <= 1) {
      alert('You need at least one child.');
      return;
    }
    setChildren(children.filter(child => child.id !== id));
  };

  // Update child field
  const updateChild = (id, field, value) => {
    setChildren(children.map(child =>
      child.id === id ? { ...child, [field]: value } : child
    ));
  };

  // Toggle edit mode for a child
  const toggleEdit = (id) => {
    setChildren(children.map(child =>
      child.id === id ? { ...child, isEditing: !child.isEditing } : child
    ));
  };

  // Handle import
  const handleImport = () => {
    if (!fatherName.trim()) {
      alert('Please enter a name for the Father.');
      return;
    }
    if (!motherName.trim()) {
      alert('Please enter a name for the Mother.');
      return;
    }
    if (children.length === 0) {
      alert('Please add at least one child.');
      return;
    }

    const fatherId = `p_${Date.now()}_father`;
    const motherId = `p_${Date.now()}_mother`;
    
    const newPersons = [];
    
    newPersons.push({
      id: fatherId,
      name: fatherName.trim(),
      gender: 'Male',
      isDeceased: false,
      dateOfDeath: '',
      fatherId: '',
      motherId: '',
      spouseId: motherId,
      children: [],
      generation: 0
    });

    newPersons.push({
      id: motherId,
      name: motherName.trim(),
      gender: 'Female',
      isDeceased: false,
      dateOfDeath: '',
      fatherId: '',
      motherId: '',
      spouseId: fatherId,
      children: [],
      generation: 0
    });

    children.forEach((child, index) => {
      const childId = `p_${Date.now()}_child_${index}`;
      newPersons.push({
        id: childId,
        name: child.name.trim(),
        gender: child.gender,
        isDeceased: child.isDeceased,
        dateOfDeath: child.isDeceased ? child.dateOfDeath || '' : '',
        fatherId: fatherId,
        motherId: motherId,
        spouseId: '',
        children: [],
        generation: 0
      });
    });

    // Store data for success modal
    setImportedData({
      father: fatherName.trim(),
      mother: motherName.trim(),
      children: children.map(c => c.name.trim()),
      total: newPersons.length
    });

    // Import the persons
    onImport(newPersons);
    // Show success modal (DO NOT close the main modal here)
    setShowSuccessModal(true);
  };

  // Handle success modal close
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setImportedData(null);
    onClose(); // Close the main modal
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sbg-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="sbg-modal"
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sbg-modal-header">
                <div className="sbg-modal-header-left">
                  <div className="sbg-modal-icon">⚡</div>
                  <div>
                    <h2 className="sbg-modal-title">Smart Bulk Generate</h2>
                    <p className="sbg-modal-subtitle">
                      Generate a family with parents and children with auto-generated names
                    </p>
                  </div>
                </div>
                <button className="sbg-modal-close" onClick={onClose}>✕</button>
              </div>

              <div className="sbg-modal-body">
                <div className="sbg-parents-section">
                  <div className="sbg-parents-grid">
                    <div className="sbg-form-group">
                      <label className="sbg-form-label">👨 Father</label>
                      <input
                        type="text"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="Enter father's name"
                        className="sbg-form-input"
                      />
                      <button
                        className="sbg-random-btn sbg-random-btn-small"
                        onClick={() => setFatherName(generateRandomName('Male'))}
                      >
                        🎲
                      </button>
                    </div>
                    <div className="sbg-form-group">
                      <label className="sbg-form-label">👩 Mother</label>
                      <input
                        type="text"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        placeholder="Enter mother's name"
                        className="sbg-form-input"
                      />
                      <button
                        className="sbg-random-btn sbg-random-btn-small"
                        onClick={() => setMotherName(generateRandomName('Female'))}
                      >
                        🎲
                      </button>
                    </div>
                  </div>

                  <div className="sbg-lastname-group">
                    <label className="sbg-form-label">📛 Last Name (for children)</label>
                    <div className="sbg-lastname-input-group">
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name for children"
                        className="sbg-form-input"
                      />
                      <button
                        className="sbg-btn sbg-btn-secondary"
                        onClick={regenerateNames}
                      >
                        🔄 Regenerate All Names
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sbg-divider">
                  <span>👶 Children</span>
                </div>

                <div className="sbg-controls">
                  <div className="sbg-controls-left">
                    <span className="sbg-controls-label">Number of Children:</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={children.length}
                      onChange={(e) => {
                        const count = parseInt(e.target.value) || 1;
                        if (count > 20) {
                          alert('Maximum 20 children allowed.');
                          return;
                        }
                        generateChildren(Math.max(1, count));
                      }}
                      className="sbg-child-count"
                    />
                  </div>
                  <div className="sbg-controls-right">
                    <button className="sbg-btn sbg-btn-secondary" onClick={regenerateNames}>
                      🎲 Randomize All Names
                    </button>
                    <button className="sbg-btn sbg-btn-primary" onClick={addChild}>
                      + Add Child
                    </button>
                  </div>
                </div>

                <div className="sbg-children-list">
                  {children.map((child, index) => (
                    <div key={child.id} className="sbg-child-item">
                      <span className="sbg-child-number">{index + 1}.</span>
                      
                      {child.isEditing ? (
                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) => updateChild(child.id, 'name', e.target.value)}
                          className="sbg-child-input"
                          autoFocus
                        />
                      ) : (
                        <span className="sbg-child-name">{child.name}</span>
                      )}
                      
                      <select
                        value={child.gender}
                        onChange={(e) => updateChild(child.id, 'gender', e.target.value)}
                        className="sbg-child-gender"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      
                      <label className="sbg-child-deceased-label">
                        <input
                          type="checkbox"
                          checked={child.isDeceased}
                          onChange={(e) => updateChild(child.id, 'isDeceased', e.target.checked)}
                        />
                        Deceased
                      </label>
                      
                      {child.isDeceased && (
                        <input
                          type="date"
                          value={child.dateOfDeath}
                          onChange={(e) => updateChild(child.id, 'dateOfDeath', e.target.value)}
                          className="sbg-child-death-date"
                        />
                      )}
                      
                      <div className="sbg-child-actions">
                        <button
                          className="sbg-child-btn sbg-child-edit"
                          onClick={() => toggleEdit(child.id)}
                        >
                          {child.isEditing ? '💾' : '✏️'}
                        </button>
                        <button
                          className="sbg-child-btn sbg-child-delete"
                          onClick={() => removeChild(child.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sbg-tip">
                  💡 Click the ✏️ icon to edit a child's name. Click 🎲 to randomize names.
                </div>
              </div>

              <div className="sbg-modal-footer">
                <div className="sbg-footer-left">
                  <span className="sbg-footer-info">
                    {children.length} child{children.length > 1 ? 'ren' : ''} · 
                    {children.filter(c => c.isDeceased).length} deceased
                  </span>
                </div>
                <div className="sbg-footer-right">
                  <button className="sbg-btn sbg-btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button className="sbg-btn sbg-btn-primary" onClick={handleImport}>
                    👨‍👩‍👧‍👦 Create Family ({children.length + 2} persons)
                  </button>
                </div>
              </div>

              <style>{`
                .sbg-modal-overlay {
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

                .sbg-modal {
                  background: var(--card-bg, #ffffff);
                  border-radius: 16px;
                  max-width: 700px;
                  width: 100%;
                  max-height: 92vh;
                  overflow: hidden;
                  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
                  border: 1px solid var(--border-color, #e2e8f0);
                  display: flex;
                  flex-direction: column;
                }

                .sbg-modal-header {
                  padding: 18px 24px;
                  border-bottom: 1px solid var(--border-color, #e2e8f0);
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  background: var(--bg-secondary, #f8fafc);
                  flex-shrink: 0;
                  gap: 12px;
                }

                .sbg-modal-header-left {
                  display: flex;
                  align-items: center;
                  gap: 14px;
                }

                .sbg-modal-icon {
                  font-size: 28px;
                  flex-shrink: 0;
                }

                .sbg-modal-title {
                  font-size: 18px;
                  font-weight: 700;
                  color: var(--text-primary, #0f172a);
                  margin: 0;
                }

                .sbg-modal-subtitle {
                  font-size: 13px;
                  color: var(--text-secondary, #64748b);
                  margin: 2px 0 0 0;
                }

                .sbg-modal-close {
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

                .sbg-modal-close:hover {
                  background: var(--border-color, #e2e8f0);
                }

                .sbg-modal-body {
                  padding: 20px 24px;
                  overflow-y: auto;
                  flex: 1;
                }

                .sbg-modal-body::-webkit-scrollbar {
                  width: 6px;
                }

                .sbg-modal-body::-webkit-scrollbar-track {
                  background: var(--bg-secondary, #f1f5f9);
                  border-radius: 3px;
                }

                .sbg-modal-body::-webkit-scrollbar-thumb {
                  background: var(--border-color, #e2e8f0);
                  border-radius: 3px;
                }

                .sbg-parents-section {
                  margin-bottom: 16px;
                }

                .sbg-parents-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 12px;
                  margin-bottom: 12px;
                }

                .sbg-form-group {
                  display: flex;
                  flex-direction: column;
                  gap: 4px;
                  position: relative;
                }

                .sbg-form-label {
                  font-size: 12px;
                  font-weight: 600;
                  color: var(--text-secondary, #64748b);
                  text-transform: uppercase;
                  letter-spacing: 0.3px;
                }

                .sbg-form-input {
                  padding: 8px 12px;
                  border: 1px solid var(--border-color, #e2e8f0);
                  border-radius: 8px;
                  font-size: 14px;
                  outline: none;
                  background: var(--bg-primary, #ffffff);
                  color: var(--text-primary, #0f172a);
                  transition: border-color 0.2s;
                  width: 100%;
                  padding-right: 40px;
                  box-sizing: border-box;
                }

                .sbg-form-input:focus {
                  border-color: #6366f1;
                  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }

                .sbg-random-btn {
                  position: absolute;
                  right: 8px;
                  top: 28px;
                  background: none;
                  border: none;
                  font-size: 18px;
                  cursor: pointer;
                  padding: 4px;
                  border-radius: 4px;
                  transition: background 0.2s;
                  line-height: 1;
                }

                .sbg-random-btn:hover {
                  background: var(--bg-secondary, #f1f5f9);
                }

                .sbg-lastname-group {
                  display: flex;
                  flex-direction: column;
                  gap: 4px;
                }

                .sbg-lastname-input-group {
                  display: flex;
                  gap: 8px;
                }

                .sbg-lastname-input-group .sbg-form-input {
                  flex: 1;
                  padding-right: 12px;
                }

                .sbg-divider {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  margin: 16px 0 12px 0;
                  color: var(--text-secondary, #64748b);
                  font-size: 13px;
                  font-weight: 600;
                }

                .sbg-divider::before,
                .sbg-divider::after {
                  content: '';
                  flex: 1;
                  height: 1px;
                  background: var(--border-color, #e2e8f0);
                }

                .sbg-controls {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 12px;
                  flex-wrap: wrap;
                  gap: 8px;
                }

                .sbg-controls-left {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }

                .sbg-controls-label {
                  font-size: 13px;
                  color: var(--text-secondary, #64748b);
                  font-weight: 500;
                }

                .sbg-child-count {
                  width: 60px;
                  padding: 4px 8px;
                  border: 1px solid var(--border-color, #e2e8f0);
                  border-radius: 6px;
                  font-size: 14px;
                  outline: none;
                  background: var(--bg-primary, #ffffff);
                  color: var(--text-primary, #0f172a);
                  text-align: center;
                }

                .sbg-child-count:focus {
                  border-color: #6366f1;
                }

                .sbg-controls-right {
                  display: flex;
                  gap: 8px;
                  flex-wrap: wrap;
                }

                .sbg-children-list {
                  display: flex;
                  flex-direction: column;
                  gap: 6px;
                  max-height: 280px;
                  overflow-y: auto;
                  padding-right: 4px;
                  margin-bottom: 8px;
                }

                .sbg-children-list::-webkit-scrollbar {
                  width: 4px;
                }

                .sbg-children-list::-webkit-scrollbar-track {
                  background: var(--bg-secondary, #f1f5f9);
                  border-radius: 2px;
                }

                .sbg-children-list::-webkit-scrollbar-thumb {
                  background: var(--border-color, #e2e8f0);
                  border-radius: 2px;
                }

                .sbg-child-item {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 6px 10px;
                  border-radius: 8px;
                  background: var(--bg-secondary, #f8fafc);
                  border: 1px solid var(--border-color, #e2e8f0);
                  flex-wrap: wrap;
                }

                .sbg-child-number {
                  font-size: 12px;
                  font-weight: 600;
                  color: var(--text-secondary, #64748b);
                  min-width: 24px;
                }

                .sbg-child-name {
                  font-size: 14px;
                  font-weight: 500;
                  color: var(--text-primary, #0f172a);
                  flex: 1;
                  min-width: 80px;
                }

                .sbg-child-input {
                  flex: 1;
                  min-width: 80px;
                  padding: 4px 8px;
                  border: 1px solid #6366f1;
                  border-radius: 6px;
                  font-size: 14px;
                  outline: none;
                  background: var(--bg-primary, #ffffff);
                  color: var(--text-primary, #0f172a);
                }

                .sbg-child-gender {
                  padding: 4px 8px;
                  border: 1px solid var(--border-color, #e2e8f0);
                  border-radius: 6px;
                  font-size: 12px;
                  outline: none;
                  background: var(--bg-primary, #ffffff);
                  color: var(--text-primary, #0f172a);
                  cursor: pointer;
                }

                .sbg-child-deceased-label {
                  display: flex;
                  align-items: center;
                  gap: 4px;
                  font-size: 12px;
                  color: var(--text-secondary, #64748b);
                  cursor: pointer;
                  white-space: nowrap;
                }

                .sbg-child-deceased-label input {
                  cursor: pointer;
                  accent-color: #6366f1;
                }

                .sbg-child-death-date {
                  padding: 4px 8px;
                  border: 1px solid var(--border-color, #e2e8f0);
                  border-radius: 6px;
                  font-size: 12px;
                  outline: none;
                  background: var(--bg-primary, #ffffff);
                  color: var(--text-primary, #0f172a);
                  max-width: 120px;
                }

                .sbg-child-death-date:focus {
                  border-color: #6366f1;
                }

                .sbg-child-actions {
                  display: flex;
                  gap: 4px;
                  flex-shrink: 0;
                }

                .sbg-child-btn {
                  padding: 2px 6px;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                  transition: background 0.2s;
                  background: transparent;
                  color: var(--text-secondary, #64748b);
                }

                .sbg-child-btn:hover {
                  background: var(--bg-secondary, #f1f5f9);
                }

                .sbg-child-edit:hover {
                  color: #6366f1;
                }

                .sbg-child-delete:hover {
                  color: #dc2626;
                }

                .sbg-tip {
                  font-size: 12px;
                  color: var(--text-secondary, #64748b);
                  padding: 8px 12px;
                  background: var(--bg-secondary, #f8fafc);
                  border-radius: 8px;
                  border: 1px solid var(--border-color, #e2e8f0);
                  margin-top: 4px;
                }

                .sbg-btn {
                  padding: 6px 16px;
                  border-radius: 8px;
                  border: none;
                  font-size: 13px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.2s ease;
                  white-space: nowrap;
                }

                .sbg-btn-primary {
                  background: linear-gradient(135deg, #6366f1, #8b5cf6);
                  color: #ffffff;
                  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
                }

                .sbg-btn-primary:hover {
                  transform: translateY(-1px);
                  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
                }

                .sbg-btn-secondary {
                  background: var(--border-color, #e2e8f0);
                  color: var(--text-primary, #0f172a);
                }

                .sbg-btn-secondary:hover {
                  background: var(--hover-bg, #d1d5db);
                }

                .sbg-modal-footer {
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

                .sbg-footer-left {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }

                .sbg-footer-info {
                  font-size: 12px;
                  color: var(--text-secondary, #64748b);
                }

                .sbg-footer-right {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  flex-wrap: wrap;
                }

                @media (max-width: 768px) {
                  .sbg-modal {
                    max-width: 100%;
                    max-height: 95vh;
                  }

                  .sbg-modal-body {
                    padding: 16px;
                  }

                  .sbg-parents-grid {
                    grid-template-columns: 1fr;
                  }

                  .sbg-modal-header {
                    padding: 14px 16px;
                    flex-wrap: wrap;
                  }

                  .sbg-modal-header-left {
                    flex: 1;
                    min-width: 0;
                  }

                  .sbg-modal-title {
                    font-size: 16px;
                  }

                  .sbg-modal-subtitle {
                    font-size: 12px;
                  }

                  .sbg-controls {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 6px;
                  }

                  .sbg-controls-left {
                    justify-content: center;
                  }

                  .sbg-controls-right {
                    justify-content: center;
                  }

                  .sbg-child-item {
                    flex-wrap: wrap;
                    gap: 4px;
                  }

                  .sbg-child-name {
                    min-width: 60px;
                    font-size: 13px;
                  }

                  .sbg-child-death-date {
                    max-width: 100px;
                    font-size: 11px;
                  }

                  .sbg-modal-footer {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 8px;
                    padding: 12px 16px;
                  }

                  .sbg-footer-left {
                    justify-content: center;
                  }

                  .sbg-footer-right {
                    justify-content: center;
                  }

                  .sbg-btn {
                    padding: 5px 12px;
                    font-size: 12px;
                  }
                }

                @media (max-width: 480px) {
                  .sbg-modal {
                    max-height: 100vh;
                    border-radius: 12px;
                  }

                  .sbg-modal-header {
                    padding: 10px 12px;
                  }

                  .sbg-modal-body {
                    padding: 12px;
                  }

                  .sbg-modal-icon {
                    font-size: 22px;
                  }

                  .sbg-modal-title {
                    font-size: 14px;
                  }

                  .sbg-modal-subtitle {
                    font-size: 11px;
                  }

                  .sbg-child-item {
                    padding: 4px 6px;
                  }

                  .sbg-child-name {
                    font-size: 12px;
                    min-width: 40px;
                  }

                  .sbg-child-gender {
                    font-size: 11px;
                    padding: 2px 6px;
                  }

                  .sbg-child-deceased-label {
                    font-size: 11px;
                  }

                  .sbg-child-death-date {
                    max-width: 80px;
                    font-size: 10px;
                    padding: 2px 6px;
                  }

                  .sbg-child-count {
                    width: 50px;
                    font-size: 12px;
                  }

                  .sbg-footer-info {
                    font-size: 11px;
                  }
                }

                [data-theme="dark"] .sbg-modal {
                  --bg-primary: #0f172a;
                  --bg-secondary: #1e293b;
                  --card-bg: #1e293b;
                  --text-primary: #f1f5f9;
                  --text-secondary: #94a3b8;
                  --border-color: #334155;
                  --hover-bg: #2d3748;
                }

                [data-theme="dark"] .sbg-modal {
                  background: var(--card-bg, #1e293b);
                  border-color: var(--border-color, #334155);
                }

                [data-theme="dark"] .sbg-modal-header {
                  background: var(--bg-secondary, #1e293b);
                  border-color: var(--border-color, #334155);
                }

                [data-theme="dark"] .sbg-modal-close:hover {
                  background: var(--border-color, #334155);
                }

                [data-theme="dark"] .sbg-form-input {
                  background: var(--bg-primary, #0f172a);
                  border-color: var(--border-color, #334155);
                  color: var(--text-primary, #f1f5f9);
                }

                [data-theme="dark"] .sbg-form-input:focus {
                  border-color: #6366f1;
                  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
                }

                [data-theme="dark"] .sbg-child-item {
                  background: var(--bg-secondary, #1e293b);
                  border-color: var(--border-color, #334155);
                }

                [data-theme="dark"] .sbg-child-gender {
                  background: var(--bg-primary, #0f172a);
                  border-color: var(--border-color, #334155);
                  color: var(--text-primary, #f1f5f9);
                }

                [data-theme="dark"] .sbg-child-death-date {
                  background: var(--bg-primary, #0f172a);
                  border-color: var(--border-color, #334155);
                  color: var(--text-primary, #f1f5f9);
                }

                [data-theme="dark"] .sbg-child-input {
                  background: var(--bg-primary, #0f172a);
                  color: var(--text-primary, #f1f5f9);
                }

                [data-theme="dark"] .sbg-child-count {
                  background: var(--bg-primary, #0f172a);
                  border-color: var(--border-color, #334155);
                  color: var(--text-primary, #f1f5f9);
                }

                [data-theme="dark"] .sbg-btn-secondary {
                  background: var(--border-color, #334155);
                  color: var(--text-primary, #f1f5f9);
                }

                [data-theme="dark"] .sbg-btn-secondary:hover {
                  background: var(--hover-bg, #2d3748);
                }

                [data-theme="dark"] .sbg-modal-footer {
                  background: var(--bg-secondary, #1e293b);
                  border-color: var(--border-color, #334155);
                }

                [data-theme="dark"] .sbg-tip {
                  background: var(--bg-secondary, #1e293b);
                  border-color: var(--border-color, #334155);
                }

                [data-theme="dark"] .sbg-random-btn:hover {
                  background: var(--bg-secondary, #1e293b);
                }
              `}</style>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && importedData && (
          <motion.div
            className="sbg-success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSuccessClose}
          >
            <motion.div
              className="sbg-success-modal"
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sbg-success-icon">✅</div>
              <h2 className="sbg-success-title">Family Created Successfully!</h2>
              <p className="sbg-success-subtitle">
                {importedData.total} persons have been added to the family tree.
              </p>

              <div className="sbg-success-summary">
                <div className="sbg-success-item">
                  <span className="sbg-success-label">👨 Father</span>
                  <span className="sbg-success-value">{importedData.father}</span>
                </div>
                <div className="sbg-success-item">
                  <span className="sbg-success-label">👩 Mother</span>
                  <span className="sbg-success-value">{importedData.mother}</span>
                </div>
                <div className="sbg-success-item">
                  <span className="sbg-success-label">👶 Children</span>
                  <span className="sbg-success-value">{importedData.children.length}</span>
                </div>
              </div>

              <div className="sbg-success-children">
                <div className="sbg-success-children-label">Children Names:</div>
                <div className="sbg-success-children-list">
                  {importedData.children.map((name, idx) => (
                    <span key={idx} className="sbg-success-child-name">
                      {idx + 1}. {name}
                    </span>
                  ))}
                </div>
              </div>

              <button className="sbg-success-btn" onClick={handleSuccessClose}>
                View Family Tree
              </button>
            </motion.div>

            <style>{`
              .sbg-success-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(15, 23, 42, 0.7);
                backdrop-filter: blur(12px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 4000;
                padding: 20px;
              }

              .sbg-success-modal {
                background: var(--card-bg, #ffffff);
                border-radius: 20px;
                max-width: 480px;
                width: 100%;
                padding: 40px 36px 32px;
                box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
                border: 1px solid var(--border-color, #e2e8f0);
                text-align: center;
                position: relative;
                overflow: hidden;
              }

              .sbg-success-modal::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(135deg, #10b981, #34d399);
              }

              .sbg-success-icon {
                font-size: 56px;
                margin-bottom: 12px;
                display: block;
              }

              .sbg-success-title {
                font-size: 22px;
                font-weight: 700;
                color: var(--text-primary, #0f172a);
                margin: 0 0 6px 0;
              }

              .sbg-success-subtitle {
                font-size: 14px;
                color: var(--text-secondary, #64748b);
                margin: 0 0 24px 0;
              }

              .sbg-success-summary {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 8px;
                margin-bottom: 20px;
              }

              .sbg-success-item {
                background: var(--bg-secondary, #f8fafc);
                border-radius: 10px;
                padding: 12px 8px;
                border: 1px solid var(--border-color, #e2e8f0);
              }

              .sbg-success-label {
                display: block;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.4px;
                color: var(--text-secondary, #64748b);
              }

              .sbg-success-value {
                display: block;
                font-size: 16px;
                font-weight: 700;
                color: var(--text-primary, #0f172a);
                margin-top: 2px;
              }

              .sbg-success-children {
                background: var(--bg-secondary, #f8fafc);
                border-radius: 10px;
                padding: 14px 16px;
                border: 1px solid var(--border-color, #e2e8f0);
                margin-bottom: 24px;
                text-align: left;
              }

              .sbg-success-children-label {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.4px;
                color: var(--text-secondary, #64748b);
                margin-bottom: 6px;
              }

              .sbg-success-children-list {
                display: flex;
                flex-wrap: wrap;
                gap: 4px 12px;
              }

              .sbg-success-child-name {
                font-size: 13px;
                font-weight: 500;
                color: var(--text-primary, #0f172a);
              }

              .sbg-success-btn {
                padding: 10px 32px;
                border-radius: 10px;
                border: none;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.25s ease;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: #ffffff;
                box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
                width: 100%;
              }

              .sbg-success-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 24px rgba(99, 102, 241, 0.45);
              }

              @media (max-width: 480px) {
                .sbg-success-modal {
                  padding: 28px 20px 24px;
                  max-width: 100%;
                }

                .sbg-success-summary {
                  grid-template-columns: 1fr;
                  gap: 6px;
                }

                .sbg-success-icon {
                  font-size: 44px;
                }

                .sbg-success-title {
                  font-size: 18px;
                }

                .sbg-success-children-list {
                  flex-direction: column;
                  gap: 2px;
                }
              }

              [data-theme="dark"] .sbg-success-modal {
                --bg-primary: #0f172a;
                --bg-secondary: #1e293b;
                --card-bg: #1e293b;
                --text-primary: #f1f5f9;
                --text-secondary: #94a3b8;
                --border-color: #334155;
              }

              [data-theme="dark"] .sbg-success-modal {
                background: var(--card-bg, #1e293b);
                border-color: var(--border-color, #334155);
              }

              [data-theme="dark"] .sbg-success-item {
                background: var(--bg-secondary, #1e293b);
                border-color: var(--border-color, #334155);
              }

              [data-theme="dark"] .sbg-success-children {
                background: var(--bg-secondary, #1e293b);
                border-color: var(--border-color, #334155);
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SmartBulkGenerator;