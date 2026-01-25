import Link from "next/link";
import { Home, Search, PlusSquare, Heart, User } from "lucide-react";

export default function BottomNav() {
  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: PlusSquare, label: "Create", href: "/create" },
    { icon: Heart, label: "Notifications", href: "/notifications" },
    { icon: User, label: "Profile", href: "/profile" },
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
