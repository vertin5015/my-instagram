"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAuthSession, clearAuthCookie, getCurrentUser } from "@/lib/auth";
import { User } from "@prisma/client";

// 定义通用的返回类型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

// --- 1. 注册 Action ---
export async function registerAction(
  p0: null,
  formData: {
    email: string;
    password: string;
    username: string;
    name: string;
  }
): Promise<ActionResponse<Omit<User, "hashedPassword">>> {
  try {
    const { email, password, username, name } = formData;

    if (!email || !password || !username || !name) {
      return { success: false, error: "所有字段都是必填项" };
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return { success: false, error: "该邮箱已被注册" };
      }
      if (existingUser.username === username) {
        return { success: false, error: "该用户名已被占用" };
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, username, name, hashedPassword },
    });

    if (user.email) {
      await createAuthSession(user.id, user.email);
    }

    const { hashedPassword: _, ...safeUser } = user;
    return { success: true, data: safeUser };
  } catch (error) {
    console.error("[REGISTER_ACTION_ERROR]", error);
    return { success: false, error: "注册失败，请稍后重试" };
  }
}

// --- 2. 登录 Action ---
export async function loginAction(
  p0: null,
  formData: {
    email: string;
    password: string;
  }
): Promise<ActionResponse<Omit<User, "hashedPassword">>> {
  try {
    const { email, password } = formData;

    if (!email || !password) {
      return { success: false, error: "请输入邮箱和密码" };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.hashedPassword) {
      return { success: false, error: "账号不存在或密码错误" };
    }

    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) {
      return { success: false, error: "账号不存在或密码错误" };
    }

    if (user.email) {
      await createAuthSession(user.id, user.email);
    }

    const { hashedPassword: _, ...safeUser } = user;
    return { success: true, data: safeUser };
  } catch (error) {
    console.error("[LOGIN_ACTION_ERROR]", error);
    return { success: false, error: "服务器内部错误" };
  }
}

// --- 3. 登出 Action ---
export async function logoutAction(): Promise<ActionResponse> {
  try {
    await clearAuthCookie();
    return { success: true, error: undefined };
  } catch (error) {
    console.error("[LOGOUT_ACTION_ERROR]", error);
    return { success: false, error: "登出失败" };
  }
}

// --- 4. 获取当前用户 Action ---
export async function getSessionAction(): Promise<
  ActionResponse<Partial<User> | null>
> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, data: null };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error("[GET_SESSION_ACTION_ERROR]", error);
    // 这里不返回 error 字段，避免前端报错，只是视作未登录
    return { success: false, data: null };
  }
}
