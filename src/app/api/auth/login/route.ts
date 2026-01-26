import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

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

    // 为了安全，不要明确提示是“用户不存在”还是“密码错误”，统称“凭证错误”
    // 但为了调试方便，你可以先分开写，上线前合并
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

    // 3. 返回用户信息 (不包含密码)
    // 注意：实际生产中这里应该设置 HttpOnly Cookie (JWT)，
    // 但鉴于你目前使用 Zustand store 存储简单的登录态，我们先返回 User 对象
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
