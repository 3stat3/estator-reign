import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DemoDashboard from './DemoDashboard';
import UserDashboard from './UserDashboard';
import RegularAdminDashboard from './RegularAdminDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';

const Dashboard = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    // Redirect to login if no user after loading
    useEffect(() => {
        if (!loading && !user) {
            console.log('🔴 No user in Dashboard, redirecting to login');
            navigate('/login', { replace: true });
        }
    }, [loading, user, navigate]);

    // Show loading state
    if (loading) {
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
            </div>
        );
    }

    // If no user, redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    console.log('🟢 Dashboard rendering for user:', user.email, 'Role:', user.role);

    // Check if user data is complete
    if (!user.id || !user.email) {
        console.error('⚠️ Incomplete user data:', user);
        // Try to recover from localStorage
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.id && parsedUser.email) {
                    console.log('🔄 Recovered user from localStorage');
                    // User will be refreshed by AuthContext
                }
            }
        } catch (e) {
            console.error('Error recovering user data:', e);
        }
        // Still render the dashboard, the ProtectedRoute will handle it
    }

    // Check approval status - if not approved, show Demo Dashboard
    if (user.approval_status !== 'approved') {
        console.log('👤 User not approved, showing DemoDashboard');
        return <DemoDashboard />;
    }

    // Route to appropriate dashboard based on role
    console.log('🎯 Routing to dashboard for role:', user.role);
    
    switch (user.role) {
        case 'super_admin':
            return <SuperAdminDashboard />;
        case 'regular_admin':
            return <RegularAdminDashboard />;
        case 'regular_user':
            return <UserDashboard />;
        default:
            console.warn('⚠️ Unknown role, defaulting to UserDashboard:', user.role);
            return <UserDashboard />;
    }
};

export default Dashboard;