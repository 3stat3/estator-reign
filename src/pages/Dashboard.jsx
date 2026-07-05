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

    // Check if user data is complete - try to recover from localStorage
    if (!user.id || !user.email) {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.id && parsedUser.email) {
                    // User will be refreshed by AuthContext
                }
            }
        } catch (e) {
            // Error recovering user data
        }
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