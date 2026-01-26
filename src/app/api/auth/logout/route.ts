import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
    // ✅ 直接调用异步清除函数
    await clearAuthCookie();

    return NextResponse.json({ success: true, message: "已登出" });
  } catch (error) {
    console.error("[LOGOUT_ERROR]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
