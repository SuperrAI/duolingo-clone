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
  skillProgress,
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

  const skillId = challenge.skillId;

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
    revalidatePath("/skill");
    revalidatePath("/quests");
    revalidatePath("/leaderboard");
    revalidatePath(`/skill/${skillId}`);
    return;
  }

  await db.insert(challengeProgress).values({
    challengeId,
    userId,
    completed: true,
  });

  const skillProgressData = await db.query.skillProgress.findFirst({
    where: and(
      eq(skillProgress.userId, userId),
      eq(skillProgress.skillId, skillId)
    ),
  });

  if (!skillProgressData) {
    // Create new skill progress if it doesn't exist
    await db.insert(skillProgress).values({
      userId,
      skillId,
      currentDifficulty: 1,
      correctAnswers: isCorrect ? 1 : 0,
      totalAttempts: 1,
    });
  } else {
    // Update existing skill progress
    const newCorrectAnswers = isCorrect
      ? skillProgressData.correctAnswers + 1
      : skillProgressData.correctAnswers;
    const newTotalAttempts = skillProgressData.totalAttempts + 1;
    const accuracy = newCorrectAnswers / newTotalAttempts;

    let newDifficulty = skillProgressData.currentDifficulty;
    if (accuracy > 0.8 && newDifficulty < 3) {
      newDifficulty++;
    } else if (accuracy < 0.5 && newDifficulty > 1) {
      newDifficulty--;
    }

    await db
      .update(skillProgress)
      .set({
        currentDifficulty: newDifficulty,
        correctAnswers: newCorrectAnswers,
        totalAttempts: newTotalAttempts,
      })
      .where(eq(skillProgress.id, skillProgressData.id));
  }

  await db
    .update(userProgress)
    .set({
      points: currentUserProgress.points + 10,
    })
    .where(eq(userProgress.userId, userId));

  revalidatePath("/learn");
  revalidatePath("/skill");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
  revalidatePath(`/skill/${skillId}`);
};
