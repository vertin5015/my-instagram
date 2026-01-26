"use client";

import Link from "next/link";
import { Home, Search, PlusSquare, Heart, User } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export default function BottomNav() {
  const { user } = useAuthStore();

  const navItems = [
    { icon: Home, label: "首页", href: "/" },
    { icon: Search, label: "搜索", href: "/search" },
    { icon: PlusSquare, label: "创建", href: "/create" },
    { icon: Heart, label: "通知", href: "/notifications" },
    {
      icon: User,
      label: "主页",
      href: user?.username ? `/${user.username}` : "/login",
    },
  ];

  return (
    <div className="flex h-16 items-center justify-around px-2">
      {navItems.map((item) => (
        <Link key={item.label} href={item.href} className="p-2">
          <item.icon className="h-7 w-7" />
          <span className="sr-only">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
