"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, BookOpen, Wrench, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/playground", label: "Kotlin Playground", icon: BookOpen },
  { href: "/ide-projects", label: "IDE Projects", icon: Wrench },
  { href: "/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface border-r border-border p-4 hidden md:block overflow-y-auto">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-bold text-lg">FRC Kotlin</span>
        </Link>
      </div>
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-border/50 hover:text-foreground"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
