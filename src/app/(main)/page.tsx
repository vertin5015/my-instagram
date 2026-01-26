"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
              <Link
                key={i}
                href={`/${username}`}
                className="flex flex-col items-center space-y-1 shrink-0 hover:opacity-80 transition-opacity"
              >
                {/* Story Ring */}
                <div className="w-20 h-20 rounded-full bg-linear-to-tr from-yellow-400 to-purple-600 p-[2px]">
                  <Avatar className="w-full h-full border-2 border-background">
                    <AvatarImage
                      src={`https://i.pravatar.cc/150?u=${username}`}
                    />
                    <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>

                <span className="text-xs truncate max-w-[72px]">
                  {username}
                </span>
              </Link>
            );
          })}
        </div>

        {/* 核心 Feed 容器 */}
        <FeedContainer />
      </div>

      {/* 右侧推荐栏 (仅在大屏显示) - 预留 */}
      <div className="hidden xl:block w-[320px] pl-16">
        <div className="fixed w-[320px]">
          {/* 当前用户信息卡片 */}
          <div className="flex items-center justify-between py-2 mb-5">
            <Link
              href={user.username ? `/${user.username}` : "/login"}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1"
            >
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
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">
                  {user.name || user.username || "用户"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.username || "username"}
                </p>
              </div>
            </Link>
            <Link
              href="/login"
              className="text-blue-500 text-sm font-bold hover:text-blue-600 transition-colors ml-2"
            >
              切换
            </Link>
          </div>

          {/* 为你推荐标题 */}
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-muted-foreground">为你推荐</span>
            <button className="text-sm font-bold hover:text-blue-500 transition-colors">
              查看全部
            </button>
          </div>

          {/* 模拟推荐用户 */}
          {Array.from({ length: 5 }).map((_, i) => {
            const username = `suggested_user_${i}`;
            return (
              <div key={i} className="flex items-center justify-between py-2">
                <Link
                  href={`/${username}`}
                  className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage
                      src={`https://i.pravatar.cc/150?u=${username}`}
                    />
                    <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{username}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      New to Instagram
                    </p>
                  </div>
                </Link>
                <button className="text-blue-500 text-sm font-bold hover:text-blue-600 transition-colors shrink-0 ml-2">
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
