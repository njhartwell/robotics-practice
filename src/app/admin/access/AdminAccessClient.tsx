"use client";

import { FormEvent, useCallback, useState } from "react";

export interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  accessStatus: "pending";
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
}

export interface AccessQueue {
  pendingUsers: PendingUser[];
  invitations: Invitation[];
}

export function AdminAccessClient({ initialQueue }: { initialQueue: AccessQueue }) {
  const [queue, setQueue] = useState(initialQueue);
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");

  const loadQueue = useCallback(async () => {
    const response = await fetch("/api/admin/invitations", { cache: "no-store" });
    if (!response.ok) {
      setError("Could not load the access queue.");
      return;
    }
    setQueue((await response.json()) as AccessQueue);
  }, []);

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/invitations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = (await response.json()) as { inviteUrl?: string; error?: string };
    if (!response.ok || !result.inviteUrl) {
      setError(result.error ?? "Could not create the invitation.");
      return;
    }
    setInviteUrl(result.inviteUrl);
    setEmail("");
    await loadQueue();
  }

  async function updateUser(
    userId: string,
    status: "approved" | "rejected",
    role: "student" | "admin" = "student"
  ) {
    setError("");
    const response = await fetch(`/api/admin/users/${userId}/approval`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, role }),
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? "Could not update this user.");
      return;
    }
    await loadQueue();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Administration
        </p>
        <h1 className="mt-1 text-3xl font-bold">Invitations and approvals</h1>
        <p className="mt-2 text-muted">
          Invite a known student or review accounts that registered directly.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-bold">Invite a student</h2>
        <form onSubmit={createInvite} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="student@example.com"
            aria-label="Student email"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2"
          />
          <button className="rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-light">
            Create invitation
          </button>
        </form>
        {inviteUrl && (
          <div className="mt-4 rounded-lg bg-background p-3">
            <p className="text-sm font-semibold">Share this one-time link:</p>
            <div className="mt-2 flex gap-2">
              <input
                readOnly
                value={inviteUrl}
                aria-label="Invitation link"
                className="min-w-0 flex-1 rounded border border-border bg-surface px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(inviteUrl)}
                className="rounded border border-border px-3 py-1 text-sm font-semibold hover:bg-surface"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-bold">Approval queue</h2>
        {queue.pendingUsers.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No accounts are waiting.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {queue.pendingUsers.map((pendingUser) => (
              <li key={pendingUser.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{pendingUser.name}</p>
                  <p className="truncate text-sm text-muted">{pendingUser.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateUser(pendingUser.id, "approved")}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => updateUser(pendingUser.id, "approved", "admin")}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-semibold"
                  >
                    Make admin
                  </button>
                  <button
                    type="button"
                    onClick={() => updateUser(pendingUser.id, "rejected")}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-bold">Invitation history</h2>
        {queue.invitations.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No invitations yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {queue.invitations.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-4 py-3">
                <span className="truncate text-sm">{invite.email}</span>
                <span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold capitalize text-muted">
                  {invite.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
