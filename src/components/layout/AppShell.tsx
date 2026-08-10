"use client";

import { ProgressProvider } from "@/lib/progress/ProgressProvider";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { LessonMeta } from "@/lib/progress/types";
import { usePathname } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
  playgroundLessons: LessonMeta[];
  ideLessons: LessonMeta[];
}

export function AppShell({
  children,
  playgroundLessons,
  ideLessons,
}: AppShellProps) {
  const pathname = usePathname();
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/pending")
  ) {
    return children;
  }

  return (
    <ProgressProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          playgroundLessons={playgroundLessons}
          ideLessons={ideLessons}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ProgressProvider>
  );
}
