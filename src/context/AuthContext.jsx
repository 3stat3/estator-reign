import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../../supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        // Check for existing session
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session) {
                    // Try to get user from localStorage first for faster load
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        try {
                            const parsedUser = JSON.parse(storedUser);
                            // Verify the stored user ID matches the session
                            if (parsedUser.id === session.user.id) {
                                setUser(parsedUser);
                                setLoading(false);
                                // Still fetch fresh data in background
                                await fetchUser(session.user.id);
                                return;
                            }
                        } catch (e) {
                            localStorage.removeItem('user');
                        }
                    }
                    
                    // If no stored user or mismatch, fetch fresh
                    await fetchUser(session.user.id);
                }
            } catch (error) {
                // If there's an error, clear any stale data
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        
        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                await fetchUser(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem('user');
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const fetchUser = async (userId) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                throw error;
            }

            if (!profile) {
                throw new Error('Profile not found');
            }

            const userData = {
                id: profile.id,
                email: profile.email,
                username: profile.username,
                full_name: profile.full_name,
                role: profile.role,
                approval_status: profile.approval_status,
                position: profile.position
            };
            
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            
            return userData;
        } catch (error) {
            setUser(null);
            localStorage.removeItem('user');
            throw error;
        }
    };

    const register = async (email, password, username, fullName, position) => {
        setError(null);
        try {
            // Get the current origin dynamically
            const redirectUrl = window.location.origin + '/email-confirmation';
            
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username,
                        full_name: fullName,
                        position: position
                    },
                    emailRedirectTo: redirectUrl
                }
            });

            if (signUpError) throw signUpError;

            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: authData.user.id,
                        username: username,
                        full_name: fullName,
                        email: email,
                        position: position,
                        role: 'regular_user',
                        approval_status: 'pending_initial'
                    }]);

                if (profileError) throw profileError;
                
                sessionStorage.setItem('pendingVerificationEmail', email);
                
                return { success: true, user: authData.user };
            }
            return { error: 'Registration failed' };
        } catch (error) {
            return { error: error.message };
        }
    };

    const login = async (email, password, deviceInfo) => {
        setError(null);
        setLoading(true);
        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (signInError) throw signInError;

            if (data.user) {
                const userData = await fetchUser(data.user.id);
                return { user: userData };
            }
            
            return { user: null };
        } catch (error) {
            setError(error.message);
            return { error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Logout error:', error);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('user');
        }
    };

    const toggleDarkMode = () => setDarkMode(prev => !prev);

    const sendMagicLink = async (email) => {
        const redirectUrl = window.location.origin + '/dashboard';
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: redirectUrl
            }
        });
        if (error) throw error;
        return { success: true };
    };

    const loginWithBiometrics = async () => {
        return { success: false, error: 'Biometric login not configured' };
    };

    const loginWith2FA = async (code) => {
        return { success: false, error: '2FA not configured' };
    };

    const forgotPassword = async (email) => {
        setError(null);
        try {
            const redirectUrl = window.location.origin + '/reset-password';
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    const resendResetLink = async (email) => {
        setError(null);
        try {
            const redirectUrl = window.location.origin + '/reset-password';
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        error,
        register,
        login,
        logout,
        darkMode,
        toggleDarkMode,
        sendMagicLink,
        loginWithBiometrics,
        loginWith2FA,
        forgotPassword,
        resendResetLink,
        refreshUser: () => user ? fetchUser(user.id) : null
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};