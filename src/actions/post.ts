// actions/post.ts
"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// 定义每页加载的数量
const PAGE_SIZE = 5;

// 接收 cursor 参数
export async function getFeedPosts(cursor?: string) {
  const user = await getCurrentUser();
  const userId = user?.id;

  let followingIds: Set<string> = new Set();
  if (userId) {
    const following = await prisma.follows.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    followingIds = new Set(following.map((f) => f.followingId));
  }

  // 查询逻辑修改
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1, // 多取一条，用于判断是否还有下一页
    cursor: cursor ? { id: cursor } : undefined, // 如果有 cursor，从该 ID 开始
    skip: cursor ? 1 : 0, // 如果有 cursor，跳过游标本身
    include: {
      user: {
        select: {
          id: true,
          username: true,
          image: true,
          name: true,
        },
      },
      likes: userId
        ? {
            where: { userId: userId },
            select: { userId: true },
          }
        : false,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  // 判断是否有下一页
  let nextCursor: string | undefined = undefined;
  if (posts.length > PAGE_SIZE) {
    const nextItem = posts.pop(); // 移除多取的那一条
    nextCursor = nextItem?.id; // 将该条 ID 作为下一次请求的游标
  }

  // 数据格式化
  const formattedPosts = posts.map((post) => ({
    id: post.id,
    userId: post.user.id,
    username: post.user.username ?? "Unknown",
    userImage: post.user.image ?? undefined,
    caption: post.caption ?? "",
    images: post.images,
    likes: post._count.likes,
    commentsCount: post._count.comments,
    timestamp: post.createdAt,
    isLiked: userId ? post.likes.length > 0 : false,
    isFollowing: userId ? followingIds.has(post.userId) : false,
  }));

  return {
    items: formattedPosts,
    nextCursor,
  };
}

// 1. 获取单条帖子详情 (包含评论和用户信息)
export async function getPostById(postId: string) {
  const user = await getCurrentUser();
  const userId = user?.id;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: { id: true, username: true, image: true },
      },
      comments: {
        orderBy: { createdAt: "desc" }, // 评论按时间倒序
        include: {
          user: {
            select: { id: true, username: true, image: true },
          },
        },
      },
      _count: {
        select: { likes: true, comments: true },
      },
      // 检查当前用户是否点赞
      likes: userId
        ? { where: { userId: userId }, select: { userId: true } }
        : false,
    },
  });

  if (!post) return null;

  return {
    ...post,
    isLiked: userId ? post.likes.length > 0 : false,
    likesCount: post._count.likes,
  };
}

// 2. 发布评论 Action
export async function createComment(postId: string, body: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  if (!body.trim()) throw new Error("Comment cannot be empty");

  const comment = await prisma.comment.create({
    data: {
      body,
      postId,
      userId: user.id,
    },
  });

  // 重新验证路径，让UI更新
  revalidatePath(`/post/${postId}`);
  revalidatePath("/"); // 更新首页的评论数

  return { success: true, comment };
}
