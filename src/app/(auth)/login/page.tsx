"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card"; // 依然使用 Card 但样式会调整

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  // 表单状态
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { email, password }
        : { email, password, name, username };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // 关键修正：先检查 content-type 防止后端返回 HTML 导致 crash
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("服务器响应格式错误");
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "操作失败");
        return;
      }

      setUser(data.user);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("网络错误，请检查您的连接或稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[350px] mx-auto">
      {/* 主卡片：Logo + 表单 */}
      <Card className="border p-8 shadow-none bg-white rounded-none md:rounded-sm">
        <div className="flex flex-col items-center mb-8">
          {/* 这里可以使用 Instagram 的图片 Logo，暂时用文字代替 */}
          <h1 className="text-4xl font-serif tracking-tighter mb-6 italic">
            Instagram
          </h1>
          {!isLogin && (
            <p className="text-center text-muted-foreground font-bold text-gray-500 mb-4">
              注册即可查看好友的照片和视频。
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && (
            <div className="text-xs text-red-500 text-center mb-2">{error}</div>
          )}

          <Input
            type="email"
            placeholder="账号或邮箱"
            className="bg-gray-50 text-xs py-2 h-9 focus-visible:ring-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {!isLogin && (
            <>
              <Input
                type="text"
                placeholder="全名"
                className="bg-gray-50 text-xs py-2 h-9 focus-visible:ring-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required // 强制必填
              />
              <Input
                type="text"
                placeholder="用户名 (User ID)"
                className="bg-gray-50 text-xs py-2 h-9 focus-visible:ring-1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required // 强制必填
              />
            </>
          )}

          <Input
            type="password"
            placeholder="密码"
            className="bg-gray-50 text-xs py-2 h-9 focus-visible:ring-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <Button
            type="submit"
            className="mt-2 w-full bg-sky-500 hover:bg-sky-600 text-white font-bold h-8 text-sm"
            disabled={loading}
          >
            {loading ? "处理中..." : isLogin ? "登录" : "注册"}
          </Button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="h-[1px] bg-gray-200 flex-1" />
          <span className="text-xs text-gray-400 font-bold">OR</span>
          <div className="h-[1px] bg-gray-200 flex-1" />
        </div>

        <div className="flex flex-col items-center gap-4 text-sm">
          <button className="text-[#385185] font-bold text-xs flex items-center gap-2">
            Facebook 登录 (演示)
          </button>
          {isLogin && (
            <button className="text-xs text-blue-900/80">忘记密码？</button>
          )}
        </div>
      </Card>

      {/* 底部卡片：切换登录/注册 */}
      <Card className="border p-5 text-center shadow-none rounded-none md:rounded-sm">
        <p className="text-sm">
          {isLogin ? "没有账号？" : "已有账号？"}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              // 清空字段防止混淆
              if (isLogin) {
                setName("");
                setUsername("");
              }
            }}
            className="text-sky-500 font-bold ml-1 hover:text-sky-600 transition"
          >
            {isLogin ? "注册" : "登录"}
          </button>
        </p>
      </Card>
    </div>
  );
}
