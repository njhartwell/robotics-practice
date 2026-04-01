@AGENTS.md

# FRC Kotlin Tutorial Platform

A gamified, browser-based Kotlin tutorial for FRC robotics students, modeled after the Helsinki Java MOOC.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- **Code execution**: JetBrains Kotlin Playground (embedded widget)
- **Content**: MDX via `next-mdx-remote/rsc` with `remark-gfm`
- **Testing**: Vitest + React Testing Library
- **Commands**: `bun test:run` (tests), `bun run dev` (dev server), `bun run build` (production build)

## Development Practices

### Red/Green TDD

All new logic must follow red/green development:
1. Write failing tests first
2. Verify they fail (`bun test:run`)
3. Implement the minimum code to make them pass
4. Verify green (`bun test:run`)

This applies to library code (`src/lib/`), utilities, and data logic. UI components don't require tests for every change, but core logic (gamification, progress, content loading, validation) must be TDD.

### Framework First

Build infrastructure with stub content before writing real lessons. Validate that the framework works end-to-end before investing in content authoring.

## Content Guidelines

### Team Identity

- **Team number**: 4215
- **Team name**: Tribots
- These are defined in `src/lib/constants.ts` (`TEAM_NUMBER`, `TEAM_NAME`) for use in code.
- Use these in all lesson examples instead of made-up team numbers/names.

### Target Audience

The audience is **middle school and high school students (ages 12-18) with zero prior programming experience**. They are FRC team members learning to code for the first time. Write accordingly:

- **Use simple, short sentences.** Avoid jargon unless you've just defined it.
- **Explain every new concept before using it.** Never assume prior knowledge.
- **One idea per paragraph.** Don't pack multiple concepts together.
- **Use concrete, relatable examples.** FRC-themed where possible (team numbers, motor speeds, match scores, alliance colors) but keep them intuitive.
- **Avoid "simply", "just", "obviously", "of course".** Nothing is obvious to a beginner.
- **Show before you tell.** Lead with a code example, then explain what it does.
- **Be encouraging.** Celebrate progress ("Great job!", "You've got this!").

### Exercise Design

- Instructions must be crystal clear. State exactly what output is expected.
- Start easy and build gradually within each lesson.
- Every exercise should be completable with only the knowledge taught so far in the lesson.
- Use `hiddenPostamble` for function-parameter exercises (Kotlin Playground doesn't support interactive `readLine()`).
- Mix exercise types: code-completion, fix-the-bug, write-from-scratch, multiple-choice, fill-in-the-blank.
- XP values: 10 (fill-in-blank/MC), 15 (code-completion), 20 (write-from-scratch/fix-the-bug).

### MDX Authoring

- Lessons live in `content/playground/<section>/<lesson>/` or `content/ide-projects/<lesson>/`
- Each lesson has `meta.json`, `lesson.mdx`, and `exercises/*.json`
- Available MDX components: `<Exercise id="01" />`, `<Callout type="info|warning|tip">`, `<FrcContext>`, `<Checklist>`
- The first `# H1` in MDX is suppressed (the page header renders the lesson title)
- Tables require `remark-gfm` (already configured)
- Exercise `id` matches the exercise's `order` field (id="01" → order 1)

## Project Structure

```
content/                    # Lesson content (MDX + exercise JSON)
  playground/               # Browser-based lessons
    01-getting-started/     # Section directory
      01-hello-kotlin/      # Lesson directory
        meta.json           # Lesson metadata
        lesson.mdx          # Lesson content
        exercises/*.json    # Exercise definitions
  ide-projects/             # IDE-required lessons
src/
  app/                      # Next.js App Router
    playground/             # Playground lesson routes
    ide-projects/           # IDE project routes
  components/               # React components
    exercises/              # Exercise type components
    gamification/           # XP, levels, badges UI
    layout/                 # Sidebar, TopBar, AppShell
    lesson/                 # LessonView, LessonCard
    mdx/                    # MDX custom components
    part2/                  # IDE project components
    playground/             # Kotlin Playground wrapper
  lib/
    content/                # Content loading (fs-loader, mdx-components)
    gamification/           # XP, levels, badges logic
    progress/               # User progress (types, reducer, provider, storage)
```
