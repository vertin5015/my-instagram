// app/[username]/saved/page.tsx (或者替换 tagged/page.tsx)
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Copy, LockKeyhole } from "lucide-react";
import { getUserSavedPosts } from "@/actions/profile";
import { getCurrentUser } from "@/lib/auth";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function SavedPage({ params }: Props) {
  const resolvedParams = await params;
  const username = resolvedParams.username;

  // 获取收藏数据
  const posts = await getUserSavedPosts(username);
  const currentUser = await getCurrentUser();
  const isSelf = currentUser?.username === username;

  // 如果不是自己，且我们遵循严格的隐私策略，界面上可以显示"无权访问"
  // (Action 层已经过滤了数据，所以 posts 长度为 0，这里只是优化 UI 提示)
  if (!isSelf) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full">
          <LockKeyhole className="w-8 h-8" />
        </div>
        <p>只有用户本人可以查看收藏的内容。</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-px">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="relative aspect-3/4 group bg-neutral-100 dark:bg-neutral-900 cursor-pointer"
        >
          {/* 图片显示逻辑 */}
          {post.images && post.images.length > 0 ? (
            <Image
              src={post.images[0]}
              alt={post.caption || "Saved post"}
              fill
              unoptimized={process.env.NODE_ENV === "development"}
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground bg-neutral-200 dark:bg-neutral-800">
              No Image
            </div>
          )}

          {/* 多图图标 (右上角) */}
          {post.images && post.images.length > 1 && (
            <div className="absolute top-2 right-2 text-white">
              <Copy className="w-5 h-5 drop-shadow-md transform rotate-180" />
            </div>
          )}

          {/* 悬停遮罩层 (黑色半透明 + 点赞评论数) */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-6 text-white font-bold text-base md:text-lg">
            <span className="flex items-center gap-1">
              <Heart className="fill-white w-4 h-4 md:w-6 md:h-6" />
              {post._count.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="fill-white w-4 h-4 md:w-6 md:h-6" />
              {post._count.comments}
            </span>
          </div>
        </Link>
      ))}

      {/* 空状态提示 */}
      {posts.length === 0 && (
        <div className="col-span-3 flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <div className="border-2 border-current rounded-full p-4 mb-2">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground">保存的内容</h3>
          <p className="text-sm">收藏的照片和视频会显示在这里。</p>
        </div>
      )}
    </div>
  );
}
