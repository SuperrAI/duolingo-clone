import { cache } from "react";

import { auth } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";

import { CHALLENGES_FOR_LESSON_COMPLETION } from "@/constants";

import db from "./drizzle";
import {
  challengeProgress,
  challenges,
  chapters,
  subjects,
  topicProgress,
  topics,
  userProgress,
  userSubscription,
} from "./schema";

const DAY_IN_MS = 86_400_000;

/**
 * Subjects
 */
export const getSubjects = cache(async () => {
  const data = await db.query.subjects.findMany();

  return data;
});

export const getSubjectById = cache(async (subjectId: number) => {
  const data = await db.query.subjects.findFirst({
    where: eq(subjects.id, subjectId),
    with: {
      chapters: {
        orderBy: (chapters, { asc }) => [asc(chapters.order)],
        with: {
          topics: {
            orderBy: (topics, { asc }) => [asc(topics.order)],
          },
        },
      },
    },
  });

  return data;
});

/**
 * Chapters
 */
export const getChapters = cache(async () => {
  const { userId } = auth();
  const userProgress = await getUserProgress();

  if (!userId || !userProgress?.activeSubjectId) return [];

  const data = await db.query.chapters.findMany({
    where: eq(chapters.subjectId, userProgress.activeSubjectId),
    orderBy: (chapters, { asc }) => [asc(chapters.order)],
    with: {
      topics: {
        orderBy: (topics, { asc }) => [asc(topics.order)],
        with: {
          challenges: {
            orderBy: (challenges, { asc }) => [asc(challenges.order)],
            with: {
              challengeProgress: {
                where: eq(challengeProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  const normalizedData = data.map((chapter) => {
    const topicsWithCompletedStatus = chapter.topics.map((topic) => {
      if (topic.challenges.length < 5) return { ...topic, completed: false };

      const completedChallenges = topic.challenges.filter((challenge) => {
        return (
          challenge.challengeProgress &&
          challenge.challengeProgress.length > 0 &&
          challenge.challengeProgress.every((progress) => progress.completed)
        );
      });

      return {
        ...topic,
        completed:
          completedChallenges.length >= CHALLENGES_FOR_LESSON_COMPLETION,
      };
    });

    return { ...chapter, topics: topicsWithCompletedStatus };
  });

  return normalizedData;
});

/**
 * Topics
 */
export const getTopic = cache(async (id?: number) => {
  const { userId } = auth();

  if (!userId) return null;

  const subjectProgress = await getSubjectProgress();
  const topicId = id || subjectProgress?.activeTopicId;

  if (!topicId) return null;

  // Fetch user progress
  const userProgressData = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  if (!userProgressData) return null;

  const abilityEstimate = userProgressData.abilityEstimate;

  const data = await db.query.topics.findFirst({
    where: eq(topics.id, topicId),
    with: {
      challenges: {
        orderBy: (challenges, { asc }) => [asc(challenges.order)],
        limit: 10, // Increased from 5 to have more options
        with: {
          challengeOptions: true,
          challengeProgress: {
            where: eq(challengeProgress.userId, userId),
          },
        },
      },
    },
  });

  if (!data || !data.challenges) return null;

  // Sort challenges based on how close their difficulty is to the user's ability
  const sortedChallenges = data.challenges.sort((a, b) => 
    Math.abs(a.difficulty - abilityEstimate) - Math.abs(b.difficulty - abilityEstimate)
  );

  // Select the top 5 most appropriate challenges
  const selectedChallenges = sortedChallenges.slice(0, 5);

  const normalizedChallenges = selectedChallenges.map((challenge) => {
    const completed =
      challenge.challengeProgress &&
      challenge.challengeProgress.length > 0 &&
      challenge.challengeProgress.every((progress) => progress.completed);

    return { ...challenge, completed };
  });

  return { ...data, challenges: normalizedChallenges };
});

export const getTopicProgress = cache(async (userId: string, topicId: number) => {
  return db.query.topicProgress.findFirst({
    where: and(
      eq(topicProgress.userId, userId),
      eq(topicProgress.topicId, topicId)
    ),
  });
});

export const getChallengesForTopic = cache(async (topicId: number, abilityEstimate: number) => {
  const challengesOfTopic = await db.query.challenges.findMany({
    where: eq(challenges.topicId, topicId),
    with: {
      challengeOptions: true,
    },
  });

  // Sort challenges based on how close their difficulty is to the user's ability
  const sortedChallenges = challengesOfTopic.sort((a, b) => 
    Math.abs(a.difficulty - abilityEstimate) - Math.abs(b.difficulty - abilityEstimate)
  );

  // Select the top 5 most appropriate challenges
  return sortedChallenges.slice(0, 5);
});

/**
 * Progresses
 */
export const getUserProgress = cache(async () => {
  const { userId } = auth();

  if (!userId) return null;

  const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: {
      activeSubject: true,
    },
  });

  return data;
});

export const getSubjectProgress = cache(async () => {
  const { userId } = auth();
  const userProgress = await getUserProgress();

  if (!userId || !userProgress?.activeSubjectId) return null;

  const chaptersInActiveSubject = await db.query.chapters.findMany({
    orderBy: (chapters, { asc }) => [asc(chapters.order)],
    where: eq(chapters.subjectId, userProgress.activeSubjectId),
    with: {
      topics: {
        orderBy: (topics, { asc }) => [asc(topics.order)],
        with: {
          chapter: true,
          challenges: {
            with: {
              challengeProgress: {
                where: eq(challengeProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  const firstUncompletedTopic = chaptersInActiveSubject
    .flatMap((chapter) => chapter.topics)
    .find((topic) => {
      const completedChallenges = topic.challenges.filter((challenge) => {
        return (
          challenge.challengeProgress &&
          challenge.challengeProgress.length > 0 &&
          challenge.challengeProgress.every((progress) => progress.completed)
        );
      });
      return completedChallenges.length < CHALLENGES_FOR_LESSON_COMPLETION;
    });

  return {
    activeTopic: firstUncompletedTopic,
    activeTopicId: firstUncompletedTopic?.id,
  };
});

export const getTopicPercentage = cache(async () => {
  const subjectProgress = await getSubjectProgress();

  if (!subjectProgress?.activeTopicId) return 0;

  const topic = await getTopic(subjectProgress?.activeTopicId);

  if (!topic) return 0;

  const completedChallenges = topic.challenges.filter(
    (challenge) => challenge.completed
  );

  const percentage = Math.round(
    (completedChallenges.length / topic.challenges.length) * 100
  );

  return percentage;
});

/**
 * Misc
 */
export const getTopTenUsers = cache(async () => {
  const { userId } = auth();

  if (!userId) return [];

  const data = await db.query.userProgress.findMany({
    orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
    limit: 10,
    columns: {
      userId: true,
      userName: true,
      userImageSrc: true,
      points: true,
    },
  });

  return data;
});

/**
 * Subscriptions
 */
export const getUserSubscription = cache(async () => {
  const { userId } = auth();

  if (!userId) return null;

  const data = await db.query.userSubscription.findFirst({
    where: eq(userSubscription.userId, userId),
  });

  if (!data) return null;

  const isActive =
    data.stripePriceId &&
    data.stripeCurrentPeriodEnd?.getTime() + DAY_IN_MS > Date.now();

  return {
    ...data,
    isActive: !!isActive,
  };
});