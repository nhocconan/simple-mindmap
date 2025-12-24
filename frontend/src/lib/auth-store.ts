import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: 'USER' | 'ADMIN';
  isVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName?: string; lastName?: string; recaptchaToken?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password, recaptchaToken) => {
        set({ isLoading: true });
        try {
          const response = await api.login(email, password, recaptchaToken);
          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
          });
          await get().fetchUser();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth-change'));
          }
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response: any = await api.register(data);
          if (response.accessToken) {
            set({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              isAuthenticated: true,
            });
            await get().fetchUser();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('auth-change'));
            }
          }
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        const { accessToken } = get();
        if (accessToken) {
          try {
            await api.logout(accessToken);
          } catch (e) {
            // Ignore logout errors
          }
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-change'));
        }
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const response = await api.refreshToken(refreshToken);
          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
          });
        } catch {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      fetchUser: async () => {
        const { accessToken } = get();
        if (!accessToken) return;

        try {
          const user = await api.getMe(accessToken) as User;
          set({ user, isAuthenticated: true });
        } catch {
          await get().refreshAuth();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && state?.refreshToken) {
          state.fetchUser().catch(() => {
            state.refreshAuth();
          });
        }
      },
    }
  )
);
