import { cache } from "react";

import { auth } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";

import { CHALLENGES_FOR_LESSON_COMPLETION } from "@/constants";

import db from "./drizzle";
import {
  challengeProgress,
  challenges,
  topics,
  chapters,
  subjects,
  lessonProgress,
  lessons,
  userProgress,
  userSubscription,
} from "./schema";
// import { TOTAL_CHALLENGES } from "../app/lesson/quiz";

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
            with: {
              lessons: {
                orderBy: (lessons, { asc }) => [asc(lessons.order)],
              },
            }
          }
        },
      },
    },
  });

  return data;
});

export const getTopicPercentage = cache(async () => {
  const subjectProgress = await getSubjectProgress();

  if (!subjectProgress?.activeTopicId) return 0;

  const topics = await getTopics(subjectProgress.activeTopicId);

  if (!topics || topics.length == 0) return 0;

  const [topic] = topics;

  const completedLessons = topic.lessons.filter(
    (lesson) => lesson.completed
  );

  const percentage = Math.round(
    (completedLessons.length / topic.lessons.length) * 100
  );

  return percentage;
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
          lessons: {
            orderBy: (lessons, { asc }) => [asc(lessons.order)],
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
      },
    },
  });

  const normalizedData = data.map((chapter) => {
    const topicsWithCompletedStatus = chapter.topics.map((topic) => {
      const completedLessons = topic.lessons.filter((lesson) => {
        const completedChallenges = lesson.challenges.filter((challenge) => {
          return (
            challenge.challengeProgress &&
            challenge.challengeProgress.length > 0 &&
            challenge.challengeProgress.every((progress) => progress.completed)
          );
        });
        return completedChallenges.length >= CHALLENGES_FOR_LESSON_COMPLETION;
      });

      return {
        ...topic,
        completed: completedLessons.length === topic.lessons.length,
      };
    });

    return { ...chapter, topics: topicsWithCompletedStatus };
  });

  return normalizedData;
});

/**
 * Topics
 */
export const getTopics = cache(async (topicId: number) => {
  const { userId } = auth();

  if (!userId) return [];

  const data = await db.query.topics.findMany({
    where: eq(topics.id, topicId),
    orderBy: (topics, { asc }) => [asc(topics.order)],
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
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

  const normalizedData = data.map((topic) => {
    const lessonsWithCompletedStatus = topic.lessons.map((lesson) => {
      if (lesson.challenges.length < 5) return { ...lesson, completed: false };

      const completedChallenges = lesson.challenges.filter((challenge) => {
        return (
          challenge.challengeProgress &&
          challenge.challengeProgress.length > 0 &&
          challenge.challengeProgress.every((progress) => progress.completed)
        );
      });

      return {
        ...lesson,
        completed:
          completedChallenges.length >= CHALLENGES_FOR_LESSON_COMPLETION,
      };
    });

    return { ...topic, lessons: lessonsWithCompletedStatus };
  });

  return normalizedData;
});

/**
 * Lessons
 */
export const getLesson = cache(async (id?: number) => {
  const { userId } = auth();

  if (!userId) return null;

  const subjectProgress = await getSubjectProgress();
  const lessonId = id || subjectProgress?.activeLessonId;

  if (!lessonId) return null;

  // Fetch user progress
  const userProgressData = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  if (!userProgressData) return null;

  const abilityEstimate = userProgressData.abilityEstimate;

  const data = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      topic: true,
      challenges: {
        orderBy: (challenges, { asc }) => [asc(challenges.order)],
        limit: 5,
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

export const getLessonProgress = cache(async (userId: string, lessonId: number) => {
  return db.query.lessonProgress.findFirst({
    where: and(
      eq(lessonProgress.userId, userId),
      eq(lessonProgress.lessonId, lessonId)
    ),
  });
});

export const getChallengesForLesson = cache(async (lessonId: number, abilityEstimate: number) => {
  const challengesOfLesson = await db.query.challenges.findMany({
    where: eq(challenges.lessonId, lessonId),
    with: {
      challengeOptions: true,
    },
  });

  // Sort challenges based on how close their difficulty is to the user's ability
  const sortedChallenges = challengesOfLesson.sort((a, b) => 
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
          lessons: {
            orderBy: (lessons, { asc }) => [asc(lessons.order)],
            with: {
              topic: true,
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
      },
    },
  });

  const firstUncompletedTopic = chaptersInActiveSubject
    .flatMap((chapter) => chapter.topics)
    .find((topic) => {
      const completedLessons = topic.lessons.filter((lesson) => {
        const completedChallenges = lesson.challenges.filter((challenge) => {
          return (
            challenge.challengeProgress &&
            challenge.challengeProgress.length > 0 &&
            challenge.challengeProgress.every((progress) => progress.completed)
          );
        });
        return completedChallenges.length >= CHALLENGES_FOR_LESSON_COMPLETION;
      });
      return completedLessons.length < topic.lessons.length;
    });

  const firstUncompletedLesson = firstUncompletedTopic?.lessons.find((lesson) => {
    const completedChallenges = lesson.challenges.filter((challenge) => {
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
    activeLesson: firstUncompletedLesson,
    activeLessonId: firstUncompletedLesson?.id,
  };
});

export const getLessonPercentage = cache(async () => {
  const subjectProgress = await getSubjectProgress();

  if (!subjectProgress?.activeLessonId) return 0;

  const lesson = await getLesson(subjectProgress?.activeLessonId);

  if (!lesson) return 0;

  const completedChallenges = lesson.challenges.filter(
    (challenge) => challenge.completed
  );

  const percentage = Math.round(
    (completedChallenges.length / lesson.challenges.length) * 100
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