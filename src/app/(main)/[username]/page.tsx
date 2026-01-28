import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Copy } from "lucide-react";
import { getUserPosts } from "@/actions/profile";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function ProfilePostsPage({ params }: Props) {
  const resolvedParams = await params;
  const username = resolvedParams.username;
  const posts = await getUserPosts(username);

  return (
    <div className="grid grid-cols-3 gap-px">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="relative aspect-3/4 group bg-neutral-100 dark:bg-neutral-900"
        >
          {post.images && post.images.length > 0 ? (
            <Image
              src={post.images[0]}
              alt={post.caption || "Post image"}
              fill
              unoptimized={process.env.NODE_ENV === "development"}
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
              No Image
            </div>
          )}

          {post.images && post.images.length > 1 && (
            <div className="absolute top-2 right-2 text-white">
              <Copy className="w-5 h-5 drop-shadow-md transform rotate-180" />
            </div>
          )}

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-6 text-white font-bold text-base md:text-lg">
            <span className="flex items-center gap-1">
              {/* 使用 className 控制宽度和高度，取代固定的 size 属性 */}
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
      {posts.length === 0 && (
        <div className="col-span-3 py-10 text-center text-muted-foreground">
          暂无帖子
        </div>
      )}
    </div>
  );
}
