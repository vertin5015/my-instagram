"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleCommentLike } from "@/actions/post";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
// 引入新组件
import { ParsedText } from "./parsed-text";

export type CommentType = {
  id: string;
  body: string;
  createdAt: Date;
  parentId: string | null;
  user: {
    id: string;
    username: string;
    image?: string;
  };
  likesCount: number;
  isLiked: boolean;
  replies: CommentType[];
};

interface CommentItemProps {
  comment: CommentType;
  onReply: (username: string, commentId: string) => void;
}

export function CommentItem({ comment, onReply }: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(comment.isLiked);
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [isPending, startTransition] = useTransition();

  const handleLike = () => {
    const prevLiked = isLiked;
    setIsLiked(!prevLiked);
    setLikesCount((prev) => (prevLiked ? prev - 1 : prev + 1));

    startTransition(async () => {
      const res = await toggleCommentLike(comment.id);
      if (!res.success) {
        setIsLiked(prevLiked);
        setLikesCount(comment.likesCount);
        toast.error("操作失败");
      }
    });
  };

  return (
    <div className="group mb-5">
      {" "}
      {/* 稍微增加间距 */}
      <div className="flex gap-3 items-start">
        <Avatar className="h-8 w-8 shrink-0 cursor-pointer">
          <AvatarImage src={comment.user.image} />
          <AvatarFallback>{comment.user.username?.[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="text-sm">
            <Link
              href={`/${comment.user.username}`}
              className="font-bold mr-2 hover:opacity-70 inline-block"
            >
              {comment.user.username}
            </Link>

            {/* --- 使用 ParsedText 替代纯文本 --- */}
            {/* 评论通常不需要默认展开，且阈值可以设小一点，比如 120 */}
            <div className="inline">
              <ParsedText
                text={comment.body}
                threshold={120}
                className="inline" // 保持 inline 布局以便紧跟用户名
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: zhCN,
              }).replace("大约 ", "")}
            </span>
            {likesCount > 0 && (
              <span className="font-semibold">{likesCount} 次赞</span>
            )}
            <button
              onClick={() => onReply(comment.user.username, comment.id)}
              className="font-semibold hover:text-foreground cursor-pointer"
            >
              回复
            </button>
          </div>
        </div>

        {/* 评论点赞 */}
        <button onClick={handleLike} className="pt-1 focus:outline-none">
          <Heart
            className={cn(
              "h-3 w-3 cursor-pointer transition-colors",
              isLiked
                ? "fill-red-500 text-red-500"
                : "text-muted-foreground hover:text-foreground"
            )}
          />
        </button>
      </div>
      {/* 渲染嵌套回复 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-11 mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}
