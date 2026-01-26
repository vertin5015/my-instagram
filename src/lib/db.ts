// src/lib/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 1. 获取数据库连接字符串
// 优先使用 POSTGRES_URL (Vercel 自动注入的)，本地开发用 DATABASE_URL
const connectionString = `${process.env.POSTGRES_URL || process.env.DATABASE_URL}`;

// 2. 创建连接池
const pool = new Pool({
  connectionString,
  // 👇 关键修复：Vercel Postgres (Neon) 必须开启 SSL
  ssl: process.env.NODE_ENV === "production" ? true : undefined,
  // 或者如果遇到证书报错，可以使用这种宽松模式（不推荐用于极高安全要求场景，但对于 Vercel 部署通常需要）：
  // ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
