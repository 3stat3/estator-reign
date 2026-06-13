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
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await fetchUser(session.user.id);
            }
            setLoading(false);
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

        return () => subscription.unsubscribe();
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

            if (error) throw error;

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
        } catch (error) {
            console.error('Error fetching user:', error);
            setUser(null);
        }
    };

    const register = async (email, password, username, fullName, position) => {
        setError(null);
        try {
            // Register with Supabase Auth
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username,
                        full_name: fullName,
                        position: position
                    }
                }
            });

            if (signUpError) throw signUpError;

            if (authData.user) {
                // Insert into profiles table
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
                
                return { success: true, user: authData.user };
            }
            return { error: 'Registration failed' };
        } catch (error) {
            console.error('Registration error:', error);
            return { error: error.message };
        }
    };

    const login = async (email, password, deviceInfo) => {
        setError(null);
        try {
            // Sign in with Supabase
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (signInError) throw signInError;

            if (data.user) {
                // Get user profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) throw profileError;

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
                
                return { user: userData };
            }
            
            return { user: null };
        } catch (error) {
            console.error('Login error:', error);
            setError(error.message);
            return { error: error.message };
        }
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
        }
        setUser(null);
        localStorage.removeItem('user');
    };

    const toggleDarkMode = () => setDarkMode(prev => !prev);

    // Additional functions for Login.jsx
    const sendMagicLink = async (email) => {
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: window.location.origin + '/dashboard'
            }
        });
        if (error) throw error;
        return { success: true };
    };

    const loginWithBiometrics = async () => {
        // Biometric login not directly supported by Supabase
        return { success: false, error: 'Biometric login not configured' };
    };

    const loginWith2FA = async (code) => {
        // 2FA would need to be implemented with a custom solution
        return { success: false, error: '2FA not configured' };
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
        loginWith2FA
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};