"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("invite");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const result = await authClient.signUp.email({ name, email, password });
    if (result.error) {
      setIsSubmitting(false);
      setError(result.error.message || "Could not create the account.");
      return;
    }

    if (invitationToken) {
      const claim = await fetch("/api/invitations/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: invitationToken }),
      });
      if (!claim.ok) {
        router.push("/pending?claim=failed");
        router.refresh();
        return;
      }
    }

    router.push(invitationToken ? "/" : "/pending");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 shadow-sm">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted">
          {invitationToken
            ? "Use the email address that received this invitation."
            : "New accounts require administrator approval before lessons unlock."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Name
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-light disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          Already registered?{" "}
          <Link
            href={
              invitationToken
                ? `/sign-in?invite=${encodeURIComponent(invitationToken)}`
                : "/sign-in"
            }
            className="text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
