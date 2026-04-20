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

const LEGACY_LOCATION_MAP: Record<string, string> = {
  "Madrid, España": "Lima, Perú",
  "Barcelona, España": "Arequipa, Perú",
  "Sevilla, España": "Cusco, Perú",
  "Valencia, España": "Trujillo, Perú",
};

function normalizeUser(user: User | null): User | null {
  if (!user) return null;

  return {
    ...user,
    location: LEGACY_LOCATION_MAP[user.location] ?? user.location,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (user = CURRENT_USER) =>
        set({ user: normalizeUser(user), isAuthenticated: true }),

      setUser: (user) =>
        set({ user: normalizeUser(user), isAuthenticated: true }),

      logout: () =>
        set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      merge: (persistedState, currentState) => {
        const typedState = persistedState as Partial<AuthState> | undefined;

        return {
          ...currentState,
          ...typedState,
          user: normalizeUser(typedState?.user ?? currentState.user),
        };
      },
    }
  )
);
