// components/post/post-view.tsx
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createComment } from "@/actions/post"; // 引入 Action
import { toast } from "sonner"; // 建议安装 sonner 用于提示

// 定义数据类型 (根据 Action 返回值)
type PostDetail = {
  id: string;
  images: string[];
  caption: string | null;
  createdAt: Date;
  user: { username: string | null; image: string | null };
  comments: Array<{
    id: string;
    body: string;
    createdAt: Date;
    user: { username: string | null; image: string | null };
  }>;
  isLiked: boolean;
  likesCount: number;
};

export default function PostView({ post }: { post: PostDetail }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [commentBody, setCommentBody] = useState("");
  const [isPending, startTransition] = useTransition();

  // 图片切换逻辑
  const handlePrev = () => setCurrentImageIndex((p) => Math.max(0, p - 1));
  const handleNext = () =>
    setCurrentImageIndex((p) => Math.min(post.images.length - 1, p + 1));

  // 提交评论
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;

    startTransition(async () => {
      try {
        await createComment(post.id, commentBody);
        setCommentBody("");
        toast.success("评论已发送");
      } catch (error) {
        toast.error("发送失败");
      }
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-full max-h-[90vh] w-full max-w-[1200px] bg-background md:rounded-r-lg overflow-hidden">
      {/* 左侧：图片区域 (黑色背景，图片居中) */}
      <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-0">
        <div className="relative w-full h-full">
          <Image
            src={post.images[currentImageIndex]}
            alt="Post Content"
            fill
            className="object-contain" // 保持比例，不裁切
            priority
          />
        </div>

        {/* 左右箭头 */}
        {post.images.length > 1 && (
          <>
            {currentImageIndex > 0 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-1.5 hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {currentImageIndex < post.images.length - 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-1.5 hover:bg-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* 右侧：信息与评论区域 */}
      <div className="flex flex-col w-full md:w-[400px] bg-background border-l shrink-0">
        {/* 1. Header: 作者信息 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.user.image || undefined} />
              <AvatarFallback>{post.user.username?.[0]}</AvatarFallback>
            </Avatar>
            <span className="font-bold text-sm hover:opacity-80 cursor-pointer">
              {post.user.username}
            </span>
          </div>
          <MoreHorizontal className="h-5 w-5 cursor-pointer" />
        </div>

        {/* 2. Scrollable Body: Caption + Comments */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {/* Caption */}
          {post.caption && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={post.user.image || undefined} />
                <AvatarFallback>{post.user.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <span className="font-bold mr-2">{post.user.username}</span>
                <span>{post.caption}</span>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(post.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Comments List */}
          {post.comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.user.image || undefined} />
                <AvatarFallback>{comment.user.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="text-sm flex-1">
                <span className="font-bold mr-2">{comment.user.username}</span>
                <span>{comment.body}</span>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  <button className="font-semibold hover:text-foreground">
                    回复
                  </button>
                </div>
              </div>
              <Heart className="h-3 w-3 mt-2 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-red-500" />
            </div>
          ))}
        </div>

        {/* 3. Footer: Actions & Input */}
        <div className="border-t p-4 bg-background z-10">
          <div className="flex justify-between mb-2">
            <div className="flex gap-4">
              {/* 这里的点赞逻辑可以复用 PostCard 的逻辑 */}
              <Heart
                className={cn(
                  "h-6 w-6 cursor-pointer",
                  post.isLiked ? "fill-red-500 text-red-500" : ""
                )}
              />
              <MessageCircle className="h-6 w-6 cursor-pointer scale-x-[-1]" />
              <Send className="h-6 w-6 cursor-pointer" />
            </div>
            <Bookmark className="h-6 w-6 cursor-pointer" />
          </div>
          <div className="font-bold text-sm mb-2">{post.likesCount} 次点赞</div>
          <div className="text-[10px] text-muted-foreground uppercase mb-3">
            {new Date(post.createdAt).toLocaleString()}
          </div>

          {/* Comment Input */}
          <form
            onSubmit={handleCommentSubmit}
            className="flex items-center gap-2 border-t pt-3"
          >
            <input
              className="flex-1 text-sm outline-none bg-transparent"
              placeholder="添加评论..."
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              disabled={isPending}
            />
            <button
              type="submit"
              disabled={!commentBody.trim() || isPending}
              className="text-blue-500 font-bold text-sm disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "发布"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
