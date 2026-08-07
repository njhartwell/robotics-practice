import path from "path";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";
import {
  getAllLessonMetas,
  getExercisesForLesson,
  getLessonMdx,
} from "@/lib/content/fs-loader";
import { LessonView } from "@/components/lesson/LessonView";
import { buildMdxComponents } from "@/lib/content/mdx-components";
import remarkGfm from "remark-gfm";
import { orderLessonsByTrack } from "@/lib/content/curriculum-track";

const CONTENT_DIR = path.resolve(process.cwd(), "content");

export async function generateStaticParams() {
  const metas = await getAllLessonMetas("playground", CONTENT_DIR);
  return metas.map((m) => ({ lessonSlug: m.slug }));
}

interface PageProps {
  params: Promise<{ lessonSlug: string }>;
}

export default async function PlaygroundLessonPage({ params }: PageProps) {
  const { lessonSlug } = await params;

  const metas = await getAllLessonMetas("playground", CONTENT_DIR);
  const lesson = metas.find((m) => m.slug === lessonSlug);

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Lesson not found</h1>
        <Link href="/playground" className="text-primary hover:underline">
          Back to lessons
        </Link>
      </div>
    );
  }

  const [exercises, mdxSource] = await Promise.all([
    getExercisesForLesson("playground", lessonSlug, CONTENT_DIR),
    getLessonMdx("playground", lessonSlug, CONTENT_DIR),
  ]);

  const mdxComponents = buildMdxComponents(exercises);
  const learningPath = orderLessonsByTrack(metas);
  const lessonIndex = learningPath.findIndex(
    (meta) => meta.slug === lessonSlug
  );
  const previousLesson =
    lessonIndex > 0 ? learningPath[lessonIndex - 1] : undefined;
  const nextLesson =
    lessonIndex >= 0 && lessonIndex < learningPath.length - 1
      ? learningPath[lessonIndex + 1]
      : undefined;

  let mdxContent: React.ReactElement;
  if (mdxSource) {
    const { content } = await compileMDX({
      source: mdxSource,
      components: mdxComponents,
      options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
    });
    mdxContent = content;
  } else {
    mdxContent = <p className="text-muted">No content yet.</p>;
  }

  return (
    <LessonView
      lesson={lesson}
      exerciseIds={exercises.map((exercise) => exercise.id)}
      previousLesson={previousLesson}
      nextLesson={nextLesson}
    >
      {mdxContent}
    </LessonView>
  );
}
