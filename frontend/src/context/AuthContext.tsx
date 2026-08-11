'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export interface Workspace {
  _id: string;
  name?: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role?: string;
  workspaceId?: string;
  workspace?: string | Workspace; // 👈 Updated so TS accepts both string & object
  slug?: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (token: string, userData: any) => void;
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

  const login = (token: string, userData: any) => {
    // 1. Save in Cookies for Middleware protection
    Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'strict' });

    // Normalize the backend response data
    const normalizedUser: UserSession = {
      ...userData,
      workspaceId: userData.workspaceId || userData.workspace?._id || userData.workspace,
      workspace: userData.workspace,
    };

    // 2. Save the fully normalized object to localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user_data', JSON.stringify(normalizedUser));

    setUser(normalizedUser);
    router.push('/');
  };

  const logout = () => {
    Cookies.remove('token');
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    setUser(null);
    router.push('/login');
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