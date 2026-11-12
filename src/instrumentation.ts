export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.VERCEL === "1" ||
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.KOTLIN_EXECUTION_MODE === "remote"
  ) {
    return;
  }

  try {
    const { warmLocalKotlinCompiler } = await import(
      "@/lib/local-kotlin-compiler"
    );
    await warmLocalKotlinCompiler();
    console.log("Local Kotlin compiler is warm and ready.");
  } catch (error) {
    const message =
      "Local Kotlin compiler warmup failed; grading will use the remote fallback.";
    if (process.env.KOTLIN_EXECUTION_MODE === "local") {
      console.error(message, error);
    } else {
      console.warn(message, error);
    }
  }
}
