import type { Metadata } from "next";
import path from "path";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { getAllLessonMetas } from "@/lib/content/fs-loader";

export const metadata: Metadata = {
  title: "FRC Kotlin Tutorial",
  description:
    "Learn Kotlin for FRC robotics with interactive lessons and projects",
};

const CONTENT_DIR = path.resolve(process.cwd(), "content");

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [playgroundLessons, ideLessons] = await Promise.all([
    getAllLessonMetas("playground", CONTENT_DIR),
    getAllLessonMetas("ide-projects", CONTENT_DIR),
  ]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AppShell
          playgroundLessons={playgroundLessons}
          ideLessons={ideLessons}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
