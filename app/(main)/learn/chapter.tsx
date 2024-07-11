import { lessons, chapters } from "@/db/schema";

import { LessonButton } from "./lesson-button";
import { ChapterBanner } from "./chapter-banner";

type ChapterProps = {
  id: number;
  order: number;
  title: string;
  description: string;
  lessons: (typeof lessons.$inferSelect & {
    completed: boolean;
  })[];
  activeLesson:
    | (typeof lessons.$inferSelect & {
        chapter: typeof chapters.$inferSelect;
      })
    | undefined;
  activeLessonPercentage: number;
};

export const Chapter = ({
  title,
  description,
  lessons,
  activeLesson,
  activeLessonPercentage,
}: ChapterProps) => {
  return (
    <>
      <ChapterBanner title={title} description={description} />

      <div className="relative flex flex-col items-center">
        {lessons.map((lesson, i) => {
          const isCurrent = lesson.id === activeLesson?.id;
          const isLocked = !lesson.completed && !isCurrent;

          return (
            <LessonButton
              key={lesson.id}
              id={lesson.id}
              index={i}
              totalCount={lessons.length - 1}
              current={isCurrent}
              locked={isLocked}
              percentage={activeLessonPercentage}
            />
          );
        })}
      </div>
    </>
  );
};
