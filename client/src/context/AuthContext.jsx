import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize user and token from localStorage for instant offline access
  const [token, setToken] = useState(() => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem('finfood_token') : null;
    } catch (e) {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const cachedUser = localStorage.getItem('finfood_user');
        return cachedUser ? JSON.parse(cachedUser) : null;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    // If we already have token and cached user, don't block UI with full page loader
    return !(token && user);
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register' | 'forgot'

  // Load user profile on mount if token exists
  useEffect(() => {
    let isMounted = true;

    if (token) {
      // If offline, use cached user profile without hitting network
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsLoading(false);
        return;
      }

      api.getMe()
        .then((res) => {
          if (isMounted && res.success && res.user) {
            setUser(res.user);
            try {
              localStorage.setItem('finfood_user', JSON.stringify(res.user));
            } catch (e) {}
          }
        })
        .catch((err) => {
          // IMPORTANT: Only clear session if server explicitly returned 401 Unauthorized.
          // Never log out on network failures, timeouts, or offline mode!
          const isUnauthorized = err.message === 'Unauthorized' || err.status === 401;
          if (isUnauthorized && isMounted) {
            console.warn('Session expired. Logging out.');
            localStorage.removeItem('finfood_token');
            localStorage.removeItem('finfood_user');
            setToken(null);
            setUser(null);
          } else {
            console.warn('Could not refresh profile from server, continuing with local profile:', err.message);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('finfood_token', res.token);
      if (res.user) {
        localStorage.setItem('finfood_user', JSON.stringify(res.user));
      }
      setToken(res.token);
      setUser(res.user);
      setIsAuthModalOpen(false);
      return res;
    }
    throw new Error(res.error || 'Login failed');
  };

  const register = async (name, email, password, avatar = null) => {
    const res = await api.register({ name, email, password, avatar });
    if (res.success && res.token) {
      localStorage.setItem('finfood_token', res.token);
      if (res.user) {
        localStorage.setItem('finfood_user', JSON.stringify(res.user));
      }
      setToken(res.token);
      setUser(res.user);
      setIsAuthModalOpen(false);
      return res;
    }
    throw new Error(res.error || 'Registration failed');
  };

  const forgotPassword = async (email) => {
    return api.forgotPassword({ email });
  };

  const resetPassword = async (email, code, newPassword) => {
    return api.resetPassword({ email, code, newPassword });
  };

  const logout = () => {
    localStorage.removeItem('finfood_token');
    localStorage.removeItem('finfood_user');
    setToken(null);
    setUser(null);
  };

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const updateProfile = async (profileData) => {
    const res = await api.updateProfile(profileData);
    if (res.success && res.user) {
      setUser(res.user);
      try {
        localStorage.setItem('finfood_user', JSON.stringify(res.user));
      } catch (e) {}
      return res;
    }
    throw new Error(res.error || 'Failed to update profile');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        forgotPassword,
        resetPassword,
        updateProfile,
        logout,
        isAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
