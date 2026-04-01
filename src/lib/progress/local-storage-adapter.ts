import type { StorageAdapter } from "./storage-adapter";
import type { UserProgress } from "./types";

export const STORAGE_KEY = "frc-kotlin-progress";

export class LocalStorageAdapter implements StorageAdapter {
  async load(): Promise<UserProgress | null> {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProgress;
    } catch {
      return null;
    }
  }

  async save(progress: UserProgress): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }
}
