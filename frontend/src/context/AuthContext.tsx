'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  workspace: string;
  slug: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (token: string, userData: UserSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // On mount, check if user details exist in localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user_data');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: UserSession) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    setUser(null);
    router.push('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
