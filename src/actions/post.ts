// actions/post.ts
"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const PAGE_SIZE = 5;

export async function toggleSave(postId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const existingSave = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    if (existingSave) {
      // 如果已收藏，则取消收藏
      await prisma.savedPost.delete({
        where: {
          userId_postId: {
            userId: user.id,
            postId,
          },
        },
      });
      revalidatePath("/");
      revalidatePath(`/post/${postId}`);
      return { success: true, isSaved: false };
    } else {
      // 如果未收藏，则添加收藏
      await prisma.savedPost.create({
        data: {
          userId: user.id,
          postId,
        },
      });
      revalidatePath("/");
      revalidatePath(`/post/${postId}`);
      return { success: true, isSaved: true };
    }
  } catch (error) {
    console.error("Toggle save error:", error);
    return { success: false, error: "Failed to toggle save" };
  }
}

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

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
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
      // 新增：查询当前用户是否收藏
      savedBy: userId
        ? {
            where: { userId: userId },
            select: { id: true },
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

  let nextCursor: string | undefined = undefined;
  if (posts.length > PAGE_SIZE) {
    const nextItem = posts.pop();
    nextCursor = nextItem?.id;
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

export async function getPostById(postId: string) {
  const user = await getCurrentUser();
  const userId = user?.id;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: { id: true, username: true, image: true, name: true },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, username: true, image: true },
          },
        },
      },
      _count: {
        select: { likes: true, comments: true },
      },
      likes: userId
        ? { where: { userId: userId }, select: { userId: true } }
        : false,
      savedBy: userId
        ? { where: { userId: userId }, select: { id: true } }
        : false,
    },
  });

  if (!post) return null;

  let isFollowing = false;
  if (userId && post.userId !== userId) {
    const follow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: post.userId,
        },
      },
    });
    isFollowing = !!follow;
  }

  return {
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
    isFollowing,
    comments: post.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      user: {
        id: comment.user.id,
        username: comment.user.username ?? "Unknown",
        image: comment.user.image ?? undefined,
      },
    })),
  };
}

async function syncPostMentions(postId: string, caption: string | null) {
  if (caption === null) return;

  // 正则匹配 @username (假设用户名由字母数字下划线点号组成)
  const regex = /@([a-zA-Z0-9_.]+)/g;
  const matches = caption.match(regex);

  if (!matches) {
    // 如果没有提及任何人，清空该帖子的提及列表 (用于编辑场景)
    await prisma.post.update({
      where: { id: postId },
      data: { mentionedUsers: { set: [] } },
    });
    return;
  }

  // 提取用户名 (去掉 @)
  const usernames = matches.map((tag) => tag.slice(1));
  // 去重
  const uniqueUsernames = Array.from(new Set(usernames));

  // 查找数据库中存在的用户
  const usersToConnect = await prisma.user.findMany({
    where: {
      username: { in: uniqueUsernames },
    },
    select: { id: true },
  });

  // 更新 Post 的 mentionedUsers 关联
  // 使用 set 可以覆盖之前的关系 (适用于编辑场景，删除了某人也能自动解绑)
  await prisma.post.update({
    where: { id: postId },
    data: {
      mentionedUsers: {
        set: usersToConnect.map((u) => ({ id: u.id })),
      },
    },
  });
}

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

  revalidatePath(`/post/${postId}`);
  revalidatePath("/");

  return { success: true, comment };
}

export async function deletePost(postId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });

  if (!post) throw new Error("Post not found");
  if (post.userId !== user.id) throw new Error("Unauthorized");

  try {
    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath("/");
    revalidatePath(`/${user.username}`);
    return { success: true };
  } catch (error) {
    console.error("Delete post error:", error);
    return { success: false, error: "Failed to delete post" };
  }
}

export async function updatePost(postId: string, caption: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });

  if (!post) throw new Error("Post not found");
  if (post.userId !== user.id) throw new Error("Unauthorized");

  try {
    // 1. 更新 Caption
    await prisma.post.update({
      where: { id: postId },
      data: { caption },
    });

    // 2. 关键：同步提及关系
    await syncPostMentions(postId, caption);

    revalidatePath(`/post/${postId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Update post error:", error);
    return { success: false, error: "Failed to update post" };
  }
}

export async function getUserTaggedPosts(username: string) {
  // 1. 找到目标用户
  const targetUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!targetUser) return [];

  // 2. 查询该用户被提及的帖子 (Tagged Posts)
  // Tagged 内容通常是公开的，或者遵循发帖人的隐私设置。这里暂定为公开。
  const posts = await prisma.post.findMany({
    where: {
      mentionedUsers: {
        some: {
          id: targetUser.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  return posts;
}
