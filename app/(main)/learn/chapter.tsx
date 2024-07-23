import { topics } from "@/db/schema";

import { ChapterBanner } from "./chapter-banner";
import { TopicButton } from "./topic-button";

type ChapterProps = {
  id: number;
  order: number;
  title: string;
  description: string;
  topics: (typeof topics.$inferSelect & {
    completed: boolean;
  })[];
  activeTopic:
    | (typeof topics.$inferSelect)
    | undefined;
  activeTopicPercentage: number;
};

export const Chapter = ({
  title,
  description,
  topics,
  activeTopic,
  activeTopicPercentage,
}: ChapterProps) => {
  return (
    <>
      <ChapterBanner title={title} description={description} />

      <div className="relative flex flex-col items-center">
        {topics.map((topic, i) => {
          const isCurrent = topic.id === activeTopic?.id;
          const isLocked = !topic.completed && !isCurrent;

          return (
            <TopicButton
              key={topic.id}
              id={topic.id}
              index={i}
              totalCount={topics.length - 1}
              current={isCurrent}
              locked={isLocked}
              percentage={activeTopicPercentage}
              name={topic.title}
            />
          );
        })}
      </div>
    </>
  );
};
