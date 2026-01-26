import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAuthSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, username, name } = body;

    if (!email || !password || !username || !name) {
      return NextResponse.json(
        { error: "所有字段都是必填项" },
        { status: 400 }
      );
    }

    // 1. 检查唯一性
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 });
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: "该用户名已被占用" },
          { status: 409 }
        );
      }
    }

    // 2. 密码加密
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        hashedPassword,
      },
    });

    // 4. 直接设置 Session Cookie
    // ✅ 使用 await 调用
    if (user.email) {
      await createAuthSession(user.id, user.email);
    }

    // 5. 返回用户
    const { hashedPassword: _, ...userWithoutPassword } = user;

    // 不需要手动 set-cookie header，createAuthSession 内部已经处理了
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
