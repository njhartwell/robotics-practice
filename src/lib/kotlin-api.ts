const API_SERVER = "https://api.kotlinlang.org";
const COMPILER_VERSION = "2.0.21"; // fallback; ideally fetched dynamically

interface KotlinFile {
  name: string;
  text: string;
  publicId: string;
}

export interface KotlinRunResult {
  output: string;
  errors: string[];
  success: boolean;
}

/**
 * Parse the JetBrains compiler output text.
 * Output is wrapped in <outStream>...</outStream> and <errStream>...</errStream> tags.
 * We extract only stdout (outStream) content.
 */
export function parseOutput(raw: string): string {
  if (!raw) return "";

  // Check if the output contains stream tags
  const hasStreamTags = raw.includes("<outStream>") || raw.includes("<errStream>");

  if (!hasStreamTags) {
    return raw.trim();
  }

  // Extract all <outStream> content
  const parts: string[] = [];
  const regex = /<outStream>([\s\S]*?)<\/outStream>/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    parts.push(match[1]);
  }

  let result = parts.join("");

  // Decode HTML entities
  result = result
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');

  return result.trim();
}

/**
 * Build the files array for the API request.
 * The main code goes in File.kt, hidden dependencies go in hiddenDependency0.kt, etc.
 */
export function buildFiles(code: string, hiddenCode?: string): KotlinFile[] {
  const files: KotlinFile[] = [
    { name: "File.kt", text: code, publicId: "" },
  ];

  if (hiddenCode) {
    files.push({
      name: "hiddenDependency0.kt",
      text: hiddenCode,
      publicId: "",
    });
  }

  return files;
}

/**
 * Run Kotlin code via the JetBrains compiler API.
 * Optionally include hidden code (e.g. a main function that calls the student's code).
 */
export async function runKotlin(
  code: string,
  hiddenCode?: string
): Promise<KotlinRunResult> {
  const files = buildFiles(code, hiddenCode);

  const url = `${API_SERVER}/api/${COMPILER_VERSION}/compiler/run`;
  const body = JSON.stringify({
    args: "",
    files,
    confType: "java",
  });

  let data: {
    text?: string;
    errors?: Record<string, { severity: string; message: string }[]>;
    exception?: { fullName?: string; message?: string } | null;
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    data = await response.json();
  } catch (err) {
    return {
      output: "",
      errors: [(err as Error).message || "Network error"],
      success: false,
    };
  }

  // Collect compilation errors
  const errors: string[] = [];
  if (data.errors) {
    for (const fileErrors of Object.values(data.errors)) {
      for (const err of fileErrors) {
        if (err.severity === "ERROR") {
          errors.push(err.message);
        }
      }
    }
  }

  // Check for runtime exception
  if (data.exception) {
    const msg = data.exception.message || data.exception.fullName || "Runtime error";
    errors.push(msg);
  }

  const output = parseOutput(data.text ?? "");
  const success = errors.length === 0;

  return { output, errors, success };
}
