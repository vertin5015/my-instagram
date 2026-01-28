import Link from "next/link";
import { Grid3X3, Clapperboard, UserSquare2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getUserByUsername } from "@/actions/profile";

type Props = {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
};

export default async function ProfileLayout({ children, params }: Props) {
  // 3. 等待 params 解析
  const resolvedParams = await params;
  const username = resolvedParams.username;

  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center w-full pb-16">
      <div className="w-full max-w-[935px] px-0 md:px-3 lg:px-10">
        {/* ===== Profile Header ===== */}
        <header className="flex flex-col sm:flex-row gap-8 sm:gap-16 py-8">
          {/* Avatar */}
          <div className="flex justify-center sm:justify-start shrink-0 sm:ml-4 md:ml-10">
            <div className="rounded-full p-[3px] bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600">
              <div className="rounded-full bg-background p-[2px]">
                <Image
                  src={user.image || `https://i.pravatar.cc/300?u=${username}`}
                  alt={username}
                  width={150}
                  height={150}
                  className="h-24 w-24 sm:h-[150px] sm:w-[150px] rounded-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <section className="flex flex-col gap-4 sm:gap-5 flex-1 min-w-0">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-normal truncate">{username}</h2>
              <button className="h-8 px-4 text-sm font-semibold bg-neutral-200 dark:bg-neutral-800 rounded">
                已关注
              </button>
              <button className="h-8 px-4 text-sm font-semibold bg-neutral-200 dark:bg-neutral-800 rounded">
                发消息
              </button>
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
          <div className="flex justify-center gap-12 md:gap-28 text-xs font-semibold tracking-widest uppercase">
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
        "flex items-center gap-2 h-[52px] border-t border-transparent ",
        "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon size={24} />
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}
