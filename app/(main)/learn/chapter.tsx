import { skills, chapters } from "@/db/schema";

import { SkillButton } from "./skill-button";
import { ChapterBanner } from "./chapter-banner";

type ChapterProps = {
  id: number;
  order: number;
  title: string;
  description: string;
  skills: (typeof skills.$inferSelect & {
    completed: boolean;
  })[];
  activeSkill:
    | (typeof skills.$inferSelect & {
        chapter: typeof chapters.$inferSelect;
      })
    | undefined;
  activeSkillPercentage: number;
};

export const Chapter = ({
  title,
  description,
  skills,
  activeSkill,
  activeSkillPercentage,
}: ChapterProps) => {
  return (
    <>
      <ChapterBanner title={title} description={description} />

      <div className="relative flex flex-col items-center">
        {skills.map((skill, i) => {
          const isCurrent = skill.id === activeSkill?.id;
          const isLocked = !skill.completed && !isCurrent;

          return (
            <SkillButton
              key={skill.id}
              id={skill.id}
              index={i}
              totalCount={skills.length - 1}
              current={isCurrent}
              locked={isLocked}
              percentage={activeSkillPercentage}
            />
          );
        })}
      </div>
    </>
  );
};
