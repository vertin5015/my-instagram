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
      isLoading: true, // 建议初始为 true，避免页面闪烁
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/auth/me", {
            // 必须加上这个，否则 Next.js 可能会缓存结果导致状态不更新
            cache: "no-store",
            credentials: "include",
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
          // 强制刷新页面或跳转，清除内存状态
          window.location.href = "/login";
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
      // ✅ 关键修复：当从 localStorage 恢复数据完成后，立即计算 isAuthenticated
      onRehydrateStorage: () => (state) => {
        if (state && state.user) {
          state.isAuthenticated = true;
          state.isLoading = false; // 既然有缓存用户，先认为加载完成
        }
      },
    }
  )
);
