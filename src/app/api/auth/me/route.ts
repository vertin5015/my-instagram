import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// ✅ 强制动态模式：因为使用了 cookies，这通常是默认的，但显式声明更安全
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ✅ getCurrentUser 现在是 async 的，且内部 correctly awaited cookies()
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[GET_ME_ERROR]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
