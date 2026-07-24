import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabase';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const handleConfirmation = async () => {
      // Try to get token from query params first (new format)
      let tokenHash = searchParams.get('token_hash');
      let type = searchParams.get('type');
      
      // If no token_hash in query params, try the hash (legacy format)
      if (!tokenHash && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        tokenHash = hashParams.get('token_hash');
        type = hashParams.get('type');
        
        // If still no token_hash, try access_token (older format)
        if (!tokenHash) {
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              
              if (error) {
                setStatus('error');
                return;
              }
              
              if (data.user?.email_confirmed_at) {
                setStatus('success');
                
                const timer = setInterval(() => {
                  setCountdown(prev => {
                    if (prev <= 1) {
                      clearInterval(timer);
                      navigate('/dashboard');
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1000);
                
                return () => clearInterval(timer);
              } else {
                setStatus('error');
              }
            } catch (error) {
              setStatus('error');
            }
            return;
          }
        }
      }
      
      // If we have token_hash and type is signup/confirmation
      if (tokenHash && (type === 'signup' || type === 'confirmation' || type === 'email')) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'signup',
          });
          
          if (error) {
            setStatus('error');
            return;
          }
          
          if (data.user?.email_confirmed_at) {
            setStatus('success');
            
            const timer = setInterval(() => {
              setCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(timer);
                  navigate('/dashboard');
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
            
            return () => clearInterval(timer);
          } else {
            setStatus('error');
          }
        } catch (error) {
          setStatus('error');
        }
        return;
      }
      
      // If we get here, no valid token was found
      setStatus('error');
    };

    handleConfirmation();
  }, [searchParams, navigate]);

  // SUCCESS STATE
  if (status === 'success') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '450px',
          width: '100%',
          background: 'white',
          borderRadius: '2rem',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#22c55e',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <svg style={{ width: '50px', height: '50px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1a202c' }}>
            Email Verified! 🎉
          </h1>
          
          <p style={{ color: '#4a5568', marginBottom: '1rem', fontSize: '1.1rem' }}>
            Your email has been successfully verified.
          </p>
          
          <div style={{
            background: '#f0fdf4',
            padding: '1rem',
            borderRadius: '1rem',
            marginTop: '1.5rem'
          }}>
            <p style={{ color: '#22c55e', fontWeight: '500' }}>
              Redirecting to dashboard in {countdown} seconds...
            </p>
          </div>
          
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Go to Dashboard Now
          </button>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (status === 'error') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '450px',
          width: '100%',
          background: 'white',
          borderRadius: '2rem',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#ef4444',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <svg style={{ width: '50px', height: '50px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1a202c' }}>
            Verification Failed
          </h1>
          
          <p style={{ color: '#4a5568', marginBottom: '1rem' }}>
            The verification link is invalid or has expired.
          </p>
          
          <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Please try signing up again or contact support if the problem persists.
          </p>
          
          <button
            onClick={() => navigate('/login')}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // VERIFYING STATE
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '450px',
        width: '100%',
        background: 'white',
        borderRadius: '2rem',
        padding: '3rem 2rem',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 1.5rem',
          border: '4px solid #e2e8f0',
          borderTopColor: '#667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1a202c' }}>
          Verifying your email...
        </h1>
        
        <p style={{ color: '#4a5568' }}>
          Please wait while we confirm your email address.
        </p>
      </div>
      
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default EmailConfirmation;