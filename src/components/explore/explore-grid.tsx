"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Copy, Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { getExplorePosts } from "@/actions/explore";
import { cn } from "@/lib/utils";

type ExplorePost = {
  id: string;
  images: string[];
  caption: string | null;
  _count: {
    likes: number;
    comments: number;
  };
};

type Props = {
  initialPosts: ExplorePost[];
  initialCursor?: string;
};

export function ExploreGrid({ initialPosts, initialCursor }: Props) {
  const [posts, setPosts] = useState<ExplorePost[]>(initialPosts);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(!!initialCursor);

  // 监听底部元素，触底时触发
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px", // 提前 100px 触发加载
  });

  useEffect(() => {
    if (inView && hasMore && !isLoading && cursor) {
      loadMore();
    }
  }, [inView, hasMore, isLoading, cursor]);

  const loadMore = async () => {
    if (isLoading || !cursor) return;
    setIsLoading(true);

    try {
      const res = await getExplorePosts(cursor);
      setPosts((prev) => [...prev, ...res.items]);
      setCursor(res.nextCursor);
      setHasMore(!!res.nextCursor);
    } catch (error) {
      console.error("Failed to load more posts", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[935px] mx-auto pb-10">
      <div className="grid grid-cols-3 gap-px">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="relative aspect-square group bg-neutral-100 dark:bg-neutral-900 overflow-hidden cursor-pointer"
          >
            {post.images && post.images.length > 0 ? (
              <Image
                src={post.images[0]}
                alt={post.caption || "Post image"}
                fill
                sizes="(max-width: 768px) 33vw, 300px"
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-muted-foreground text-xs">
                No Image
              </div>
            )}

            {/* 多图图标 */}
            {post.images && post.images.length > 1 && (
              <div className="absolute top-2 right-2 text-white/90">
                <Copy className="w-4 h-4 md:w-5 md:h-5 drop-shadow-md transform rotate-180" />
              </div>
            )}

            {/* 悬停遮罩层 */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4 md:gap-8 text-white font-bold select-none">
              <span className="flex items-center gap-1">
                <Heart className="fill-white w-5 h-5 md:w-6 md:h-6" />
                <span className="text-sm md:text-lg">{post._count.likes}</span>
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="fill-white w-5 h-5 md:w-6 md:h-6 scale-x-[-1]" />
                <span className="text-sm md:text-lg">
                  {post._count.comments}
                </span>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* 底部加载状态 / 触发器 */}
      <div ref={ref} className="py-8 flex justify-center w-full">
        {isLoading && (
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-sm text-muted-foreground">没有更多内容了</p>
        )}
      </div>

      {posts.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          暂无热门帖子
        </div>
      )}
    </div>
  );
}
