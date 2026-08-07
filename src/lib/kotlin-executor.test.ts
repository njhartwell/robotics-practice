import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  localRun: vi.fn(),
  localTests: vi.fn(),
  remoteRun: vi.fn(),
  remoteTests: vi.fn(),
}));

vi.mock("./local-kotlin-runner", () => ({
  runLocalKotlin: mocks.localRun,
  runLocalKotlinTests: mocks.localTests,
}));

vi.mock("./kotlin-api", () => ({
  runKotlin: mocks.remoteRun,
  runKotlinTests: mocks.remoteTests,
}));

import { runKotlin, runKotlinTests } from "./kotlin-executor";

describe("Kotlin executor", () => {
  const originalMode = process.env.KOTLIN_EXECUTION_MODE;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.KOTLIN_EXECUTION_MODE;
  });

  afterEach(() => {
    if (originalMode === undefined) {
      delete process.env.KOTLIN_EXECUTION_MODE;
    } else {
      process.env.KOTLIN_EXECUTION_MODE = originalMode;
    }
  });

  it("uses the local runner by default", async () => {
    const localResult = { output: "ok", errors: [], success: true };
    mocks.localRun.mockResolvedValue(localResult);

    await expect(runKotlin("code")).resolves.toEqual(localResult);
    expect(mocks.remoteRun).not.toHaveBeenCalled();
  });

  it("falls back to the remote runner when local infrastructure fails", async () => {
    const remoteResult = { output: "ok", errors: [], success: true };
    mocks.localRun.mockRejectedValue(new Error("worker missing"));
    mocks.remoteRun.mockResolvedValue(remoteResult);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(runKotlin("code")).resolves.toEqual(remoteResult);
    expect(mocks.remoteRun).toHaveBeenCalledWith("code", undefined);
  });

  it("does not fall back when local-only mode is requested", async () => {
    process.env.KOTLIN_EXECUTION_MODE = "local";
    mocks.localRun.mockRejectedValue(new Error("worker missing"));

    const result = await runKotlin("code");
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("worker missing");
    expect(mocks.remoteRun).not.toHaveBeenCalled();
  });

  it("uses the remote test runner in remote mode", async () => {
    process.env.KOTLIN_EXECUTION_MODE = "remote";
    const remoteResult = { passed: true, tests: [], errors: [] };
    mocks.remoteTests.mockResolvedValue(remoteResult);

    await expect(runKotlinTests("code", "tests")).resolves.toEqual(
      remoteResult
    );
    expect(mocks.localTests).not.toHaveBeenCalled();
  });
});
