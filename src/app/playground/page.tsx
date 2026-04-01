import path from "path";
import { getAllLessonMetas } from "@/lib/content/fs-loader";
import { PlaygroundIndexClient } from "./PlaygroundIndexClient";

const CONTENT_DIR = path.resolve(process.cwd(), "content");

export default async function PlaygroundIndex() {
  const lessons = await getAllLessonMetas("playground", CONTENT_DIR);

  return <PlaygroundIndexClient lessons={lessons} />;
}
