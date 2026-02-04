// actions/user.ts
"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notification"; // 引入 helper

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
