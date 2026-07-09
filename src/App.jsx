import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import SplashScreen from './components/SplashScreen/SplashScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WelcomePage from './pages/WelcomePage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailConfirmation from './pages/EmailConfirmation';
import './index.css';

// Loading component
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
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      setIsChecking(false);
    }
  }, [loading]);

  // CRITICAL: If on reset-password, DON'T redirect
  if (location.pathname === '/reset-password') {
    return children;
  }

  // Allow access to welcome page without redirect
  if (location.pathname === '/welcome') {
    return children;
  }

  if (loading || isChecking) {
    return <AppLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route wrapper - only accessible when NOT logged in
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // CRITICAL: If on reset-password, DON'T redirect
  if (location.pathname === '/reset-password') {
    return children;
  }
  
  if (loading) {
    return <AppLoading />;
  }
  
  if (user) {
    return <Navigate to="/welcome" replace />;
  }
  
  return children;
};

// Fixed: Only redirect email confirmations, not recovery
function CheckHashForConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Only run on specific paths
    if (location.pathname !== '/' && location.pathname !== '/login') {
      return;
    }
    
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const type = params.get('type');
      
      console.log('🔍 Hash detected:', type);
      
      // Only redirect to email confirmation for signup/email confirmations
      if (type === 'signup' || type === 'email' || !type) {
        navigate('/email-confirmation', { replace: true });
      }
      // For recovery type, let the ResetPassword component handle it
      // DO NOT redirect
    }
  }, [navigate, location.pathname]);
  
  return null;
}

// Main App Component
function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  // Check if on reset-password page
  const isResetPasswordPage = location.pathname === '/reset-password';

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return <AppLoading />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <CheckHashForConfirmation />
      
      <Routes>
        {/* Public routes - only accessible when NOT logged in */}
        <Route path="/login" element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        } />
        <Route path="/register" element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicOnlyRoute>
            <ForgotPassword />
          </PublicOnlyRoute>
        } />
        
        {/* CRITICAL: Reset Password must be ABOVE all redirects and always accessible */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/email-confirmation" element={<EmailConfirmation />} />
        
        {/* Welcome Page - Protected but accessible after login */}
        <Route path="/welcome" element={
          <ProtectedRoute>
            <WelcomePage />
          </ProtectedRoute>
        } />
        
        {/* Protected routes - require authentication */}
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
        
        {/* Root route */}
        <Route path="/" element={
          <Navigate to={user ? "/welcome" : "/login"} replace />
        } />
        
        {/* Catch all */}
        <Route path="*" element={
          <Navigate to={user ? "/welcome" : "/login"} replace />
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