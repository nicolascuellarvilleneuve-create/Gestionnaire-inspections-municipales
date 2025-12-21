import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Init: Check LocalStorage for existing session AND Verify with Server
    useEffect(() => {
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('urbops_user');
            const storedToken = localStorage.getItem('urbops_token');

            if (storedUser && storedToken) {
                try {
                    // Verify with Server
                    const response = await fetch('http://localhost:3001/api/auth/verify', {
                        headers: {
                            'Authorization': `Bearer ${storedToken}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.valid) {
                            setUser(data.user); // Refresh user data from server
                        } else {
                            throw new Error("Token invalid");
                        }
                    } else {
                        throw new Error("Verification failed");
                    }
                } catch (e) {
                    console.warn("Session invalid, logging out:", e);
                    localStorage.removeItem('urbops_token');
                    localStorage.removeItem('urbops_user');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur de connexion');
            }

            // Success
            localStorage.setItem('urbops_token', data.token);
            localStorage.setItem('urbops_user', JSON.stringify(data.user));
            setUser(data.user);
            return { success: true };

        } catch (err) {
            console.error("Login Failed:", err);
            return { success: false, error: err.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('urbops_token');
        localStorage.removeItem('urbops_user');
        setUser(null);
    };

    // Helper to get token for API calls
    const getToken = () => localStorage.getItem('urbops_token');

    return (
        <AuthContext.Provider value={{ user, login, logout, getToken, loading, isAuthenticated: !!user }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
