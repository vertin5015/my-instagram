"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/actions/user";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  isCurrentUser: boolean; // 如果是自己，显示编辑资料而不是关注
  className?: string;
}

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  isCurrentUser,
  className,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  const handleFollow = () => {
    // 乐观 UI 更新：先切换状态
    const prev = isFollowing;
    setIsFollowing(!prev);

    startTransition(async () => {
      const res = await toggleFollow(targetUserId);
      if (!res.success) {
        // 失败回滚
        setIsFollowing(prev);
        toast.error("操作失败，请重试");
      }
    });
  };

  if (isCurrentUser) {
    return (
      <Button
        variant="secondary"
        className={cn(
          "h-8 px-4 text-sm font-semibold bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-foreground",
          className
        )}
      >
        编辑主页
      </Button>
    );
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={isPending}
      variant={isFollowing ? "secondary" : "default"}
      className={cn(
        "h-8 px-4 text-sm font-semibold transition-colors",
        isFollowing
          ? "bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-foreground"
          : "bg-blue-500 hover:bg-blue-600 text-white",
        className
      )}
    >
      {isFollowing ? "已关注" : "关注"}
    </Button>
  );
}
