// components/post/post-view.tsx
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createComment, toggleSave } from "@/actions/post";
import { toggleFollow, toggleLike } from "@/actions/user";
import { useAuthStore } from "@/store/auth-store";
import { PostOptions } from "@/components/post/post-options";
import { ParsedCaption } from "./parsed-caption";

type PostDetail = {
  id: string;
  userId: string;
  username: string;
  userImage?: string;
  caption: string;
  images: string[];
  likes: number;
  commentsCount: number;
  timestamp: Date;
  isLiked: boolean;
  isFollowing: boolean;
  isSaved: boolean;
  comments: Array<{
    id: string;
    body: string;
    createdAt: Date;
    user: {
      id: string;
      username: string;
      image?: string;
    };
  }>;
};

export default function PostView({ post }: { post: PostDetail }) {
  const { user: currentUser } = useAuthStore();
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [commentBody, setCommentBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isFollowing, setIsFollowing] = useState(post.isFollowing);
  const [isFollowPending, startFollowTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);

  const [isAnimating, setIsAnimating] = useState(false);
  const [isLikePending, startLikeTransition] = useTransition();

  const handlePrev = () => setCurrentImageIndex((p) => Math.max(0, p - 1));
  const handleNext = () =>
    setCurrentImageIndex((p) => Math.min(post.images.length - 1, p + 1));

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

  const handleSave = async () => {
    if (!currentUser) return toast.error("请先登录");
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);

    // 注意：这里没有使用 transition，简单处理
    try {
      const res = await toggleSave(post.id);
      if (!res.success) setIsSaved(prevSaved);
      else toast.success(res.isSaved ? "已收藏" : "已取消收藏");
    } catch {
      setIsSaved(prevSaved);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return toast.error("请先登录");

    const prevStatus = isFollowing;
    setIsFollowing(!prevStatus);

    startTransition(() => {
      toggleFollow(post.userId).then((res) => {
        if (!res.success) {
          setIsFollowing(prevStatus);
          toast.error("关注失败");
        } else {
          router.refresh();
        }
      });
    });
  };

  const handleLike = () => {
    if (!currentUser) return toast.error("请先登录");

    const prevIsLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prevIsLiked);
    setLikesCount(prevIsLiked ? prevCount - 1 : prevCount + 1);

    if (!prevIsLiked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }

    startLikeTransition(async () => {
      const res = await toggleLike(post.id);
      if (!res.success) {
        setIsLiked(prevIsLiked);
        setLikesCount(prevCount);
        toast.error("操作失败");
      }
    });
  };

  const isSelf = currentUser?.id === post.userId;

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
              <AvatarImage src={post.userImage} />
              <AvatarFallback>{post.username?.[0]}</AvatarFallback>
            </Avatar>
            <span className="font-bold text-sm hover:opacity-80 cursor-pointer">
              {post.username}
            </span>

            {!isSelf && (
              <>
                <span className="text-muted-foreground text-[10px]">•</span>
                <button
                  onClick={handleFollow}
                  className={cn(
                    "font-semibold text-xs transition-colors",
                    isFollowing
                      ? "text-muted-foreground hover:text-foreground"
                      : "text-blue-500 hover:text-blue-700"
                  )}
                >
                  {isFollowing ? "已关注" : "关注"}
                </button>
              </>
            )}
          </div>
          <PostOptions
            postId={post.id}
            userId={post.userId}
            caption={post.caption || ""}
            isOwner={isSelf}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {/* Caption */}
          {post.caption && (
            <div className="flex gap-3 items-start">
              {" "}
              {/* items-start 更好 */}
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={post.userImage} />
                <AvatarFallback>{post.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="text-sm flex-1">
                {/* Username */}
                <Link
                  href={`/${post.username}`}
                  className="font-bold mr-2 hover:opacity-80"
                >
                  {post.username}
                </Link>

                {/* 使用 ParsedCaption，PostView 中通常不需要折叠 */}
                <div className="inline">
                  <ParsedCaption text={post.caption} defaultExpanded={true} />
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(post.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Comments List */}
          {post.comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.user.image} />
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
              <button
                onClick={handleLike}
                className="flex items-center justify-center active:scale-90 transition-transform outline-none"
              >
                <Heart
                  className={cn(
                    "h-6 w-6 cursor-pointer transition-colors duration-300",
                    isLiked
                      ? "fill-red-500 text-red-500"
                      : "hover:text-muted-foreground",
                    isAnimating && "animate-bounce-custom"
                  )}
                />
              </button>
              <MessageCircle className="h-6 w-6 cursor-pointer scale-x-[-1]" />
              <Send className="h-6 w-6 cursor-pointer" />
            </div>
            <button
              onClick={handleSave}
              className="active:scale-90 transition-transform"
            >
              <Bookmark
                className={cn(
                  "h-6 w-6 cursor-pointer",
                  isSaved
                    ? "fill-black text-black dark:fill-white dark:text-white"
                    : ""
                )}
              />
            </button>
          </div>
          <div className="font-bold text-sm mb-2">{likesCount} 次点赞</div>
          <div className="text-[10px] text-muted-foreground uppercase mb-3">
            {new Date(post.timestamp).toLocaleString()}
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
