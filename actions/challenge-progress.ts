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
  chapterProgress,
  subjectProgress,
  topicProgress,
  lessonProgress,
  userProgress,
} from "@/db/schema";

export const upsertChallengeProgress = async (
  challengeId: number,
  isCorrect: boolean
) => {
  const { userId } = auth();

  if (!userId) throw new Error("Unauthorized.");

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
    with: {
      lesson: {
        with: {
          topic: {
            with: {
              chapter: {
                with: {
                  subject: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!challenge) throw new Error("Challenge not found.");

  const lessonId = challenge.lesson.id;
  const topicId = challenge.lesson.topic.id;
  const chapterId = challenge.lesson.topic.chapter.id;
  const subjectId = challenge.lesson.topic.chapter.subject.id;

  const existingChallengeProgress = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, challengeId)
    ),
  });

  const isPractice = !!existingChallengeProgress;

  const currentUserProgress = await getUserProgress();
  const userSubscription = await getUserSubscription();

  if (!currentUserProgress) throw new Error("User progress not found.");

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

  // Update lessonProgress
  await upsertLessonProgress(userId, challengeId, lessonId, topicId, chapterId, subjectId, isCorrect);
};

async function upsertLessonProgress(userId: string, challengeId: number, lessonId: number, topicId: number, chapterId: number, subjectId: number, isCorrect: boolean) {
  const [lessonProgressData, challenge] = await Promise.all([
    db.query.lessonProgress.findFirst({
      where: and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.lessonId, lessonId)
      ),
    }),
    db.query.challenges.findFirst({
      where: eq(challenges.id, challengeId)
    })
  ]);

  if (!challenge) throw new Error("Challenge not found");

  const challengeDifficulty = challenge.difficulty;
  const MIN_ABILITY = 1, MAX_ABILITY = 3, MIN_DIFFICULTY = 1, MAX_DIFFICULTY = 3;

  if (!lessonProgressData) {
    await db.insert(lessonProgress).values({
      userId,
      lessonId,
      currentDifficulty: challengeDifficulty,
      correctAnswers: isCorrect ? 1 : 0,
      totalAttempts: 1,
      abilityEstimate: MIN_ABILITY,
    });
  } else {
    const newCorrectAnswers = isCorrect ? lessonProgressData.correctAnswers + 1 : lessonProgressData.correctAnswers;
    const newTotalAttempts = lessonProgressData.totalAttempts + 1;
    const oldAbilityEstimate = lessonProgressData.abilityEstimate;

    const learningRate = 0.4;
    const consistencyBonus = 0.5;
    const scaledDifficulty = (((challengeDifficulty - MIN_DIFFICULTY) / (MAX_DIFFICULTY - MIN_DIFFICULTY)) * (MAX_ABILITY - MIN_ABILITY)) + MIN_ABILITY;

    let abilityAdjustment;
    if (isCorrect) {
      // If correct, always increase ability, but more for harder questions
      abilityAdjustment = Math.max(consistencyBonus, scaledDifficulty - oldAbilityEstimate);
    } else {
      // If incorrect, always decrease ability, but more for easier questions
      abilityAdjustment = Math.min(-consistencyBonus, scaledDifficulty - oldAbilityEstimate);
    }

    let newAbilityEstimate = oldAbilityEstimate + learningRate * abilityAdjustment;
    newAbilityEstimate = Math.max(MIN_ABILITY, Math.min(MAX_ABILITY, newAbilityEstimate));

    const newDifficulty = Math.ceil((((newAbilityEstimate - MIN_ABILITY) / (MAX_ABILITY - MIN_ABILITY)) * (MAX_DIFFICULTY - MIN_DIFFICULTY)) + MIN_DIFFICULTY);

    await db
      .update(lessonProgress)
      .set({
        currentDifficulty: newDifficulty,
        correctAnswers: newCorrectAnswers,
        totalAttempts: newTotalAttempts,
        abilityEstimate: newAbilityEstimate,
      })
      .where(eq(lessonProgress.id, lessonProgressData.id));

    await upsertTopicProgress(userId, challengeId, lessonId, topicId, chapterId, subjectId, isCorrect);
  }
}

async function upsertTopicProgress(userId: string, challengeId: number, lessonId: number, topicId: number, chapterId: number, subjectId: number, isCorrect: boolean) {
  const topicProgressData = await db.query.topicProgress.findFirst({
    where: and(
      eq(topicProgress.userId, userId),
      eq(topicProgress.topicId, topicId)
    ),
  });

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId)
  });

  if (!challenge) throw new Error("Challenge not found");

  const challengeDifficulty = challenge.difficulty;

  // Define bounds for abilityEstimate
  const MIN_ABILITY = -3;
  const MAX_ABILITY = 3;

  if (!topicProgressData) {
    const initialAbilityEstimate = 0;
    await db.insert(topicProgress).values({
      userId,
      topicId,
      abilityEstimate: initialAbilityEstimate,
      currentDifficulty: 1, // Start with the lowest difficulty
    });
  } else {
    // Calculate new ability estimate using Item Response Theory (IRT)
    const oldAbilityEstimate = topicProgressData.abilityEstimate;
    const learningRate = 0.1;
    let newAbilityEstimate = oldAbilityEstimate + 
      learningRate * (isCorrect ? 1 : -1) * (challengeDifficulty - oldAbilityEstimate);

    // Bound the abilityEstimate
    newAbilityEstimate = Math.max(MIN_ABILITY, Math.min(MAX_ABILITY, newAbilityEstimate));

    // Calculate new difficulty based on the user's current ability estimate
    // Map the ability estimate (-3 to 3) to difficulty (1 to 3)
    const newDifficulty = Math.round(((newAbilityEstimate - MIN_ABILITY) / (MAX_ABILITY - MIN_ABILITY)) * 2 + 1);

    await db
      .update(topicProgress)
      .set({
        abilityEstimate: newAbilityEstimate,
        currentDifficulty: newDifficulty,
      })
      .where(eq(topicProgress.id, topicProgressData.id));
  }

  // Update chapterProgress
  await upsertChapterProgress(userId, challengeId, lessonId, topicId, chapterId, subjectId, isCorrect);
}

async function upsertChapterProgress(userId: string, challengeId: number, lessonId: number, topicId: number, chapterId: number, subjectId: number, isCorrect: boolean) {
  const chapterProgressData = await db.query.chapterProgress.findFirst({
    where: and(
      eq(chapterProgress.userId, userId),
      eq(chapterProgress.chapterId, chapterId)
    ),
  });

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId)
  });

  if (!challenge) throw new Error("Challenge not found");

  const challengeDifficulty = challenge.difficulty;

  // Define bounds for abilityEstimate
  const MIN_ABILITY = -3;
  const MAX_ABILITY = 3;

  if (!chapterProgressData) {
    const initialAbilityEstimate = 0;
    await db.insert(chapterProgress).values({
      userId,
      chapterId,
      abilityEstimate: initialAbilityEstimate,
      currentDifficulty: 1, // Start with the lowest difficulty
    });
  } else {
    // Calculate new ability estimate using Item Response Theory (IRT)
    const oldAbilityEstimate = chapterProgressData.abilityEstimate;
    const learningRate = 0.05; // Slightly lower learning rate for chapter level
    let newAbilityEstimate = oldAbilityEstimate + 
      learningRate * (isCorrect ? 1 : -1) * (challengeDifficulty - oldAbilityEstimate);

    // Bound the abilityEstimate
    newAbilityEstimate = Math.max(MIN_ABILITY, Math.min(MAX_ABILITY, newAbilityEstimate));

    // Calculate new difficulty based on the user's current ability estimate
    // Map the ability estimate (-3 to 3) to difficulty (1 to 3)
    const newDifficulty = Math.round(((newAbilityEstimate - MIN_ABILITY) / (MAX_ABILITY - MIN_ABILITY)) * 2 + 1);

    await db
      .update(chapterProgress)
      .set({
        abilityEstimate: newAbilityEstimate,
        currentDifficulty: newDifficulty,
      })
      .where(eq(chapterProgress.id, chapterProgressData.id));
  }

  // Update subjectProgress
  await upsertSubjectProgress(userId, challengeId, lessonId, topicId, chapterId, subjectId, isCorrect);
}

async function upsertSubjectProgress(userId: string, challengeId: number, lessonId: number, topicId: number, chapterId: number, subjectId: number, isCorrect: boolean) {
  const subjectProgressData = await db.query.subjectProgress.findFirst({
    where: and(
      eq(subjectProgress.userId, userId),
      eq(subjectProgress.subjectId, subjectId)
    ),
  });

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId)
  });

  if (!challenge) throw new Error("Challenge not found");

  const challengeDifficulty = challenge.difficulty;

  // Define bounds for abilityEstimate
  const MIN_ABILITY = -3;
  const MAX_ABILITY = 3;

  if (!subjectProgressData) {
    const initialAbilityEstimate = 0;
    await db.insert(subjectProgress).values({
      userId,
      subjectId,
      abilityEstimate: initialAbilityEstimate,
      currentDifficulty: 1, // Start with the lowest difficulty
    });
  } else {
    // Calculate new ability estimate using Item Response Theory (IRT)
    const oldAbilityEstimate = subjectProgressData.abilityEstimate;
    const learningRate = 0.025; // Even lower learning rate for subject level
    let newAbilityEstimate = oldAbilityEstimate + 
      learningRate * (isCorrect ? 1 : -1) * (challengeDifficulty - oldAbilityEstimate);

    // Bound the abilityEstimate
    newAbilityEstimate = Math.max(MIN_ABILITY, Math.min(MAX_ABILITY, newAbilityEstimate));

    // Calculate new difficulty based on the user's current ability estimate
    // Map the ability estimate (-3 to 3) to difficulty (1 to 3)
    const newDifficulty = Math.round(((newAbilityEstimate - MIN_ABILITY) / (MAX_ABILITY - MIN_ABILITY)) * 2 + 1);

    await db
      .update(subjectProgress)
      .set({
        abilityEstimate: newAbilityEstimate,
        currentDifficulty: newDifficulty,
      })
      .where(eq(subjectProgress.id, subjectProgressData.id));
  }

  const currentUserProgress = await getUserProgress();
  if (!currentUserProgress) throw new Error("User progress not found.");

  await db
    .update(userProgress)
    .set({
      points: currentUserProgress.points + 10,
      activeLessonId: lessonId,
      activeTopicId: topicId,
      activeChapterId: chapterId,
      activeSubjectId: subjectId
    })
    .where(eq(userProgress.userId, userId));

  revalidatePath("/learn");
  revalidatePath("/lesson");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
  revalidatePath(`/lesson/${lessonId}`);
}