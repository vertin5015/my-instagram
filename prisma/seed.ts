import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";

// 1. 初始化数据库连接 (与 lib/db.ts 逻辑保持一致)
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 模拟 Instagram 风格的用户名
const INSTAGRAM_USERNAMES = [
  "creative_wanderer",
  "tech.ninja",
  "fitness_junkie_99",
  "foodie.adventures",
  "travel_with_mike",
  "design_daily",
  "coffee_and_code",
  "urban_photographer",
  "sunset.chaser",
  "minimalist.life",
];

const TAGS = [
  "react",
  "nextjs",
  "javascript",
  "coding",
  "lifestyle",
  "travel",
  "food",
  "nature",
  "photography",
  "vibes",
];

async function main() {
  console.log("🌱 Starting seeding...");

  // 2. 清理数据库
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follows.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Database cleaned.");

  const hashedPassword = await bcrypt.hash("123456", 10);
  const users = [];

  // 3. 创建用户
  for (let i = 0; i < 10; i++) {
    const email = `user${i + 1}@test.com`;
    const username =
      INSTAGRAM_USERNAMES[i] || faker.internet.username().toLowerCase();
    const image = `https://ui-avatars.com/api/?name=${username}&background=random&color=fff`;

    const user = await prisma.user.create({
      data: {
        email,
        username,
        name: faker.person.fullName(),
        hashedPassword,
        image,
        bio: faker.person.bio(),
        website: faker.internet.url(),
        emailVerified: new Date(),
      },
    });

    users.push(user);
    console.log(`👤 Created user: ${username}`);
  }

  // 4. 创建帖子
  for (const user of users) {
    const postsCount = faker.number.int({ min: 1, max: 5 });

    for (let j = 0; j < postsCount; j++) {
      const imagesCount = faker.number.int({ min: 1, max: 3 });
      const images = Array.from({ length: imagesCount }).map(() =>
        faker.image.urlLoremFlickr({
          category: "nature",
          width: 600,
          height: 600,
        })
      );

      const selectedTags = faker.helpers.arrayElements(TAGS, {
        min: 1,
        max: 3,
      });
      const captionText = faker.lorem.sentence();
      const captionWithTags = `${captionText} ${selectedTags.map((t) => `#${t}`).join(" ")}`;

      await prisma.post.create({
        data: {
          userId: user.id,
          caption: captionWithTags,
          images: images,
          tags: {
            connectOrCreate: selectedTags.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        },
      });
    }
  }
  console.log("📸 Posts created.");

  const allPosts = await prisma.post.findMany();

  // 5. 关注
  for (const user of users) {
    const potentialTargets = users.filter((u) => u.id !== user.id);
    const followTargets = faker.helpers.arrayElements(potentialTargets, {
      min: 2,
      max: 5,
    });

    for (const target of followTargets) {
      await prisma.follows.create({
        data: {
          followerId: user.id,
          followingId: target.id,
        },
      });
    }
  }
  console.log("🔗 Follows created.");

  // 6. 点赞和评论
  for (const post of allPosts) {
    const likeUsers = faker.helpers.arrayElements(users, { min: 0, max: 8 });
    for (const liker of likeUsers) {
      await prisma.like
        .create({
          data: { userId: liker.id, postId: post.id },
        })
        .catch(() => {});
    }

    const commentUsers = faker.helpers.arrayElements(users, { min: 0, max: 5 });
    for (const commenter of commentUsers) {
      await prisma.comment.create({
        data: {
          body: faker.lorem.sentence(),
          userId: commenter.id,
          postId: post.id,
        },
      });
    }
  }

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
