// src/lib/auth.ts
import { cookies } from "next/headers";
import { verifyToken, generateToken, TokenPayload } from "./jwt";
import { prisma } from "./db";

/**
 * 1. 设置认证 Cookie (适配 Next.js 15)
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies(); // ✅ 关键修复：必须加 await

  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 天
    path: "/",
  });
}

/**
 * 2. 清除认证 Cookie
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies(); // ✅ 关键修复：必须加 await
  cookieStore.delete("auth-token");
}

/**
 * 3. 获取当前登录用户
 * 之前报错就是因为这里没有 await cookies()
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies(); // ✅ 关键修复：必须加 await
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    // 从数据库查询用户
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
      },
    });

    return user;
  } catch (error) {
    // 忽略 JWT 过期等错误，直接返回未登录
    return null;
  }
}

/**
 * 4. 创建 Session 的辅助函数 (用于 Login/Register)
 */
export async function createAuthSession(userId: string, email: string) {
  const token = generateToken({ userId, email });
  await setAuthCookie(token); // 调用上面的异步函数
  return token;
}
