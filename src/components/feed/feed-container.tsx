// components/feed/feed-container.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useInView } from "react-intersection-observer"; // 引入钩子
import { Loader2 } from "lucide-react";
import PostCard from "./post-card";
import { getFeedPosts } from "@/actions/post";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner"; // 或者使用 console.error

// 定义接口
interface FeedPost {
  id: string;
  username: string;
  userImage?: string;
  caption: string;
  images: string[];
  likes: number;
  commentsCount: number;
  timestamp: Date;
  isLiked: boolean;
  isFollowing: boolean;
}

export default function FeedContainer() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true); // 初始加载
  const [isFetchingMore, setIsFetchingMore] = useState(false); // 加载更多状态
  const [hasMore, setHasMore] = useState(true); // 是否还有数据

  // ref 用于监测底部元素，inView 为 true 时代表元素进入视口
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px", // 提前 100px 触发加载，体验更流畅
  });

  // 1. 初始加载
  useEffect(() => {
    const initFetch = async () => {
      try {
        const { items, nextCursor: cursor } = await getFeedPosts();
        setPosts(items);
        setNextCursor(cursor);
        if (!cursor) setHasMore(false);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    initFetch();
  }, []);

  // 2. 加载更多函数
  const loadMore = useCallback(async () => {
    if (isFetchingMore || !hasMore || !nextCursor) return;

    setIsFetchingMore(true);
    try {
      // 传入当前的 cursor
      const { items, nextCursor: newCursor } = await getFeedPosts(nextCursor);

      setPosts((prev) => [...prev, ...items]); // 追加数据
      setNextCursor(newCursor);

      if (!newCursor) setHasMore(false);
    } catch (error) {
      console.error("Failed to load more posts", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [nextCursor, hasMore, isFetchingMore]);

  // 3. 监听滚动触底
  useEffect(() => {
    if (inView && hasMore) {
      loadMore();
    }
  }, [inView, hasMore, loadMore]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={{
            ...post,
            timestamp: formatRelativeTime(post.timestamp),
          }}
        />
      ))}

      {/* 底部加载触发器 */}
      {hasMore ? (
        <div
          ref={ref} // 绑定监测点
          className="h-20 flex justify-center items-center py-4"
        >
          <Loader2 className="animate-spin text-muted-foreground h-6 w-6" />
        </div>
      ) : (
        <div className="py-10 text-center text-sm text-muted-foreground">
          没有更多内容了
        </div>
      )}
    </div>
  );
}
