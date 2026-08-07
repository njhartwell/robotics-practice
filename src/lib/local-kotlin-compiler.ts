import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export interface WorkerConfig {
  kotlinHome: string;
  kotlin: string;
  java: string;
  testSupport: string;
}

export interface KotlinCompileResult {
  success: boolean;
  diagnostics: string;
}

interface PendingCompile {
  resolve: (result: KotlinCompileResult) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const WORKER_DIRECTORY = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  ".cache",
  "kotlin-worker"
);
const WORKER_CONFIG = path.join(WORKER_DIRECTORY, "config.json");
const DEFAULT_COMPILE_TIMEOUT_MS = 15_000;

function boundedInteger(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(minimum, Math.min(parsed, maximum));
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function decode(value: string): string {
  return Buffer.from(value, "base64").toString("utf8");
}

function isWorkerConfig(value: unknown): value is WorkerConfig {
  if (typeof value !== "object" || value === null) return false;
  const config = value as Record<string, unknown>;
  return (
    typeof config.kotlinHome === "string" &&
    typeof config.kotlin === "string" &&
    typeof config.java === "string" &&
    typeof config.testSupport === "string"
  );
}

export class PersistentKotlinCompiler {
  private child: ChildProcessWithoutNullStreams | null = null;
  private config: WorkerConfig | null = null;
  private stdoutBuffer = "";
  private stderrBuffer = "";
  private requestId = 0;
  private pending = new Map<string, PendingCompile>();
  private queue: Promise<void> = Promise.resolve();

  compile(
    sourcePaths: string[],
    outputDirectory: string,
    classpath: string[] = []
  ): Promise<KotlinCompileResult> {
    const task = this.queue.then(() =>
      this.compileNow(sourcePaths, outputDirectory, classpath)
    );
    this.queue = task.then(
      () => undefined,
      () => undefined
    );
    return task;
  }

  getConfig(): WorkerConfig {
    if (!this.config) {
      throw new Error("The local Kotlin compiler worker has not started.");
    }
    return this.config;
  }

  async loadConfig(): Promise<WorkerConfig> {
    if (this.config) return this.config;

    const rawConfig = JSON.parse(await readFile(WORKER_CONFIG, "utf8"));
    if (!isWorkerConfig(rawConfig)) {
      throw new Error(
        "Invalid local Kotlin worker config. Run `mise run kotlin:worker:build`."
      );
    }
    this.config = rawConfig;
    return rawConfig;
  }

  stop(): void {
    this.child?.kill("SIGKILL");
    this.child = null;
  }

  private async compileNow(
    sourcePaths: string[],
    outputDirectory: string,
    classpath: string[]
  ): Promise<KotlinCompileResult> {
    const child = await this.ensureStarted();
    const requestId = String(++this.requestId);
    const timeoutMs = boundedInteger(
      process.env.KOTLIN_LOCAL_COMPILE_TIMEOUT_MS,
      DEFAULT_COMPILE_TIMEOUT_MS,
      1_000,
      60_000
    );

    return new Promise<KotlinCompileResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        this.stop();
        reject(
          new Error(`Local Kotlin compilation timed out after ${timeoutMs}ms.`)
        );
      }, timeoutMs);

      this.pending.set(requestId, { resolve, reject, timer });
      const sources = sourcePaths.map(encode).join(",");
      const encodedClasspath = classpath.map(encode).join(",");
      child.stdin.write(
        `${requestId}\t${encode(outputDirectory)}\t${sources}\t${encodedClasspath}\n`
      );
    });
  }

  private async ensureStarted(): Promise<ChildProcessWithoutNullStreams> {
    if (this.child && !this.child.killed) return this.child;

    const rawConfig = await this.loadConfig();

    const classpath = [
      WORKER_DIRECTORY,
      path.join(rawConfig.kotlinHome, "lib", "*"),
    ].join(path.delimiter);
    const child = spawn(
      rawConfig.java,
      [
        "-Xms128m",
        "-Xmx768m",
        `-Dkotlin.home=${rawConfig.kotlinHome}`,
        "-cp",
        classpath,
        "CompilerWorker",
        rawConfig.kotlinHome,
      ],
      {
        env: { ...process.env, KOTLIN_HOME: rawConfig.kotlinHome },
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    this.child = child;
    this.stdoutBuffer = "";
    this.stderrBuffer = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => this.handleStdout(chunk));
    child.stderr.on("data", (chunk: string) => {
      this.stderrBuffer = (this.stderrBuffer + chunk).slice(-8_000);
    });
    child.on("error", (error) => this.handleExit(error));
    child.on("close", (code) => {
      this.handleExit(
        new Error(
          `Local Kotlin compiler worker exited with code ${code ?? "unknown"}.` +
            (this.stderrBuffer ? `\n${this.stderrBuffer.trim()}` : "")
        )
      );
    });

    return child;
  }

  private handleStdout(chunk: string): void {
    this.stdoutBuffer += chunk;
    let newline = this.stdoutBuffer.indexOf("\n");
    while (newline >= 0) {
      const line = this.stdoutBuffer.slice(0, newline).trimEnd();
      this.stdoutBuffer = this.stdoutBuffer.slice(newline + 1);
      this.handleLine(line);
      newline = this.stdoutBuffer.indexOf("\n");
    }
  }

  private handleLine(line: string): void {
    if (!line || line === "READY") return;
    const [requestId, status, encodedMessage = ""] = line.split("\t");
    const pending = this.pending.get(requestId);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pending.delete(requestId);
    const diagnostics = decode(encodedMessage);
    if (status === "OK" || status === "ERROR") {
      pending.resolve({ success: status === "OK", diagnostics });
      return;
    }

    pending.reject(
      new Error(diagnostics || "The local Kotlin compiler worker failed.")
    );
  }

  private handleExit(error: Error): void {
    if (!this.child) return;
    this.child = null;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }
}

declare global {
  var frcKotlinCompiler: PersistentKotlinCompiler | undefined;
}

export function getPersistentKotlinCompiler(): PersistentKotlinCompiler {
  const existing = globalThis.frcKotlinCompiler as
    | { stop?: () => void }
    | undefined;
  if (!(existing instanceof PersistentKotlinCompiler)) {
    existing?.stop?.();
    globalThis.frcKotlinCompiler = new PersistentKotlinCompiler();
    globalThis.frcKotlinWarmup = undefined;
  }
  return globalThis.frcKotlinCompiler!;
}

declare global {
  var frcKotlinWarmup: Promise<void> | undefined;
}

export function warmLocalKotlinCompiler(): Promise<void> {
  globalThis.frcKotlinWarmup ??= (async () => {
    const workspace = await mkdtemp(
      path.join(/*turbopackIgnore: true*/ tmpdir(), "frc-kotlin-warmup-")
    );
    const outputDirectory = path.join(
      /*turbopackIgnore: true*/ workspace,
      "classes"
    );
    const sourcePath = path.join(
      /*turbopackIgnore: true*/ workspace,
      "Warmup.kt"
    );
    await mkdir(outputDirectory);
    await writeFile(sourcePath, "fun frcKotlinCompilerWarmup() = Unit\n");

    try {
      const result = await getPersistentKotlinCompiler().compile(
        [sourcePath],
        outputDirectory
      );
      if (!result.success) {
        throw new Error(
          result.diagnostics.trim() || "Local Kotlin compiler warmup failed."
        );
      }
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  })();

  return globalThis.frcKotlinWarmup;
}
