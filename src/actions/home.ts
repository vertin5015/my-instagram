// actions/home.ts
"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// 获取最近发帖的用户 (用于顶部 Story 栏)
// 逻辑：查找最近发帖的 Post，去重 User，排除自己
export async function getRecentStoryUsers() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  // 1. 获取最近的 20 条帖子（包含用户信息）
  const recentPosts = await prisma.post.findMany({
    take: 20,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
    },
  });

  // 2. 数据处理：去重 & 排除自己
  const uniqueUsersMap = new Map();

  for (const post of recentPosts) {
    if (post.userId !== currentUser.id && !uniqueUsersMap.has(post.userId)) {
      uniqueUsersMap.set(post.userId, post.user);
    }
    // 只要找够 3 个就停止
    if (uniqueUsersMap.size >= 3) break;
  }

  return Array.from(uniqueUsersMap.values());
}

// 获取随机推荐用户 (用于右侧栏)
// 逻辑：获取未关注的用户，随机取 5 个
export async function getSuggestedUsers() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  // 1. 获取我已经关注的人的 ID 列表
  const following = await prisma.follows.findMany({
    where: {
      followerId: currentUser.id,
    },
    select: {
      followingId: true,
    },
  });
  const followingIds = following.map((f) => f.followingId);

  // 2. 查询候选池 (排除自己，排除已关注)
  // 为了性能，限制 take 数量 (比如 50)，然后在内存中随机
  const candidates = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: currentUser.id } }, // 排除自己
        { id: { notIn: followingIds } }, // 排除已关注
      ],
    },
    select: {
      id: true,
      username: true,
      image: true,
      name: true, // 用于显示全名或 "New to Instagram"
    },
    take: 50,
  });

  // 3. 随机打乱数组并取前 5 个
  const shuffled = candidates.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
}
