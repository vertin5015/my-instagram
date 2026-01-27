import { create } from "zustand";
import { persist } from "zustand/middleware";
// 引入新的 Server Actions
import { getSessionAction, logoutAction } from "@/actions/auth";

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
      isLoading: true,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
      fetchUser: async () => {
        set({ isLoading: true });
        try {
          // ✅ 改造点：直接调用 Server Action
          const res = await getSessionAction();

          if (res.success && res.data) {
            // 类型断言：确保 Prisma 的部分 User 类型符合 store 的 User 接口
            const userData = res.data as User;
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
