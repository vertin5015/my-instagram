"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, user } = useAuthStore();
  // 添加一个本地挂载状态，防止水合不匹配
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, [fetchUser]);

  // 可选：在这里处理全局 loading
  // 如果你需要非常严格的保护，可以在这里判断：如果 isLoading 且没有 user，显示 Loading 动画

  if (!mounted) return null; // 防止服务端/客户端渲染不一致

  return <>{children}</>;
}
