import { prisma } from "@/lib/db";
import { NotificationType } from "@prisma/client";

export async function createNotification({
  recipientId,
  issuerId,
  type,
  postId,
  commentId,
}: {
  recipientId: string;
  issuerId: string;
  type: NotificationType;
  postId?: string;
  commentId?: string;
}) {
  try {
    // 1. 自己不能给自己发通知
    if (recipientId === issuerId) return;

    // 2. 避免重复通知 (特别是点赞，用户可能反复点赞取消)
    // 对于 LIKE 和 FOLLOW，我们通常只保留最近的一条
    if (type === "LIKE" || type === "FOLLOW") {
      const existing = await prisma.notification.findFirst({
        where: {
          recipientId,
          issuerId,
          type,
          postId, // 对于 FOLLOW，postId 是 undefined，逻辑也成立
        },
      });

      if (existing) {
        // 如果已存在，更新时间即可，不重复创建
        await prisma.notification.update({
          where: { id: existing.id },
          data: { createdAt: new Date(), read: false },
        });
        return;
      }
    }

    // 3. 创建新通知
    await prisma.notification.create({
      data: {
        recipientId,
        issuerId,
        type,
        postId,
        commentId,
      },
    });
  } catch (error) {
    // 通知失败不应该阻塞主流程，只记录错误
    console.error("Notification creation failed:", error);
  }
}
