"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";

/**
 * 认证提供者组件
 * 在应用启动时从 cookie 中获取用户信息
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, isLoading } = useAuthStore();

  useEffect(() => {
    // 在组件挂载时获取用户信息
    fetchUser();
  }, [fetchUser]);

  // 在加载用户信息时，可以显示加载状态
  // 这里我们直接渲染 children，让各个页面自己处理加载状态
  return <>{children}</>;
}
