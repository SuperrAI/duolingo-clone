import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { getNextChallenge } from "@/actions/get-next-challenge";
import db from "@/db/drizzle";
import { getLesson, getLessonProgress, getUserProgress, getUserSubscription } from "@/db/queries";
import { lessonProgress } from "@/db/schema";

import { Quiz } from "./quiz";

export async function getLessonPage(lessonId?: number) {
  const { userId } = auth()
  if (!userId) return null;

  const lessonData = getLesson(lessonId);
  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();

  const [lesson, userProgress, userSubscription] = await Promise.all([
    lessonData,
    userProgressData,
    userSubscriptionData
  ]);

  if (!lesson || !userProgress) return redirect("/learn");

  const userLessonProgress = await getLessonProgress(userId, lesson.id);

  let currentContentBlockOrder = 0;

  if (!userLessonProgress) {
    await db.insert(lessonProgress).values({
      userId,
      lessonId: lesson.id,
      currentDifficulty: 1,
      correctAnswers: 0,
      totalAttempts: 1,
      abilityEstimate: 1,
    });
  } else {
    currentContentBlockOrder = userLessonProgress.currentContentBlockOrder
  }

  const initialChallenge = await getNextChallenge(lesson.id);

  const initialPercentage =
    (lesson.challenges.filter((challenge) => challenge.completed).length /
      lesson.challenges.length) *
    100;

  return (
    <Quiz
      initialPercentage={initialPercentage}
      initialHearts={userProgress.hearts}
      initialLessonId={lesson.id}
      currentContentBlockOrder={currentContentBlockOrder}
      contentBlockIds={lesson.contentBlockIds}
      contentBlocks={lesson.contentBlocks}
      initialLessonChallenges={lesson.challenges}
      initialChallenge={initialChallenge}
      userSubscription={userSubscription}
    />
  );
}

const LessonPage = async () => {
  return getLessonPage();
};

export default LessonPage;
