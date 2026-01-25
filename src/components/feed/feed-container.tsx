"use client"; // 未来这里需要交互，所以标记为 Client Component

import PostCard from "./post-card";

export default function FeedContainer() {
  // 模拟数据，未来这里会被 API 数据替换
  const mockPosts = Array.from({ length: 5 }, (_, i) => ({
    id: `${i}`,
    username: `user_${i}`,
    imageUrl: `/test1.jpeg`, // 使用随机图片服务
    caption: `This is a beautiful caption for post number ${i}. #react #nextjs #instagram`,
    likes: i * 123,
    timestamp: "2 HOURS AGO",
  }));

  return (
    <div className="flex flex-col gap-8">
      {mockPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* 无限滚动触发锚点 (预留)
        未来在这里放置一个看不见的 div，当它进入视图时触发加载更多函数
      */}
      <div
        id="infinite-scroll-trigger"
        className="h-10 flex justify-center items-center"
      >
        {/* 未来加载时显示 Loading Spinner */}
        {/* <Loader2 className="animate-spin text-muted-foreground" /> */}
      </div>
    </div>
  );
}
