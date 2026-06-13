// components/Admin/UserApprovalModal.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon, 
  UserIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const UserApprovalModal = ({ user, onApprove, onReject, onClose, currentAdminRole }) => {
  const [approvalNote, setApprovalNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Add validation at the start
  if (!user) {
    console.error('UserApprovalModal: user prop is required');
    return null;
  }

  const handleApprove = async () => {
    if (!user.id) {
      console.error('User ID is required for approval');
      return;
    }
    setIsProcessing(true);
    try {
      await onApprove(user.id, approvalNote);
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user.id) {
      console.error('User ID is required for rejection');
      return;
    }
    setIsProcessing(true);
    try {
      await onReject(user.id, approvalNote);
    } catch (error) {
      console.error('Rejection failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isSuperAdmin = currentAdminRole === 'super_admin';
  
  // Get approval status from user object
  const approvalStatus = user.approvalStatus || 'pending_initial';
  const hasInitialApproval = !!user.initialApprovedBy;
  const hasFinalApproval = !!user.finalApprovedBy;
  
  let approvalMessage = '';
  let warningMessage = '';
  let canApprove = false;
  let approveButtonText = 'Approve';
  
  if (isSuperAdmin) {
    if (approvalStatus === 'approved_initial') {
      canApprove = true;
      approveButtonText = 'Final Approval';
      approvalMessage = 'As Super Admin, you provide final approval for this user.';
      warningMessage = 'This user has already received initial approval from a Regular Admin. Your final approval will activate their account.';
    } else if (approvalStatus === 'pending_initial') {
      canApprove = true;
      approveButtonText = 'Approve (Skip Initial)';
      approvalMessage = 'As Super Admin, you can approve this user directly without initial approval.';
      warningMessage = '⚠️ You are bypassing the regular admin approval step. This will immediately activate the user.';
    } else if (approvalStatus === 'approved_final') {
      canApprove = false;
      approvalMessage = 'This user is already fully approved.';
    } else if (approvalStatus === 'rejected') {
      canApprove = false;
      approvalMessage = 'This user has been rejected.';
    }
  } else {
    // Regular Admin
    if (approvalStatus === 'pending_initial') {
      canApprove = true;
      approveButtonText = 'Initial Approval';
      approvalMessage = 'Your initial approval will mark this user as "Pending Super Admin Approval".';
      warningMessage = 'After your approval, a Super Admin must provide final approval to activate this user.';
    } else if (approvalStatus === 'approved_initial') {
      canApprove = false;
      approvalMessage = 'This user already has initial approval and is waiting for Super Admin final approval.';
    } else if (approvalStatus === 'approved_final') {
      canApprove = false;
      approvalMessage = 'This user is already fully approved.';
    } else if (approvalStatus === 'rejected') {
      canApprove = false;
      approvalMessage = 'This user has been rejected.';
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="approval-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className={`modal-header-icon ${isSuperAdmin ? 'super-admin' : 'regular-admin'}`}>
            {isSuperAdmin ? <ShieldCheckIcon /> : <UserIcon />}
          </div>
          <h2>{isSuperAdmin ? 'Super Admin Approval' : 'Regular Admin Approval'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="user-info">
            <div className="user-avatar-large">
              {user.name?.[0] || user.email?.[0] || '?'}
            </div>
            <div>
              <h3>{user.name || 'Unnamed User'}</h3>
              <p>{user.email || 'No email provided'}</p>
              <span className={`role-badge ${user.role || 'pending'}`}>
                Role: {user.role || 'Pending'}
              </span>
            </div>
          </div>

          <div className="approval-flow-visual">
            <div className={`flow-step ${hasInitialApproval ? 'completed' : (approvalStatus === 'pending_initial' ? 'active' : 'pending')}`}>
              <div className="step-icon">
                {hasInitialApproval ? <CheckCircleIcon /> : <UserIcon />}
              </div>
              <div className="step-label">Regular Admin</div>
              {hasInitialApproval && user.initialApproverName && (
                <div className="step-details">
                  {user.initialApproverName}
                </div>
              )}
              {approvalStatus === 'pending_initial' && !hasInitialApproval && (
                <div className="step-details pending">
                  Awaiting approval
                </div>
              )}
            </div>
            
            <div className="flow-arrow">→</div>
            
            <div className={`flow-step ${hasFinalApproval ? 'completed' : (approvalStatus === 'approved_initial' ? 'active' : 'pending')}`}>
              <div className="step-icon">
                {hasFinalApproval ? <CheckCircleIcon /> : <ShieldCheckIcon />}
              </div>
              <div className="step-label">Super Admin</div>
              {hasFinalApproval && user.finalApproverName && (
                <div className="step-details">
                  {user.finalApproverName}
                </div>
              )}
              {approvalStatus === 'approved_initial' && !hasFinalApproval && (
                <div className="step-details pending">
                  Awaiting final approval
                </div>
              )}
            </div>
          </div>

          {/* Warning Messages */}
          {warningMessage && (
            <div className={`warning-banner ${isSuperAdmin ? 'super-warning' : 'regular-warning'}`}>
              <BellIcon className="warning-icon" />
              <div>
                <strong>Important:</strong>
                <p>{warningMessage}</p>
              </div>
            </div>
          )}

          <div className="approval-message">
            <div className={`message-banner ${isSuperAdmin ? 'super-admin' : 'regular-admin'}`}>
              <p>{approvalMessage}</p>
            </div>
          </div>

          {canApprove && (
            <>
              <div className="form-group">
                <label>Approval Notes (Optional)</label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Add any comments or notes about this approval..."
                  rows="3"
                />
              </div>
            </>
          )}

          {!canApprove && approvalStatus !== 'approved_final' && approvalStatus !== 'rejected' && (
            <div className="error-banner">
              <ExclamationTriangleIcon />
              <p>You cannot approve this user at this stage.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          
          {canApprove && (
            <>
              <button 
                className={`btn-approve ${isSuperAdmin ? 'btn-super-approve' : ''}`} 
                onClick={handleApprove}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : approveButtonText}
              </button>
              
              <button 
                className="btn-reject" 
                onClick={handleReject}
                disabled={isProcessing}
              >
                Reject
              </button>
            </>
          )}
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .approval-modal {
            background: var(--card-bg);
            border-radius: 1rem;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: var(--shadow-lg);
          }

          .modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            gap: 1rem;
            position: relative;
          }

          .modal-header-icon {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .modal-header-icon.super-admin {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          }

          .modal-header-icon.regular-admin {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
          }

          .modal-header-icon svg {
            width: 1.25rem;
            height: 1.25rem;
          }

          .modal-header h2 {
            flex: 1;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--text-secondary);
          }

          .modal-body {
            padding: 1.5rem;
          }

          .user-info {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background: var(--hover-bg);
            border-radius: 0.75rem;
            margin-bottom: 1.5rem;
          }

          .user-avatar-large {
            width: 3.5rem;
            height: 3.5rem;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.25rem;
            font-weight: 600;
          }

          .role-badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            margin-top: 0.5rem;
          }

          .approval-flow-visual {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem;
            background: var(--hover-bg);
            border-radius: 0.75rem;
            margin-bottom: 1.5rem;
          }

          .flow-step {
            flex: 1;
            text-align: center;
          }

          .flow-step.active .step-icon {
            background: #f59e0b;
            animation: pulse 2s infinite;
          }

          .flow-step.completed .step-icon {
            background: #10b981;
          }

          .flow-step.pending .step-icon {
            background: var(--border-color);
          }

          .step-icon {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 50%;
            background: var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 0.5rem;
            color: white;
          }

          .step-icon svg {
            width: 1.25rem;
            height: 1.25rem;
          }

          .step-label {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-primary);
          }

          .step-details {
            font-size: 0.7rem;
            color: var(--text-secondary);
            margin-top: 0.25rem;
          }

          .step-details.pending {
            color: #f59e0b;
          }

          .flow-arrow {
            font-size: 1.5rem;
            color: var(--text-tertiary);
            margin: 0 0.5rem;
          }

          .warning-banner {
            display: flex;
            gap: 0.75rem;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
          }

          .warning-banner.super-warning {
            background: rgba(139, 92, 246, 0.1);
            border-left: 3px solid #8b5cf6;
          }

          .warning-banner.regular-warning {
            background: rgba(245, 158, 11, 0.1);
            border-left: 3px solid #f59e0b;
          }

          .warning-icon {
            width: 1.25rem;
            height: 1.25rem;
            flex-shrink: 0;
          }

          .warning-banner strong {
            display: block;
            margin-bottom: 0.25rem;
          }

          .warning-banner p {
            font-size: 0.875rem;
          }

          .message-banner {
            padding: 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            margin-bottom: 1rem;
          }

          .message-banner.super-admin {
            background: rgba(139, 92, 246, 0.1);
            border-left: 3px solid #8b5cf6;
            color: #8b5cf6;
          }

          .message-banner.regular-admin {
            background: rgba(59, 130, 246, 0.1);
            border-left: 3px solid #3b82f6;
            color: #3b82f6;
          }

          .error-banner {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 0.5rem;
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 1rem;
          }

          .error-banner svg {
            width: 1.25rem;
            height: 1.25rem;
          }

          .form-group {
            margin-top: 1rem;
          }

          .form-group label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
          }

          .form-group textarea {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: 0.5rem;
            background: var(--bg-secondary);
            color: var(--text-primary);
            font-size: 0.875rem;
            resize: vertical;
          }

          .modal-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
          }

          .btn-secondary, .btn-approve, .btn-reject {
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-secondary {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
          }

          .btn-approve {
            background: #3b82f6;
            border: none;
            color: white;
          }

          .btn-approve.btn-super-approve {
            background: #8b5cf6;
          }

          .btn-reject {
            background: #ef4444;
            border: none;
            color: white;
          }

          button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </motion.div>
    </div>
  );
};

export default UserApprovalModal;