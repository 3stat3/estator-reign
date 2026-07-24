import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DemoDashboard from './DemoDashboard';
import UserDashboard from './UserDashboard';
import RegularAdminDashboard from './RegularAdminDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';

const Dashboard = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [isReady, setIsReady] = useState(false);
    const hasValidated = useRef(false);

    useEffect(() => {
        // Only run validation once
        if (hasValidated.current) return;
        
        if (!loading) {
            if (!user) {
                navigate('/login', { replace: true });
                return;
            }

            // REMOVED: The welcome page check since we deleted it
            // Users now go directly to dashboard after splash screen
            
            // Validated successfully
            hasValidated.current = true;
            setIsReady(true);
        }
    }, [loading, user, navigate]);

    if (loading || !isReady) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    border: '4px solid #e2e8f0',
                    borderTop: '4px solid #667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: '#64748b', fontSize: '1rem' }}>Loading dashboard...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check approval status - if not approved, show Demo Dashboard
    if (user.approval_status !== 'approved') {
        return <DemoDashboard />;
    }

    // Route to appropriate dashboard based on role
    switch (user.role) {
        case 'super_admin':
            return <SuperAdminDashboard />;
        case 'regular_admin':
            return <RegularAdminDashboard />;
        case 'regular_user':
            return <UserDashboard />;
        default:
            return <UserDashboard />;
    }
};

export default Dashboard;