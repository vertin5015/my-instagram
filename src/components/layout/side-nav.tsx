import Link from "next/link";
import {
  Home,
  Search,
  Compass,
  MessageCircle,
  Heart,
  PlusSquare,
  Instagram,
  Menu,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SideNav() {
  // 模拟导航项
  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: MessageCircle, label: "Messages", href: "/messages" },
    { icon: Heart, label: "Notifications", href: "/notifications" },
    { icon: PlusSquare, label: "Create", href: "/create" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <div className="flex h-full flex-col justify-between py-6 px-3 lg:px-5">
      {/* 顶部 Logo 和 导航链接 */}
      <div className="space-y-8">
        {/* Logo: 大屏显示文字，小屏显示图标 */}
        <Link href="/" className="flex items-center pl-2 mb-10">
          <Instagram className="h-8 w-8 lg:hidden shrink-0" />
          <span className="hidden lg:block font-bold text-2xl italic shrink-0">
            Instagram
          </span>
        </Link>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-4 p-3 hover:bg-accent rounded-lg transition-colors group"
            >
              <item.icon className="h-7 w-7 group-hover:scale-105 transition-transform shrink-0" />
              {/* 文字在 lg 以下隐藏 */}
              <span className="hidden lg:block text-base font-medium truncate">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* 底部 More 菜单 */}
      <div>
        <Button
          variant="ghost"
          className="w-full flex justify-start gap-4 p-3 hover:bg-accent rounded-lg lg:px-3"
        >
          <Menu className="h-7 w-7 shrink-0" />
          <span className="hidden lg:block text-base font-medium">More</span>
        </Button>
      </div>
    </div>
  );
}
