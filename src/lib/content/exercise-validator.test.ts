import { describe, it, expect } from "vitest";
import { validateOutput, validateMultipleChoice, validateFillInTheBlank } from "./exercise-validator";

describe("validateOutput", () => {
  it("returns true for exact match", () => {
    expect(validateOutput("Hello World", "Hello World")).toBe(true);
  });

  it("trims whitespace before comparing", () => {
    expect(validateOutput("  Hello World  \n", "Hello World")).toBe(true);
  });

  it("returns false for mismatch", () => {
    expect(validateOutput("Hello World", "Goodbye World")).toBe(false);
  });

  it("handles multiline output", () => {
    expect(validateOutput("line1\nline2", "line1\nline2")).toBe(true);
  });

  it("normalizes line endings", () => {
    expect(validateOutput("line1\r\nline2", "line1\nline2")).toBe(true);
  });
});

describe("validateMultipleChoice", () => {
  it("returns true for correct answer", () => {
    expect(validateMultipleChoice("b", "b")).toBe(true);
  });

  it("returns false for incorrect answer", () => {
    expect(validateMultipleChoice("a", "b")).toBe(false);
  });
});

describe("validateFillInTheBlank", () => {
  it("returns true for exact match", () => {
    expect(validateFillInTheBlank("val", ["val"])).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(validateFillInTheBlank("Val", ["val"])).toBe(true);
  });

  it("accepts any of multiple answers", () => {
    expect(validateFillInTheBlank("var", ["val", "var"])).toBe(true);
  });

  it("trims whitespace", () => {
    expect(validateFillInTheBlank("  val  ", ["val"])).toBe(true);
  });

  it("returns false for wrong answer", () => {
    expect(validateFillInTheBlank("let", ["val", "var"])).toBe(false);
  });
});
