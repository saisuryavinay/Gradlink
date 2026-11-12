import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Incremented after every avatar upload — passed to <Avatar cacheBust=...>
  // so all Avatar instances refresh their img src without a stale cached 404.
  const [avatarCacheBust, setAvatarCacheBust] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('gradlink_token');
    const storedUser = localStorage.getItem('gradlink_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('gradlink_token');
        localStorage.removeItem('gradlink_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('gradlink_token', token);
    localStorage.setItem('gradlink_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('gradlink_token');
    localStorage.removeItem('gradlink_user');
    setUser(null);
    setAvatarCacheBust(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem('gradlink_user', JSON.stringify(updated));
    setUser(updated);
    // Bust the avatar cache on every updateUser call that touches avatar-related
    // fields — this covers: first upload, re-upload (same sentinel value 'photo'),
    // and remove. We always fire so a second upload immediately refreshes the img.
    if (
      updates.avatar !== undefined ||
      updates.avatarFileId !== undefined
    ) {
      setAvatarCacheBust(Date.now());
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, avatarCacheBust }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
