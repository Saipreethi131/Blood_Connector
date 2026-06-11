import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem('profile');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const saveSession = (tokenVal, userData, profileData) => {
    localStorage.setItem('token', tokenVal);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('profile', JSON.stringify(profileData));
    setToken(tokenVal);
    setUser(userData);
    setProfile(profileData);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveSession(data.token, data.user, data.profile);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
      const updatedProfile = data.profile;
      setProfile(updatedProfile);
      localStorage.setItem('profile', JSON.stringify(updatedProfile));
      return updatedProfile;
    } catch {
      // silently fail
    }
  };

  const updateProfile = (newProfile) => {
    setProfile(newProfile);
    localStorage.setItem('profile', JSON.stringify(newProfile));
  };

  return (
    <AuthContext.Provider
      value={{ user, token, profile, loading, login, logout, refreshProfile, updateProfile, saveSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
