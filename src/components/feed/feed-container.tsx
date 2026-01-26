"use client";

import { Loader2 } from "lucide-react"; // 确保安装了 lucide-react
import PostCard from "./post-card";

export default function FeedContainer() {
  // 模拟数据：结构必须完全匹配 PostCard 中定义的 PostProps
  const mockPosts = Array.from({ length: 5 }, (_, i) => ({
    id: `${i}`,
    username: `user_${i}`,
    // 修改 1: imageUrl -> images (数组)
    // 模拟多图：偶数 ID 的帖子有 3 张图，奇数 ID 的只有 1 张
    images:
      i % 2 === 0
        ? [
            `https://picsum.photos/seed/${i}/600/600`,
            `https://picsum.photos/seed/${i + 100}/600/600`,
            `https://picsum.photos/seed/${i + 200}/600/600`,
          ]
        : [`https://picsum.photos/seed/${i}/600/600`],
    caption: `Trying out the new carousel feature! 📸 This is a beautiful caption for post number ${i}. @user_${i + 1} check this out! #react #nextjs #instagram`,
    // 模拟点赞数
    likes: (i + 1) * 1234,
    // 修改 2: 新增 commentsCount
    commentsCount: (i + 1) * 15,
    timestamp: "2 HOURS AGO",
    // 修改 3: 新增 isFollowing 状态
    isFollowing: i % 3 === 0,
  }));

  return (
    <div className="flex flex-col gap-8 pb-10">
      {mockPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* 无限滚动触发锚点 */}
      <div
        id="infinite-scroll-trigger"
        className="h-20 flex justify-center items-center py-4"
      >
        {/* 这里展示 Loading 状态，模拟正在获取更多 */}
        <Loader2 className="animate-spin text-muted-foreground h-6 w-6" />
      </div>
    </div>
  );
}
