import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = process.cwd();
const source = path.join(root, "kotlin-worker", "CompilerWorker.java");
const outputDirectory = path.join(root, ".cache", "kotlin-worker");
const outputClass = path.join(outputDirectory, "CompilerWorker.class");
const testSupport = path.join(outputDirectory, "test-support.jar");
const configPath = path.join(outputDirectory, "config.json");
const testSupportSources = [
  path.join(root, "kotlin-worker", "JunitStubs.kt"),
  path.join(root, "kotlin-worker", "TestRunner.kt"),
];

async function findCommand(name) {
  const { stdout } = await run("which", [name]);
  return stdout.trim();
}

const [kotlinc, kotlin, java, javac] = await Promise.all([
  findCommand("kotlinc"),
  findCommand("kotlin"),
  findCommand("java"),
  findCommand("javac"),
]);
const kotlinHome = path.resolve(path.dirname(kotlinc), "..");
const compilerJar = path.join(kotlinHome, "lib", "kotlin-compiler.jar");

await access(compilerJar);
await mkdir(outputDirectory, { recursive: true });

let needsBuild = true;
try {
  const [sourceInfo, outputInfo, existingConfig] = await Promise.all([
    stat(source),
    stat(outputClass),
    readFile(configPath, "utf8"),
  ]);
  const config = JSON.parse(existingConfig);
  needsBuild =
    outputInfo.mtimeMs < sourceInfo.mtimeMs ||
    config.kotlinHome !== kotlinHome ||
    config.java !== java;
} catch {
  needsBuild = true;
}

if (needsBuild) {
  await run(javac, [
    "-cp",
    compilerJar,
    "-d",
    outputDirectory,
    source,
  ]);
  console.log("Built persistent Kotlin compiler worker.");
} else {
  console.log("Persistent Kotlin compiler worker is up to date.");
}

let needsTestSupportBuild = true;
try {
  const [outputInfo, ...sourceInfo] = await Promise.all([
    stat(testSupport),
    ...testSupportSources.map((file) => stat(file)),
  ]);
  needsTestSupportBuild = sourceInfo.some(
    (sourceFile) => outputInfo.mtimeMs < sourceFile.mtimeMs
  );
} catch {
  needsTestSupportBuild = true;
}

if (needsTestSupportBuild) {
  await run(kotlinc, [
    ...testSupportSources,
    "-jvm-target",
    "17",
    "-d",
    testSupport,
  ]);
  console.log("Built local Kotlin test support.");
} else {
  console.log("Local Kotlin test support is up to date.");
}

await writeFile(
  configPath,
  JSON.stringify({ kotlinHome, kotlin, java, testSupport }, null, 2) + "\n"
);
