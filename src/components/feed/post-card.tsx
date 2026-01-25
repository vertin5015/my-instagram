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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// 定义简单的接口 (未来从 Prisma 类型导入)
interface PostProps {
  id: string;
  username: string;
  imageUrl: string;
  caption: string;
  likes: number;
  timestamp: string;
}

export default function PostCard({ post }: { post: PostProps }) {
  return (
    <Card className="border-0 rounded-none md:rounded-lg md:border bg-background shadow-none md:shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-primary/20 transition">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${post.username}`} />
            <AvatarFallback>{post.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <Link
            href={`/profile/${post.username}`}
            className="font-bold text-sm hover:underline"
          >
            {post.username}
          </Link>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Image Container - 关键点：保持纵横比，防止布局抖动 */}
      {/* Ins 的图片通常是正方形或 4:5，这里使用 aspect-square 强制正方形占位 */}
      <div className="relative w-full aspect-square bg-muted">
        <Image
          src={post.imageUrl}
          alt={post.caption}
          fill
          className="object-cover"
          priority={Number(post.id) < 2} // 优先加载前两张图以提升 LCP
        />
      </div>

      {/* Action Buttons */}
      <div className="p-3 pb-1">
        <div className="flex justify-between mb-2">
          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 p-0 hover:text-red-500 hover:bg-transparent"
            >
              <Heart className="h-7 w-7" />
            </Button>
            <Link href={`/post/${post.id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 p-0 hover:bg-transparent scale-x-[-1]"
              >
                <MessageCircle className="h-7 w-7" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 p-0 hover:bg-transparent"
            >
              <Send className="h-7 w-7" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 p-0 hover:bg-transparent"
          >
            <Bookmark className="h-7 w-7" />
          </Button>
        </div>

        {/* Likes count */}
        <p className="font-bold text-sm mb-1">
          {post.likes.toLocaleString()} likes
        </p>

        {/* Caption */}
        <div className="text-sm mb-2">
          <span className="font-bold mr-2">{post.username}</span>
          <span className="break-words">{post.caption}</span>
        </div>

        {/* Comments Link */}
        <Link
          href={`/post/${post.id}`}
          className="text-muted-foreground text-sm mb-2 block"
        >
          View all 24 comments
        </Link>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
          {post.timestamp}
        </p>
      </div>

      <Separator className="hidden md:block" />

      {/* Add Comment Section (Desktop only usually) */}
      <div className="hidden md:flex items-center p-3 gap-3">
        <Smile className="h-6 w-6 text-muted-foreground" />
        <input
          type="text"
          placeholder="Add a comment..."
          className="flex-1 outline-none bg-transparent text-sm"
        />
        <Button
          variant="ghost"
          className="text-blue-500 font-bold hover:bg-transparent hover:text-blue-700"
        >
          Post
        </Button>
      </div>
    </Card>
  );
}
