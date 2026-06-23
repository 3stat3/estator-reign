import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import EmailConfirmation from './pages/EmailConfirmation';
import './index.css';

// Protected Route wrapper with better loading handling
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Once auth is done loading, stop checking
    if (!loading) {
      setIsChecking(false);
    }
  }, [loading]);

  // Show loading spinner while checking authentication
  if (loading || isChecking) {
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
        <p style={{ color: '#64748b', fontSize: '1rem' }}>Loading your session...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    console.log('🔴 No user in ProtectedRoute, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('🔴 User role not allowed:', user.role);
    return <Navigate to="/dashboard" replace />;
  }

  console.log('🟢 User authenticated, rendering dashboard');
  return children;
};

// Component to check for email confirmation in URL hash
function CheckHashForConfirmation() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      // If there's an access token in the hash, go to email confirmation
      navigate('/email-confirmation', { replace: true });
    }
  }, [navigate]);
  
  return null;
}

// Loading component for App-level loading
const AppLoading = () => (
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
    <p style={{ color: '#64748b', fontSize: '1rem' }}>Loading application...</p>
  </div>
);

// Main App Component
function AppContent() {
  const { user, loading, darkMode, toggleDarkMode } = useAuth();

  // Show loading at app level
  if (loading) {
    return <AppLoading />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <CheckHashForConfirmation />
      
      {/* Dark mode toggle button - fixed position */}
      <button
        onClick={toggleDarkMode}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      <Routes>
        <Route path="/login" element={
          !user ? <Login /> : <Navigate to="/dashboard" replace />
        } />
        <Route path="/register" element={
          !user ? <Register /> : <Navigate to="/dashboard" replace />
        } />
        <Route path="/forgot-password" element={
          !user ? <ForgotPassword /> : <Navigate to="/dashboard" replace />
        } />
        <Route path="/email-confirmation" element={<EmailConfirmation />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <Navigate to={user ? "/dashboard" : "/login"} replace />
        } />
        {/* Catch all route - redirect to dashboard or login */}
        <Route path="*" element={
          <Navigate to={user ? "/dashboard" : "/login"} replace />
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;