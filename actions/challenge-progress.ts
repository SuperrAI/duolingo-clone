"use server";

import { auth } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { MAX_HEARTS } from "@/constants";
import db from "@/db/drizzle";
import { getUserProgress, getUserSubscription } from "@/db/queries";
import {
  challengeProgress,
  challenges,
  lessonProgress,
  userProgress,
} from "@/db/schema";

export const upsertChallengeProgress = async (
  challengeId: number,
  isCorrect: boolean
) => {
  const { userId } = auth();

  if (!userId) throw new Error("Unauthorized.");

  const currentUserProgress = await getUserProgress();
  const userSubscription = await getUserSubscription();

  if (!currentUserProgress) throw new Error("User progress not found.");

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });

  if (!challenge) throw new Error("Challenge not found.");

  const lessonId = challenge.lessonId;

  const existingChallengeProgress = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, challengeId)
    ),
  });

  const isPractice = !!existingChallengeProgress;

  if (
    currentUserProgress.hearts === 0 &&
    !isPractice &&
    !userSubscription?.isActive
  )
    return { error: "hearts" };

  if (isPractice) {
    await db
      .update(challengeProgress)
      .set({
        completed: true,
      })
      .where(eq(challengeProgress.id, existingChallengeProgress.id));

    await db
      .update(userProgress)
      .set({
        hearts: Math.min(currentUserProgress.hearts + 1, MAX_HEARTS),
        points: currentUserProgress.points + 10,
      })
      .where(eq(userProgress.userId, userId));

    revalidatePath("/learn");
    revalidatePath("/lesson");
    revalidatePath("/quests");
    revalidatePath("/leaderboard");
    revalidatePath(`/lesson/${lessonId}`);
    return;
  }

  await db.insert(challengeProgress).values({
    challengeId,
    userId,
    completed: true,
  });

  const lessonProgressData = await db.query.lessonProgress.findFirst({
    where: and(
      eq(lessonProgress.userId, userId),
      eq(lessonProgress.lessonId, lessonId)
    ),
  });

  if (!lessonProgressData) {
    // Create new lesson progress if it doesn't exist
    await db.insert(lessonProgress).values({
      userId,
      lessonId,
      currentDifficulty: 1,
      correctAnswers: isCorrect ? 1 : 0,
      totalAttempts: 1,
    });
  } else {
    // Update existing lesson progress
    const newCorrectAnswers = isCorrect
      ? lessonProgressData.correctAnswers + 1
      : lessonProgressData.correctAnswers;
    const newTotalAttempts = lessonProgressData.totalAttempts + 1;
    const accuracy = newCorrectAnswers / newTotalAttempts;

    let newDifficulty = lessonProgressData.currentDifficulty;
    if (accuracy > 0.8 && newDifficulty < 3) {
      newDifficulty++;
    } else if (accuracy < 0.5 && newDifficulty > 1) {
      newDifficulty--;
    }

    await db
      .update(lessonProgress)
      .set({
        currentDifficulty: newDifficulty,
        correctAnswers: newCorrectAnswers,
        totalAttempts: newTotalAttempts,
      })
      .where(eq(lessonProgress.id, lessonProgressData.id));
  }

  await db
    .update(userProgress)
    .set({
      points: currentUserProgress.points + 10,
    })
    .where(eq(userProgress.userId, userId));

  revalidatePath("/learn");
  revalidatePath("/lesson");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
  revalidatePath(`/lesson/${lessonId}`);
};
