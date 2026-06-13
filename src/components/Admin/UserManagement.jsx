// components/Admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  UserPlusIcon,
  CheckBadgeIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  XMarkIcon,
  EnvelopeIcon,
  CalendarIcon,
  BriefcaseIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../../supabase';

const UserManagement = ({ currentAdminRole, onUserUpdate }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  useEffect(() => {
    getCurrentAdmin();
  }, []);

  const getCurrentAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: adminData } = await supabase
          .from('profiles')
          .select('id, username, role')
          .eq('id', user.id)
          .single();
        
        if (adminData) setCurrentAdmin(adminData);
      }
    } catch (err) {
      console.error('Error fetching current admin:', err);
    }
  };

  useEffect(() => {
    loadUsers();
    const subscription = supabase
      .channel('profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadUsers())
      .subscribe();
    return () => subscription.unsubscribe();
  }, [filterRole]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (filterRole !== 'all') query = query.eq('role', filterRole);
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const transformedUsers = (data || []).map(profile => ({
        id: profile.id,
        name: profile.username,
        fullName: profile.full_name || profile.username,
        email: profile.email,
        role: profile.role,
        position: profile.position || 'Not specified',
        joined: profile.created_at,
        status: profile.approval_status === 'approved' ? 'active' : 
                profile.approval_status === 'frozen' ? 'frozen' : 'pending',
        approvalStatus: profile.approval_status,
      }));
      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleApproveUser = async () => {
    if (!selectedUser?.id) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'approved', role: 'regular_user' })
        .eq('id', selectedUser.id);
      if (error) throw error;
      await loadUsers();
      setShowUserModal(false);
      setSelectedUser(null);
      if (onUserUpdate) onUserUpdate({ type: 'approve', userId: selectedUser.id });
    } catch (err) {
      alert('Failed to approve user: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFreezeUser = async () => {
    if (!selectedUser?.id) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'frozen' })
        .eq('id', selectedUser.id);
      if (error) throw error;
      await loadUsers();
      setShowUserModal(false);
      setSelectedUser(null);
      if (onUserUpdate) onUserUpdate({ type: 'freeze', userId: selectedUser.id });
    } catch (err) {
      alert('Failed to freeze user: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreUser = async () => {
    if (!selectedUser?.id) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'approved', role: 'regular_user' })
        .eq('id', selectedUser.id);
      if (error) throw error;
      await loadUsers();
      setShowUserModal(false);
      setSelectedUser(null);
      if (onUserUpdate) onUserUpdate({ type: 'restore', userId: selectedUser.id });
    } catch (err) {
      alert('Failed to restore user: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const statusConfig = {
    active: { text: 'Active', className: 'status-active', icon: <CheckCircleIcon /> },
    pending: { text: 'Pending', className: 'status-pending', icon: <ClockIcon /> },
    frozen: { text: 'Frozen', className: 'status-frozen', icon: <NoSymbolIcon /> }
  };

  const roleConfig = {
    super_admin: { text: 'Super Admin', className: 'role-super', icon: <ShieldCheckIcon /> },
    regular_admin: { text: 'Admin', className: 'role-admin', icon: <BriefcaseIcon /> },
    regular_user: { text: 'User', className: 'role-user', icon: <UsersIcon /> }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <ExclamationTriangleIcon />
        <h3>Failed to load users</h3>
        <p>{error}</p>
        <button onClick={loadUsers}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* Header */}
      <div className="header">
        <div className="header-title">
          <UsersIcon />
          <div>
            <h1>User Management</h1>
            <p>Manage user accounts and access permissions</p>
          </div>
        </div>
        <button className="btn-add">
          <UserPlusIcon />
          <span>Add User</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <MagnifyingGlassIcon />
          <input
            type="text"
            placeholder="Search by name, full name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
          <FunnelIcon />
          <span>Filter</span>
          <ChevronDownIcon className={showFilters ? 'rotated' : ''} />
        </button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            className="filters-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="filter-group">
              <label>Role</label>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="regular_admin">Admin</option>
                <option value="regular_user">User</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="frozen">Frozen</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table - List View */}
      <div className="table-container">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <UsersIcon />
            <h3>No users found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const status = statusConfig[user.status];
                const role = roleConfig[user.role] || { text: user.role || 'User', className: 'role-user', icon: <UsersIcon /> };
                
                return (
                  <tr key={user.id} onClick={() => handleOpenUserModal(user)}>
                    <td className="user-info">
                      <div className="user-avatar">
                        {user.fullName?.[0] || user.name?.[0] || user.email?.[0] || '?'}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.fullName || user.name || 'Unnamed User'}</div>
                        <div className="user-email">{user.email || 'No email'}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${role.className}`}>
                        {role.icon}
                        {role.text}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${status.className}`}>
                        {status.icon}
                        {status.text}
                      </span>
                    </td>
                    <td className="join-date">
                      <CalendarIcon />
                      {user.joined ? new Date(user.joined).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <button className="view-btn">
                        <span>View</span>
                        <ChevronRightIcon />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* User Detail Modal - Updated with Full Name and Position */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
            <motion.div 
              className="user-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-avatar">
                  {selectedUser.fullName?.[0] || selectedUser.name?.[0] || selectedUser.email?.[0] || '?'}
                </div>
                <div className="modal-info">
                  <h2>{selectedUser.fullName || selectedUser.name || 'Unnamed User'}</h2>
                  <p className="modal-username">
                    <UserIcon /> @{selectedUser.name || 'username'}
                  </p>
                  <p><EnvelopeIcon /> {selectedUser.email || 'No email provided'}</p>
                  <p className="modal-position">
                    <BuildingOfficeIcon /> {selectedUser.position || 'Position not specified'}
                  </p>
                  <p><CalendarIcon /> Joined {selectedUser.joined ? new Date(selectedUser.joined).toLocaleDateString() : 'Unknown'}</p>
                </div>
                <button className="modal-close" onClick={() => setShowUserModal(false)}>
                  <XMarkIcon />
                </button>
              </div>

              <div className="modal-body">
                <div className="stats">
                  <div className="stat">
                    <span className="stat-label">Role</span>
                    <span className={`role-badge ${roleConfig[selectedUser.role]?.className || 'role-user'}`}>
                      {roleConfig[selectedUser.role]?.icon}
                      {roleConfig[selectedUser.role]?.text || selectedUser.role}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Status</span>
                    <span className={`status-badge ${statusConfig[selectedUser.status]?.className}`}>
                      {statusConfig[selectedUser.status]?.icon}
                      {statusConfig[selectedUser.status]?.text}
                    </span>
                  </div>
                </div>

                <div className="modal-actions">
                  {selectedUser.status === 'pending' && (
                    <button 
                      className="action-btn approve"
                      onClick={handleApproveUser}
                      disabled={isProcessing}
                    >
                      <CheckBadgeIcon />
                      {isProcessing ? 'Processing...' : 'Approve User'}
                    </button>
                  )}
                  
                  {selectedUser.status === 'active' && (
                    <button 
                      className="action-btn freeze"
                      onClick={handleFreezeUser}
                      disabled={isProcessing}
                    >
                      <NoSymbolIcon />
                      {isProcessing ? 'Processing...' : 'Freeze Access'}
                    </button>
                  )}
                  
                  {selectedUser.status === 'frozen' && (
                    <button 
                      className="action-btn restore"
                      onClick={handleRestoreUser}
                      disabled={isProcessing}
                    >
                      <ArrowPathIcon />
                      {isProcessing ? 'Processing...' : 'Restore Access'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        /* CSS Variables for Light/Dark Mode */
        :root {
          --bg-primary: #ffffff;
          --bg-secondary: #f9fafb;
          --bg-tertiary: #f3f4f6;
          --text-primary: #111827;
          --text-secondary: #6b7280;
          --text-tertiary: #9ca3af;
          --border: #e5e7eb;
          --hover: #f9fafb;
          --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        [data-theme="dark"] {
          --bg-primary: #1f2937;
          --bg-secondary: #111827;
          --bg-tertiary: #374151;
          --text-primary: #f9fafb;
          --text-secondary: #9ca3af;
          --text-tertiary: #6b7280;
          --border: #374151;
          --hover: #374151;
          --shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        }

        .user-management {
          background: var(--bg-primary);
          min-height: 100vh;
          padding: 1.5rem;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-title svg {
          width: 2rem;
          height: 2rem;
          color: var(--text-primary);
        }

        .header-title h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
        }

        .header-title p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0;
        }

        .btn-add {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: #8b5cf6;
          border: none;
          border-radius: 0.5rem;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add:hover {
          background: #7c3aed;
          transform: translateY(-1px);
        }

        .btn-add svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        /* Search Bar */
        .search-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .search-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .search-input-wrapper:focus-within {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .search-input-wrapper svg {
          width: 1.25rem;
          height: 1.25rem;
          color: var(--text-tertiary);
        }

        .search-input-wrapper input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .search-input-wrapper input::placeholder {
          color: var(--text-tertiary);
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: var(--hover);
        }

        .filter-btn svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .filter-btn .rotated {
          transform: rotate(180deg);
        }

        /* Filters Panel */
        .filters-panel {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          border: 1px solid var(--border);
          overflow-x: auto;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: 120px;
        }

        .filter-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .filter-group select {
          padding: 0.5rem 2rem 0.5rem 0.75rem;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 0.375rem;
          color: var(--text-primary);
          font-size: 0.875rem;
          cursor: pointer;
        }

        /* Table */
        .table-container {
          background: var(--bg-primary);
          border-radius: 0.75rem;
          overflow-x: auto;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 500px;
        }

        .users-table th {
          text-align: left;
          padding: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border);
        }

        .users-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .users-table tr {
          cursor: pointer;
          transition: background 0.2s;
        }

        .users-table tr:hover {
          background: var(--hover);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 2.5rem;
          height: 2.5rem;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .user-name {
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-email {
          font-size: 0.75rem;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .join-date {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: var(--text-secondary);
          font-size: 0.813rem;
          white-space: nowrap;
        }

        .join-date svg {
          width: 0.875rem;
          height: 0.875rem;
          flex-shrink: 0;
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 0.375rem;
          color: var(--text-primary);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .view-btn:hover {
          background: var(--hover);
          border-color: #8b5cf6;
        }

        .view-btn svg {
          width: 0.875rem;
          height: 0.875rem;
        }

        /* Badges */
        .role-badge, .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.625rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 500;
          width: fit-content;
        }

        .role-badge svg, .status-badge svg {
          width: 0.875rem;
          height: 0.875rem;
        }

        .role-super {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .role-admin {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .role-user {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .status-active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .status-pending {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .status-frozen {
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        }

        /* Loading & Error States */
        .loading-state, .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1rem;
          color: var(--text-secondary);
          text-align: center;
        }

        .loading-spinner {
          width: 2.5rem;
          height: 2.5rem;
          border: 3px solid var(--border);
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .error-state svg {
          width: 3rem;
          height: 3rem;
          color: #ef4444;
        }

        .error-state button {
          padding: 0.5rem 1rem;
          background: #8b5cf6;
          border: none;
          border-radius: 0.5rem;
          color: white;
          cursor: pointer;
        }

        .empty-state {
          text-align: center;
          padding: 4rem;
          color: var(--text-secondary);
        }

        .empty-state svg {
          width: 3rem;
          height: 3rem;
          margin-bottom: 1rem;
          color: var(--text-tertiary);
        }

        /* Modal */
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

        .user-modal {
          background: var(--bg-primary);
          border-radius: 1rem;
          width: 100%;
          max-width: 450px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }

        .modal-header {
          padding: 1.5rem;
          display: flex;
          gap: 1rem;
          border-bottom: 1px solid var(--border);
          position: relative;
        }

        .modal-avatar {
          width: 3.5rem;
          height: 3.5rem;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .modal-info {
          flex: 1;
          min-width: 0;
        }

        .modal-info h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.5rem 0;
          word-break: break-word;
        }

        .modal-info p {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: var(--text-secondary);
          font-size: 0.813rem;
          margin: 0.25rem 0;
          word-break: break-word;
        }

        .modal-info svg {
          width: 0.875rem;
          height: 0.875rem;
          flex-shrink: 0;
        }

        .modal-username, .modal-position {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-tertiary);
          padding: 0.25rem;
        }

        .modal-close:hover {
          color: var(--text-primary);
        }

        .modal-close svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat {
          background: var(--bg-secondary);
          border-radius: 0.75rem;
          padding: 0.75rem;
          text-align: center;
        }

        .stat-label {
          display: block;
          font-size: 0.688rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .modal-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .action-btn.approve {
          background: #10b981;
          color: white;
        }

        .action-btn.approve:hover {
          background: #059669;
        }

        .action-btn.freeze {
          background: #6b7280;
          color: white;
        }

        .action-btn.freeze:hover {
          background: #4b5563;
        }

        .action-btn.restore {
          background: #3b82f6;
          color: white;
        }

        .action-btn.restore:hover {
          background: #2563eb;
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .user-management {
            padding: 1rem;
          }

          .header-title h1 {
            font-size: 1.25rem;
          }

          .header-title p {
            display: none;
          }

          .users-table th:nth-child(3),
          .users-table td:nth-child(3) {
            display: none;
          }

          .stat {
            font-size: 0.75rem;
          }

          .modal-header {
            flex-direction: column;
            text-align: center;
          }

          .modal-avatar {
            margin: 0 auto;
          }

          .modal-info p {
            justify-content: center;
          }
        }

        @media (max-width: 640px) {
          .users-table th:nth-child(4),
          .users-table td:nth-child(4) {
            display: none;
          }

          .btn-add span {
            display: none;
          }

          .btn-add {
            padding: 0.625rem;
          }

          .filter-btn span {
            display: none;
          }

          .filter-btn {
            padding: 0.625rem;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .modal-info h2 {
            font-size: 1rem;
          }

          .modal-info p {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .user-avatar {
            width: 2rem;
            height: 2rem;
            font-size: 0.75rem;
          }

          .user-name {
            font-size: 0.813rem;
          }

          .user-email {
            font-size: 0.688rem;
          }

          .view-btn span {
            display: none;
          }

          .view-btn {
            padding: 0.375rem;
          }
        }
      `}</style>
    </div>
  );
};

export default UserManagement;