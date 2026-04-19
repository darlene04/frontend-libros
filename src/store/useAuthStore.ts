import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { CURRENT_USER } from "@/data/mock";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user?: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (user = CURRENT_USER) =>
        set({ user, isAuthenticated: true }),

      setUser: (user) =>
        set({ user, isAuthenticated: true }),

      logout: () =>
        set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
