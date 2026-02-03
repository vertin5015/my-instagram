// actions/create-post.ts
"use server";

import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache"; // 别忘了引入 revalidatePath

export async function createPost(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const caption = (formData.get("caption") as string) || "";
  const files = formData.getAll("images") as File[];

  if (!files.length) {
    throw new Error("No files to upload");
  }

  // 1. 上传图片 (保持你的优化逻辑)
  const uploadPromises = files.map((file) => {
    const ext = file.type?.split("/")[1] || "jpg";
    const key = `posts/${user.id}/${crypto.randomUUID()}.${ext}`;
    return put(key, file, { access: "public", contentType: file.type });
  });

  const blobs = await Promise.all(uploadPromises);
  const urls = blobs.map((blob) => blob.url);

  // 2. 解析 Hashtags (#)
  const tagNames = Array.from(
    new Set(
      (caption.match(/#[^\s#@]+/g) || []).map((t) => t.slice(1).toLowerCase())
    )
  );

  // --- 新增：解析 Mentions (@) ---
  const mentionedUsernames = Array.from(
    new Set((caption.match(/@([a-zA-Z0-9_.]+)/g) || []).map((t) => t.slice(1)))
  );

  // 为了防止用户输入不存在的用户名导致 create 失败，我们需要先查询存在的用户
  let validUserIds: string[] = [];
  if (mentionedUsernames.length > 0) {
    const validUsers = await prisma.user.findMany({
      where: {
        username: { in: mentionedUsernames },
      },
      select: { id: true },
    });
    validUserIds = validUsers.map((u) => u.id);
  }

  // 3. 创建帖子
  const post = await prisma.post.create({
    data: {
      caption,
      images: urls,
      userId: user.id,
      // 关联 Hashtags
      tags:
        tagNames.length > 0
          ? {
              connectOrCreate: tagNames.map((name) => ({
                where: { name },
                create: { name },
              })),
            }
          : undefined,
      // --- 新增：关联被标记的用户 ---
      mentionedUsers:
        validUserIds.length > 0
          ? {
              connect: validUserIds.map((id) => ({ id })),
            }
          : undefined,
    },
  });

  // 4. 刷新路径
  revalidatePath("/");
  revalidatePath(`/${user.username}`);

  return post;
}
