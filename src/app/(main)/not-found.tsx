import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <span className="text-3xl">😕</span>
        </div>
        <h1 className="mb-2 text-2xl font-semibold">页面未找到</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          抱歉，你访问的页面不存在或已被删除。请检查链接是否正确，或者返回首页继续浏览内容。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">返回首页</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/explore">去发现更多</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

