import { describe, expect, it } from "vitest";
import { parseLocalTestOutput } from "./local-kotlin-runner";

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

describe("parseLocalTestOutput", () => {
  it("parses passing and failing hidden-test results", () => {
    const output = [
      ["FRC_TEST", encode("testPass"), "OK", "", "", ""].join("\t"),
      [
        "FRC_TEST",
        encode("testFailure"),
        "FAIL",
        encode("Expected <4> but was <3>"),
        encode("4"),
        encode("3"),
      ].join("\t"),
      "FRC_TESTS_DONE=2",
    ].join("\n");

    expect(parseLocalTestOutput(output)).toEqual({
      passed: false,
      errors: [],
      tests: [
        {
          name: "testPass",
          passed: true,
          message: undefined,
          expected: undefined,
          actual: undefined,
        },
        {
          name: "testFailure",
          passed: false,
          message: "Expected <4> but was <3>",
          expected: "4",
          actual: "3",
        },
      ],
    });
  });

  it("fails closed when the runner summary is missing", () => {
    const result = parseLocalTestOutput(
      ["FRC_TEST", encode("testPass"), "OK", "", "", ""].join("\t")
    );

    expect(result.passed).toBe(false);
    expect(result.errors[0]).toContain("did not report valid results");
  });
});
