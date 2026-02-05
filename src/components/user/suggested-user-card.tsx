"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toggleFollow } from "@/actions/user";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SuggestedUser = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  bio: string | null;
  _count: {
    followedBy: number;
  };
};

export function SuggestedUserCard({ user }: { user: SuggestedUser }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isVisible, setIsVisible] = useState(true); // 用于点击关闭按钮移除卡片

  const handleFollow = () => {
    const prevStatus = isFollowing;
    setIsFollowing(!prevStatus);

    startTransition(async () => {
      const res = await toggleFollow(user.id);
      if (!res.success) {
        setIsFollowing(prevStatus);
        toast.error("操作失败");
      }
    });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    // 这里可以调用后端 API 记录 "用户不感兴趣"，暂时仅前端移除
  };

  if (!isVisible) return null;

  return (
    <div className="relative flex flex-col items-center p-4 border rounded-lg bg-background hover:bg-accent/20 transition-colors group">
      {/* 关闭按钮 (右上角) */}
      <button
        onClick={handleRemove}
        className="absolute top-2 right-2 text-muted-foreground opacity-50 hover:opacity-100 p-1"
      >
        <X className="w-4 h-4" />
      </button>

      {/* 头像 */}
      <Link href={`/${user.username}`} className="mb-3 mt-2">
        <Avatar className="w-20 h-20 md:w-24 md:h-24">
          <AvatarImage src={user.image || ""} />
          <AvatarFallback className="text-xl">
            {user.username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>

      {/* 用户名 */}
      <Link
        href={`/${user.username}`}
        className="font-bold text-sm truncate w-full text-center hover:underline"
      >
        {user.username}
      </Link>

      {/* 姓名或辅助信息 */}
      <div className="text-xs text-muted-foreground truncate w-full text-center mb-4 h-5">
        {user.name || "Instagram 用户"}
      </div>

      {/* 粉丝数展示 (可选) */}
      <div className="text-[10px] text-muted-foreground mb-3">
        {user._count.followedBy} 位粉丝
      </div>

      {/* 关注按钮 */}
      <Button
        onClick={handleFollow}
        disabled={isPending}
        className={cn(
          "w-full h-8 text-sm font-semibold transition-all",
          isFollowing
            ? "bg-transparent border border-input text-foreground hover:bg-accent hover:text-accent-foreground"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        )}
      >
        {isFollowing ? "已关注" : "关注"}
      </Button>
    </div>
  );
}
