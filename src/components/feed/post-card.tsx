"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner"; // 确保你已经在 layout 中引入了 <Toaster />
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toggleFollow, toggleLike } from "@/actions/user";
import { useAuthStore } from "@/store/auth-store";
import { toggleSave } from "@/actions/post";
import { DialogTitle } from "@radix-ui/react-dialog";

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

  // 控制 Modal 状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentImageIndex > 0) setCurrentImageIndex((prev) => prev - 1);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentImageIndex < post.images.length - 1)
      setCurrentImageIndex((prev) => prev + 1);
  };

  // --- 修改核心：复制链接逻辑 ---
  const handleCopyLink = async () => {
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/post/${post.id}`;

      // 执行复制
      await navigator.clipboard.writeText(url);

      // 1. 先关闭弹窗 (如果在弹窗中点击)
      setIsDialogOpen(false);

      // 2. 弹出成功提示
      toast.success("复制post链接成功");
    } catch (err) {
      console.error("Copy failed", err);
      toast.error("复制失败，请重试");
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
    if (!currentUser) return toast.error("请先登录");
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
        toast.error("操作失败");
      }
    });
  };

  const handleSave = async () => {
    if (!currentUser) return toast.error("请先登录");
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);
    startTransition(async () => {
      try {
        const res = await toggleSave(post.id);
        if (res.success) {
          toast.success(res.isSaved ? "已收藏" : "已取消收藏");
        } else {
          setIsSaved(prevSaved);
          toast.error("操作失败");
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

        {/* --- 更多选项 Modal --- */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTitle></DialogTitle>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-foreground/80 focus-visible:ring-0"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent
            showCloseButton={false}
            className="p-0 gap-0 sm:max-w-[400px] border-none bg-background/95 backdrop-blur-sm overflow-hidden rounded-xl z-50"
          >
            {/* 选项 1: 打开帖子 */}
            <Link
              href={`/post/${post.id}`}
              className="w-full outline-none"
              onClick={() => setIsDialogOpen(false)}
            >
              <div className="flex items-center justify-center w-full h-12 text-sm font-semibold border-b cursor-pointer hover:bg-accent/50 transition-colors">
                打开帖子
              </div>
            </Link>

            {/* 选项 2: 复制链接 */}
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center w-full h-12 text-sm font-semibold border-b hover:bg-accent/50 transition-colors outline-none active:bg-accent"
            >
              复制链接
            </button>

            {/* 选项 3: 取消 */}
            <DialogClose asChild>
              <button className="flex items-center justify-center w-full h-12 text-sm font-semibold hover:bg-accent/50 transition-colors outline-none">
                取消
              </button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>

      {/* Image Slider */}
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
              />
            </div>
          ))}
        </div>
        {post.images.length > 1 && (
          <>
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
          </>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 pb-1">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-4">
            {/* Like Button */}
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

            {/* Comment Button */}
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

            {/* --- 修改：Send 按钮调用 handleCopyLink --- */}
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center hover:text-muted-foreground transition-colors -ml-1 active:scale-90 outline-none"
            >
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
