import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import org.jetbrains.kotlin.cli.common.ExitCode;
import org.jetbrains.kotlin.cli.jvm.K2JVMCompiler;

/**
 * A tiny line-oriented wrapper around the embeddable Kotlin compiler.
 *
 * The process stays alive so the JVM and compiler classes remain warm. Student
 * programs are only compiled here; they are executed in disposable JVMs by the
 * Next.js server.
 */
public final class CompilerWorker {
    private static final Base64.Decoder DECODER = Base64.getDecoder();
    private static final Base64.Encoder ENCODER = Base64.getEncoder();
    private static final K2JVMCompiler COMPILER = new K2JVMCompiler();

    private CompilerWorker() {}

    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            System.err.println("Usage: CompilerWorker <kotlin-home>");
            System.exit(2);
        }

        String kotlinHome = args[0];
        BufferedReader input = new BufferedReader(
            new InputStreamReader(System.in, StandardCharsets.UTF_8)
        );
        PrintStream protocol = System.out;
        protocol.println("READY");
        protocol.flush();

        String line;
        while ((line = input.readLine()) != null) {
            compile(line, kotlinHome, protocol);
        }
    }

    private static void compile(String request, String kotlinHome, PrintStream protocol) {
        String[] fields = request.split("\\t", -1);
        String requestId = fields.length > 0 ? fields[0] : "unknown";

        try {
            if (fields.length != 4) {
                throw new IllegalArgumentException("Malformed compiler request");
            }

            String outputDirectory = decode(fields[1]);
            String[] encodedSources = fields[2].isEmpty()
                ? new String[0]
                : fields[2].split(",");
            List<String> compilerArgs = new ArrayList<>();
            for (String encodedSource : encodedSources) {
                compilerArgs.add(decode(encodedSource));
            }
            if (!fields[3].isEmpty()) {
                String[] encodedClasspath = fields[3].split(",");
                List<String> classpath = new ArrayList<>();
                for (String encodedEntry : encodedClasspath) {
                    classpath.add(decode(encodedEntry));
                }
                compilerArgs.add("-classpath");
                compilerArgs.add(String.join(java.io.File.pathSeparator, classpath));
            }
            compilerArgs.add("-d");
            compilerArgs.add(outputDirectory);
            compilerArgs.add("-jvm-target");
            compilerArgs.add("17");
            compilerArgs.add("-kotlin-home");
            compilerArgs.add(kotlinHome);
            compilerArgs.add("-nowarn");

            ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
            ExitCode result;
            try (PrintStream compilerOutput = new PrintStream(
                diagnostics,
                true,
                StandardCharsets.UTF_8
            )) {
                result = COMPILER.exec(
                    compilerOutput,
                    compilerArgs.toArray(String[]::new)
                );
            }

            respond(
                protocol,
                requestId,
                result == ExitCode.OK ? "OK" : "ERROR",
                diagnostics.toString(StandardCharsets.UTF_8)
            );
        } catch (Throwable error) {
            respond(protocol, requestId, "INTERNAL", error.toString());
        }
    }

    private static String decode(String value) {
        return new String(DECODER.decode(value), StandardCharsets.UTF_8);
    }

    private static void respond(
        PrintStream protocol,
        String requestId,
        String status,
        String message
    ) {
        String encodedMessage = ENCODER.encodeToString(
            message.getBytes(StandardCharsets.UTF_8)
        );
        protocol.println(requestId + "\t" + status + "\t" + encodedMessage);
        protocol.flush();
    }
}
