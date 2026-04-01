import path from "path";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";
import {
  getAllLessonMetas,
  getLessonMdx,
} from "@/lib/content/fs-loader";
import { IdeProjectView } from "@/components/part2/IdeProjectView";
import { buildMdxComponents } from "@/lib/content/mdx-components";
import remarkGfm from "remark-gfm";

const CONTENT_DIR = path.resolve(process.cwd(), "content");

export async function generateStaticParams() {
  const metas = await getAllLessonMetas("ide-projects", CONTENT_DIR);
  return metas.map((m) => ({ lessonSlug: m.slug }));
}

interface PageProps {
  params: Promise<{ lessonSlug: string }>;
}

export default async function IdeProjectLessonPage({ params }: PageProps) {
  const { lessonSlug } = await params;

  const metas = await getAllLessonMetas("ide-projects", CONTENT_DIR);
  const lesson = metas.find((m) => m.slug === lessonSlug);

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Lesson not found</h1>
        <Link href="/ide-projects" className="text-primary hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }

  const mdxSource = await getLessonMdx("ide-projects", lessonSlug, CONTENT_DIR);
  const mdxComponents = buildMdxComponents([]);

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
    <IdeProjectView lesson={lesson}>
      {mdxContent}
    </IdeProjectView>
  );
}
