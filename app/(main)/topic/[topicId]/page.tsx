import { redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import {
  getLessonPercentage,
  getTopics,
  getUserProgress,
  getUserSubscription,
} from "@/db/queries";

import { Topic } from "./topic";
import { Header } from "../../learn/header";

interface TopicPageProps {
  params: {
    topicId: string;
  };
}

const TopicPage = async ({ params }: TopicPageProps) => {
  const userProgressData = getUserProgress();
  const topicData = getTopics(parseInt(params.topicId));
  const lessonPercentageData = getLessonPercentage();
  const userSubscriptionData = getUserSubscription();

  const [
    userProgress,
    topics,
    lessonPercentage,
    userSubscription,
  ] = await Promise.all([
    userProgressData,
    topicData,
    lessonPercentageData,
    userSubscriptionData,
  ]);

  if (!topics || topics.length == 0 || !userProgress || !userProgress.activeSubject)
    redirect("/subjects");

  const isPro = !!userSubscription?.isActive;
  const [topic] = topics;

  // Find the first uncompleted lesson or the last lesson if all are completed
  const activeLesson = topic.lessons.find(lesson => !lesson.completed) || topic.lessons[topic.lessons.length - 1];

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeSubject={userProgress.activeSubject}
          hearts={userProgress.hearts}
          points={userProgress.points}
          hasActiveSubscription={isPro}
        />
      </StickyWrapper>
      <FeedWrapper>
        <Header title={topic.title} />
        <Topic
          id={topic.id}
          title={topic.title}
          description={topic.description}
          lessons={topic.lessons}
          activeLesson={activeLesson}
          activeLessonPercentage={lessonPercentage}
        />
      </FeedWrapper>
    </div>
  );
};

export default TopicPage;
