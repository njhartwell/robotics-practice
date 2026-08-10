"use client";

import { LogOut, MessageSquareText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  if (isPending || !session) return null;

  return (
    <div className="flex items-center gap-2 border-l border-border pl-3">
      {session.user.role === "admin" && (
        <>
          <Link
            href="/admin/access"
            aria-label="Access administration"
            title="Access administration"
            className="rounded-lg p-1.5 text-muted hover:bg-border/50 hover:text-foreground"
          >
            <ShieldCheck size={18} />
          </Link>
          <Link
            href="/admin/feedback"
            aria-label="Lesson feedback"
            title="Lesson feedback"
            className="rounded-lg p-1.5 text-muted hover:bg-border/50 hover:text-foreground"
          >
            <MessageSquareText size={18} />
          </Link>
        </>
      )}
      <span className="hidden max-w-32 truncate text-sm text-muted sm:inline">{session.user.name}</span>
      <button
        type="button"
        aria-label="Sign out"
        title="Sign out"
        onClick={async () => {
          await authClient.signOut();
          router.push("/sign-in");
          router.refresh();
        }}
        className="rounded-lg p-1.5 text-muted hover:bg-border/50 hover:text-foreground"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
