package org.junit

import kotlin.math.abs
import kotlin.reflect.KClass

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Test(val expected: KClass<out Throwable> = None::class)

class None : Throwable()

class ComparisonFailure(
    message: String,
    val expected: String?,
    val actual: String?,
) : AssertionError(message)

object Assert {
    @JvmStatic
    fun assertEquals(expected: Any?, actual: Any?) {
        if (expected != actual) {
            throw ComparisonFailure(
                "Expected <$expected> but was <$actual>",
                expected?.toString(),
                actual?.toString(),
            )
        }
    }

    @JvmStatic
    fun assertEquals(message: String, expected: Any?, actual: Any?) {
        if (expected != actual) {
            throw ComparisonFailure(
                "$message: expected <$expected> but was <$actual>",
                expected?.toString(),
                actual?.toString(),
            )
        }
    }

    @JvmStatic
    fun assertEquals(expected: Double, actual: Double, delta: Double) {
        if (
            expected.isNaN() != actual.isNaN() ||
            (!expected.isNaN() && abs(expected - actual) > delta)
        ) {
            throw ComparisonFailure(
                "Expected <$expected> but was <$actual> (delta <$delta>)",
                expected.toString(),
                actual.toString(),
            )
        }
    }

    @JvmStatic
    fun assertTrue(value: Boolean) = assertTrue("Expected true", value)

    @JvmStatic
    fun assertTrue(message: String, value: Boolean) {
        if (!value) throw AssertionError(message)
    }

    @JvmStatic
    fun assertFalse(value: Boolean) = assertFalse("Expected false", value)

    @JvmStatic
    fun assertFalse(message: String, value: Boolean) {
        if (value) throw AssertionError(message)
    }

    @JvmStatic
    fun assertNull(value: Any?) {
        if (value != null) throw AssertionError("Expected null but was <$value>")
    }

    @JvmStatic
    fun fail(message: String): Nothing = throw AssertionError(message)
}
