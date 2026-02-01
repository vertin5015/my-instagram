"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Smile,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toggleFollow, toggleLike } from "@/actions/user";
import { useAuthStore } from "@/store/auth-store";
import { toggleSave } from "@/actions/post";

interface PostProps {
  id: string;
  userId: string;
  username: string;
  userImage?: string;
  images: string[];
  caption: string;
  likes: number;
  isLiked: boolean;
  commentsCount: number;
  timestamp: string;
  isFollowing?: boolean;
  isSaved?: boolean;
}

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1).replace(/\.0$/, "") + "万";
  }
  return num.toLocaleString();
};

// 子组件：解析简介中的 Tag 和 @用户
const ParsedCaption = ({
  text,
  isExpanded,
  setIsExpanded,
}: {
  text: string;
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
}) => {
  const regex = /((?:#|@)[^\s#@]+)/g;
  const parts = text.split(regex);

  // 截断逻辑：如果不展开且文本过长(例如超过60字)，则截断
  const shouldTruncate = text.length > 60 && !isExpanded;
  const displayParts = shouldTruncate ? text.slice(0, 60).split(regex) : parts;

  return (
    <div className="text-sm leading-relaxed wrap-break-word">
      {displayParts.map((part, index) => {
        if (part.startsWith("#")) {
          const tag = part.slice(1);
          return (
            <Link
              key={index}
              href={`/explore/search/keyword/?q=${tag}`}
              className="text-blue-900 dark:text-blue-100 hover:underline mr-1"
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith("@")) {
          const user = part.slice(1);
          return (
            <Link
              key={index}
              href={`/${user}`}
              className="text-blue-900 font-semibold hover:underline mr-1"
            >
              {part}
            </Link>
          );
        }
        return <span key={index}>{part}</span>;
      })}

      {/* 展开/收起 按钮 */}
      {text.length > 60 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground text-xs font-medium ml-1 hover:text-primary"
        >
          {isExpanded ? " 收起" : "... 更多"}
        </button>
      )}
    </div>
  );
};

export default function PostCard({ post }: { post: PostProps }) {
  const { user: currentUser } = useAuthStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [isPending, startTransition] = useTransition();
  const [isFollowing, setIsFollowing] = useState(post.isFollowing || false);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentImageIndex < post.images.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
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
        }
      });
    });
  };

  const handleLike = async () => {
    if (!currentUser) {
      return toast.error("请先登录");
    }

    const prevIsLiked = isLiked;
    const prevLikesCount = likesCount;

    setIsLiked(!prevIsLiked);
    setLikesCount(prevIsLiked ? prevLikesCount - 1 : prevLikesCount + 1);

    if (!prevIsLiked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }

    startTransition(async () => {
      const res = await toggleLike(post.id);
      if (!res.success) {
        setIsLiked(prevIsLiked);
        setLikesCount(prevLikesCount);
        toast.error("操作失败，请重试");
      }
    });
  };

  const handleSave = async () => {
    if (!currentUser) return toast.error("请先登录");

    const prevSaved = isSaved;
    // 乐观 UI 更新
    setIsSaved(!prevSaved);

    startTransition(async () => {
      try {
        const res = await toggleSave(post.id);
        if (res.success) {
          toast.success(res.isSaved ? "已收藏" : "已取消收藏");
        } else {
          // 失败回滚
          setIsSaved(prevSaved);
          toast.error("操作失败，请重试");
        }
      } catch (error) {
        setIsSaved(prevSaved);
        toast.error("网络错误");
      }
    });
  };

  const isSelf = currentUser?.username === post.username;

  return (
    <Card className="border-0 rounded-none md:rounded-lg gap-4 bg-background shadow-none overflow-hidden w-full max-w-[470px] mx-auto ">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Link href={`/${post.username}`}>
            <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-primary/20 transition">
              <AvatarImage src={post.userImage || `/avatar-default.png`} />
              <AvatarFallback>{post.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col text-sm leading-none gap-0.5">
            <div className="flex items-center gap-2">
              <Link
                href={`/${post.username}`}
                className="font-bold hover:opacity-80 transition-opacity"
              >
                {post.username}
              </Link>

              {!isSelf && (
                <>
                  <span className="text-muted-foreground text-[10px]">•</span>
                  <button
                    disabled={isPending}
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
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-foreground/80"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative w-full aspect-4/5 bg-muted overflow-hidden group rounded-sm">
        <div
          className="flex w-full h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
        >
          {post.images.map((imgUrl, index) => (
            <div key={index} className="w-full h-full shrink-0 relative">
              <Image
                src={imgUrl}
                alt={`Post image ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 470px"
                unoptimized={process.env.NODE_ENV === "development"}
              />
            </div>
          ))}
        </div>

        {post.images.length > 1 && (
          <>
            {/* Left Arrow: 第一张时不显示 */}
            <button
              onClick={handlePrevImage}
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-all z-10",
                currentImageIndex === 0
                  ? "hidden"
                  : "opacity-0 group-hover:opacity-100"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Right Arrow: 最后一张时不显示 */}
            <button
              onClick={handleNextImage}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-all z-10",
                currentImageIndex === post.images.length - 1
                  ? "hidden"
                  : "opacity-0 group-hover:opacity-100"
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* 指示器 Dots */}
        {post.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {post.images.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all shadow-sm",
                  idx === currentImageIndex
                    ? "bg-white w-1.5 scale-125"
                    : "bg-white/50 w-1.5"
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-3 pb-1">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleLike}
                disabled={isPending}
                className="flex items-center justify-center transition-transform active:scale-90 outline-none"
              >
                <Heart
                  className={cn(
                    "h-6 w-6 transition-colors duration-300",
                    isLiked
                      ? "fill-red-500 text-red-500"
                      : "text-foreground hover:text-muted-foreground",
                    isAnimating && "animate-bounce-custom"
                  )}
                />
              </button>
              <span className="text-sm font-semibold min-w-[2ch]">
                {formatNumber(likesCount)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Link href={`/post/${post.id}`} className="flex items-center">
                <button className="flex items-center justify-center hover:text-muted-foreground transition-colors scale-x-[-1]">
                  <MessageCircle className="h-6 w-6" />
                </button>
              </Link>
              <span className="text-sm font-semibold min-w-[2ch]">
                {formatNumber(post.commentsCount)}
              </span>
            </div>

            <button className="flex items-center justify-center hover:text-muted-foreground transition-colors -ml-1">
              <Send className="h-6 w-6" />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center justify-center hover:text-muted-foreground transition-colors active:scale-90"
          >
            <Bookmark
              className={cn(
                "h-6 w-6 transition-colors",
                isSaved
                  ? "fill-black text-black dark:fill-white dark:text-white"
                  : ""
              )}
            />
          </button>
        </div>

        <div className="mb-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <Link href={`/${post.username}`} className="font-bold text-sm">
              {post.username}
            </Link>
            <ParsedCaption
              text={post.caption}
              isExpanded={isExpanded}
              setIsExpanded={setIsExpanded}
            />
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">
          {post.timestamp}
        </p>
      </div>

      <Separator className="hidden md:block opacity-50" />
    </Card>
  );
}
