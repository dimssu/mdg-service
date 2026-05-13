import type { Admin } from '@dk/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  admin: Admin | null;
  login: (token: string, admin: Admin) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      login: (token, admin) => set({ token, admin }),
      logout: () => set({ token: null, admin: null }),
    }),
    {
      name: 'dk.auth',
      partialize: (s) => ({ token: s.token, admin: s.admin }),
    },
  ),
);

/** Imperative accessor used by the fetch client (outside React). */
export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}

export function clearAuth(): void {
  useAuthStore.getState().logout();
}
