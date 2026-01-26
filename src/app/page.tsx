"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import FeedContainer from "@/components/feed/feed-container";
import { useAuthStore } from "@/store/auth-store";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // 检查登录状态，未登录则跳转到登录页
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // 如果未登录，不渲染内容（等待跳转）
  if (!isAuthenticated || !user) {
    return null;
  }
  return (
    // Ins 首页通常是一个较窄的中心区域
    <div className="flex justify-center">
      <div className="w-full max-w-[550px] space-y-6">
        {/* 顶部 Story 区域 (预留) */}
        <div className="flex gap-4 pb-2 rounded-lg p-3 bg-card">
          {Array.from({ length: 5 }).map((_, i) => {
            const username = `user_${i}`;
            return (
              <div
                key={i}
                className="flex flex-col items-center space-y-1 shrink-0"
              >
                {/* Story Ring */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                  <Avatar className="w-full h-full border-2 border-background">
                    <AvatarImage
                      src={`https://i.pravatar.cc/150?u=${username}`}
                    />
                    <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>

                <span className="text-xs">{username}</span>
              </div>
            );
          })}
        </div>

        {/* 核心 Feed 容器 */}
        <FeedContainer />
      </div>

      {/* 右侧推荐栏 (仅在大屏显示) - 预留 */}
      <div className="hidden xl:block w-[320px] pl-16">
        <div className="fixed w-[320px]">
          <div className="flex items-center justify-between py-2 mb-5">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={
                    user.image || `https://i.pravatar.cc/150?u=${user.username}`
                  }
                />
                <AvatarFallback>
                  {user.name?.[0]?.toUpperCase() ||
                    user.username?.[0]?.toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm">
                  {user.name || user.username || "用户"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.username || "username"}
                </p>
              </div>
            </div>
            <button className="text-blue-500 text-sm font-bold">切换</button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-muted-foreground">为你推荐</span>
            <button className="text-sm font-bold hover:text-blue-500">
              查看全部
            </button>
          </div>
          {/* 模拟推荐用户 */}
          {Array.from({ length: 5 }).map((_, i) => {
            const username = `suggested_user_${i}`;
            return (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={`https://i.pravatar.cc/150?u=${username}`}
                    />
                    <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm">{username}</p>
                    <p className="text-xs text-muted-foreground">
                      New to Instagram
                    </p>
                  </div>
                </div>
                <button className="text-blue-500 text-sm font-bold">
                  关注
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
