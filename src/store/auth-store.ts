import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/auth/me", {
            credentials: "include", // 确保发送 cookies
          });

          if (response.ok) {
            const data = await response.json();
            set({
              user: data.user,
              isAuthenticated: !!data.user,
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
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          });
        } catch (error) {
          console.error("[LOGOUT_ERROR]", error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      // 只持久化用户信息，不持久化认证状态（从 cookie 中获取）
      partialize: (state) => ({ user: state.user }),
    }
  )
);
