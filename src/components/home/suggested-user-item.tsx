"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toggleFollow } from "@/actions/user";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SuggestedUserItemProps {
  user: {
    id: string;
    username: string | null;
    image: string | null;
  };
}

export function SuggestedUserItem({ user }: SuggestedUserItemProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFollow = () => {
    setIsFollowing(true); // 乐观更新
    startTransition(async () => {
      const res = await toggleFollow(user.id);
      if (!res.success) {
        setIsFollowing(false);
        toast.error("关注失败");
      }
    });
  };

  if (!user.username) return null;

  return (
    <div className="flex items-center justify-between py-2">
      <Link
        href={`/${user.username}`}
        className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
      >
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={user.image || undefined} />
          <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{user.username}</p>
          <p className="text-xs text-muted-foreground truncate">为你推荐</p>
        </div>
      </Link>

      <button
        onClick={handleFollow}
        disabled={isPending || isFollowing}
        className={cn(
          "text-xs font-bold transition-colors shrink-0 ml-2",
          isFollowing
            ? "text-muted-foreground"
            : "text-blue-500 hover:text-blue-700"
        )}
      >
        {isFollowing ? "已关注" : "关注"}
      </button>
    </div>
  );
}
