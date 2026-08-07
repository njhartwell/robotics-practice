import {
  runLocalKotlin,
  runLocalKotlinTests,
} from "../src/lib/local-kotlin-runner.ts";
import { getPersistentKotlinCompiler } from "../src/lib/local-kotlin-compiler.ts";

const started = performance.now();

try {
  const outputResult = await runLocalKotlin(
    'fun main() { println("compiler ready") }'
  );
  if (!outputResult.success || outputResult.output !== "compiler ready") {
    throw new Error(
      `Local output runner failed: ${JSON.stringify(outputResult)}`
    );
  }

  const testResult = await runLocalKotlinTests(
    "fun double(value: Int) = value * 2",
    `import org.junit.Assert
import org.junit.Test

class Tests {
    @Test
    fun testDouble() {
        Assert.assertEquals(8, double(4))
    }
}`
  );
  if (!testResult.passed || testResult.tests.length !== 1) {
    throw new Error(`Local test runner failed: ${JSON.stringify(testResult)}`);
  }

  console.log(
    `Local Kotlin worker passed output and hidden-test checks in ${Math.round(
      performance.now() - started
    )}ms.`
  );
} finally {
  getPersistentKotlinCompiler().stop();
}
