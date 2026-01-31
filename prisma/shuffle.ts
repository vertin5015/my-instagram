import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { faker } from "@faker-js/faker";

// 1. 初始化数据库连接 (与 lib/db.ts 逻辑保持一致)
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔀 Starting to shuffle post dates...");

  // 1. 获取所有帖子的 ID
  const posts = await prisma.post.findMany({
    select: { id: true },
  });

  console.log(`Found ${posts.length} posts. Shuffling timestamps...`);

  // 2. 遍历并更新每一个帖子
  // 使用 Promise.all 并发更新以提高速度
  const updatePromises = posts.map((post) => {
    // 生成一个过去 7 天内的随机时间
    const randomDate = faker.date.recent({ days: 7 });

    return prisma.post.update({
      where: { id: post.id },
      data: {
        createdAt: randomDate,
        // 可选：更新 updatedAt 保持一致，或者是稍后的时间
        updatedAt: randomDate,
      },
    });
  });

  await Promise.all(updatePromises);

  console.log("✅ All posts shuffled! Your feed should look natural now.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
