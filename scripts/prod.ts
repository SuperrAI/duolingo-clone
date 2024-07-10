import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";

const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql, { schema });

const createTables = async () => {
  await sql`CREATE TABLE IF NOT EXISTS user_progress (
    user_id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL DEFAULT 'User',
    user_image_src TEXT NOT NULL DEFAULT '/man.svg',
    active_course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    hearts INTEGER NOT NULL DEFAULT 50,
    points INTEGER NOT NULL DEFAULT 0
  );`;

  await sql`CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER,
    type VARCHAR(50),
    question TEXT,
    challenge_order INTEGER,
    difficulty INTEGER
  );`;

  await sql`CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    course_id INTEGER,
    title VARCHAR(255),
    description TEXT,
    unit_order INTEGER
  );`;

  await sql`CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER,
    title VARCHAR(255),
    lesson_order INTEGER
  );`;

  await sql`CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_src VARCHAR(255),
    course_order INTEGER
  );`;

  await sql`CREATE TABLE IF NOT EXISTS challenge_options (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER,
    correct BOOLEAN,
    text TEXT,
    image_src VARCHAR(255),
    audio_src VARCHAR(255)
  );`;

  await sql`CREATE TABLE IF NOT EXISTS user_subscription (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    stripe_customer_id TEXT NOT NULL UNIQUE,
    stripe_subscription_id TEXT NOT NULL UNIQUE,
    stripe_price_id TEXT NOT NULL,
    stripe_current_period_end TIMESTAMP NOT NULL
  );`;

  await sql`CREATE TABLE IF NOT EXISTS challenge_progress (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
      completed BOOLEAN NOT NULL DEFAULT FALSE
    );`;
};

const main = async () => {
  try {
    // Delete all existing data
    await Promise.all([
      db.delete(schema.userProgress),
      db.delete(schema.challenges),
      db.delete(schema.units),
      db.delete(schema.lessons),
      db.delete(schema.courses),
      db.delete(schema.challengeOptions),
      db.delete(schema.userSubscription),
    ]);

    console.log("Creating tables");
    await createTables();
    console.log("Tables created");

    console.log("Seeding database");

    // Insert courses
    const courses = await db
      .insert(schema.courses)
      .values([{ title: "Math", imageSrc: "/man.svg" }])
      .returning();

    // For each course, insert units
    for (const course of courses) {
      const units = await db
        .insert(schema.units)
        .values([
          {
            courseId: course.id,
            title: "Unit 1",
            description: `Basic Math Questions`,
            order: 1,
          },
        ])
        .returning();

      // For each unit, insert lessons
      for (const unit of units) {
        const lessons = await db
          .insert(schema.lessons)
          .values([{ unitId: unit.id, title: "Lesson 1", order: 1 }])
          .returning();

        // For each lesson, insert challenges
        for (const lesson of lessons) {
          const challenges = await db
            .insert(schema.challenges)
            .values([
              {
                lessonId: lesson.id,
                type: "SELECT",
                question: "Write 5 million, 3 thousand, and 21 in numerals.",
                order: 1,
                difficulty: 9,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question: "In the number 3,456, what place value is the 4 in?",
                order: 2,
                difficulty: 5,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question: "What is the result of 2^3 x 3^2?",
                order: 3,
                difficulty: 10,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question: "Solve for x: 3x + 7 = 22",
                order: 4,
                difficulty: 11,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question: "What is 25% of 80?",
                order: 5,
                difficulty: 1,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question: "Convert 3/8 to a decimal.",
                order: 6,
                difficulty: 4,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question:
                  "Find the area of a rectangle with length 9 cm and width 6 cm.",
                order: 7,
                difficulty: 3,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question:
                  "What is the greatest common factor (GCF) of 24 and 36?",
                order: 8,
                difficulty: 7,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question: "Simplify: -4 + (-7) - (+2)",
                order: 9,
                difficulty: 6,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question:
                  "If a triangle has angles measuring 30° and 60°, what is the measure of the third angle?",
                order: 10,
                difficulty: 8,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question:
                  "What is the value of π (pi) rounded to two decimal places?",
                order: 11,
                difficulty: 2,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question: "Solve: 2(x + 3) = 14",
                order: 12,
                difficulty: 12,
              },
            ])
            .returning();

          // For each challenge, insert challenge options
          for (const challenge of challenges) {
            if (challenge.order === 1) {
              await db.insert(schema.challengeOptions).values([
                {
                  challengeId: challenge.id,
                  correct: true,
                  text: "5,003,021",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "5,300,021",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "5,030,021",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "5,000,321",
                },
              ]);
            } else if (challenge.order === 2) {
              await db.insert(schema.challengeOptions).values([
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "Ones",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "Tens",
                },
                {
                  challengeId: challenge.id,
                  correct: true,
                  text: "Hundreds",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "Thousands",
                },
              ]);
            } else if (challenge.order === 3) {
              await db.insert(schema.challengeOptions).values([
                { challengeId: challenge.id, correct: true, text: "72" },
                { challengeId: challenge.id, correct: false, text: "36" },
                { challengeId: challenge.id, correct: false, text: "64" },
                { challengeId: challenge.id, correct: false, text: "81" },
              ]);
            } else if (challenge.order === 4) {
              await db.insert(schema.challengeOptions).values([
                { challengeId: challenge.id, correct: true, text: "5" },
                { challengeId: challenge.id, correct: false, text: "7" },
                { challengeId: challenge.id, correct: false, text: "4" },
                { challengeId: challenge.id, correct: false, text: "6" },
              ]);
            } else if (challenge.order === 5) {
              await db.insert(schema.challengeOptions).values([
                { challengeId: challenge.id, correct: true, text: "20" },
                { challengeId: challenge.id, correct: false, text: "15" },
                { challengeId: challenge.id, correct: false, text: "25" },
                { challengeId: challenge.id, correct: false, text: "30" },
              ]);
            } else if (challenge.order === 6) {
              await db.insert(schema.challengeOptions).values([
                { challengeId: challenge.id, correct: true, text: "0.375" },
                { challengeId: challenge.id, correct: false, text: "0.3" },
                { challengeId: challenge.id, correct: false, text: "0.38" },
                { challengeId: challenge.id, correct: false, text: "0.4" },
              ]);
            } else if (challenge.order === 7) {
              await db.insert(schema.challengeOptions).values([
                { challengeId: challenge.id, correct: true, text: "54 cm²" },
                { challengeId: challenge.id, correct: false, text: "30 cm²" },
                { challengeId: challenge.id, correct: false, text: "45 cm²" },
                { challengeId: challenge.id, correct: false, text: "60 cm²" },
              ]);
            } else if (challenge.order === 8) {
              await db.insert(schema.challengeOptions).values([
                { challengeId: challenge.id, correct: true, text: "12" },
                { challengeId: challenge.id, correct: false, text: "6" },
                { challengeId: challenge.id, correct: false, text: "18" },
                { challengeId: challenge.id, correct: false, text: "24" },
              ]);
            } else if (challenge.order === 9) {
              await db.insert(schema.challengeOptions).values([
                { challengeId: challenge.id, correct: true, text: "-13" },
                { challengeId: challenge.id, correct: false, text: "-9" },
                { challengeId: challenge.id, correct: false, text: "-11" },
                { challengeId: challenge.id, correct: false, text: "-15" },
              ]);
            } else if (challenge.order === 10) {
              await db.insert(schema.challengeOptions).values([
                { challengeId: challenge.id, correct: true, text: "90°" },
                { challengeId: challenge.id, correct: false, text: "80°" },
                { challengeId: challenge.id, correct: false, text: "100°" },
                { challengeId: challenge.id, correct: false, text: "120°" },
              ]);
            } else if (challenge.order === 11) {
              await db.insert(schema.challengeOptions).values([
                { challengeId: challenge.id, correct: true, text: "3.14" },
                { challengeId: challenge.id, correct: false, text: "3.12" },
                { challengeId: challenge.id, correct: false, text: "3.16" },
                { challengeId: challenge.id, correct: false, text: "3.18" },
              ]);
            } else if (challenge.order === 12) {
              await db.insert(schema.challengeOptions).values([
                { challengeId: challenge.id, correct: true, text: "4" },
                { challengeId: challenge.id, correct: false, text: "5" },
                { challengeId: challenge.id, correct: false, text: "3" },
                { challengeId: challenge.id, correct: false, text: "6" },
              ]);
            }
          }
        }
      }
    }
    console.log("Database seeded successfully");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to seed database");
  }
};

void main();
