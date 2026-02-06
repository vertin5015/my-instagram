// actions/explore.ts
"use server";

import { prisma } from "@/lib/db";

// 必须是 3 的倍数，保证网格整齐
const EXPLORE_PAGE_SIZE = 12;

export async function getExplorePosts(cursor?: string) {
  const posts = await prisma.post.findMany({
    orderBy: {
      // 探索页通常可以是按点赞数排序，或者随机，这里暂时按时间
      createdAt: "desc",
    },
    take: EXPLORE_PAGE_SIZE + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    select: {
      id: true,
      images: true, // 我们只需要第一张图
      caption: true, // 用于 alt
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  let nextCursor: string | undefined = undefined;
  if (posts.length > EXPLORE_PAGE_SIZE) {
    const nextItem = posts.pop();
    nextCursor = nextItem?.id;
  }

  return {
    items: posts,
    nextCursor,
  };
}

export async function getPostsByTag(tag: string, cursor?: string) {
  // 解码 URL 参数 (防止中文乱码)
  const decodedTag = decodeURIComponent(tag);

  const posts = await prisma.post.findMany({
    where: {
      tags: {
        some: {
          name: decodedTag,
        },
      },
    },
    orderBy: {
      createdAt: "desc", // 或者按点赞数 _count: { likes: 'desc' }
    },
    take: EXPLORE_PAGE_SIZE + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    select: {
      id: true,
      images: true,
      caption: true,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  let nextCursor: string | undefined = undefined;
  if (posts.length > EXPLORE_PAGE_SIZE) {
    const nextItem = posts.pop();
    nextCursor = nextItem?.id;
  }

  return {
    items: posts,
    nextCursor,
  };
}

export async function getTagInfo(tag: string) {
  const decodedTag = decodeURIComponent(tag);
  const tagData = await prisma.tag.findUnique({
    where: { name: decodedTag },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  });
  return tagData;
}
