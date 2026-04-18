import React, { createContext, useContext, useState, useEffect } from 'react';
import { authStore } from '../services/store';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authStore.getCurrentUser();
    if (currentUser) setUser(currentUser);
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const userData = authStore.login(email, password);
    setUser(userData);
    return userData;
  };

  const register = (formData) => {
    const userData = authStore.register(formData);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    authStore.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
