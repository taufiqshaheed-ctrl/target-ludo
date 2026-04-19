import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/authService';
import api from '@/services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUserState] = useState(null);
    const [loading, setLoading] = useState(true);

    // setUser also keeps localStorage in sync
    const setUser = useCallback((updaterOrValue) => {
        setUserState(prev => {
            const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
            if (next) {
                localStorage.setItem('user', JSON.stringify(next));
            } else {
                localStorage.removeItem('user');
            }
            return next;
        });
    }, []);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUserState(currentUser);
        setLoading(false);
    }, []);

    // Fetch fresh profile from server and sync into context + localStorage
    const refreshUser = useCallback(async () => {
        try {
            const res = await api.get('/profile');
            setUser(res.data);
            return res.data;
        } catch {
            return null;
        }
    }, [setUser]);

    const login = async (email, password) => {
        const data = await authService.login(email, password);
        setUser(data.user);
        return data;
    };

    const register = async (fullName, email, password, phone) => {
        const data = await authService.register(fullName, email, password, phone);
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        await authService.logout();
        setUserState(null);
    };

    const value = {
        user,
        setUser,
        refreshUser,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
