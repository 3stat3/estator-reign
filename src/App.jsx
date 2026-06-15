import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import EmailConfirmation from './pages/EmailConfirmation';
import './index.css';

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

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

// Main App Component
function AppContent() {
  const { user, darkMode, toggleDarkMode } = useAuth();

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
          justifyContent: 'center'
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
        <Route path="/" element={
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