import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('finfood_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register' | 'forgot'

  // Load user profile on mount if token exists
  useEffect(() => {
    let isMounted = true;

    if (token) {
      api.getMe()
        .then((res) => {
          if (isMounted && res.success && res.user) {
            setUser(res.user);
          }
        })
        .catch(() => {
          // Token expired or invalid
          if (isMounted) {
            localStorage.removeItem('finfood_token');
            setToken(null);
            setUser(null);
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
