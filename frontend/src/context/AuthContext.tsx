'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export interface Workspace {
  _id: string;
  name?: string;
}

// 1. Update UserSession interface to allow both id and _id safely
export interface UserSession {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role?: string;
  workspaceId?: string;
  workspace?: string | Workspace;
  slug?: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper to normalize backend user payloads cleanly
  const normalizeUser = (userData: any): UserSession => {
    const userId = userData.id || userData._id;
    return {
      ...userData,
      id: userId,
      _id: userId,
      workspaceId: userData.workspaceId || userData.workspace?._id || userData.workspace,
      workspace: userData.workspace,
    };
  };

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('http://localhost:5000/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        const normalizedUser = normalizeUser(userData);

        localStorage.setItem('user_data', JSON.stringify(normalizedUser));
        setUser(normalizedUser);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user_data');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse cached user:', e);
      }
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: any) => {
    Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'strict' });

    const normalizedUser = normalizeUser(userData);

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
    router.push('/register');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchUser }}>
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