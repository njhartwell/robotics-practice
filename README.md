# FRC Kotlin Tutorial

An interactive Kotlin course for high-school students preparing to program a
FIRST Robotics Competition robot. The app combines browser-based lessons,
graded exercises, local progress, and guided WPILib projects.

## Course structure

- **Core Kotlin for FRC** is the recommended beginner path: language basics,
  functions, collections, object-oriented Kotlin, null safety, and the Kotlin
  features students will encounter in robot code.
- **Further Kotlin** contains optional algorithms and advanced language topics.
- **IDE Projects** bridge the browser lessons into a real WPILib project.

Lesson content lives under `content/playground/<section>/<lesson>/`. Each lesson
contains:

- `meta.json` — title, order, level, XP, timing, and tags.
- `lesson.mdx` — lesson prose with `<Exercise id="01" />` placeholders.
- `exercises/*.json` — interactive exercise definitions and private graders.

The test suite scans the complete curriculum. Invalid metadata, duplicate
exercise IDs, missing graders, or MDX references that do not match exercise
order fail CI.

## Local development

The recommended setup uses [mise](https://mise.jdx.dev/) to install the pinned
versions of Bun and Kotlin:

```bash
mise trust
mise install
mise run install:frozen
mise run dev
```

If you already have Bun installed, `bun install` and `bun run dev` work without
mise. The committed `bun.lock` is the only JavaScript dependency lockfile.

Open [http://localhost:3000](http://localhost:3000). Create a local account on
the sign-up screen. Existing browser progress is imported into the account the
first time it signs in, then stored in the configured SQLite-compatible
database.

New accounts are pending until an administrator approves them. Bootstrap the
first administrator by setting `BOOTSTRAP_ADMIN_EMAILS` to that person’s email
address before they sign up. Multiple addresses may be comma-separated. There
is deliberately no default administrator identity.

## Authentication and database

Local development uses Better Auth email/password accounts and a libSQL file at
`data/tutorial.db`. Copy `.env.example` to `.env.local` when you need to
override mise defaults or enable GitHub, Google, or Microsoft sign-in.
When the tutorial is opened through another LAN hostname, add its full origin
to `BETTER_AUTH_TRUSTED_ORIGINS` and its hostname to `DEV_ALLOWED_ORIGINS`.

Administrators can open `/admin/access` to create seven-day, one-time
invitation links and approve or reject accounts in the access queue. Invitation
tokens are stored as SHA-256 hashes; the shareable token is only returned when
an invitation is created or replaced.

Every lesson step includes a feedback button for in-context comments and an
optional 1–5 rating. Completed lessons also prompt for a lesson-level review.
Administrators can triage the latest submissions at `/admin/feedback`; feedback
is stored alongside user and lesson context in the same database.

The same Drizzle schema works with hosted Turso/libSQL: set `DATABASE_URL` and
`DATABASE_AUTH_TOKEN` (or `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`), then run
`mise run db:migrate`. Both the app and migrations support these names;
non-empty `DATABASE_*` values take precedence over their `TURSO_*` equivalents.
Remove any local `DATABASE_URL=file:...` override when using `TURSO_*`.
Common database tasks:

```bash
mise run db:generate
mise run db:migrate
mise run db:studio
```

Run the full local verification suite with:

```bash
mise run check
```

Individual checks are also available:

```bash
mise run lint
mise run typecheck
mise run test
mise run build
```

Execute every exercise solution and its hidden grader through the same
persistent worker used by the app with:

```bash
mise run test:solutions
```

`mise install` provides the Kotlin compiler used by this check. The slower,
standalone compiler audit remains available as `mise run test:solutions:cli`.
Set `KOTLINC_BIN=/path/to/kotlinc` only when that audit should use another
compiler.

Run every application check and the complete Kotlin solution audit with:

```bash
mise run check:all
```

Use `mise tasks` to see the complete task list and short aliases such as
`mise run d`, `mise run t`, and `mise run c`.

## Deploying to Vercel + Turso

1. Create a Turso database and generate its credentials:

   ```bash
   turso db create robotics-practice
   turso db show robotics-practice --url
   turso db tokens create robotics-practice
   ```

2. Import this repository into Vercel. The committed `vercel.json` installs
   with the frozen Bun lockfile and builds Next.js without a Kotlin/JVM setup.
   Configure these environment variables before the first deployment:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Turso's `libsql://...` URL |
   | `DATABASE_AUTH_TOKEN` | Database token from Turso |
   | `BETTER_AUTH_URL` | Exact public HTTPS origin, e.g. `https://learn.example.com` |
   | `BETTER_AUTH_SECRET` | Random secret of at least 32 characters (`openssl rand -hex 32`) |
   | `BOOTSTRAP_ADMIN_EMAILS` | Comma-separated emails to make administrators on signup |

   Optional OAuth credentials and `NEXT_PUBLIC_*_AUTH` flags work as described
   in `.env.example`. Register each provider's callback as
   `https://<your-host>/api/auth/callback/<provider>` (github, google, or microsoft).
   Add any additional allowed origins to `BETTER_AUTH_TRUSTED_ORIGINS`.

3. Apply the committed migrations before serving traffic. From a local checkout,
   set `DATABASE_URL` and `DATABASE_AUTH_TOKEN` to the target Turso credentials,
   then run `bun run db:migrate`. Drizzle also reads `.env.local`; exported
   environment variables take precedence. Use `bun run db:generate` only when
   changing the schema. Migrations deliberately run separately from Vercel
   builds so preview builds cannot migrate the production database accidentally.

4. Deploy, sign up with a bootstrap administrator email, and verify sign-in,
   lesson loading, code grading, progress persistence, and the admin access page.

Use a separate Turso database and auth secret for Preview deployments, migrate
that database separately, and set `BETTER_AUTH_URL` to the exact preview origin
(a stable preview domain is easiest). Avoid sharing production credentials with
previews. Redeploy after changing environment variables; public OAuth flags
are embedded at build time.

On Vercel the app requires hosted database credentials and explicit auth
settings. Lesson files are included in server function traces. Kotlin grading
always uses the remote compiler service, skips JVM warmup, and has a 60-second
function budget. You can configure `KOTLIN_API_SERVER`,
`KOTLIN_COMPILER_VERSION`, and `KOTLIN_API_TIMEOUT_MS` for your compiler service;
grading requires that service to be reachable from Vercel.

See the [Vercel Next.js guide](https://vercel.com/docs/frameworks/nextjs),
[function duration configuration](https://vercel.com/docs/functions/configuring-functions/duration),
and [Drizzle's Turso guide](https://orm.drizzle.team/docs/tutorials/drizzle-with-turso).

## Exercise grading

Code exercises are graded through the `POST /api/kotlin` route. The browser
sends the lesson slug, exercise ID, and student code. The server loads the
exercise definition and uses a persistent local JVM compiler worker, so hidden
tests, expected output, and solutions are not serialized into lesson pages.

`mise run dev` builds the worker and Next.js warms it during server startup.
The compiler stays alive between submissions, while each compiled student
program runs in a disposable JVM with memory, runtime, and output limits. In
`auto` mode the JetBrains compiler API remains available as a fallback when the
local toolchain cannot start.

Configuration is optional:

| Variable | Default | Purpose |
| --- | --- | --- |
| `KOTLIN_API_SERVER` | `https://api.kotlinlang.org` | Kotlin compiler service |
| `KOTLIN_COMPILER_VERSION` | `2.0.21` | Compiler API version |
| `KOTLIN_API_TIMEOUT_MS` | `15000` | Compiler request timeout |
| `KOTLIN_EXECUTION_MODE` | `auto` | `auto`, `local`, or `remote` grading |
| `KOTLIN_LOCAL_COMPILE_TIMEOUT_MS` | `15000` | Local compilation timeout |
| `KOTLIN_LOCAL_EXECUTION_TIMEOUT_MS` | `3000` | Student program runtime limit |
| `KOTLIN_VALIDATION_CONCURRENCY` | `4` | Local solution-audit workers |
| `KOTLIN_VALIDATION_TIMEOUT_MS` | `60000` | Per-process local audit timeout |

Output exercises compare normalized console output. Test exercises require at
least one reported JUnit test and fail closed when the upstream service returns
an error or an unexpected response.

The local runner is intended for code written by students using this tutorial.
Its subprocess limits prevent hangs and runaway output, but it is not an OS
sandbox for hostile, untrusted programs.

The local solution audit compiles and executes every reference solution. It
compares output exercises exactly and runs every hidden test method with
throwing assertions, so a merely compilable but incorrect solution fails.

## Authoring a lesson

1. Copy a nearby lesson directory and give the lesson and every exercise a
   globally unique ID.
2. Add each exercise to the MDX in numeric order.
3. Use output grading for introductory console-output work. Prefer JUnit tests
   for functions, classes, edge cases, and behavior.
4. Provide starter code, a working solution, a concise hint, and beginner-safe
   failure expectations.
5. Run `mise run check:all` before submitting the change.

Do not put secrets in content files. Solution and test code are kept out of the
normal browser payload, but this is an educational grader rather than a secure
code-execution sandbox.
