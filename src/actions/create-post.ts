"use server";

import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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

  // --- 优化开始 ---
  // 使用 Promise.all 并发上传所有图片，而不是一个接一个等待
  const uploadPromises = files.map((file) => {
    const ext = file.type?.split("/")[1] || "jpg";
    const key = `posts/${user.id}/${crypto.randomUUID()}.${ext}`;

    return put(key, file, {
      access: "public",
      contentType: file.type,
    });
  });

  // 等待所有图片上传完成
  const blobs = await Promise.all(uploadPromises);
  const urls = blobs.map((blob) => blob.url);
  // --- 优化结束 ---

  // 提取标签 (逻辑保持不变)
  const tagNames = Array.from(
    new Set(
      (caption.match(/#[^\s#@]+/g) || []).map((t) => t.slice(1).toLowerCase())
    )
  );

  const post = await prisma.post.create({
    data: {
      caption,
      images: urls,
      userId: user.id,
      tags:
        tagNames.length > 0
          ? {
              connectOrCreate: tagNames.map((name) => ({
                where: { name },
                create: { name },
              })),
            }
          : undefined,
    },
  });

  return post;
}
