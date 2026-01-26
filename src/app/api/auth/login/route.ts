import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAuthSession } from "@/lib/auth"; // 注意这里导入的是 createAuthSession

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 });
    }

    // 1. 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.hashedPassword) {
      return NextResponse.json(
        { error: "账号不存在或密码错误" },
        { status: 401 }
      );
    }

    // 2. 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "账号不存在或密码错误" },
        { status: 401 }
      );
    }

    // 3. 生成 Token 并设置 Cookie
    // ✅ 这里直接 await 调用，不需要再处理 headers 了
    // Prisma 的 email 可能是 null，但这里必须确保非空
    if (user.email) {
      await createAuthSession(user.id, user.email);
    }

    // 4. 返回用户信息
    const { hashedPassword, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("[LOGIN_ERROR]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
