"use client";

import Link from "next/link";
import { XpBar } from "@/components/gamification/XpBar";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { Menu } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, BookOpen, Wrench, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/part1", label: "Kotlin Basics", icon: BookOpen },
  { href: "/part2", label: "FRC Projects", icon: Wrench },
  { href: "/profile", label: "Profile", icon: User },
];

export function TopBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="bg-surface border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg hover:bg-border/50"
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <span className="font-bold">FRC Kotlin</span>
          </Link>
        </div>
        <div className="hidden md:block" />
        <div className="flex items-center gap-3">
          <XpBar />
          <LevelBadge />
        </div>
      </div>
      {mobileMenuOpen && (
        <nav className="mt-3 pt-3 border-t border-border md:hidden space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-border/50"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
