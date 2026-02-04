"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function getNotifications() {
  const user = await getCurrentUser();
  if (!user) return [];

  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      issuer: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      post: {
        select: {
          id: true,
          images: true, // 用于在通知右侧显示小图
        },
      },
    },
    take: 20, // 限制数量
  });

  return notifications;
}

// 标记所有为已读 (当用户打开通知页时调用)
export async function markNotificationsAsRead() {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.notification.updateMany({
    where: {
      recipientId: user.id,
      read: false,
    },
    data: {
      read: true,
    },
  });
}
