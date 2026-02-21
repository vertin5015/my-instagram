import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSessionAction, logoutAction } from "@/actions/auth";
import type { AuthUser } from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const res = await getSessionAction();

          if (res.success && res.data) {
            const userData = res.data;
            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("[FETCH_USER_ERROR]", error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
      logout: async () => {
        try {
          // ✅ 改造点：直接调用 Server Action
          await logoutAction();
        } catch (error) {
          console.error("[LOGOUT_ERROR]", error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
          });
          window.location.href = "/login";
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state && state.user) {
          state.isAuthenticated = true;
          state.isLoading = false;
        }
      },
    }
  )
);
