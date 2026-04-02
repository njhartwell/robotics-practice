import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseOutput, buildFiles, runKotlin } from "./kotlin-api";

describe("parseOutput", () => {
  it("extracts text from outStream tags", () => {
    const raw = '<outStream>Hello, World!\n</outStream>';
    expect(parseOutput(raw)).toBe("Hello, World!");
  });

  it("handles multiple outStream sections", () => {
    const raw = '<outStream>line1\n</outStream><outStream>line2\n</outStream>';
    expect(parseOutput(raw)).toBe("line1\nline2");
  });

  it("ignores errStream content", () => {
    const raw =
      '<outStream>good\n</outStream><errStream>bad\n</errStream>';
    expect(parseOutput(raw)).toBe("good");
  });

  it("returns empty string for empty input", () => {
    expect(parseOutput("")).toBe("");
  });

  it("returns empty string for null/undefined", () => {
    expect(parseOutput(null as unknown as string)).toBe("");
    expect(parseOutput(undefined as unknown as string)).toBe("");
  });

  it("returns raw text when no tags present", () => {
    expect(parseOutput("plain text")).toBe("plain text");
  });

  it("trims trailing whitespace", () => {
    const raw = '<outStream>Hello\n</outStream>';
    expect(parseOutput(raw)).toBe("Hello");
  });

  it("handles HTML entity brackets in output", () => {
    const raw = '<outStream>&lt;html&gt;\n</outStream>';
    expect(parseOutput(raw)).toBe("<html>");
  });
});

describe("buildFiles", () => {
  it("builds a single file for code only", () => {
    const files = buildFiles('fun main() { println("hi") }');
    expect(files).toEqual([
      { name: "File.kt", text: 'fun main() { println("hi") }', publicId: "" },
    ]);
  });

  it("includes hidden dependency as a separate file", () => {
    const files = buildFiles("fun greet() = 42", "fun main() { println(greet()) }");
    expect(files).toHaveLength(2);
    expect(files[0].name).toBe("File.kt");
    expect(files[0].text).toBe("fun greet() = 42");
    expect(files[1].name).toBe("hiddenDependency0.kt");
    expect(files[1].text).toBe("fun main() { println(greet()) }");
  });

  it("omits hidden dependency when undefined", () => {
    const files = buildFiles("code", undefined);
    expect(files).toHaveLength(1);
  });

  it("omits hidden dependency when empty string", () => {
    const files = buildFiles("code", "");
    expect(files).toHaveLength(1);
  });
});

describe("runKotlin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends correct request shape and parses successful output", async () => {
    const mockResponse = {
      text: '<outStream>Hello, World!\n</outStream>',
      errors: { "File.kt": [] },
      exception: null,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await runKotlin('fun main() { println("Hello, World!") }');

    expect(result.success).toBe(true);
    expect(result.output).toBe("Hello, World!");
    expect(result.errors).toEqual([]);

    // Verify the request was made correctly
    const call = vi.mocked(fetch).mock.calls[0];
    const url = call[0] as string;
    expect(url).toContain("api.kotlinlang.org");
    expect(url).toContain("/compiler/run");

    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.files[0].name).toBe("File.kt");
    expect(body.confType).toBe("java");
  });

  it("sends hidden code as a separate file", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          text: '<outStream>ok\n</outStream>',
          errors: { "File.kt": [] },
          exception: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    await runKotlin("fun greet() = 42", "fun main() { println(greet()) }");

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.files).toHaveLength(2);
    expect(body.files[1].name).toBe("hiddenDependency0.kt");
  });

  it("returns errors on compilation failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          text: "",
          errors: {
            "File.kt": [
              {
                severity: "ERROR",
                message: "Unresolved reference: foo",
                interval: { start: { line: 1, ch: 0 }, end: { line: 1, ch: 3 } },
              },
            ],
          },
          exception: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await runKotlin("foo()");
    expect(result.success).toBe(false);
    expect(result.errors).toContain("Unresolved reference: foo");
  });

  it("returns error on runtime exception", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          text: "",
          errors: { "File.kt": [] },
          exception: {
            fullName: "java.lang.ArithmeticException",
            message: "/ by zero",
            cause: null,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await runKotlin("fun main() { println(1/0) }");
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("/ by zero");
  });

  it("handles network failure gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const result = await runKotlin("fun main() {}");
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("Network error");
  });
});
