"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function PendingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <PendingContent />
    </Suspense>
  );
}

function PendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const claimFailed = searchParams.get("claim") === "failed";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <div className="text-5xl" aria-hidden="true">
          🛠️
        </div>
        <h1 className="mt-4 text-2xl font-bold">Access is awaiting approval</h1>
        <p className="mt-2 text-muted">
          An administrator needs to approve {session?.user.email ?? "this account"}
          {" "}before the course opens.
        </p>
        {claimFailed && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            That invitation could not be claimed. It may be expired or intended for
            a different email address.
          </p>
        )}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-light"
          >
            Check again
          </button>
          <button
            type="button"
            onClick={async () => {
              await authClient.signOut();
              router.push("/sign-in");
              router.refresh();
            }}
            className="rounded-lg border border-border px-4 py-2 font-semibold hover:bg-background"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
