import { redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { Promo } from "@/components/promo";
import { Quests } from "@/components/quests";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import {
  getSubjectProgress,
  getLessonPercentage,
  getChapters,
  getUserProgress,
  getUserSubscription,
} from "@/db/queries";

import { Chapter } from "./chapter";
import { Header } from "./header";

const LearnPage = async () => {
  const userProgressData = getUserProgress();
  const subjectProgressData = getSubjectProgress();
  const lessonPercentageData = getLessonPercentage();
  const chaptersData = getChapters();
  const userSubscriptionData = getUserSubscription();

  const [
    userProgress,
    chapters,
    subjectProgress,
    lessonPercentage,
    userSubscription,
  ] = await Promise.all([
    userProgressData,
    chaptersData,
    subjectProgressData,
    lessonPercentageData,
    userSubscriptionData,
  ]);

  if (!subjectProgress || !userProgress || !userProgress.activeSubject)
    redirect("/subjects");

  const isPro = !!userSubscription?.isActive;

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeSubject={userProgress.activeSubject}
          hearts={userProgress.hearts}
          points={userProgress.points}
          hasActiveSubscription={isPro}
        />

        {!isPro && <Promo />}
        <Quests points={userProgress.points} />
      </StickyWrapper>
      <FeedWrapper>
        <Header title={userProgress.activeSubject.title} />
        {chapters.map((chapter) => (
          <div key={chapter.id} className="mb-10">
            <Chapter
              id={chapter.id}
              order={chapter.order}
              description={chapter.description}
              title={chapter.title}
              lessons={chapter.lessons}
              activeLesson={subjectProgress.activeLesson}
              activeLessonPercentage={lessonPercentage}
            />
          </div>
        ))}
      </FeedWrapper>
    </div>
  );
};

export default LearnPage;
