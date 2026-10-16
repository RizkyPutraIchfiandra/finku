/**
 * useAuth Hook
 *
 * Authentication hook providing user state and auth actions via React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/src/providers/AppProvider';

export interface User {
  id: string;
  email: string;
}

export class AuthError extends Error {
  reason?: string;
  constructor(message: string, reason?: string) {
    super(message);
    this.reason = reason;
  }
}

export const authKeys = {
  session: ['auth', 'session'] as const,
  user: ['auth', 'user'] as const,
};

export function useAuth() {
  const { client } = useApp();
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: authKeys.session,
    queryFn: async () => {
      const { data, error } = await client.auth.getSession();
      if (error) throw new AuthError(error.message, 'session');
      return data.session;
    },
  });

  const userQuery = useQuery({
    queryKey: authKeys.user,
    enabled: !!sessionQuery.data,
    queryFn: async () => {
      const { data, error } = await client.auth.getUser();
      if (error) throw new AuthError(error.message, 'user');
      const u = data.user;
      return u ? ({ id: u.id, email: u.email ?? '' } as User) : null;
    },
  });

  const signIn = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw new AuthError(error.message, 'signIn');
      return data.session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.session });
      queryClient.invalidateQueries({ queryKey: authKeys.user });
    },
  });

  const signUp = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw new AuthError(error.message, 'signUp');
      return data.session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.session });
      queryClient.invalidateQueries({ queryKey: authKeys.user });
    },
  });

  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await client.auth.signOut();
      if (error) throw new AuthError(error.message, 'signOut');
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return {
    session: sessionQuery.data ?? null,
    user: userQuery.data ?? null,
    isAuthenticated: !!sessionQuery.data,
    isLoading: sessionQuery.isLoading,
    signIn,
    signUp,
    signOut,
  };
}
