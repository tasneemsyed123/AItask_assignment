/**
 * hooks/useAuth.ts
 * --------------------------------------------------------------------------
 * Minimal client-side auth state, backed by localStorage (Phase 1: access
 * token only, no cookies/refresh flow). Not a React Context because the
 * only consumers are login/register (write) and a simple `isAuthenticated`
 * check (read) - a context would be overkill for this scope.
 */
import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/task';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    setIsLoading(false);
  }, []);

  const login = useCallback((accessToken: string, nextUser: User) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return { user, isLoading, login, logout, isAuthenticated: !!user };
}
