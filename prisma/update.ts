import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 生成随机 ID 防止图片缓存重复
const getRandomId = () => Math.floor(Math.random() * 100000);

// 1. 获取头像链接 (正方形, 400x400)
const getAvatarUrl = () => {
  return `https://picsum.photos/400/400?random=${getRandomId()}`;
};

// 2. 获取帖子图片链接 (限制为 Instagram 常用比例)
const getPostImageUrl = () => {
  // 随机选择三种比例之一，避免过宽或过高
  const types = [
    { w: 1080, h: 1080 }, // 1:1 正方形 (最常见)
    { w: 1080, h: 1350 }, // 4:5 竖向 (Instagram 推荐)
    { w: 1080, h: 800 }, // 4:3 横向 (比较稳妥)
  ];

  const size = types[Math.floor(Math.random() * types.length)];
  return `https://picsum.photos/${size.w}/${size.h}?random=${getRandomId()}`;
};

async function main() {
  console.log("🎨 Starting image update...");

  // --- 1. 更新用户头像 ---
  const users = await prisma.user.findMany({
    select: { id: true, username: true },
  });
  console.log(`👤 Found ${users.length} users. Updating avatars...`);

  // 并行更新用户
  await Promise.all(
    users.map((user) =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          image: getAvatarUrl(),
        },
      })
    )
  );
  console.log("✅ Users updated.");

  // --- 2. 更新帖子图片 ---
  const posts = await prisma.post.findMany({
    select: { id: true, images: true },
  });
  console.log(`📸 Found ${posts.length} posts. Updating post images...`);

  // 并行更新帖子
  await Promise.all(
    posts.map((post) => {
      // 保持该帖子原有的图片数量，但替换 URL
      const imageCount = post.images.length;

      // 生成新的图片数组
      const newImages = Array.from({ length: imageCount }).map(() =>
        getPostImageUrl()
      );

      return prisma.post.update({
        where: { id: post.id },
        data: {
          images: newImages,
        },
      });
    })
  );

  console.log("✅ Posts updated.");
  console.log("🎨 Image update completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
