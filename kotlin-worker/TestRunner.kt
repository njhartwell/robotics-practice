import java.lang.reflect.InvocationTargetException
import java.nio.charset.StandardCharsets
import java.util.Base64
import org.junit.ComparisonFailure
import org.junit.None
import org.junit.Test

private data class TestOutcome(
    val passed: Boolean,
    val message: String? = null,
    val expected: String? = null,
    val actual: String? = null,
)

private fun encode(value: String?): String = Base64.getEncoder().encodeToString(
    (value ?: "").toByteArray(StandardCharsets.UTF_8)
)

private fun runTest(
    testsClass: Class<*>,
    method: java.lang.reflect.Method,
): TestOutcome {
    val expectedException = method.getAnnotation(Test::class.java).expected.java
    val instance = testsClass.getDeclaredConstructor().newInstance()
    method.isAccessible = true

    return try {
        method.invoke(instance)
        if (expectedException == None::class.java) {
            TestOutcome(passed = true)
        } else {
            TestOutcome(
                passed = false,
                message = "Expected ${expectedException.simpleName} but no exception was thrown",
            )
        }
    } catch (error: InvocationTargetException) {
        val cause = error.targetException
        if (
            expectedException != None::class.java &&
            expectedException.isInstance(cause)
        ) {
            TestOutcome(passed = true)
        } else if (cause is ComparisonFailure) {
            TestOutcome(
                passed = false,
                message = cause.message,
                expected = cause.expected,
                actual = cause.actual,
            )
        } else {
            TestOutcome(
                passed = false,
                message = cause.message ?: cause.javaClass.simpleName,
            )
        }
    } catch (error: Throwable) {
        TestOutcome(
            passed = false,
            message = error.message ?: error.javaClass.simpleName,
        )
    }
}

fun main() {
    val testsClass = Class.forName("Tests")
    val methods = testsClass.declaredMethods
        .filter { it.getAnnotation(Test::class.java) != null }
        .sortedBy { it.name }

    for (method in methods) {
        val outcome = runTest(testsClass, method)
        println(
            listOf(
                "FRC_TEST",
                encode(method.name),
                if (outcome.passed) "OK" else "FAIL",
                encode(outcome.message),
                encode(outcome.expected),
                encode(outcome.actual),
            ).joinToString("\t")
        )
    }

    println("FRC_TESTS_DONE=${methods.size}")
}
