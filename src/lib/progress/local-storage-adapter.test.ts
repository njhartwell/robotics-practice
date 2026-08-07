import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageAdapter, STORAGE_KEY } from "./local-storage-adapter";
import { createDefaultProgress } from "./types";

describe("LocalStorageAdapter", () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LocalStorageAdapter();
  });

  describe("load", () => {
    it("returns null when no data is stored", async () => {
      const result = await adapter.load();
      expect(result).toBeNull();
    });

    it("returns parsed data when data exists", async () => {
      const progress = createDefaultProgress();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

      const result = await adapter.load();
      expect(result).toEqual(progress);
    });

    it("returns null for invalid JSON", async () => {
      localStorage.setItem(STORAGE_KEY, "not-json");

      const result = await adapter.load();
      expect(result).toBeNull();
    });
  });

  describe("save", () => {
    it("persists progress to localStorage", async () => {
      const progress = createDefaultProgress();
      progress.profile.totalXp = 150;

      await adapter.save(progress);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.profile.totalXp).toBe(150);
    });
  });

  describe("clear", () => {
    it("removes data from localStorage", async () => {
      localStorage.setItem(STORAGE_KEY, "some-data");

      await adapter.clear();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
