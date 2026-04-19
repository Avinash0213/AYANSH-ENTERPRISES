import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../api/axios';

interface AuthUser {
  token: string;
  permissions: string[];
  roleId?: number;
  email?: string;
}

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permission: string) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async (token: string) => {
    try {
      const { data } = await api.get('/permissions/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data as string[];
    } catch {
      return [];
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const permissions = await fetchPermissions(token);
        const decoded = parseJwt(token);
        // http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress is standard ASP.NET claim for Email
        const userEmail = decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded?.email;
        setUser({ token, permissions, roleId: decoded?.roleId ? parseInt(decoded.roleId) : undefined, email: userEmail });
      }
      setLoading(false);
    };
    init();
  }, [fetchPermissions]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const token = data.accessToken;
    localStorage.setItem('token', token);
    const permissions = await fetchPermissions(token);
    const decoded = parseJwt(token);
    const userEmail = decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded?.email;
    setUser({ token, permissions, roleId: decoded?.roleId ? parseInt(decoded.roleId) : undefined, email: userEmail });
  }, [fetchPermissions]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const can = useCallback((permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false;
  }, [user]);

  const isAuthenticated = !!user?.token;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, can, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
