import type { UserProgress } from "./types";

export interface StorageAdapter {
  load(): Promise<UserProgress | null>;
  save(progress: UserProgress): Promise<void>;
  clear(): Promise<void>;
}
