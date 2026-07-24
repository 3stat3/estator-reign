import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import SplashScreen from './components/SplashScreen/SplashScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailConfirmation from './pages/EmailConfirmation';
import './index.css';

// Loading component - ONLY for initial app loading
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

// Helper function to get role-based dashboard path
const getDashboardPath = (user) => {
  const userRole = user?.role || user?.user_metadata?.role || 'client';
  
  switch (userRole) {
    case 'admin':
      return '/admin/dashboard';
    case 'manager':
      return '/manager/dashboard';
    case 'advisor':
      return '/advisor/dashboard';
    case 'client':
    default:
      return '/dashboard';
  }
};

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

  if (loading || isChecking) {
    return <AppLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user)} replace />;
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
  
  // ONLY redirect if we're done loading AND user exists
  if (!loading && user) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }
  
  // ALWAYS render the children (login/register page) regardless of loading state
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Only show splash screen on initial app load
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Check if we're on auth pages - if so, don't show loading
  const isAuthPage = location.pathname === '/login' || 
                     location.pathname === '/register' || 
                     location.pathname === '/forgot-password';
  
  // Only show AppLoading if loading AND not on an auth page
  if (loading && !isAuthPage) {
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
        
        {/* Admin routes - if you have them */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Manager routes - if you have them */}
        <Route path="/manager/*" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Advisor routes - if you have them */}
        <Route path="/advisor/*" element={
          <ProtectedRoute allowedRoles={['advisor']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Root route - redirect to role-based dashboard */}
        <Route path="/" element={
          <Navigate to={user ? getDashboardPath(user) : "/login"} replace />
        } />
        
        {/* Catch all */}
        <Route path="*" element={
          <Navigate to={user ? getDashboardPath(user) : "/login"} replace />
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