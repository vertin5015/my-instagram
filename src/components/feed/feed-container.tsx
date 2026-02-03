"use client";

import { useEffect, useState, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import PostCard from "./post-card";
import { getFeedPosts } from "@/actions/post";
import { formatRelativeTime } from "@/lib/utils";

interface FeedPost {
  id: string;
  userId: string;
  username: string;
  userImage?: string;
  caption: string;
  images: string[];
  likes: number;
  commentsCount: number;
  timestamp: Date;
  isLiked: boolean;
  isFollowing: boolean;
  isSaved: boolean;
}

export default function FeedContainer() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ref 用于监测底部元素，inView 为 true 时代表元素进入视口
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

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

  const loadMore = useCallback(async () => {
    if (isFetchingMore || !hasMore || !nextCursor) return;

    setIsFetchingMore(true);
    try {
      const { items, nextCursor: newCursor } = await getFeedPosts(nextCursor);

      setPosts((prev) => [...prev, ...items]);
      setNextCursor(newCursor);

      if (!newCursor) setHasMore(false);
    } catch (error) {
      console.error("获取更多 posts 失败", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [nextCursor, hasMore, isFetchingMore]);

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
    <div className="flex flex-col gap-0 pb-10">
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
        <div ref={ref} className="h-20 flex justify-center items-center py-4">
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
