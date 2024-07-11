import { cache } from "react";

import { auth } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";

import { CHALLENGES_FOR_LESSON_COMPLETION } from "@/constants";

import db from "./drizzle";
import {
  challengeProgress,
  challenges,
  chapters,
  courses,
  skillProgress,
  skills,
  userProgress,
  userSubscription,
} from "./schema";

const DAY_IN_MS = 86_400_000;

export const getCourses = cache(async () => {
  const data = await db.query.courses.findMany();

  return data;
});

export const getUserProgress = cache(async () => {
  const { userId } = auth();

  if (!userId) return null;

  const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: {
      activeCourse: true,
    },
  });

  return data;
});

export const getChapters = cache(async () => {
  const { userId } = auth();
  const userProgress = await getUserProgress();

  if (!userId || !userProgress?.activeCourseId) return [];

  const data = await db.query.chapters.findMany({
    where: eq(chapters.courseId, userProgress.activeCourseId),
    orderBy: (chapters, { asc }) => [asc(chapters.order)],
    with: {
      skills: {
        orderBy: (skills, { asc }) => [asc(skills.order)],
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
    const skillsWithCompletedStatus = chapter.skills.map((skill) => {
      if (skill.challenges.length < 5) return { ...skill, completed: false };

      const completedChallenges = skill.challenges.filter((challenge) => {
        return (
          challenge.challengeProgress &&
          challenge.challengeProgress.length > 0 &&
          challenge.challengeProgress.every((progress) => progress.completed)
        );
      });

      return {
        ...skill,
        completed:
          completedChallenges.length >= CHALLENGES_FOR_LESSON_COMPLETION,
      };
    });

    return { ...chapter, skills: skillsWithCompletedStatus };
  });

  return normalizedData;
});

export const getCourseById = cache(async (courseId: number) => {
  const data = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      chapters: {
        orderBy: (chapters, { asc }) => [asc(chapters.order)],
        with: {
          skills: {
            orderBy: (skills, { asc }) => [asc(skills.order)],
          },
        },
      },
    },
  });

  return data;
});

export const getCourseProgress = cache(async () => {
  const { userId } = auth();
  const userProgress = await getUserProgress();

  if (!userId || !userProgress?.activeCourseId) return null;

  const chaptersInActiveCourse = await db.query.chapters.findMany({
    orderBy: (chapters, { asc }) => [asc(chapters.order)],
    where: eq(chapters.courseId, userProgress.activeCourseId),
    with: {
      skills: {
        orderBy: (skills, { asc }) => [asc(skills.order)],
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

  const firstUncompletedSkill = chaptersInActiveCourse
    .flatMap((chapter) => chapter.skills)
    .find((skill) => {
      const completedChallenges = skill.challenges.filter((challenge) => {
        return (
          challenge.challengeProgress &&
          challenge.challengeProgress.length > 0 &&
          challenge.challengeProgress.every((progress) => progress.completed)
        );
      });
      return completedChallenges.length < CHALLENGES_FOR_LESSON_COMPLETION;
    });

  return {
    activeSkill: firstUncompletedSkill,
    activeSkillId: firstUncompletedSkill?.id,
  };
});

export const getSkill = cache(async (id?: number) => {
  const { userId } = auth();

  if (!userId) return null;

  const courseProgress = await getCourseProgress();
  const skillId = id || courseProgress?.activeSkillId;

  if (!skillId) return null;

  // Fetch user progress
  const userProgressData = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  if (!userProgressData) {
    return null;
  }

  // Fetch skill progress
  const skillProgressData = await db.query.skillProgress.findFirst({
    where: and(
      eq(skillProgress.userId, userId),
      eq(skillProgress.skillId, skillId)
    ),
  });

  // Determine difficulty level based on skill progress
  const difficulty = skillProgressData?.currentDifficulty || 1;

  const data = await db.query.skills.findFirst({
    where: eq(skills.id, skillId),
    with: {
      challenges: {
        where: eq(challenges.difficulty, difficulty),
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

  const normalizedChallenges = data.challenges.map((challenge) => {
    const completed =
      challenge.challengeProgress &&
      challenge.challengeProgress.length > 0 &&
      challenge.challengeProgress.every((progress) => progress.completed);

    return { ...challenge, completed };
  });

  return { ...data, challenges: normalizedChallenges };
});

export const getSkillPercentage = cache(async () => {
  const courseProgress = await getCourseProgress();

  if (!courseProgress?.activeSkillId) return 0;

  const skill = await getSkill(courseProgress?.activeSkillId);

  if (!skill) return 0;

  const completedChallenges = skill.challenges.filter(
    (challenge) => challenge.completed
  );

  const percentage = Math.round(
    (completedChallenges.length / skill.challenges.length) * 100
  );

  return percentage;
});

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
