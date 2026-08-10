"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const SOCIAL_PROVIDERS = [
  { id: "github", label: "GitHub", enabled: process.env.NEXT_PUBLIC_GITHUB_AUTH === "true" },
  { id: "google", label: "Google", enabled: process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true" },
  { id: "microsoft", label: "Microsoft", enabled: process.env.NEXT_PUBLIC_MICROSOFT_AUTH === "true" },
] as const;

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const destination = searchParams.get("next") || "/";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const result = await authClient.signIn.email({ email, password });
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error.message || "Could not sign in.");
      return;
    }
    router.push(destination);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-4xl" aria-hidden="true">🤖</div>
          <h1 className="mt-2 text-2xl font-bold">Sign in to FRC Kotlin</h1>
          <p className="mt-1 text-sm text-muted">Your course progress follows you between devices.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-light disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {SOCIAL_PROVIDERS.some((provider) => provider.enabled) && (
          <div className="mt-5 space-y-2 border-t border-border pt-5">
            {SOCIAL_PROVIDERS.filter((provider) => provider.enabled).map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => authClient.signIn.social({ provider: provider.id, callbackURL: destination })}
                className="w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-background"
              >
                Continue with {provider.label}
              </button>
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          Need an account? <Link href="/sign-up" className="text-primary hover:underline">Create one</Link>
        </p>
      </div>
    </main>
  );
}
