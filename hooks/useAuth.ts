'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { AuthUser } from '@/types';

export interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (provider?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!session?.user;

  // Convert NextAuth session to our AuthUser type
  const user: AuthUser | null = session?.user ? {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name!,
    avatar: session.user.avatar || session.user.image || undefined,
    provider: 'google', // We'll determine this based on the session
    preferences: session.user.preferences || {
      theme: 'system',
      notifications: {
        email: true,
        push: true,
        sound: true,
      },
      privacy: {
        onlineStatus: true,
        readReceipts: true,
      },
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    status: session.user.status || 'online',
    createdAt: new Date(), // This should come from the database
    lastActiveAt: new Date(),
  } : null;

  const handleSignIn = useCallback(async (provider: string = 'google') => {
    try {
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: '/inbox',
      });
      
      if (result?.error) {
        console.error('Sign in error:', result.error);
        throw new Error(result.error);
      }
      
      if (result?.ok) {
        router.push('/inbox');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }, [router]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut({
        redirect: false,
        callbackUrl: '/login',
      });
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, [router]);

  const refreshSession = useCallback(async () => {
    await update();
  }, [update]);

  // Update user status when the app becomes visible/hidden
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = async () => {
      try {
        const response = await fetch('/api/user/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: document.hidden ? 'away' : 'online',
            lastActiveAt: new Date(),
          }),
        });

        if (response.ok) {
          await refreshSession();
        }
      } catch (error) {
        console.error('Failed to update user status:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Update status to online when hook initializes
    handleVisibilityChange();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, refreshSession]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error: null, // We could add error handling from session
    signIn: handleSignIn,
    signOut: handleSignOut,
    refreshSession,
  };
}