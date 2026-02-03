import Link from "next/link";
import { Grid3X3, Clapperboard, UserSquare2, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import { getUserByUsername } from "@/actions/profile";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FollowButton } from "@/components/post/follow-button";
import { ProfileAvatar } from "@/components/user/profile-avatar";
import { EditProfileModal } from "@/components/user/edit-profile-modal";

type Props = {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
};

export default async function ProfileLayout({ children, params }: Props) {
  const resolvedParams = await params;
  const username = resolvedParams.username;

  const [user, currentUser] = await Promise.all([
    getUserByUsername(username),
    getCurrentUser(),
  ]);

  if (!user) {
    notFound();
  }

  let isFollowing = false;
  let isCurrentUser = false;

  if (currentUser) {
    isCurrentUser = currentUser.id === user.id;
    if (!isCurrentUser) {
      const followRecord = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!followRecord;
    }
  }

  return (
    <div className="flex flex-col items-center w-full pb-16">
      <div className="w-full max-w-233.75 px-0 md:px-3 lg:px-10">
        {/* ===== Profile Header ===== */}
        {/* 
            修复1: items-center sm:items-start 
            确保移动端 Flex 容器内的子元素（头像、信息）水平居中，
            桌面端恢复左对齐
        */}
        <header className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-16 py-8">
          {/* Avatar Area */}
          <div className="shrink-0 sm:ml-4 md:ml-10">
            <ProfileAvatar
              user={{ username: user.username, image: user.image }}
              isCurrentUser={isCurrentUser}
            />
          </div>

          {/* Info Section */}
          {/* 
             修复2: items-center sm:items-start text-center sm:text-left
             让内部文本在移动端居中，桌面端左对齐。
             min-w-0 防止 flex 子项被长文本撑大。
          */}
          <section className="flex flex-col gap-4 sm:gap-4 flex-1 min-w-0 w-full items-center sm:items-start text-center sm:text-left">
            <div className="flex flex-col gap-1 w-full">
              {/* 
                  修复3: flex-wrap 和 justify-center 
                  防止用户名和按钮在极小屏幕重叠，且在移动端居中 
              */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <h2 className="text-xl font-bold truncate max-w-[200px] sm:max-w-none">
                  {username}
                </h2>

                <div className="flex items-center gap-2">
                  {isCurrentUser ? (
                    <EditProfileModal
                      user={{ name: user.name, bio: user.bio }}
                    />
                  ) : (
                    <FollowButton
                      targetUserId={user.id}
                      initialIsFollowing={isFollowing}
                      isCurrentUser={isCurrentUser}
                    />
                  )}

                  {!isCurrentUser && (
                    <button className="h-8 px-4 text-sm font-semibold bg-neutral-200 dark:bg-neutral-800 rounded hover:bg-neutral-300 transition-colors">
                      发消息
                    </button>
                  )}
                </div>
              </div>

              {/* 名字显示 (仅在名字与用户名不同时更有意义，这里保持你原有的逻辑) */}
              {user.name && (
                <div className="text-sm font-normal mt-1 hidden sm:block">
                  {user.name}
                </div>
              )}
            </div>

            {/* Stats - 保持移动端隐藏，桌面端显示 (符合 Ins 网页版逻辑) */}
            <ul className="hidden sm:flex gap-10 text-base">
              <li>
                <span className="font-semibold">{user._count.posts}</span> 帖子
              </li>
              <li>
                <span className="font-semibold">{user._count.followedBy}</span>{" "}
                粉丝
              </li>
              <li>
                <span className="font-semibold">{user._count.following}</span>{" "}
                关注
              </li>
            </ul>

            {/* Bio Section */}
            <div className="text-sm space-y-1 w-full max-w-md sm:max-w-full">
              {/* 移动端显示名字 (如果上面隐藏了) */}
              {user.name && (
                <div className="font-bold sm:hidden">{user.name}</div>
              )}

              {/* 
                 修复4: Bio 样式
                 - break-words: 防止长单词撑破布局
                 - sm:pr-15: 只在桌面端保留右侧留白，移动端不需要
                 - whitespace-pre-wrap: 保留换行
              */}
              <div className="whitespace-pre-wrap break-words sm:pr-15 leading-normal">
                {user.bio}
              </div>
            </div>

            {/* 移动端 Stats (可选：如果你想在移动端头像下方显示数据，可以解开注释并调整样式) */}
            {/* 
            <ul className="flex sm:hidden justify-around w-full border-t border-b py-3 mt-4 text-sm">
               <li className="flex flex-col items-center"><span className="font-bold">{user._count.posts}</span><span className="text-muted-foreground">帖子</span></li>
               <li className="flex flex-col items-center"><span className="font-bold">{user._count.followedBy}</span><span className="text-muted-foreground">粉丝</span></li>
               <li className="flex flex-col items-center"><span className="font-bold">{user._count.following}</span><span className="text-muted-foreground">关注</span></li>
            </ul> 
            */}
          </section>
        </header>

        {/* ===== Tabs ===== */}
        <div>
          <div className="flex justify-center gap-12 md:gap-20 text-xs font-semibold tracking-widest uppercase border-b">
            <TabLink href={`/${username}`} icon={Grid3X3} />
            {isCurrentUser && (
              <TabLink href={`/${username}/saved`} icon={Bookmark} />
            )}
            <TabLink href={`/${username}/tagged`} icon={UserSquare2} />
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

function TabLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ElementType;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 h-13 border-t border-transparent ",
        "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon size={20} className="sm:w-6 sm:h-6" />
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}
