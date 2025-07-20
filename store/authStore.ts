import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, UserPreferences } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  gmailConnected: boolean;
  preferences: UserPreferences | null;
  lastActivity: Date | null;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  setGmailConnected: (connected: boolean) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setLastActivity: (date: Date) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  gmailConnected: false,
  preferences: null,
  lastActivity: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        preferences: user?.preferences || null,
        gmailConnected: !!user?.gmailTokens?.accessToken,
      }),

      updateUser: (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...updates };
        set({
          user: updatedUser,
          preferences: updatedUser.preferences,
          gmailConnected: !!updatedUser.gmailTokens?.accessToken,
        });
      },

      setGmailConnected: (connected) => set({ gmailConnected: connected }),

      updatePreferences: (newPreferences) => {
        const currentUser = get().user;
        const currentPreferences = get().preferences;
        
        if (!currentPreferences) return;

        const updatedPreferences = { ...currentPreferences, ...newPreferences };
        
        set({ 
          preferences: updatedPreferences,
          user: currentUser ? { ...currentUser, preferences: updatedPreferences } : null,
        });
      },

      setLastActivity: (date) => set({ lastActivity: date }),

      clearAuth: () => set(initialState),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        preferences: state.preferences,
        gmailConnected: state.gmailConnected,
        lastActivity: state.lastActivity,
      }),
    }
  )
);

// Computed selectors
export const useIsGmailConnected = () => useAuthStore((state) => state.gmailConnected);
export const useUserPreferences = () => useAuthStore((state) => state.preferences);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);