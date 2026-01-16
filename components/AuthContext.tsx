import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_BASE}/user`, {
        credentials: 'include',
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (err) {
      console.error('Auth check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || '로그인에 실패했습니다.');
    }

    const userData = await res.json();
    setUser(userData);
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || '회원가입에 실패했습니다.');
    }

    const userData = await res.json();
    setUser(userData);
  };

  const logout = async () => {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const res = await fetch(`${API_BASE}/reset-password-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || '비밀번호 재설정 요청에 실패했습니다.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, resetPassword }}>
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
