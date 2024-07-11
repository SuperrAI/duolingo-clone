"use server";

import { auth, currentUser } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { MAX_HEARTS, POINTS_TO_REFILL } from "@/constants";
import db from "@/db/drizzle";
import {
  getSubjectById,
  getUserProgress,
  getUserSubscription,
} from "@/db/queries";
import { challengeProgress, challenges, userProgress } from "@/db/schema";

export const upsertUserProgress = async (subjectId: number) => {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId || !user) throw new Error("Unauthorized.");

  const subject = await getSubjectById(subjectId);

  if (!subject) throw new Error("Subject not found.");

  if (!subject.chapters.length || !subject.chapters[0].topics.length)
    throw new Error("Subject is empty.");

  const existingUserProgress = await getUserProgress();

  if (existingUserProgress) {
    await db.update(userProgress).set({
      activeSubjectId: subjectId,
      userName: user.firstName || "User",
      userImageSrc: user.imageUrl || "/mascot.svg",
    });

    revalidatePath("/subjects");
    revalidatePath("/learn");
    redirect("/learn");
  }

  await db.insert(userProgress).values({
    userId,
    activeSubjectId: subjectId,
    userName: user.firstName || "User",
    userImageSrc: user.imageUrl || "/mascot.svg",
  });

  revalidatePath("/subjects");
  revalidatePath("/learn");
  redirect("/learn");
};

export const reduceHearts = async (challengeId: number) => {
  const { userId } = auth();

  if (!userId) throw new Error("Unauthorized.");

  const currentUserProgress = await getUserProgress();
  const userSubscription = await getUserSubscription();

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });

  if (!challenge) throw new Error("Challenge not found.");

  const topicId = challenge.topicId;

  const existingChallengeProgress = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, challengeId)
    ),
  });

  const isPractice = !!existingChallengeProgress;

  if (isPractice) return { error: "practice" };

  if (!currentUserProgress) throw new Error("User progress not found.");

  if (userSubscription?.isActive) return { error: "subscription" };

  if (currentUserProgress.hearts === 0) return { error: "hearts" };

  await db
    .update(userProgress)
    .set({
      hearts: Math.max(currentUserProgress.hearts - 1, 0),
    })
    .where(eq(userProgress.userId, userId));

  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
  revalidatePath(`/topic/${topicId}`);
};

export const refillHearts = async () => {
  const currentUserProgress = await getUserProgress();

  if (!currentUserProgress) throw new Error("User progress not found.");
  if (currentUserProgress.hearts === MAX_HEARTS)
    throw new Error("Hearts are already full.");
  if (currentUserProgress.points < POINTS_TO_REFILL)
    throw new Error("Not enough points.");

  await db
    .update(userProgress)
    .set({
      hearts: MAX_HEARTS,
      points: currentUserProgress.points - POINTS_TO_REFILL,
    })
    .where(eq(userProgress.userId, currentUserProgress.userId));

  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
};
