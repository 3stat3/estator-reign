import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const RequirementReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [filter, setFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    category: 'tax'
  });

  // Sample initial data
  useEffect(() => {
    const sampleReminders = [
      {
        id: 1,
        title: 'File Annual Income Tax',
        description: 'Submit annual income tax return for the previous year',
        dueDate: '2026-04-15',
        priority: 'high',
        category: 'tax',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Pay Real Property Tax',
        description: 'Pay real property tax for residential properties',
        dueDate: '2026-06-30',
        priority: 'medium',
        category: 'property',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        title: 'Submit Business Tax Returns',
        description: 'Quarterly business tax return submission',
        dueDate: '2026-03-31',
        priority: 'high',
        category: 'business',
        completed: true,
        createdAt: new Date().toISOString()
      }
    ];
    setReminders(sampleReminders);
  }, []);

  const categories = [
    { value: 'tax', label: 'Tax', color: '#3b82f6' },
    { value: 'property', label: 'Property', color: '#10b981' },
    { value: 'business', label: 'Business', color: '#f59e0b' },
    { value: 'estate', label: 'Estate', color: '#8b5cf6' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#10b981' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' }
  ];

  const handleAddReminder = (e) => {
    e.preventDefault();
    const newReminder = {
      id: Date.now(),
      ...formData,
      completed: false,
      createdAt: new Date().toISOString()
    };
    setReminders([newReminder, ...reminders]);
    setFormData({ title: '', description: '', dueDate: '', priority: 'medium', category: 'tax' });
    setShowAddModal(false);
  };

  const handleEditReminder = (e) => {
    e.preventDefault();
    setReminders(reminders.map(r => 
      r.id === editingReminder.id ? { ...r, ...formData } : r
    ));
    setEditingReminder(null);
    setFormData({ title: '', description: '', dueDate: '', priority: 'medium', category: 'tax' });
  };

  const handleDeleteReminder = (id) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      setReminders(reminders.filter(r => r.id !== id));
    }
  };

  const toggleComplete = (id) => {
    setReminders(reminders.map(r =>
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
  };

  const getFilteredReminders = () => {
    switch(filter) {
      case 'active':
        return reminders.filter(r => !r.completed);
      case 'completed':
        return reminders.filter(r => r.completed);
      default:
        return reminders;
    }
  };

  const getPriorityColor = (priority) => {
    return priorities.find(p => p.value === priority)?.color || '#64748b';
  };

  const getCategoryColor = (category) => {
    return categories.find(c => c.value === category)?.color || '#64748b';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntil = (date) => {
    const today = new Date();
    const due = new Date(date);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Due today';
    return `${diff} days remaining`;
  };

  return (
    <div className="requirement-reminders">
      <div className="reminders-header">
        <div className="header-left">
          <h3>
            <BellIcon className="header-icon" />
            Requirement Reminders
          </h3>
          <p>Track and manage your tax and compliance requirements</p>
        </div>
        <button className="add-reminder-btn" onClick={() => setShowAddModal(true)}>
          <PlusIcon className="btn-icon" />
          Add Reminder
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-buttons">
          {['all', 'active', 'completed'].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="reminders-count">
          {getFilteredReminders().filter(r => !r.completed).length} pending
        </div>
      </div>

      <div className="reminders-list">
        <AnimatePresence>
          {getFilteredReminders().length > 0 ? (
            getFilteredReminders().map((reminder) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`reminder-item ${reminder.completed ? 'completed' : ''}`}
              >
                <div className="reminder-check">
                  <button
                    className={`check-btn ${reminder.completed ? 'checked' : ''}`}
                    onClick={() => toggleComplete(reminder.id)}
                  >
                    {reminder.completed && <CheckCircleIcon className="check-icon" />}
                  </button>
                </div>

                <div className="reminder-content">
                  <div className="reminder-title-row">
                    <h4 className={`reminder-title ${reminder.completed ? 'completed-text' : ''}`}>
                      {reminder.title}
                    </h4>
                    <div className="reminder-tags">
                      <span 
                        className="category-tag"
                        style={{ backgroundColor: `${getCategoryColor(reminder.category)}20`, color: getCategoryColor(reminder.category) }}
                      >
                        {reminder.category}
                      </span>
                      <span 
                        className="priority-tag"
                        style={{ backgroundColor: `${getPriorityColor(reminder.priority)}20`, color: getPriorityColor(reminder.priority) }}
                      >
                        {reminder.priority}
                      </span>
                    </div>
                  </div>

                  <p className="reminder-description">{reminder.description}</p>

                  <div className="reminder-meta">
                    <span className="meta-item">
                      <CalendarIcon className="meta-icon" />
                      Due: {formatDate(reminder.dueDate)}
                    </span>
                    <span className="meta-item days">
                      {!reminder.completed && (
                        <>
                          <ClockIcon className="meta-icon" />
                          {getDaysUntil(reminder.dueDate)}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="reminder-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => {
                      setEditingReminder(reminder);
                      setFormData(reminder);
                    }}
                  >
                    <PencilIcon className="action-icon" />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteReminder(reminder.id)}
                  >
                    <TrashIcon className="action-icon" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="empty-state">
              <BellIcon className="empty-icon" />
              <h4>No reminders found</h4>
              <p>Create your first tax requirement reminder</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingReminder) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => {
              setShowAddModal(false);
              setEditingReminder(null);
              setFormData({ title: '', description: '', dueDate: '', priority: 'medium', category: 'tax' });
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>{editingReminder ? 'Edit Reminder' : 'Add New Reminder'}</h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingReminder(null);
                    setFormData({ title: '', description: '', dueDate: '', priority: 'medium', category: 'tax' });
                  }}
                >
                  <XMarkIcon className="close-icon" />
                </button>
              </div>

              <form onSubmit={editingReminder ? handleEditReminder : handleAddReminder}>
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter reminder title"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter description (optional)"
                    rows="3"
                    className="form-textarea"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Due Date *</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="form-select"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="form-select"
                  >
                    {priorities.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingReminder(null);
                      setFormData({ title: '', description: '', dueDate: '', priority: 'medium', category: 'tax' });
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    {editingReminder ? 'Update' : 'Add'} Reminder
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .requirement-reminders {
          background: var(--card-bg);
          border-radius: 0.75rem;
        }

        .reminders-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .header-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: #f59e0b;
        }

        .header-left p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .add-reminder-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .add-reminder-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }

        .btn-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .filters-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .filter-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          background: none;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: var(--hover-bg);
        }

        .filter-btn.active {
          background: #f59e0b;
          color: white;
          border-color: #f59e0b;
        }

        .reminders-count {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .reminders-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .reminder-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          transition: all 0.3s;
        }

        .reminder-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .reminder-item.completed {
          opacity: 0.7;
        }

        .reminder-check {
          padding-top: 0.25rem;
        }

        .check-btn {
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          border: 2px solid var(--border-color);
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .check-btn:hover {
          border-color: #10b981;
        }

        .check-btn.checked {
          background: #10b981;
          border-color: #10b981;
        }

        .check-icon {
          width: 0.875rem;
          height: 0.875rem;
          color: white;
        }

        .reminder-content {
          flex: 1;
        }

        .reminder-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }

        .reminder-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .reminder-title.completed-text {
          text-decoration: line-through;
        }

        .reminder-tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .category-tag,
        .priority-tag {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .reminder-description {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0 0 0.75rem 0;
        }

        .reminder-meta {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.813rem;
          color: var(--text-secondary);
        }

        .meta-icon {
          width: 1rem;
          height: 1rem;
        }

        .reminder-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          background: none;
          border: none;
          padding: 0.25rem;
          cursor: pointer;
          color: var(--text-secondary);
          transition: color 0.2s;
        }

        .action-btn.edit:hover {
          color: #3b82f6;
        }

        .action-btn.delete:hover {
          color: #ef4444;
        }

        .action-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
        }

        .empty-icon {
          width: 3rem;
          height: 3rem;
          color: var(--text-tertiary);
          margin: 0 auto 1rem;
        }

        .empty-state h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: var(--card-bg);
          border-radius: 1rem;
          padding: 2rem;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 0.25rem;
        }

        .close-icon {
          width: 1.5rem;
          height: 1.5rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .cancel-btn {
          flex: 1;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: var(--hover-bg);
        }

        .submit-btn {
          flex: 2;
          padding: 0.75rem;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .reminder-title-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .reminder-item {
            flex-direction: column;
          }

          .reminder-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default RequirementReminders;