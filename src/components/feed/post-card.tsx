"use client";

import { useState } from "react";
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
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils"; // 假设你有 shadcn 的 cn 工具

// 模拟数据接口
interface PostProps {
  id: string;
  username: string;
  images: string[]; // 改为字符串数组以支持多图
  caption: string;
  likes: number;
  commentsCount: number; // 新增评论数
  timestamp: string;
  isFollowing?: boolean; // 新增关注状态
}

// 工具函数：中文数字格式化
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
  // 正则匹配 #tag 或 @user
  // 捕获组: (#[^\s#]+) 匹配tag, (@[^\s@]+) 匹配at
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false); // 简单的点赞状态模拟

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

  return (
    <Card className="border-0 rounded-none md:rounded-lg bg-background shadow-none overflow-hidden max-w-[470px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-primary/20 transition">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${post.username}`} />
            <AvatarFallback>{post.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-sm leading-none gap-0.5">
            <div className="flex items-center gap-2">
              <Link
                href={`/${post.username}`}
                className="font-bold hover:opacity-80 transition-opacity"
              >
                {post.username}
              </Link>
              <span className="text-muted-foreground text-[10px]">•</span>
              <button className="text-blue-500 font-semibold text-xs hover:text-blue-700 transition-colors">
                关注
              </button>
            </div>
            {/* 可选：显示地点或原创音频信息 */}
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

      {/* Image Carousel Container */}
      <div className="relative w-full aspect-square bg-muted group">
        <Image
          src={post.images[currentImageIndex]}
          alt={`Post by ${post.username}`}
          fill
          className="object-cover transition-opacity duration-300"
          priority={Number(post.id) < 2}
        />

        {/* Left Arrow */}
        {currentImageIndex > 0 && (
          <button
            onClick={handlePrevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Right Arrow */}
        {currentImageIndex < post.images.length - 1 && (
          <button
            onClick={handleNextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Carousel Indicators (Dots) - 多图时显示 */}
        {post.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {post.images.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all shadow-sm",
                  idx === currentImageIndex
                    ? "bg-primary w-1.5"
                    : "bg-white/60 w-1.5"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons & Counts Area */}
      <div className="p-3 pb-1">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-4">
            {/* Like Button & Count */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLiked(!isLiked)}
                className={cn(
                  "h-8 w-8 p-0 hover:bg-transparent transition-transform active:scale-90",
                  isLiked ? "text-red-500" : "hover:text-muted-foreground"
                )}
              >
                <Heart className={cn("h-7 w-7", isLiked && "fill-current")} />
              </Button>
              <span className="text-sm font-semibold min-w-[2ch]">
                {formatNumber(isLiked ? post.likes + 1 : post.likes)}
              </span>
            </div>

            {/* Comment Button & Count */}
            <div className="flex items-center gap-1.5">
              <Link href={`/post/${post.id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 hover:bg-transparent hover:text-muted-foreground scale-x-[-1]"
                >
                  <MessageCircle className="h-7 w-7" />
                </Button>
              </Link>
              <span className="text-sm font-semibold min-w-[2ch]">
                {formatNumber(post.commentsCount)}
              </span>
            </div>

            {/* Send Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 hover:bg-transparent hover:text-muted-foreground -ml-1"
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 hover:bg-transparent hover:text-muted-foreground"
          >
            <Bookmark className="h-7 w-7" />
          </Button>
        </div>

        {/* Caption Section */}
        <div className="mb-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-bold text-sm">{post.username}</span>
            <ParsedCaption
              text={post.caption}
              isExpanded={isExpanded}
              setIsExpanded={setIsExpanded}
            />
          </div>
        </div>

        {/* Timestamp */}
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">
          {post.timestamp}
        </p>
      </div>

      <Separator className="hidden md:block opacity-50" />

      {/* Add Comment Section */}
      <div className="hidden md:flex items-center p-3 gap-3">
        <Smile className="h-6 w-6 text-muted-foreground cursor-pointer hover:text-foreground transition" />
        <input
          type="text"
          placeholder="添加评论..."
          className="flex-1 outline-none bg-transparent text-sm placeholder:text-muted-foreground/70"
        />
        <Button
          variant="ghost"
          className="text-blue-500 font-semibold hover:bg-transparent hover:text-blue-700 text-sm px-0 h-auto"
        >
          发布
        </Button>
      </div>
    </Card>
  );
}
