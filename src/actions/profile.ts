"use server";

import { prisma } from "@/lib/db";

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
