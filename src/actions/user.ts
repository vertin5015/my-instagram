// actions/user.ts
"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notification"; // 引入 helper

const SUGGESTED_PAGE_SIZE = 20;

export async function toggleFollow(targetUserId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");
    if (currentUser.id === targetUserId)
      throw new Error("Cannot follow yourself");

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // 取关
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUserId,
          },
        },
      });
      // 可选：取关时删除之前的关注通知
    } else {
      // 关注
      await prisma.follows.create({
        data: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      });

      // --- 触发通知: 关注 ---
      await createNotification({
        recipientId: targetUserId,
        issuerId: currentUser.id,
        type: "FOLLOW",
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { username: true },
    });

    revalidatePath("/");
    if (targetUser?.username) {
      revalidatePath(`/${targetUser.username}`);
    }

    return { success: true, isFollowing: !existingFollow };
  } catch (error) {
    console.error("[TOGGLE_FOLLOW_ERROR]", error);
    return { success: false, error: "Failed to update follow status" };
  }
}

export async function toggleLike(postId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  try {
    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { userId_postId: { userId: user.id, postId } },
      });
    } else {
      await prisma.like.create({
        data: { userId: user.id, postId },
      });

      // --- 触发通知: 点赞 ---
      // 1. 先查找帖子作者
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true },
      });

      if (post) {
        await createNotification({
          recipientId: post.userId,
          issuerId: user.id,
          type: "LIKE",
          postId: postId,
        });
      }
    }

    revalidatePath("/");
    revalidatePath(`/post/${postId}`);
    return { success: true };
  } catch (error) {
    console.error("Toggle like error:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function getAllSuggestedUsers(cursor?: string) {
  const user = await getCurrentUser();
  // 即使未登录也可以看推荐，但不能排除已关注的人(因为不知道你是谁)
  const userId = user?.id;

  const users = await prisma.user.findMany({
    take: SUGGESTED_PAGE_SIZE + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    where: {
      // 1. 排除自己
      id: { not: userId },
      // 2. 排除已经关注的人
      ...(userId && {
        followedBy: {
          none: {
            followerId: userId,
          },
        },
      }),
    },
    // 排序策略：可以是按粉丝数(如果schema有存count)、注册时间，或者随机(Prisma不支持原生随机，通常按ID或时间)
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      bio: true,
      // 获取一些额外信息用于展示，比如粉丝数
      _count: {
        select: {
          followedBy: true, // 粉丝数
        },
      },
    },
  });

  let nextCursor: string | undefined = undefined;
  if (users.length > SUGGESTED_PAGE_SIZE) {
    const nextItem = users.pop();
    nextCursor = nextItem?.id;
  }

  return {
    items: users,
    nextCursor,
  };
}

export type SearchResultUser = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  _count: {
    followedBy: number;
  };
};

export async function searchUsers(query: string): Promise<SearchResultUser[]> {
  if (!query.trim()) return [];

  const user = await getCurrentUser();
  const currentUserId = user?.id;

  try {
    const users = await prisma.user.findMany({
      where: {
        // 排除自己
        id: { not: currentUserId },
        OR: [
          // 模糊匹配用户名 (忽略大小写)
          { username: { contains: query, mode: "insensitive" } },
          // 模糊匹配昵称 (忽略大小写)
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      // 按粉丝数从高到低排序
      orderBy: {
        followedBy: {
          _count: "desc",
        },
      },
      take: 20, // 限制返回数量
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        _count: {
          select: {
            followedBy: true,
          },
        },
      },
    });

    return users;
  } catch (error) {
    console.error("Search users error:", error);
    return [];
  }
}
