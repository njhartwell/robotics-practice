import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StorageAdapter } from "./storage-adapter";
import { ProgressProvider } from "./ProgressProvider";
import { useProgress } from "./useProgress";

function ProgressStatus() {
  const { isLoaded, progress } = useProgress();

  return (
    <div>
      {isLoaded ? "loaded" : "loading"}:{progress.profile.displayName}
    </div>
  );
}

describe("ProgressProvider", () => {
  it("finishes loading with defaults when the storage adapter fails", async () => {
    const adapter: StorageAdapter = {
      load: vi.fn().mockRejectedValue(new Error("storage unavailable")),
      save: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <ProgressProvider adapter={adapter}>
        <ProgressStatus />
      </ProgressProvider>
    );

    expect(await screen.findByText("loaded:Rookie")).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(
      "Could not load saved tutorial progress; starting with local defaults.",
      expect.any(Error)
    );

    warn.mockRestore();
  });
});
