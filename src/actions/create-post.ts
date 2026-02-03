// actions/create-post.ts
"use server";

import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache"; // 别忘了引入 revalidatePath
import sharp from "sharp";

type Area = { x: number; y: number; width: number; height: number };

export async function createPost(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const caption = (formData.get("caption") as string) || "";
  const files = formData.getAll("images") as File[];

  const cropDataString = formData.get("cropData") as string;
  const cropDataList: { crop: Area }[] = cropDataString
    ? JSON.parse(cropDataString)
    : [];

  if (!files.length) {
    throw new Error("No files to upload");
  }

  // 1. 上传图片 (保持你的优化逻辑)
  const uploadPromises = files.map(async (file, index) => {
    const ext = file.type?.split("/")[1] || "jpg";
    const key = `posts/${user.id}/${crypto.randomUUID()}.${ext}`;

    // 1. 读取文件为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer) as Buffer;

    // 2. 检查是否有对应的裁剪数据
    const cropInfo = cropDataList[index]?.crop;

    // 只有当 width 和 height > 0 时才执行裁剪
    if (cropInfo && cropInfo.width > 0 && cropInfo.height > 0) {
      try {
        // 使用 sharp 进行裁剪
        buffer = await sharp(buffer)
          .extract({
            left: Math.round(cropInfo.x),
            top: Math.round(cropInfo.y),
            width: Math.round(cropInfo.width),
            height: Math.round(cropInfo.height),
          })
          .toBuffer();
      } catch (error) {
        console.error("Server side crop failed, using original image", error);
      }
    }

    // 3. 上传处理后的 Buffer 到 Vercel Blob
    return put(key, buffer, {
      access: "public",
      contentType: file.type, // 或者 'image/jpeg' 如果 sharp 转换了格式
    });
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
