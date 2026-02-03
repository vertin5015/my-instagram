// app/[username]/tagged/page.tsx
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Copy, UserSquare2 } from "lucide-react";
import { getUserTaggedPosts } from "@/actions/post"; // 引入刚才写的 Action

type Props = {
  params: Promise<{ username: string }>;
};

export default async function TaggedPage({ params }: Props) {
  const resolvedParams = await params;
  const username = resolvedParams.username;

  const posts = await getUserTaggedPosts(username);

  return (
    <div className="grid grid-cols-3 gap-px pb-10">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="relative aspect-3/4 group bg-neutral-100 dark:bg-neutral-900 cursor-pointer block"
        >
          {post.images && post.images.length > 0 ? (
            <Image
              src={post.images[0]}
              alt={post.caption || "Tagged post"}
              fill
              unoptimized={process.env.NODE_ENV === "development"}
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground bg-neutral-200 dark:bg-neutral-800">
              No Image
            </div>
          )}

          {/* 多图图标 */}
          {post.images && post.images.length > 1 && (
            <div className="absolute top-2 right-2 text-white">
              <Copy className="w-5 h-5 drop-shadow-md transform rotate-180" />
            </div>
          )}

          {/* 悬停遮罩 */}
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

      {/* 空状态 */}
      {posts.length === 0 && (
        <div className="col-span-3 flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
          <div className="border-[1.5px] border-current rounded-full p-4 md:p-6 opacity-50">
            <UserSquare2 className="w-8 h-8 md:w-12 md:h-12" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground">暂无照片</h3>
            <p className="text-sm mt-2 max-w-[250px]">
              当人们在照片中标记你时，照片就会出现在这里。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
