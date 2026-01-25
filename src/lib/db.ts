import { PrismaClient } from "@prisma/client";

// 扩展全局对象类型以包含 prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 如果全局已有 prisma 实例，则使用它；否则创建新实例
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"], // 开发环境下打印 SQL 查询日志，方便调试
  });

// 在非生产环境下，将实例保存到全局变量中
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
