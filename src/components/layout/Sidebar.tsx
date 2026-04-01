"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProgress } from "@/lib/progress/useProgress";
import {
  Home,
  BookOpen,
  Wrench,
  User,
  ChevronDown,
  CheckCircle,
  Lock,
} from "lucide-react";
import type { LessonMeta } from "@/lib/progress/types";

interface SidebarProps {
  playgroundLessons: LessonMeta[];
  ideLessons: LessonMeta[];
}

interface SectionGroup {
  section: string;
  sectionTitle: string;
  lessons: LessonMeta[];
}

function groupBySection(lessons: LessonMeta[]): SectionGroup[] {
  const groups = new Map<string, SectionGroup>();
  for (const lesson of lessons) {
    const existing = groups.get(lesson.section);
    if (existing) {
      existing.lessons.push(lesson);
    } else {
      groups.set(lesson.section, {
        section: lesson.section,
        sectionTitle: lesson.sectionTitle,
        lessons: [lesson],
      });
    }
  }
  return Array.from(groups.values());
}

export function Sidebar({ playgroundLessons, ideLessons }: SidebarProps) {
  const pathname = usePathname();
  const { progress, isLessonUnlocked } = useProgress();

  const playgroundActive = pathname.startsWith("/playground");
  const ideActive = pathname.startsWith("/ide-projects");

  const [playgroundOpen, setPlaygroundOpen] = useState(playgroundActive);
  const [ideOpen, setIdeOpen] = useState(ideActive);

  const playgroundSections = groupBySection(playgroundLessons);
  const ideSections = groupBySection(ideLessons);

  return (
    <aside className="w-64 bg-surface border-r border-border p-4 hidden md:block overflow-y-auto">
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-bold text-lg">FRC Kotlin</span>
        </Link>
      </div>
      <nav className="space-y-1">
        {/* Dashboard */}
        <NavLink
          href="/"
          icon={<Home size={18} />}
          label="Dashboard"
          active={pathname === "/"}
        />

        {/* Kotlin Playground — expandable */}
        <ExpandableSection
          icon={<BookOpen size={18} />}
          label="Kotlin Playground"
          href="/playground"
          active={playgroundActive}
          open={playgroundOpen}
          onToggle={() => setPlaygroundOpen(!playgroundOpen)}
        />
        {playgroundOpen && (
          <div className="ml-3 border-l border-border pl-2 space-y-0.5">
            {playgroundSections.map((section) => (
              <div key={section.section} className="mb-2">
                <div className="px-2 py-1 text-xs font-semibold text-muted uppercase tracking-wide">
                  {section.sectionTitle}
                </div>
                {section.lessons.map((lesson) => (
                  <LessonNavItem
                    key={lesson.slug}
                    lesson={lesson}
                    active={pathname === `/playground/${lesson.slug}`}
                    completed={
                      progress.lessons[lesson.slug]?.completed ?? false
                    }
                    locked={!isLessonUnlocked(lesson.requiredLevel)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* IDE Projects — expandable */}
        <ExpandableSection
          icon={<Wrench size={18} />}
          label="IDE Projects"
          href="/ide-projects"
          active={ideActive}
          open={ideOpen}
          onToggle={() => setIdeOpen(!ideOpen)}
        />
        {ideOpen && (
          <div className="ml-3 border-l border-border pl-2 space-y-0.5">
            {ideSections.map((section) => (
              <div key={section.section} className="mb-2">
                <div className="px-2 py-1 text-xs font-semibold text-muted uppercase tracking-wide">
                  {section.sectionTitle}
                </div>
                {section.lessons.map((lesson) => (
                  <LessonNavItem
                    key={lesson.slug}
                    lesson={lesson}
                    active={pathname === `/ide-projects/${lesson.slug}`}
                    completed={
                      progress.lessons[lesson.slug]?.completed ?? false
                    }
                    locked={!isLessonUnlocked(lesson.requiredLevel)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Profile */}
        <NavLink
          href="/profile"
          icon={<User size={18} />}
          label="Profile"
          active={pathname === "/profile"}
        />
      </nav>
    </aside>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted hover:bg-border/50 hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function ExpandableSection({
  icon,
  label,
  href,
  active,
  open,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted hover:bg-border/50 hover:text-foreground"
      )}
    >
      <Link href={href} className="flex items-center gap-3 flex-1">
        {icon}
        {label}
      </Link>
      <button
        onClick={onToggle}
        className="p-0.5 rounded hover:bg-border/50 transition-colors"
      >
        <ChevronDown
          size={14}
          className={cn(
            "transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
    </div>
  );
}

function LessonNavItem({
  lesson,
  active,
  completed,
  locked,
}: {
  lesson: LessonMeta;
  active: boolean;
  completed: boolean;
  locked: boolean;
}) {
  if (locked) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted/50 rounded">
        <Lock size={12} />
        <span className="truncate">{lesson.title}</span>
      </div>
    );
  }

  return (
    <Link
      href={`/${lesson.part}/${lesson.slug}`}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted hover:text-foreground hover:bg-border/30"
      )}
    >
      {completed ? (
        <CheckCircle size={12} className="text-success flex-shrink-0" />
      ) : (
        <span className="w-3 h-3 rounded-full border border-border flex-shrink-0" />
      )}
      <span className="truncate">{lesson.title}</span>
    </Link>
  );
}
