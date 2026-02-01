// actions/post.ts
"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const PAGE_SIZE = 5;

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
    await prisma.post.update({
      where: { id: postId },
      data: { caption },
    });

    revalidatePath(`/post/${postId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update post" };
  }
}
