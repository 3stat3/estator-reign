import React from 'react';
import { useAuth } from '../context/AuthContext';
import DemoDashboard from './DemoDashboard';
import UserDashboard from './UserDashboard';
import RegularAdminDashboard from './RegularAdminDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';

const Dashboard = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                Loading...
            </div>
        );
    }

    // Check approval status - if not approved, show Demo Dashboard
    if (user?.approval_status !== 'approved') {
        return <DemoDashboard />;
    }

    // Route to appropriate dashboard based on role
    switch (user?.role) {
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