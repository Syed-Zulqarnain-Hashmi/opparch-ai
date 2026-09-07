"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, removeAuthToken, fetchMyProfile } from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  isLoggedIn: false,
  isAdmin: false,
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const t = getAuthToken();
    setToken(t);
    if (t) {
      try {
        const profile = await fetchMyProfile();
        setUser(profile);
      } catch (err) {
        console.error("Failed to load user profile:", err);
        removeAuthToken();
        setUser(null);
        setToken(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setToken(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isLoggedIn: !!user,
        isAdmin: user?.role === "ADMIN",
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
