import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Navigation = ({ activeTab, setActiveTab }) => {
    const { user, logout, darkMode, toggleDarkMode } = useAuth();
    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Role-based navigation items
    const getNavItems = () => {
        const role = user?.role;
        
        // Base items for all users
        const baseItems = [
            { id: 'calculator', label: 'Tax Calculator', icon: '💰' },
            { id: 'familytree', label: 'Genealogy', icon: '🏛️' },
            { id: 'collaborate', label: 'Collaboration', icon: '🤝' },
        ];
        
        // Regular Admin adds User Directory
        if (role === 'regular_admin') {
            return [...baseItems, { id: 'usermanagement', label: 'User Directory', icon: '👥' }];
        }
        
        // Super Admin adds all
        if (role === 'super_admin') {
            return [
                ...baseItems,
                { id: 'usermanagement', label: 'User Directory', icon: '👥' },
                { id: 'calculations', label: 'Calculations', icon: '📋' },
                { id: 'audit', label: 'Audit Trail', icon: '🔍' },
            ];
        }
        
        // Regular User gets only base items
        return baseItems;
    };

    const navItems = getNavItems();

    const handleNavClick = (id) => {
        setActiveTab(id);
        setIsSidebarOpen(false);
        setShowProfileMenu(false);
    };

    // Desktop Top Bar - Professional
    if (!isMobile) {
        return (
            <>
                <nav style={{
                    background: darkMode ? '#0a0e12' : '#ffffff',
                    borderBottom: `1px solid ${darkMode ? '#1e2530' : '#e8ecf0'}`,
                    padding: '0 2rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        maxWidth: '1400px',
                        margin: '0 auto',
                        height: '64px',
                    }}>
                        {/* Logo Section */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                background: 'linear-gradient(135deg, #1a365d 0%, #2563eb 100%)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <span style={{ fontSize: '18px' }}>⚖️</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: 600, fontSize: '16px', color: darkMode ? '#ffffff' : '#111827' }}>
                                    Estate Tax System
                                </span>
                                <span style={{
                                    fontSize: '11px',
                                    color: darkMode ? '#6b7280' : '#9ca3af',
                                    display: 'block',
                                    marginTop: '-2px'
                                }}>
                                    Enterprise Suite
                                </span>
                            </div>
                        </div>

                        {/* Navigation - Minimal & Professional */}
                        <div style={{ display: 'flex', gap: '0.25rem', height: '100%' }}>
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item.id)}
                                    style={{
                                        height: '100%',
                                        padding: '0 1.25rem',
                                        background: 'transparent',
                                        color: activeTab === item.id ? '#2563eb' : (darkMode ? '#9ca3af' : '#4b5563'),
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: activeTab === item.id ? 600 : 400,
                                        borderBottom: activeTab === item.id ? '2px solid #2563eb' : '2px solid transparent',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Right Section */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={toggleDarkMode}
                                style={{
                                    background: darkMode ? '#1e2530' : '#f3f4f6',
                                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                                    borderRadius: '8px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {darkMode ? '☀️' : '🌙'}
                            </button>
                            
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '6px 8px',
                                        borderRadius: '8px',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#1e2530' : '#f3f4f6'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        background: 'linear-gradient(135deg, #2563eb 0%, #1a365d 100%)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                    }}>
                                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span style={{ fontSize: '14px', color: darkMode ? '#e5e7eb' : '#374151' }}>
                                        {user?.username}
                                    </span>
                                    <span style={{ fontSize: '12px', color: darkMode ? '#6b7280' : '#9ca3af' }}>▼</span>
                                </button>

                                {showProfileMenu && (
                                    <div style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: '100%',
                                        marginTop: '8px',
                                        minWidth: '220px',
                                        background: darkMode ? '#1a1e24' : '#ffffff',
                                        border: `1px solid ${darkMode ? '#2d3748' : '#e5e7eb'}`,
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                        overflow: 'hidden',
                                        zIndex: 101,
                                    }}>
                                        <div style={{
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${darkMode ? '#2d3748' : '#f0f0f0'}`,
                                        }}>
                                            <div style={{ fontSize: '13px', fontWeight: 500, color: darkMode ? '#e5e7eb' : '#111827' }}>
                                                {user?.username}
                                            </div>
                                            <div style={{ fontSize: '11px', color: darkMode ? '#6b7280' : '#9ca3af', marginTop: '2px' }}>
                                                {user?.role === 'super_admin' ? 'Super Administrator' : user?.role}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { logout(); setShowProfileMenu(false); }}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#dc2626',
                                                fontSize: '13px',
                                                transition: 'background 0.2s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#2d3748' : '#f9fafb'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>
            </>
        );
    }

    // Mobile Sidebar (Professional)
    return (
        <>
            {/* Mobile Top Bar */}
            <nav style={{
                background: darkMode ? '#0a0e12' : '#ffffff',
                borderBottom: `1px solid ${darkMode ? '#1e2530' : '#e8ecf0'}`,
                padding: '0 1rem',
                height: '56px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: darkMode ? '#9ca3af' : '#4b5563',
                        fontSize: '20px',
                    }}
                >
                    ☰
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        background: 'linear-gradient(135deg, #1a365d 0%, #2563eb 100%)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <span style={{ fontSize: '14px' }}>⚖️</span>
                    </div>
                    <span style={{ fontWeight: 500, fontSize: '14px' }}>Estate Tax</span>
                </div>
                <button
                    onClick={toggleDarkMode}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                    }}
                >
                    {darkMode ? '☀️' : '🌙'}
                </button>
            </nav>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 200,
                    }}
                />
            )}

            {/* Sidebar */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: '280px',
                background: darkMode ? '#0a0e12' : '#ffffff',
                transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 201,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
            }}>
                <div style={{
                    padding: '20px',
                    borderBottom: `1px solid ${darkMode ? '#1e2530' : '#e8ecf0'}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #1a365d 0%, #2563eb 100%)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <span style={{ fontSize: '20px' }}>⚖️</span>
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '16px' }}>Estate Tax</div>
                            <div style={{ fontSize: '11px', color: darkMode ? '#6b7280' : '#9ca3af' }}>Enterprise</div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'none',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            color: darkMode ? '#9ca3af' : '#6b7280',
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div style={{ flex: 1, padding: '16px 0' }}>
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            style={{
                                width: '100%',
                                padding: '12px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: activeTab === item.id ? (darkMode ? '#1e2530' : '#f3f4f6') : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: activeTab === item.id ? '#2563eb' : (darkMode ? '#d1d5db' : '#4b5563'),
                                fontWeight: activeTab === item.id ? 500 : 400,
                                fontSize: '14px',
                                textAlign: 'left',
                                borderLeft: activeTab === item.id ? '3px solid #2563eb' : '3px solid transparent',
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>

                <div style={{
                    padding: '16px',
                    borderTop: `1px solid ${darkMode ? '#1e2530' : '#e8ecf0'}`,
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 4px',
                        marginBottom: '12px',
                    }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            background: 'linear-gradient(135deg, #2563eb 0%, #1a365d 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 500,
                        }}>
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 500 }}>{user?.username}</div>
                            <div style={{ fontSize: '10px', color: darkMode ? '#6b7280' : '#9ca3af' }}>{user?.role}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); setIsSidebarOpen(false); }}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: darkMode ? '#1e2530' : '#f9fafb',
                            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#dc2626',
                            textAlign: 'center',
                        }}
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </>
    );
};

export default Navigation;