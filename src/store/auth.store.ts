import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  role: 'ADMIN' | 'COORDINATOR' | null;
  userId: string | null;
  fullName: string | null;
  mustChangePassword: boolean;
  setAuth: (payload: { token: string; role: 'ADMIN' | 'COORDINATOR'; userId: string; fullName: string; mustChangePassword: boolean }) => void;
  setMustChangePassword: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      userId: null,
      fullName: null,
      mustChangePassword: false,
      setAuth: (payload) =>
        set({
          token: payload.token,
          role: payload.role,
          userId: payload.userId,
          fullName: payload.fullName,
          mustChangePassword: payload.mustChangePassword,
        }),
      setMustChangePassword: (v) => set({ mustChangePassword: v }),
      logout: () =>
        set({ token: null, role: null, userId: null, fullName: null, mustChangePassword: false }),
    }),
    { name: 'cd-auth' },
  ),
);
