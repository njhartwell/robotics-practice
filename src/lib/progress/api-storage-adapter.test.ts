import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiStorageAdapter } from "./api-storage-adapter";
import { createDefaultProgress } from "./types";
import { STORAGE_KEY } from "./local-storage-adapter";

describe("ApiStorageAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("loads progress from the authenticated API", async () => {
    const progress = createDefaultProgress();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ progress, displayName: "Avery" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
    );

    await expect(new ApiStorageAdapter().load()).resolves.toEqual(progress);
  });

  it("migrates legacy local progress when the database has none", async () => {
    const progress = createDefaultProgress();
    progress.profile.totalXp = 75;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ progress: null, displayName: "Avery" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ saved: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(new ApiStorageAdapter().load()).resolves.toEqual(progress);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("creates database progress from the authenticated profile", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ progress: null, displayName: "Avery Student" }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ saved: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const progress = await new ApiStorageAdapter().load();

    expect(progress?.profile.displayName).toBe("Avery Student");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toEqual(
      progress
    );
  });

  it("rejects failed API writes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 }))
    );

    await expect(
      new ApiStorageAdapter().save(createDefaultProgress())
    ).rejects.toThrow("Could not save progress (401)");
  });
});
