import path from "path";
import { getAllLessonMetas } from "@/lib/content/fs-loader";
import { IdeProjectsIndexClient } from "./IdeProjectsIndexClient";

const CONTENT_DIR = path.resolve(process.cwd(), "content");

export default async function IdeProjectsIndex() {
  const lessons = await getAllLessonMetas("ide-projects", CONTENT_DIR);

  return <IdeProjectsIndexClient lessons={lessons} />;
}
