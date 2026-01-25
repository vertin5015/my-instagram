import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

// 这是一个 Server Component
export default function PostPage({ params }: { params: { id: string } }) {
  // 模拟获取单个数据
  const post = {
    id: params.id,
    username: `user_${params.id}`,
    imageUrl: `https://picsum.photos/seed/${Number(params.id) + 100}/800/800`,
    caption: `Detailed view of post ${params.id}. Next.js App Router makes dynamic routing easy.`,
    likes: 1024,
    timestamp: "2 DAYS AGO",
  };

  return (
    // 模仿 Ins 网页版详情页：左图右文结构
    // 在小屏上变为上下结构
    <div className="flex flex-col md:flex-row max-w-5xl mx-auto md:border md:rounded-lg bg-background md:h-[calc(100vh-100px)] md:max-h-[700px]">
      {/* 左侧：图片容器 */}
      <div className="relative w-full md:w-[60%] aspect-square md:aspect-auto bg-black flex items-center">
        <Image
          src={post.imageUrl}
          alt="Post detail"
          fill
          className="object-contain" // 确保图片完整显示
          priority
        />
      </div>

      {/* 右侧：侧边栏信息 */}
      <div className="flex flex-col flex-1 md:border-l w-full md:w-[40%] h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={`https://i.pravatar.cc/150?u=${post.username}`}
              />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <span className="font-bold text-sm">{post.username}</span>
          </div>
          <MoreHorizontal className="h-5 w-5" />
        </div>

        {/* 评论滚动区 (中间部分) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {/* Caption 作为第一条评论 */}
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage
                src={`https://i.pravatar.cc/150?u=${post.username}`}
              />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <span className="font-bold mr-2">{post.username}</span>
              <span>{post.caption}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {post.timestamp}
              </p>
            </div>
          </div>

          {/* 模拟其他评论 */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback>C{i}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <span className="font-bold mr-2">commenter_{i}</span>
                <span>This is a sample comment to fill up space.</span>
              </div>
            </div>
          ))}
        </div>

        {/* 底部操作栏 (固定在底部) */}
        <div className="border-t bg-background shrink-0">
          <div className="flex justify-between p-3 pb-1">
            <div className="flex gap-4">
              <Heart className="h-7 w-7 cursor-pointer hover:text-muted-foreground" />
              <MessageCircle className="h-7 w-7 cursor-pointer hover:text-muted-foreground scale-x-[-1]" />
              <Send className="h-7 w-7 cursor-pointer hover:text-muted-foreground" />
            </div>
            <Bookmark className="h-7 w-7 cursor-pointer hover:text-muted-foreground" />
          </div>
          <p className="font-bold text-sm px-3 mb-1">{post.likes} likes</p>
          <p className="text-xs text-muted-foreground px-3 pb-3 border-b">
            {post.timestamp}
          </p>
          {/* Add Comment */}
          <div className="flex items-center p-3 gap-2">
            <Smile className="h-6 w-6 text-muted-foreground" />
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 outline-none bg-transparent text-sm"
            />
            <Button
              variant="ghost"
              className="text-blue-500 font-bold hover:bg-transparent p-0"
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
