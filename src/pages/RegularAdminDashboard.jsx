import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';

const RegularAdminDashboard = () => {
    const { user, darkMode } = useAuth();
    const [activeTab, setActiveTab] = useState('calculator');

    const renderContent = () => {
        switch (activeTab) {
            case 'calculator':
                return (
                    <div style={{
                        background: darkMode ? '#1a1e24' : '#ffffff',
                        borderRadius: '16px',
                        border: `1px solid ${darkMode ? '#2d3748' : '#e8ecf0'}`,
                        padding: '2rem',
                    }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Estate Tax Calculator
                        </h2>
                        <p style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>
                            Calculate estate taxes based on current tax brackets
                        </p>
                        <div style={{
                            background: darkMode ? '#13161c' : '#f9fafb',
                            borderRadius: '12px',
                            padding: '2rem',
                            textAlign: 'center',
                            border: `1px dashed ${darkMode ? '#374151' : '#e5e7eb'}`,
                        }}>
                            <p>Calculator form will appear here</p>
                        </div>
                    </div>
                );
            case 'familytree':
                return (
                    <div style={{
                        background: darkMode ? '#1a1e24' : '#ffffff',
                        borderRadius: '16px',
                        border: `1px solid ${darkMode ? '#2d3748' : '#e8ecf0'}`,
                        padding: '2rem',
                    }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Family Tree Builder
                        </h2>
                        <p style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>
                            Visualize and document family lineage
                        </p>
                        <div style={{
                            background: darkMode ? '#13161c' : '#f9fafb',
                            borderRadius: '12px',
                            padding: '4rem',
                            textAlign: 'center',
                            border: `1px dashed ${darkMode ? '#374151' : '#e5e7eb'}`,
                        }}>
                            <span style={{ fontSize: '3rem', opacity: 0.5 }}>🌳</span>
                            <p style={{ marginTop: '1rem', color: darkMode ? '#6b7280' : '#9ca3af' }}>Coming Soon</p>
                        </div>
                    </div>
                );
            case 'collaborate':
                return (
                    <div style={{
                        background: darkMode ? '#1a1e24' : '#ffffff',
                        borderRadius: '16px',
                        border: `1px solid ${darkMode ? '#2d3748' : '#e8ecf0'}`,
                        padding: '2rem',
                    }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Revenue Officer Collaboration
                        </h2>
                        <p style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>
                            Secure workspace for case collaboration
                        </p>
                        <div style={{
                            background: darkMode ? '#13161c' : '#f9fafb',
                            borderRadius: '12px',
                            padding: '4rem',
                            textAlign: 'center',
                            border: `1px dashed ${darkMode ? '#374151' : '#e5e7eb'}`,
                        }}>
                            <span style={{ fontSize: '3rem', opacity: 0.5 }}>🤝</span>
                            <p style={{ marginTop: '1rem', color: darkMode ? '#6b7280' : '#9ca3af' }}>Coming Soon</p>
                        </div>
                    </div>
                );
            case 'usermanagement':
                return (
                    <div style={{
                        background: darkMode ? '#1a1e24' : '#ffffff',
                        borderRadius: '16px',
                        border: `1px solid ${darkMode ? '#2d3748' : '#e8ecf0'}`,
                        padding: '2rem',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                    User Directory
                                </h2>
                                <p style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>
                                    Manage user accounts and pending approvals
                                </p>
                            </div>
                            <div style={{
                                background: '#fef3c7',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: '#92400e',
                            }}>
                                ⚡ Actions require Super Admin final approval
                            </div>
                        </div>
                        <div style={{
                            background: darkMode ? '#13161c' : '#f9fafb',
                            borderRadius: '12px',
                            padding: '3rem',
                            textAlign: 'center',
                            border: `1px dashed ${darkMode ? '#374151' : '#e5e7eb'}`,
                        }}>
                            <span style={{ fontSize: '3rem', opacity: 0.5 }}>👥</span>
                            <p style={{ marginTop: '1rem', color: darkMode ? '#6b7280' : '#9ca3af' }}>
                                User list and approval system coming soon
                            </p>
                            <p style={{ fontSize: '12px', marginTop: '0.5rem', color: darkMode ? '#6b7280' : '#9ca3af' }}>
                                Regular Admin can give initial approval → Super Admin gives final approval
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Extended nav items for Regular Admin (includes User Management)
    const navItemsWithManagement = ['calculator', 'familytree', 'collaborate', 'usermanagement'];
    const extendedNav = { ...Navigation, navItems: navItemsWithManagement };

    return (
        <div style={{
            minHeight: '100vh',
            background: darkMode ? '#0a0e12' : '#f3f4f6',
        }}>
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default RegularAdminDashboard;