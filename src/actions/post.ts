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
    isSaved: userId ? post.savedBy.length > 0 : false,
  }));

  return {
    items: formattedPosts,
    nextCursor,
  };
}

export async function getPostById(postId: string) {
  const user = await getCurrentUser();
  const userId = user?.id;

  // 定义评论的查询结构 (避免深层嵌套代码重复)
  const commentInclude = {
    user: { select: { id: true, username: true, image: true } },
    _count: { select: { likes: true } },
    likes: userId ? { where: { userId }, select: { userId: true } } : false,
  };

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: { id: true, username: true, image: true, name: true },
      },
      // 这里的 comments 只查顶层评论 (parentId 为 null)
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        include: {
          ...commentInclude,
          //以此类推，为了性能通常只取一层回复，点击“查看更多”再异步加载，
          //但为了简单起见，这里直接取出一层回复
          replies: {
            include: commentInclude,
            orderBy: { createdAt: "asc" }, // 回复通常按时间正序
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

  // ... isFollowing 逻辑保持不变 ...
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

  // 格式化评论数据的辅助函数
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatComment = (c: any) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    user: c.user,
    parentId: c.parentId,
    likesCount: c._count.likes,
    isLiked: userId ? c.likes.length > 0 : false,
    replies: c.replies?.map(formatComment) || [], // 递归格式化
  });

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
    isSaved: userId ? post.savedBy.length > 0 : false,
    // 使用新的格式化逻辑
    comments: post.comments.map(formatComment),
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

export async function createComment(
  postId: string,
  body: string,
  parentId?: string // 新增参数
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (!body.trim()) throw new Error("Comment cannot be empty");

  const comment = await prisma.comment.create({
    data: {
      body,
      postId,
      userId: user.id,
      parentId, // 存入数据库
    },
  });

  revalidatePath(`/post/${postId}`);
  revalidatePath("/"); // 刷新 Feed 页的评论数

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

export async function toggleCommentLike(commentId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: user.id,
          commentId,
        },
      },
    });

    if (existingLike) {
      await prisma.commentLike.delete({
        where: { userId_commentId: { userId: user.id, commentId } },
      });
      revalidatePath("/");
      return { success: true, isLiked: false };
    } else {
      await prisma.commentLike.create({
        data: { userId: user.id, commentId },
      });
      revalidatePath("/");
      return { success: true, isLiked: true };
    }
  } catch (error) {
    console.error("Toggle comment like error:", error);
    return { success: false, error: "Failed" };
  }
}
