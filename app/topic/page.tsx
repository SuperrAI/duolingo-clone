import { redirect } from "next/navigation";

import { getTopic, getUserProgress, getUserSubscription } from "@/db/queries";

import { Quiz } from "./quiz";

const TopicPage = async () => {
  const topicData = getTopic();
  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();

  const [topic, userProgress, userSubscription] = await Promise.all([
    topicData,
    userProgressData,
    userSubscriptionData,
  ]);

  if (!topic || !userProgress) return redirect("/learn");

  const initialPercentage =
    (topic.challenges.filter((challenge) => challenge.completed).length /
      topic.challenges.length) *
    100;

  return (
    <Quiz
      initialTopicId={topic.id}
      initialTopicChallenges={topic.challenges}
      initialHearts={userProgress.hearts}
      initialPercentage={initialPercentage}
      userSubscription={userSubscription}
    />
  );
};

export default TopicPage;
