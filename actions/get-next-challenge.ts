"use server";

import { auth } from "@clerk/nextjs";
import { and, eq, exists, not } from "drizzle-orm";

import db from "@/db/drizzle";
import { challengeProgress, challenges, topicProgress } from "@/db/schema";

export async function getNextChallenge(topicId: number) {
  const { userId } = auth();

  if (!userId) throw new Error("Unauthorized");

  let difficulty = 1;

  const userTopicProgress = await db.query.topicProgress.findFirst({
    where: and(
      eq(topicProgress.userId, userId),
      eq(topicProgress.topicId, topicId)
    ),
  });

  if (userTopicProgress) {
    difficulty = userTopicProgress.currentDifficulty;
  }

  const nextChallenge = await db.query.challenges.findFirst({
    where: and(
      eq(challenges.topicId, topicId),
      eq(challenges.difficulty, difficulty),
      not(
        exists(
          db
            .select()
            .from(challengeProgress)
            .where(
              and(
                eq(challengeProgress.challengeId, challenges.id),
                eq(challengeProgress.userId, userId)
              )
            )
        )
      )
    ),
    with: {
      challengeOptions: true,
    },
  });

  if (!nextChallenge) {
    // If no challenge found at current difficulty, try to find one at any difficulty
    const anyDifficultyChallenge = await db.query.challenges.findFirst({
      where: and(
        eq(challenges.topicId, topicId),
        not(
          exists(
            db
              .select()
              .from(challengeProgress)
              .where(
                and(
                  eq(challengeProgress.challengeId, challenges.id),
                  eq(challengeProgress.userId, userId)
                )
              )
          )
        )
      ),
      with: {
        challengeOptions: true,
      },
    });

    if (!anyDifficultyChallenge) throw new Error("No more challenges available");
    
    return anyDifficultyChallenge;
  }

  return nextChallenge;
}