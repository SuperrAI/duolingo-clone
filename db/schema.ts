import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { MAX_HEARTS } from "@/constants";

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageSrc: text("image_src").notNull(),
});

export const subjectsRelations = relations(subjects, ({ many }) => ({
  userProgress: many(userProgress),
  chapters: many(chapters),
}));

export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // Chapter 1
  description: text("description").notNull(), // Learn the basics of spanish
  subjectId: integer("subject_id")
    .references(() => subjects.id, {
      onDelete: "cascade",
    })
    .notNull(),
  order: integer("chapter_order").notNull(),
});

export const chaptersRelations = relations(chapters, ({ many, one }) => ({
  subject: one(subjects, {
    fields: [chapters.subjectId],
    references: [subjects.id],
  }),
  topics: many(topics),
}));

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  chapterId: integer("chapter_id")
    .references(() => chapters.id, {
      onDelete: "cascade",
    })
    .notNull(),
  order: integer("topic_order").notNull(),
});

export const topicsRelations = relations(topics, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [topics.chapterId],
    references: [chapters.id],
  }),
  challenges: many(challenges),
}));

export const challengesEnum = pgEnum("type", ["SELECT", "ASSIST"]);

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id")
    .references(() => topics.id, {
      onDelete: "cascade",
    })
    .notNull(),
  type: challengesEnum("type").notNull(),
  question: text("question").notNull(),
  order: integer("challenge_order").notNull(),
  difficulty: integer("difficulty").notNull(),
});

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  topic: one(topics, {
    fields: [challenges.topicId],
    references: [topics.id],
  }),
  challengeOptions: many(challengeOptions),
  challengeProgress: many(challengeProgress),
}));

export const challengeOptions = pgTable("challenge_options", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id")
    .references(() => challenges.id, {
      onDelete: "cascade",
    })
    .notNull(),
  text: text("text").notNull(),
  correct: boolean("correct").notNull(),
  imageSrc: text("image_src"),
  audioSrc: text("audio_src"),
});

export const challengeOptionsRelations = relations(
  challengeOptions,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeOptions.challengeId],
      references: [challenges.id],
    }),
  })
);

export const challengeProgress = pgTable("challenge_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  challengeId: integer("challenge_id")
    .references(() => challenges.id, {
      onDelete: "cascade",
    })
    .notNull(),
  completed: boolean("completed").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
  lastAttemptCorrect: boolean("last_attempt_correct"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const challengeProgressRelations = relations(
  challengeProgress,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeProgress.challengeId],
      references: [challenges.id],
    }),
  })
);

export const topicProgress = pgTable("topic_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  topicId: integer("topic_id")
    .references(() => topics.id, {
      onDelete: "cascade",
    })
    .notNull(),
  currentDifficulty: integer("current_difficulty").notNull().default(1),
  correctAnswers: integer("correct_answers").notNull().default(0),
  totalAttempts: integer("total_attempts").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  lastAttemptedAt: timestamp("last_attempted_at").notNull().defaultNow(),
});

export const topicProgressRelations = relations(topicProgress, ({ one }) => ({
  user: one(userProgress, {
    fields: [topicProgress.userId],
    references: [userProgress.userId],
  }),
  topic: one(topics, {
    fields: [topicProgress.topicId],
    references: [topics.id],
  }),
}));

export const userProgress = pgTable("user_progress", {
  userId: text("user_id").primaryKey(),
  userName: text("user_name").notNull().default("User"),
  userImageSrc: text("user_image_src").notNull().default("/mascot.svg"),
  activeSubjectId: integer("active_subject_id").references(() => subjects.id, {
    onDelete: "cascade",
  }),
  hearts: integer("hearts").notNull().default(MAX_HEARTS),
  points: integer("points").notNull().default(0),
  currentTopicId: integer("current_topic_id").references(() => topics.id),
  lastAttemptedChallengeId: integer("last_attempted_challenge_id").references(
    () => challenges.id
  ),
});

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  activeSubject: one(subjects, {
    fields: [userProgress.activeSubjectId],
    references: [subjects.id],
  }),
}));

export const userSubscription = pgTable("user_subscription", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripePriceId: text("stripe_price_id").notNull(),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end").notNull(),
});
