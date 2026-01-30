"use server";

import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      _count: {
        select: {
          posts: true,
          followedBy: true,
          following: true,
        },
      },
    },
  });
  return user;
}

export async function getUserPosts(username: string) {
  const posts = await prisma.post.findMany({
    where: {
      user: {
        username,
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
export async function updateProfileImage(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file uploaded");
  }

  try {
    // 1. 上传到 Vercel Blob
    // 使用随机文件名防止缓存问题，或者覆盖原路径
    const blob = await put(
      `avatars/${user.id}/${Date.now()}-${file.name}`,
      file,
      {
        access: "public",
        contentType: file.type,
      }
    );

    // 2. 更新数据库
    await prisma.user.update({
      where: { id: user.id },
      data: {
        image: blob.url,
      },
    });

    // 3. 刷新页面
    revalidatePath(`/${user.username}`);
    revalidatePath("/"); // 刷新首页因为可能会显示我的头像

    return { success: true, url: blob.url };
  } catch (error) {
    console.error("Update profile image error:", error);
    return { success: false, error: "Failed to update image" };
  }
}

// 移除头像 (可选，Instagram 有这个选项)
export async function removeProfileImage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { image: null },
    });

    revalidatePath(`/${user.username}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to remove image" };
  }
}
