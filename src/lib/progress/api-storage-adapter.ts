import type { StorageAdapter } from "./storage-adapter";
import type { UserProgress } from "./types";
import { LocalStorageAdapter } from "./local-storage-adapter";
import { createDefaultProgress } from "./types";

interface ProgressResponse {
  progress: UserProgress | null;
  displayName: string;
}

export class ApiStorageAdapter implements StorageAdapter {
  private readonly local = new LocalStorageAdapter();

  async load(): Promise<UserProgress | null> {
    const response = await fetch("/api/progress", {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Could not load progress (${response.status})`);
    }

    const remote = (await response.json()) as ProgressResponse;
    if (remote.progress) return remote.progress;

    const local = await this.local.load();
    const progress = local ?? createDefaultProgress();
    if (!local) {
      progress.profile.displayName = remote.displayName;
    }

    await this.save(progress);
    if (local) await this.local.clear();
    return progress;
  }

  async save(progress: UserProgress): Promise<void> {
    const response = await fetch("/api/progress", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(progress),
    });
    if (!response.ok) {
      throw new Error(`Could not save progress (${response.status})`);
    }
  }

  async clear(): Promise<void> {
    const response = await fetch("/api/progress", { method: "DELETE" });
    if (!response.ok) {
      throw new Error(`Could not clear progress (${response.status})`);
    }
    await this.local.clear();
  }
}
