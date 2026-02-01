import Link from "next/link";
import { Grid3X3, Clapperboard, UserSquare2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getUserByUsername } from "@/actions/profile";
import { getCurrentUser } from "@/lib/auth"; // 引入获取当前用户的方法
import { prisma } from "@/lib/db"; // 引入 prisma 直接查询
import { FollowButton } from "@/components/post/follow-button";
import { ProfileAvatar } from "@/components/user/profile-avatar";

type Props = {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
};

export default async function ProfileLayout({ children, params }: Props) {
  const resolvedParams = await params;
  const username = resolvedParams.username;

  // 并行获取目标用户信息和当前登录用户
  const [user, currentUser] = await Promise.all([
    getUserByUsername(username),
    getCurrentUser(),
  ]);

  if (!user) {
    notFound();
  }

  // 计算关注状态
  let isFollowing = false;
  let isCurrentUser = false;

  if (currentUser) {
    isCurrentUser = currentUser.id === user.id;

    // 如果不是自己，检查数据库是否已关注
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
        <header className="flex flex-col sm:flex-row gap-8 sm:gap-16 py-8">
          {/* Avatar */}
          <div className="flex justify-center sm:justify-start shrink-0 sm:ml-4 md:ml-10">
            <ProfileAvatar
              user={{ username: user.username, image: user.image }}
              isCurrentUser={isCurrentUser}
            />
          </div>

          {/* Info */}
          <section className="flex flex-col gap-4 sm:gap-5 flex-1 min-w-0">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-normal truncate">{username}</h2>
              <div className="flex gap-2">
                <FollowButton
                  targetUserId={user.id}
                  initialIsFollowing={isFollowing}
                  isCurrentUser={isCurrentUser}
                />

                {/* 可选：如果是自己，不显示发消息；如果是别人，显示发消息 */}
                {!isCurrentUser && (
                  <button className="h-8 px-4 text-sm font-semibold bg-neutral-200 dark:bg-neutral-800 rounded hover:bg-neutral-300 transition-colors">
                    发消息
                  </button>
                )}
              </div>
            </div>

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

            <div className="text-sm space-y-1">
              <div className="font-semibold">{user.name || username}</div>
              <div>{user.bio}</div>
            </div>
          </section>
        </header>

        {/* ===== Tabs ===== */}
        <div>
          <div className="flex justify-center gap-12 md:gap-28 text-xs font-semibold tracking-widest uppercase border-b">
            <TabLink href={`/${username}`} icon={Grid3X3}></TabLink>
            <TabLink href={`/${username}/reels`} icon={Clapperboard}></TabLink>
            <TabLink href={`/${username}/tagged`} icon={UserSquare2}></TabLink>
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
      <Icon size={24} />
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}
