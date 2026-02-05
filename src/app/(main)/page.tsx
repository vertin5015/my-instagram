import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRecentStoryUsers, getSuggestedUsers } from "@/actions/home";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import FeedContainer from "@/components/feed/feed-container";
import { SuggestedUserItem } from "@/components/home/suggested-user-item";

export default async function HomePage() {
  // 1. 获取当前用户
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // 2. 并行获取推荐数据
  const [recentStoryUsers, suggestedUsers] = await Promise.all([
    getRecentStoryUsers(),
    getSuggestedUsers(),
  ]);

  return (
    // 外层容器：居中
    <div className="flex justify-center w-full pt-4 sm:pt-8">
      {/* ===== 左侧/中间内容区域 ===== */}
      <div className="w-full max-w-[630px] flex flex-col items-center">
        {/* 1. 顶部 Story 区域 (最近发帖的用户 - 圆环推荐) */}
        {recentStoryUsers.length > 0 && (
          <div className="w-full flex gap-4 pb-4 overflow-x-auto scrollbar-hide px-2 sm:px-4 mb-4">
            {recentStoryUsers.map((user) => (
              <Link
                key={user.id}
                href={`/${user.username}`}
                className="flex flex-col items-center space-y-1 shrink-0 group"
              >
                {/* Story Ring: 渐变边框 */}
                <div className="w-[66px] h-[66px] sm:w-[80px] sm:h-[80px] rounded-full bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                  <div className="w-full h-full rounded-full bg-background p-[2px]">
                    <Avatar className="w-full h-full">
                      <AvatarImage
                        src={user.image || undefined}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {user.username?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <span className="text-xs truncate max-w-[70px] text-center group-hover:opacity-80 transition-opacity">
                  {user.username}
                </span>
              </Link>
            ))}

            {/* 占位符：如果不足3个，这里可以不显示，或者显示一些模拟数据 */}
          </div>
        )}

        {/* 2. 核心 Feed 流 */}
        <div className="w-full max-w-[470px]">
          <FeedContainer />
        </div>
      </div>

      {/* ===== 右侧推荐栏 (大屏显示) ===== */}
      <div className="hidden xl:block w-[320px] pl-16">
        <div className="fixed w-[320px] pr-4">
          {/* 当前用户信息卡片 */}
          <div className="flex items-center justify-between py-4 mb-2">
            <Link
              href={`/${currentUser.username}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0"
            >
              <Avatar className="h-11 w-11 border border-border">
                <AvatarImage src={currentUser.image || undefined} />
                <AvatarFallback>
                  {currentUser.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate leading-tight">
                  {currentUser.username}
                </p>
                <p className="text-sm text-muted-foreground truncate leading-tight">
                  {currentUser.name}
                </p>
              </div>
            </Link>
            <Link
              href="/login" // 实际上这通常是 "Switch" 账号或退出
              className="text-blue-500 text-xs font-bold hover:text-blue-700 transition-colors ml-2"
            >
              切换
            </Link>
          </div>

          {/* 推荐标题 */}
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-muted-foreground">
              为你推荐
            </span>
            <Link
              href="/explore/people"
              className="text-xs font-bold hover:text-muted-foreground transition-colors"
            >
              查看全部
            </Link>
          </div>

          {/* 推荐用户列表 */}
          <div className="flex flex-col gap-1">
            {suggestedUsers.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4">
                暂无推荐用户
              </div>
            ) : (
              suggestedUsers.map((user) => (
                <SuggestedUserItem key={user.id} user={user} />
              ))
            )}
          </div>

          {/* Footer Info (装饰性) */}
          <div className="mt-8 text-xs text-muted-foreground/50 space-y-2">
            <nav className="flex flex-wrap gap-x-2 gap-y-0.5">
              <span>关于</span>
              <span>帮助</span>
              <span>新闻中心</span>
              <span>API</span>
              <span>招聘</span>
              <span>隐私</span>
              <span>条款</span>
            </nav>
            <div>© 2024 INSTAGRAM CLONE</div>
          </div>
        </div>
      </div>
    </div>
  );
}
