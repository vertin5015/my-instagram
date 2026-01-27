"use client";

import Link from "next/link";
import { Home, Search, PlusSquare, Heart, User } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useCreatePostStore } from "@/store/create-post-store";

export default function BottomNav() {
  const { user } = useAuthStore();
  const openCreatePost = useCreatePostStore((s) => s.open);

  const navItems = [
    { type: "link", icon: Home, label: "首页", href: "/" },
    { type: "link", icon: Search, label: "搜索", href: "/search" },
    { type: "create", icon: PlusSquare, label: "创建", href: "#" },
    { type: "link", icon: Heart, label: "通知", href: "/notification" },
    {
      type: "link",
      icon: User,
      label: "主页",
      href: user?.username ? `/${user.username}` : "/login",
    },
  ];

  return (
    <div className="flex h-16 items-center justify-around px-2">
      {navItems.map((item) =>
        item.type === "create" ? (
          <button
            key={item.label}
            type="button"
            onClick={openCreatePost}
            className="p-2"
            aria-label={item.label}
          >
            <item.icon className="h-7 w-7" />
          </button>
        ) : (
          <Link key={item.label} href={item.href} className="p-2">
            <item.icon className="h-7 w-7" />
            <span className="sr-only">{item.label}</span>
          </Link>
        )
      )}
    </div>
  );
}
