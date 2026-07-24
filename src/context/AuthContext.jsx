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

    // ============ UPDATED fetchUser FUNCTION ============
    const fetchUser = async (userId) => {
        try {
            // Use maybeSingle() instead of single() to avoid 406 errors
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            // If no profile exists, create one
            if (!profile && error?.code === 'PGRST116') {
                // Get the user from auth
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                
                if (userError) {
                    throw userError;
                }

                if (user) {
                    // Create the profile
                    const { data: newProfile, error: insertError } = await supabase
                        .from('profiles')
                        .insert([{
                            id: user.id,
                            email: user.email,
                            username: user.user_metadata?.username || user.email.split('@')[0],
                            full_name: user.user_metadata?.full_name || 'User',
                            position: user.user_metadata?.position || 'Not Specified',
                            role: 'regular_user',
                            approval_status: 'pending_initial',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }])
                        .select()
                        .maybeSingle();

                    if (insertError) {
                        throw insertError;
                    }

                    if (newProfile) {
                        const userData = {
                            id: newProfile.id,
                            email: newProfile.email,
                            username: newProfile.username,
                            full_name: newProfile.full_name,
                            role: newProfile.role,
                            approval_status: newProfile.approval_status,
                            position: newProfile.position
                        };
                        setUser(userData);
                        localStorage.setItem('user', JSON.stringify(userData));
                        return userData;
                    }
                }
            }

            // If there's a real error (not "no rows"), throw it
            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            // If profile exists, return it
            if (profile) {
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
            }

            // If we get here, something went wrong
            throw new Error('Unable to fetch or create profile');
            
        } catch (error) {
            setUser(null);
            localStorage.removeItem('user');
            throw error;
        }
    };
    // ============ END OF UPDATED fetchUser FUNCTION ============

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
                // Try to insert profile, but don't fail if it already exists or trigger creates it
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

                // Only throw if it's not a duplicate or RLS error
                if (profileError && profileError.code !== '23505' && !profileError.message.includes('policy')) {
                    // Don't throw - the trigger might create it
                }
                
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
                // Silent error handling - no console logs
            }
        } catch (error) {
            // Silent error handling - no console logs
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

    const forgotPassword = async (email, options = {}) => {
        setError(null);
        try {
            // Use the provided redirect URL or fallback to the default
            const redirectUrl = options.redirectTo || `${window.location.origin}/reset-password`;
            
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

    const resendResetLink = async (email, options = {}) => {
        setError(null);
        try {
            // Use the provided redirect URL or fallback to the default
            const redirectUrl = options.redirectTo || `${window.location.origin}/reset-password`;
            
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

    // ============ PASSWORD RESET METHODS ============
    
    /**
     * Verify the reset token from the email link
     * @param {string} tokenHash - The token hash from the URL
     * @returns {Promise<{success: boolean, data?: any}>}
     */
    const verifyResetToken = async (tokenHash) => {
        setError(null);
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: 'recovery',
            });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    /**
     * Update the user's password
     * @param {string} newPassword - The new password
     * @returns {Promise<{success: boolean, data?: any}>}
     */
    const updatePassword = async (newPassword) => {
        setError(null);
        try {
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    // ============ EMAIL CONFIRMATION METHODS ============
    
    /**
     * Verify the email confirmation token from the email link
     * @param {string} tokenHash - The token hash from the URL
     * @param {string} type - The type of verification (signup, email, etc.)
     * @returns {Promise<{success: boolean, data?: any}>}
     */
    const confirmEmail = async (tokenHash, type = 'signup') => {
        setError(null);
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: type, // 'signup' for email confirmation
            });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    /**
     * Resend the confirmation email
     * @param {string} email - The user's email address
     * @param {string} redirectUrl - The URL to redirect to after confirmation
     * @returns {Promise<{success: boolean}>}
     */
    const resendConfirmationEmail = async (email, redirectUrl = null) => {
        setError(null);
        try {
            const finalRedirectUrl = redirectUrl || `${window.location.origin}/email-confirmation`;
            
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: finalRedirectUrl
                }
            });
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    /**
     * Check if the user's email is confirmed
     * @returns {boolean}
     */
    const isEmailConfirmed = () => {
        if (!user) return false;
        // You might want to check this from your user object or profile
        return user?.email_confirmed_at ? true : false;
    };

    // ============ UTILITY METHODS ============

    /**
     * Check if user is currently authenticated
     * @returns {boolean}
     */
    const isAuthenticated = () => {
        return !!user;
    };

    /**
     * Get the current session
     * @returns {Promise<{session: any, error: any}>}
     */
    const getSession = async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return { session: data.session, error: null };
        } catch (error) {
            return { session: null, error: error.message };
        }
    };

    /**
     * Refresh the user data
     * @returns {Promise<any>}
     */
    const refreshUser = async () => {
        if (user) {
            return await fetchUser(user.id);
        }
        return null;
    };

    // ============ EXPORT VALUE ============

    const value = {
        // State
        user,
        loading,
        error,
        darkMode,
        
        // Authentication methods
        register,
        login,
        logout,
        toggleDarkMode,
        
        // Advanced auth methods
        sendMagicLink,
        loginWithBiometrics,
        loginWith2FA,
        
        // Password reset methods
        forgotPassword,
        resendResetLink,
        verifyResetToken,
        updatePassword,
        
        // Email confirmation methods
        confirmEmail,
        resendConfirmationEmail,
        isEmailConfirmed,
        
        // Utility methods
        isAuthenticated,
        getSession,
        refreshUser,
        
        // User management
        fetchUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};