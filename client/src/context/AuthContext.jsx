import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pos_user');
    return saved ? JSON.parse(saved) : null;
  });

  async function login(username, password) {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('pos_token', data.token);
    localStorage.setItem('pos_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
