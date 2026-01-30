// actions/user.ts
"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleFollow(targetUserId: string) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    if (currentUser.id === targetUserId) {
      throw new Error("Cannot follow yourself");
    }

    // 1. 检查当前是否已关注
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      },
    });

    // 2. 这里的逻辑是：如果有记录则删除（取关），没记录则创建（关注）
    if (existingFollow) {
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUserId,
          },
        },
      });
    } else {
      await prisma.follows.create({
        data: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      });
      // TODO: 这里可以添加发送通知的逻辑
    }

    // 3. 获取目标用户的 username 用于刷新路径
    // 并不是必须的，但为了精确刷新 Profile 页面是很好的
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { username: true },
    });

    // 4. 刷新缓存
    revalidatePath("/"); // 刷新首页 Feed 流
    if (targetUser?.username) {
      revalidatePath(`/${targetUser.username}`); // 刷新对方的个人主页
    }

    return {
      success: true,
      isFollowing: !existingFollow, // 返回新的状态
    };
  } catch (error) {
    console.error("[TOGGLE_FOLLOW_ERROR]", error);
    return { success: false, error: "Failed to update follow status" };
  }
}
