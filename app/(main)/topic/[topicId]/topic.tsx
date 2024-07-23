import { lessons } from "@/db/schema";

import { TopicBanner } from "./topic-banner";
import { LessonButton } from "../../learn/lesson-button";

type TopicProps = {
  id: number;
  title: string;
  description: string;
  lessons: (typeof lessons.$inferSelect & {
    completed: boolean;
  })[];
  activeLesson:
    | (typeof lessons.$inferSelect)
    | undefined;
  activeLessonPercentage: number;
};

export const Topic = ({
  title,
  description,
  lessons,
  activeLesson,
  activeLessonPercentage,
}: TopicProps) => {
  return (
    <>
      <TopicBanner title={title} description={description} />

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
