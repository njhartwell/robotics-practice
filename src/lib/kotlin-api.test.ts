import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseOutput,
  buildFiles,
  buildTestFiles,
  parseTestResults,
  runKotlin,
  runKotlinTests,
} from "./kotlin-api";

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

  it("fails closed on non-successful HTTP responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Service unavailable", {
        status: 503,
        statusText: "Service Unavailable",
      })
    );

    const result = await runKotlin("fun main() {}");
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("503");
  });

  it("fails closed on invalid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not json", { status: 200 })
    );

    const result = await runKotlin("fun main() {}");
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("invalid response");
  });
});

describe("buildTestFiles", () => {
  it("builds student file and test file", () => {
    const files = buildTestFiles("fun add(a: Int, b: Int) = a + b", "class Tests {}");
    expect(files).toHaveLength(2);
    expect(files[0].name).toBe("File.kt");
    expect(files[0].text).toBe("fun add(a: Int, b: Int) = a + b");
    expect(files[1].name).toBe("Tests.kt");
    expect(files[1].text).toBe("class Tests {}");
  });
});

describe("parseTestResults", () => {
  it("parses all-passing results", () => {
    const raw = {
      Tests: [
        { status: "OK", methodName: "testAdd", comparisonFailure: null, exception: null },
        { status: "OK", methodName: "testSub", comparisonFailure: null, exception: null },
      ],
    };
    const result = parseTestResults(raw);
    expect(result.passed).toBe(true);
    expect(result.tests).toHaveLength(2);
    expect(result.tests[0].passed).toBe(true);
    expect(result.tests[0].name).toBe("testAdd");
    expect(result.tests[0].message).toBeUndefined();
  });

  it("parses failing results with comparison failure", () => {
    const raw = {
      Tests: [
        {
          status: "FAIL",
          methodName: "testGreet",
          comparisonFailure: {
            message: 'expected:<[Hello]> but was:<[Goodbye]>',
            expected: "Hello",
            actual: "Goodbye",
          },
          exception: null,
        },
      ],
    };
    const result = parseTestResults(raw);
    expect(result.passed).toBe(false);
    expect(result.tests[0].passed).toBe(false);
    expect(result.tests[0].message).toContain("expected:<[Hello]>");
    expect(result.tests[0].expected).toBe("Hello");
    expect(result.tests[0].actual).toBe("Goodbye");
  });

  it("parses failing results with exception", () => {
    const raw = {
      Tests: [
        {
          status: "FAIL",
          methodName: "testBoom",
          comparisonFailure: null,
          exception: { message: "/ by zero" },
        },
      ],
    };
    const result = parseTestResults(raw);
    expect(result.passed).toBe(false);
    expect(result.tests[0].message).toBe("/ by zero");
  });

  it("handles empty test results", () => {
    const result = parseTestResults({});
    expect(result.passed).toBe(false);
    expect(result.tests).toHaveLength(0);
    expect(result.errors[0]).toContain("did not return any test results");
  });

  it("handles mixed pass/fail", () => {
    const raw = {
      Tests: [
        { status: "OK", methodName: "testA", comparisonFailure: null, exception: null },
        { status: "FAIL", methodName: "testB", comparisonFailure: { message: "wrong" }, exception: null },
      ],
    };
    const result = parseTestResults(raw);
    expect(result.passed).toBe(false);
    expect(result.tests[0].passed).toBe(true);
    expect(result.tests[1].passed).toBe(false);
  });
});

describe("runKotlinTests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends correct request and parses passing tests", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          testResults: {
            Tests: [
              { status: "OK", methodName: "testGreet", comparisonFailure: null, exception: null },
            ],
          },
          errors: { "File.kt": [], "Tests.kt": [] },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await runKotlinTests("fun greet() = 42", "class Tests {}");
    expect(result.passed).toBe(true);
    expect(result.tests[0].name).toBe("testGreet");

    const call = vi.mocked(fetch).mock.calls[0];
    const url = call[0] as string;
    expect(url).toContain("/compiler/test");

    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.confType).toBe("junit");
    expect(body.files[1].name).toBe("Tests.kt");
  });

  it("returns compilation errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          testResults: {},
          errors: {
            "File.kt": [{ severity: "ERROR", message: "Unresolved reference" }],
            "Tests.kt": [],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await runKotlinTests("bad code", "class Tests {}");
    expect(result.passed).toBe(false);
    expect(result.errors).toContain("Unresolved reference");
  });

  it("handles network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Offline"));

    const result = await runKotlinTests("code", "tests");
    expect(result.passed).toBe(false);
    expect(result.errors).toContain("Offline");
  });

  it("fails closed when testResults is missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ errors: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await runKotlinTests("code", "tests");
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toContain("did not return any test results");
  });
});
