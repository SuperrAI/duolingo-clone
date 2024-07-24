import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";
import { contentBlockTypeEnum } from "@/db/schema";

const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql, { schema });

const createTables = async () => {
  await sql`CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    image_src TEXT NOT NULL
  );`;

  await sql`CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    chapter_order INTEGER NOT NULL
  );`;

  await sql`CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    topic_order INTEGER NOT NULL
  );`;

  await sql`CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_block_ids INTEGER[] NOT NULL,
    lesson_order INTEGER NOT NULL
  );`;

  // await sql`CREATE TYPE content_block_type AS ENUM ('CHALLENGE', 'CONTENT');`;

  await sql`CREATE TABLE IF NOT EXISTS content_blocks (
    id SERIAL PRIMARY KEY,
    type content_block_type NOT NULL,
    title TEXT,
    body TEXT,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE
  );`;

  await sql`CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    challenge_order INTEGER NOT NULL,
    difficulty INTEGER NOT NULL
  );`;

  await sql`CREATE TABLE IF NOT EXISTS challenge_options (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    correct BOOLEAN NOT NULL,
    text TEXT NOT NULL,
    image_src TEXT,
    audio_src TEXT
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
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_correct BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
  );`;

  await sql`CREATE TABLE IF NOT EXISTS lesson_progress (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    current_content_block_order INTEGER NOT NULL DEFAULT 0,
    current_difficulty INTEGER NOT NULL DEFAULT 1,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    total_attempts INTEGER NOT NULL DEFAULT 0,
    consecutive_correct INTEGER NOT NULL DEFAULT 0,
    consecutive_incorrect INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_attempted_at TIMESTAMP NOT NULL DEFAULT now(),
    ability_estimate REAL NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
  );`;

  await sql`CREATE TABLE IF NOT EXISTS topic_progress (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    current_difficulty INTEGER NOT NULL DEFAULT 1,
    ability_estimate REAL NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
  );`;

  await sql`CREATE TABLE IF NOT EXISTS chapter_progress (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    current_difficulty INTEGER NOT NULL DEFAULT 1,
    ability_estimate REAL NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
  );`;

  await sql`CREATE TABLE IF NOT EXISTS subject_progress (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    current_difficulty INTEGER NOT NULL DEFAULT 1,
    ability_estimate REAL NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
  );`;

  await sql`CREATE TABLE IF NOT EXISTS user_progress (
    user_id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL DEFAULT 'User',
    user_image_src TEXT NOT NULL DEFAULT '/mascot.svg',
    active_subject_id INTEGER REFERENCES subjects(id),
    active_chapter_id INTEGER REFERENCES chapters(id),
    active_topic_id INTEGER REFERENCES topics(id),
    active_lesson_id INTEGER REFERENCES lessons(id),
    hearts INTEGER NOT NULL DEFAULT 50,
    points INTEGER NOT NULL DEFAULT 0,
    current_lesson_id INTEGER REFERENCES lessons(id),
    last_attempted_challenge_id INTEGER REFERENCES challenges(id),
    ability_estimate REAL NOT NULL DEFAULT 1
  );`;
};

const main = async () => {
  try {
    // Delete all existing data
    await Promise.all([
      db.delete(schema.userProgress),
      db.delete(schema.challengeProgress),
      db.delete(schema.lessonProgress),
      db.delete(schema.topicProgress),
      db.delete(schema.chapterProgress),
      db.delete(schema.subjectProgress),
      db.delete(schema.subjects),
      db.delete(schema.chapters),
      db.delete(schema.topics),
      db.delete(schema.lessons),
      db.delete(schema.challenges),
      db.delete(schema.challengeOptions),
      db.delete(schema.userProgress),
      db.delete(schema.userSubscription),
    ]);

    console.log("Creating tables");
    await createTables();
    console.log("Tables created");

    console.log("Seeding database");

    /**
     * Subject data
     */
    const subjectsData = [
      {
        subjectId: 1,
        title: "Math",
        imageSrc: "/man.svg",
        chapters: [
          {
            id: 11,
            description: `Knowing Our Numbers`,
            order: 1,
            title: "Chapter 1",
            topics: [
              {
                id: 10,
                description: `Comparing Large and Small Numbers`,
                order: 1,
                title: "Topic 1",
                lessons: [
                  {
                    id: 111,
                    title: "Comparing Numbers",
                    order: 1,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the place value of 6 in the number 65342?",
                        order: 1,
                        difficulty: 1,
                        id: 1111,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "6",
                          },
                          {
                            correct: false,
                            text: "600",
                          },
                          {
                            correct: false,
                            text: "6000",
                          },
                          {
                            correct: true,
                            text: "60000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "In the number 78954, which digit is in the ten-thousands place?",
                        order: 2,
                        difficulty: 1,
                        id: 1112,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "9",
                          },
                          {
                            correct: true,
                            text: "7",
                          },
                          {
                            correct: false,
                            text: "8",
                          },
                          {
                            correct: false,
                            text: "4",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Identify the digit at the hundreds place in the number 502341:",
                        order: 3,
                        difficulty: 1,
                        id: 1113,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "5",
                          },
                          {
                            correct: false,
                            text: "0",
                          },
                          {
                            correct: false,
                            text: "2",
                          },
                          {
                            correct: true,
                            text: "3",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "The place value of 8 in the number 38542 is:",
                        order: 4,
                        difficulty: 2,
                        id: 1114,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "8",
                          },
                          {
                            correct: false,
                            text: "80",
                          },
                          {
                            correct: false,
                            text: "800",
                          },
                          {
                            correct: true,
                            text: "8000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "How many digits are there in one lakh?",
                        order: 5,
                        difficulty: 2,
                        id: 1115,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "4",
                          },
                          {
                            correct: false,
                            text: "5",
                          },
                          {
                            correct: true,
                            text: "6",
                          },
                          {
                            correct: false,
                            text: "7",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Compare the place values of 5 in the number 55555:",
                        order: 6,
                        difficulty: 2,
                        id: 1116,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "All the same",
                          },
                          {
                            correct: true,
                            text: "Different for each digit",
                          },
                          {
                            correct: false,
                            text: "None",
                          },
                          {
                            correct: false,
                            text: "Two same, three different",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the sum of the place values of 3 in the number 393739?",
                        order: 7,
                        difficulty: 3,
                        id: 1117,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "3003",
                          },
                          {
                            correct: true,
                            text: "33330",
                          },
                          {
                            correct: false,
                            text: "303030",
                          },
                          {
                            correct: false,
                            text: "333300",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which number is represented by the place values 41000 + 3100 + 210 + 51?",
                        order: 8,
                        difficulty: 3,
                        id: 1118,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "4235",
                          },
                          {
                            correct: true,
                            text: "4325",
                          },
                          {
                            correct: false,
                            text: "3425",
                          },
                          {
                            correct: false,
                            text: "3245",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "If you interchanged the digits in the ten-thousands and hundreds places in the number 487632, what will the new number be?",
                        order: 9,
                        difficulty: 3,
                        id: 1119,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "487623",
                          },
                          {
                            correct: false,
                            text: "437682",
                          },
                          {
                            correct: false,
                            text: "457682",
                          },
                          {
                            correct: true,
                            text: "487362",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following is the smallest number?",
                        order: 10,
                        difficulty: 1,
                        id: 1120,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "65321",
                          },
                          {
                            correct: false,
                            text: "43125",
                          },
                          {
                            correct: false,
                            text: "32145",
                          },
                          {
                            correct: true,
                            text: "25431",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which digit has the highest place value in the number 98076?",
                        order: 11,
                        difficulty: 1,
                        id: 1121,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "9",
                          },
                          {
                            correct: false,
                            text: "0",
                          },
                          {
                            correct: false,
                            text: "8",
                          },
                          {
                            correct: false,
                            text: "7",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Which of the following numbers is greater?",
                        order: 12,
                        difficulty: 1,
                        id: 1122,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "8756",
                          },
                          {
                            correct: false,
                            text: "7856",
                          },
                          {
                            correct: false,
                            text: "5786",
                          },
                          {
                            correct: false,
                            text: "8657",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Arrange the following numbers in ascending order: 5432, 5678, 7890, 1234:",
                        order: 13,
                        difficulty: 2,
                        id: 1123,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "5678, 5432, 1234, 7890",
                          },
                          {
                            correct: true,
                            text: "1234, 5432, 5678, 7890",
                          },
                          {
                            correct: false,
                            text: "7890, 1234, 5678, 5432",
                          },
                          {
                            correct: false,
                            text: "5432, 1234, 7890, 5678",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following numbers is less than 56789 and greater than 45678?",
                        order: 14,
                        difficulty: 2,
                        id: 1124,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "67890",
                          },
                          {
                            correct: false,
                            text: "12345",
                          },
                          {
                            correct: true,
                            text: "56785",
                          },
                          {
                            correct: false,
                            text: "23456",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Which number lies between 7890 and 8900?",
                        order: 15,
                        difficulty: 2,
                        id: 1125,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "7654",
                          },
                          {
                            correct: true,
                            text: "8000",
                          },
                          {
                            correct: false,
                            text: "9000",
                          },
                          {
                            correct: false,
                            text: "9100",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following is arranged in descending order?",
                        order: 16,
                        difficulty: 3,
                        id: 1126,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "32143, 23415, 54321, 12345",
                          },
                          {
                            correct: true,
                            text: "54321, 32143, 23415, 12345",
                          },
                          {
                            correct: false,
                            text: "54321, 23415, 32143, 12345",
                          },
                          {
                            correct: false,
                            text: "23415, 54321, 32143, 12345",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "If you have the digits 2, 8, 3, 7, which is the largest number you can form without repeating any digit?",
                        order: 17,
                        difficulty: 3,
                        id: 1127,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "8273",
                          },
                          {
                            correct: true,
                            text: "8732",
                          },
                          {
                            correct: false,
                            text: "7832",
                          },
                          {
                            correct: false,
                            text: "7823",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "If you have the digits 5, 3, 7, 1, what is the smallest even number you can form?",
                        order: 18,
                        difficulty: 3,
                        id: 1128,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "1357",
                          },
                          {
                            correct: false,
                            text: "1375",
                          },
                          {
                            correct: true,
                            text: "1537",
                          },
                          {
                            correct: false,
                            text: "1573",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is the largest number you can form with the digits 4, 6, 9?",
                        order: 19,
                        difficulty: 1,
                        id: 1129,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "469",
                          },
                          {
                            correct: true,
                            text: "964",
                          },
                          {
                            correct: false,
                            text: "649",
                          },
                          {
                            correct: false,
                            text: "946",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which number is the smallest when formed with the digits 3, 8, 2, 7?",
                        order: 20,
                        difficulty: 1,
                        id: 1130,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "7823",
                          },
                          {
                            correct: false,
                            text: "8732",
                          },
                          {
                            correct: false,
                            text: "2387",
                          },
                          {
                            correct: true,
                            text: "2378",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the largest 4-digit number you can create using the digits 5, 8, 1, and 4?",
                        order: 21,
                        difficulty: 1,
                        id: 1131,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "5814",
                          },
                          {
                            correct: true,
                            text: "8541",
                          },
                          {
                            correct: false,
                            text: "4851",
                          },
                          {
                            correct: false,
                            text: "8145",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Rearrange the digits of 5893 to form the largest possible number:",
                        order: 22,
                        difficulty: 2,
                        id: 1132,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "5893",
                          },
                          {
                            correct: false,
                            text: "8593",
                          },
                          {
                            correct: false,
                            text: "8953",
                          },
                          {
                            correct: true,
                            text: "9835",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following is the smallest 5-digit number you can form using the digits 2, 6, 9, 1, 8?",
                        order: 23,
                        difficulty: 2,
                        id: 1133,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "12689",
                          },
                          {
                            correct: false,
                            text: "12986",
                          },
                          {
                            correct: false,
                            text: "16289",
                          },
                          {
                            correct: false,
                            text: "18296",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Form the largest number possible from the digits 0, 3, 5, 2 without repeating any digit:",
                        order: 24,
                        difficulty: 2,
                        id: 1134,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "5032",
                          },
                          {
                            correct: false,
                            text: "5320",
                          },
                          {
                            correct: true,
                            text: "5230",
                          },
                          {
                            correct: false,
                            text: "5302",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Using digits 6, 1, 8, 3 and one 4, form the largest 5-digit number possible:",
                        order: 25,
                        difficulty: 3,
                        id: 1135,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "86431",
                          },
                          {
                            correct: false,
                            text: "86341",
                          },
                          {
                            correct: false,
                            text: "84163",
                          },
                          {
                            correct: false,
                            text: "86413",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the difference between the largest and smallest numbers you can form using the digits 2, 5, 7, 3, 9?",
                        order: 26,
                        difficulty: 3,
                        id: 1136,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "64764",
                          },
                          {
                            correct: false,
                            text: "60174",
                          },
                          {
                            correct: false,
                            text: "68474",
                          },
                          {
                            correct: false,
                            text: "72174",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Form a number using digits 3, 1, 4, 2, 6 such that the digit 1 is at the hundred’s place:",
                        order: 27,
                        difficulty: 3,
                        id: 1137,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "63421",
                          },
                          {
                            correct: true,
                            text: "61342",
                          },
                          {
                            correct: false,
                            text: "63142",
                          },
                          {
                            correct: false,
                            text: "62341",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Round off 5432 to the nearest hundred:",
                        order: 28,
                        difficulty: 1,
                        id: 1138,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "5400",
                          },
                          {
                            correct: false,
                            text: "5500",
                          },
                          {
                            correct: false,
                            text: "5300",
                          },
                          {
                            correct: false,
                            text: "5600",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these numbers is rounded to 700 if taken nearest hundred?",
                        order: 29,
                        difficulty: 1,
                        id: 1139,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "745",
                          },
                          {
                            correct: false,
                            text: "665",
                          },
                          {
                            correct: false,
                            text: "699",
                          },
                          {
                            correct: true,
                            text: "720",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Round off 8345 to the nearest thousand:",
                        order: 30,
                        difficulty: 1,
                        id: 1140,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "8000",
                          },
                          {
                            correct: false,
                            text: "8500",
                          },
                          {
                            correct: false,
                            text: "8700",
                          },
                          {
                            correct: false,
                            text: "8340",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Estimate the result of 6489 + 2312 by rounding off to the nearest hundred:",
                        order: 31,
                        difficulty: 2,
                        id: 1141,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "8700",
                          },
                          {
                            correct: true,
                            text: "8800",
                          },
                          {
                            correct: false,
                            text: "9000",
                          },
                          {
                            correct: false,
                            text: "8500",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following rounded to the nearest ten is 120?",
                        order: 32,
                        difficulty: 2,
                        id: 1142,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "116",
                          },
                          {
                            correct: false,
                            text: "123",
                          },
                          {
                            correct: true,
                            text: "119",
                          },
                          {
                            correct: false,
                            text: "124",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Round off 67890 to the nearest thousand:",
                        order: 33,
                        difficulty: 2,
                        id: 1143,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "68000",
                          },
                          {
                            correct: false,
                            text: "69000",
                          },
                          {
                            correct: false,
                            text: "67900",
                          },
                          {
                            correct: true,
                            text: "70000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Estimate the difference between 98765 and 54321 by rounding off to the nearest thousand:",
                        order: 34,
                        difficulty: 3,
                        id: 1144,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "44000",
                          },
                          {
                            correct: true,
                            text: "45000",
                          },
                          {
                            correct: false,
                            text: "46000",
                          },
                          {
                            correct: false,
                            text: "47000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Round off the sum of 26895 and 7629 to the nearest ten:",
                        order: 35,
                        difficulty: 3,
                        id: 1145,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "34520",
                          },
                          {
                            correct: true,
                            text: "34530",
                          },
                          {
                            correct: false,
                            text: "34540",
                          },
                          {
                            correct: false,
                            text: "34510",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the estimated quotient when 9567 is divided by 123 and rounded to the nearest tenth?",
                        order: 36,
                        difficulty: 3,
                        id: 1146,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "77.5",
                          },
                          {
                            correct: false,
                            text: "77.8",
                          },
                          {
                            correct: true,
                            text: "77.7",
                          },
                          {
                            correct: false,
                            text: "77.9",
                          },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 10,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Introduction to Place Value",
                        body: `In our number system, each digit in a number has a specific value based on its position. This is called place value. Let's explore how place value helps us understand and compare numbers.`,
                      },
                      {
                        id: 20,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Finding Place Value of Digits",
                        body: `To find the place value of a digit in a number:\n1. Identify the position of the digit from right to left.\n2. The rightmost position is the ones place, then tens, hundreds, thousands, and so on.\n3. Multiply the digit by its place value (1, 10, 100, 1000, etc.).\n\nFor example, in the number 45,678:\n- 8 is in the ones place: 8 × 1 = 8\n- 7 is in the tens place: 7 × 10 = 70\n- 6 is in the hundreds place: 6 × 100 = 600\n- 5 is in the thousands place: 5 × 1,000 = 5,000\n- 4 is in the ten thousands place: 4 × 10,000 = 40,000`,
                      },
                      {
                        id: 30,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Total Numbers from Given Digits",
                        body: `To find the total numbers that can be made from given digits:\n1. Determine if repetition is allowed.\n2. If repetition is not allowed, count the arrangements systematically.\n3. If repetition is allowed, use the counting principle.\n\nFor example, with digits 1, 2, and 3 (no repetition):\nPossible numbers: 123, 132, 213, 231, 312, 321\nTotal: 6 different numbers\n\nWith repetition allowed:\nPossible numbers: 111, 112, 113, 121, 122, 123, 131, 132, 133, 211, 212, 213, 221, 222, 223, 231, 232, 233, 311, 312, 313, 321, 322, 323, 331, 332, 333\nTotal: 27 different numbers`,
                      },
                      {
                        id: 40,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Arranging Digits for Smaller or Bigger Numbers",
                        body: `To make the smallest number:\n1. Arrange the digits in ascending order.\n2. Place the smallest non-zero digit in the leftmost position.\n\nTo make the biggest number:\n1. Arrange the digits in descending order.\n\nFor example, with digits 3, 1, 4, 2:\n- Smallest number: 1234\n- Biggest number: 4321`,
                      },
                      {
                        id: 50,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Adding 1 to Get the Smallest Next Digit Number",
                        body: `When we add 1 to the greatest 1-digit, 2-digit, or 3-digit number, we get the smallest number with the next number of digits:\n- Greatest 1-digit number: 9\n  9 + 1 = 10 (smallest 2-digit number)\n- Greatest 2-digit number: 99\n  99 + 1 = 100 (smallest 3-digit number)\n- Greatest 3-digit number: 999\n  999 + 1 = 1000 (smallest 4-digit number)`,
                      },
                      {
                        id: 60,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Expanding Numbers and Identifying Place Values",
                        body: `To expand a number and identify place values:\n1. Write each digit multiplied by its place value.\n2. Add these values together.\n\nFor example, 45,678 can be expanded as:\n40,000 + 5,000 + 600 + 70 + 8\nor\n(4 × 10,000) + (5 × 1,000) + (6 × 100) + (7 × 10) + (8 × 1)`,
                      },
                      {
                        id: 70,
                        type: contentBlockTypeEnum.enumValues[1],
                        title:
                          "Writing 6-Digit Numbers in Expanded Form and Words",
                        body: `Let's take the number 234,567 as an example:\n\nExpanded form:\n200,000 + 30,000 + 4,000 + 500 + 60 + 7\nor\n(2 × 100,000) + (3 × 10,000) + (4 × 1,000) + (5 × 100) + (6 × 10) + (7 × 1)\n\nIn words:\nTwo hundred thirty-four thousand, five hundred sixty-seven`,
                      },
                      {
                        id: 80,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Understanding Predecessors and Successors",
                        body: `The predecessor of a number is the number that comes just before it.\nThe successor of a number is the number that comes just after it.\n\nFor example:\n- For the number 50:\n  Predecessor: 49\n  Successor: 51\n\nNote: The predecessor of a number ending in 0 will end in 9, and all other digits to its left will decrease by 1.`,
                      },
                      {
                        id: 90,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Adding Larger Numbers",
                        body: `When adding larger numbers, we can use the column method:\n1. Align the numbers vertically by their place values.\n2. Start from the rightmost column (ones) and add upwards.\n3. If the sum in any column is 10 or more, carry over to the next column.\n\nFor example, adding 45,678 and 32,456:\n  45,678\n+ 32,456\n--------\n  78,134\n\nThis method helps us deal with situations involving larger numbers in real life, such as population counts or financial calculations.`,
                      },
                      {
                        id: 100,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Using Place Values to Read Numbers Easily",
                        body: `To read large numbers easily:\n1. Group the digits in sets of three from right to left.\n2. Use commas to separate these groups.\n3. Read each group followed by its place value name.\n\nFor example, 45678901 can be written as 45,678,901 and read as:\n'Forty-five million, six hundred seventy-eight thousand, nine hundred one'\n\nThis method helps in quickly understanding the magnitude of large numbers in various contexts, such as distances in space, national budgets, or global statistics.`,
                      },
                      {
                        id: 110,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Conclusion",
                        body: `In this lesson, we've explored various aspects of comparing numbers:\n- Understanding place value and its importance\n- Finding the total numbers that can be made from given digits\n- Arranging digits to form smaller or bigger numbers\n- Adding 1 to get the next digit number\n- Expanding numbers and identifying place values\n- Writing numbers in expanded form and words\n- Understanding predecessors and successors\n- Adding larger numbers\n- Using place values to read numbers easily\n\nThese skills are fundamental in mathematics and will help you in more advanced topics as well as in real-life situations involving large numbers.`,
                      },
                      {
                        id: 120,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 130,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 140,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 150,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 160,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
              {
                id: 20,
                description: `Understanding and Using Large Numbers in Practice`,
                order: 2,
                title: "Topic 2",
                lessons: [
                  {
                    id: 112,
                    title: "Large Numbers in Practice",
                    order: 2,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the word form of the number 2345678?",
                        order: 1,
                        difficulty: 1,
                        id: 1200,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Two million, three-four-five-six-seventy-eight",
                          },
                          {
                            correct: false,
                            text: "Two lakh thirty-four thousand, five sixty-seven eighty",
                          },
                          {
                            correct: true,
                            text: "Twenty-three lakh forty-five thousand six hundred seventy-eight",
                          },
                          {
                            correct: false,
                            text: "Two crore three lakh forty-five thousand four hundred seventy-eight",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following is the correct expanded form of 4500321?",
                        order: 2,
                        difficulty: 1,
                        id: 1201,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "4000000 + 500000 + 3000 + 20 + 1",
                          },
                          {
                            correct: true,
                            text: "4000000 + 500000 + 3000 + 200 + 1",
                          },
                          {
                            correct: false,
                            text: "4000000 + 500000 + 3000 + 100 + 1",
                          },
                          {
                            correct: false,
                            text: "4000000 + 500000 + 3000 + 20 + 10",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What comes after 999999?",
                        order: 3,
                        difficulty: 1,
                        id: 1202,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "999998",
                          },
                          {
                            correct: true,
                            text: "1000000",
                          },
                          {
                            correct: false,
                            text: "99999",
                          },
                          {
                            correct: false,
                            text: "100001",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the place value of 2 in the number 8726543?",
                        order: 4,
                        difficulty: 2,
                        id: 1203,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "2",
                          },
                          {
                            correct: false,
                            text: "2000",
                          },
                          {
                            correct: false,
                            text: "20000",
                          },
                          {
                            correct: true,
                            text: "200000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "If you round the number 763945 to the nearest ten thousand, what do you get?",
                        order: 5,
                        difficulty: 2,
                        id: 1204,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "760000",
                          },
                          {
                            correct: false,
                            text: "764000",
                          },
                          {
                            correct: false,
                            text: "7600000",
                          },
                          {
                            correct: false,
                            text: "7640000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the sum of 999999 and 1?",
                        order: 6,
                        difficulty: 2,
                        id: 1205,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "1000000",
                          },
                          {
                            correct: false,
                            text: "999998",
                          },
                          {
                            correct: false,
                            text: "1000001",
                          },
                          {
                            correct: false,
                            text: "10000000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these numbers is closest to ten million?",
                        order: 7,
                        difficulty: 3,
                        id: 1206,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "9500000",
                          },
                          {
                            correct: false,
                            text: "10500000",
                          },
                          {
                            correct: true,
                            text: "10000000",
                          },
                          {
                            correct: false,
                            text: "10900000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the difference between 1000000 and 501234?",
                        order: 8,
                        difficulty: 3,
                        id: 1207,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "499766",
                          },
                          {
                            correct: true,
                            text: "498766",
                          },
                          {
                            correct: false,
                            text: "499876",
                          },
                          {
                            correct: false,
                            text: "499766",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Multiply 123456 by 10. What is the result?",
                        order: 9,
                        difficulty: 3,
                        id: 1208,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "1234560",
                          },
                          {
                            correct: false,
                            text: "1234567",
                          },
                          {
                            correct: false,
                            text: "1234500",
                          },
                          {
                            correct: false,
                            text: "1234550",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "The product of 5000 and 200 is:",
                        order: 10,
                        difficulty: 1,
                        id: 1209,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "10,00,000",
                          },
                          {
                            correct: true,
                            text: "1,00,000",
                          },
                          {
                            correct: false,
                            text: "10,000,000",
                          },
                          {
                            correct: false,
                            text: "1,000,000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "If you subtract 3456 from 98765, what is the result?",
                        order: 11,
                        difficulty: 1,
                        id: 1210,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "95209",
                          },
                          {
                            correct: false,
                            text: "95609",
                          },
                          {
                            correct: true,
                            text: "95309",
                          },
                          {
                            correct: false,
                            text: "95709",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Add 456789 and 123456:",
                        order: 12,
                        difficulty: 1,
                        id: 1211,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "580245",
                          },
                          {
                            correct: true,
                            text: "578245",
                          },
                          {
                            correct: false,
                            text: "580245",
                          },
                          {
                            correct: false,
                            text: "680245",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the sum of 123456, 789012, and 654321?",
                        order: 13,
                        difficulty: 2,
                        id: 1212,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "1560789",
                          },
                          {
                            correct: false,
                            text: "1560790",
                          },
                          {
                            correct: false,
                            text: "1560788",
                          },
                          {
                            correct: false,
                            text: "1560787",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "If you divide 987654 by 3, what is the quotient?",
                        order: 14,
                        difficulty: 2,
                        id: 1213,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "329218",
                          },
                          {
                            correct: true,
                            text: "329218",
                          },
                          {
                            correct: true,
                            text: "329218",
                          },
                          {
                            correct: true,
                            text: "329218",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the product of 34567 and 456?",
                        order: 15,
                        difficulty: 2,
                        id: 1214,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "15745682",
                          },
                          {
                            correct: false,
                            text: "15743521",
                          },
                          {
                            correct: false,
                            text: "15734582",
                          },
                          {
                            correct: false,
                            text: "15747852",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Subtract 87654321 from 98765432:",
                        order: 16,
                        difficulty: 3,
                        id: 1215,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "11111121",
                          },
                          {
                            correct: false,
                            text: "111111111",
                          },
                          {
                            correct: false,
                            text: "11111111",
                          },
                          {
                            correct: false,
                            text: "11111131",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Divide 123456789 by 987:",
                        order: 17,
                        difficulty: 3,
                        id: 1216,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "125046",
                          },
                          {
                            correct: false,
                            text: "125496",
                          },
                          {
                            correct: false,
                            text: "125606",
                          },
                          {
                            correct: true,
                            text: "125226",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the product of 567890 and 1234?",
                        order: 18,
                        difficulty: 3,
                        id: 1217,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "700539660",
                          },
                          {
                            correct: false,
                            text: "699670660",
                          },
                          {
                            correct: false,
                            text: "700670660",
                          },
                          {
                            correct: false,
                            text: "700536660",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Translating Five lakh seventy-eight thousand nine hundred and sixty-four into numerals gives:",
                        order: 19,
                        difficulty: 1,
                        id: 1218,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "578964",
                          },
                          {
                            correct: false,
                            text: "578406",
                          },
                          {
                            correct: false,
                            text: "578094",
                          },
                          {
                            correct: false,
                            text: "578906",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "One million is equal to:",
                        order: 20,
                        difficulty: 1,
                        id: 1219,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "1000",
                          },
                          {
                            correct: false,
                            text: "10000",
                          },
                          {
                            correct: false,
                            text: "100000",
                          },
                          {
                            correct: true,
                            text: "1000000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "If you round off the number 9999 to the nearest thousand, what do you get?",
                        order: 21,
                        difficulty: 1,
                        id: 1220,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "8000",
                          },
                          {
                            correct: false,
                            text: "9000",
                          },
                          {
                            correct: true,
                            text: "10000",
                          },
                          {
                            correct: false,
                            text: "11000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "If there are 234567 people in a town, and 9876 more people arrive, how many people are in the town now?",
                        order: 22,
                        difficulty: 2,
                        id: 1221,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "244443",
                          },
                          {
                            correct: false,
                            text: "254443",
                          },
                          {
                            correct: false,
                            text: "244342",
                          },
                          {
                            correct: false,
                            text: "244373",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Estimate the sum of 34567 and 98765 by rounding to the nearest thousand:",
                        order: 23,
                        difficulty: 2,
                        id: 1271,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "130000",
                          },
                          {
                            correct: false,
                            text: "140000",
                          },
                          {
                            correct: true,
                            text: "135000",
                          },
                          {
                            correct: false,
                            text: "145000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "The population of a city is 8765432. Estimate it to the nearest million:",
                        order: 24,
                        difficulty: 2,
                        id: 1222,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "8000000",
                          },
                          {
                            correct: true,
                            text: "9000000",
                          },
                          {
                            correct: false,
                            text: "8760000",
                          },
                          {
                            correct: false,
                            text: "8770000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "If 9876543 is divided equally among 365 people, approximately how much will each person get (rounded to nearest whole number)?",
                        order: 25,
                        difficulty: 3,
                        id: 1223,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "27047",
                          },
                          {
                            correct: false,
                            text: "27041",
                          },
                          {
                            correct: false,
                            text: "27035",
                          },
                          {
                            correct: false,
                            text: "27049",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Calculate the sum: 1234567 + 7654321 + 8765432:",
                        order: 26,
                        difficulty: 3,
                        id: 1224,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "17654320",
                          },
                          {
                            correct: false,
                            text: "17654120",
                          },
                          {
                            correct: false,
                            text: "17654310",
                          },
                          {
                            correct: true,
                            text: "17654330",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Divide 12345678 by 678 and round off to the nearest whole number:",
                        order: 27,
                        difficulty: 3,
                        id: 1225,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "18208",
                          },
                          {
                            correct: false,
                            text: "18198",
                          },
                          {
                            correct: false,
                            text: "18200",
                          },
                          {
                            correct: false,
                            text: "18188",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "The number one less than one million is:",
                        order: 28,
                        difficulty: 1,
                        id: 1226,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "999990",
                          },
                          {
                            correct: true,
                            text: "999999",
                          },
                          {
                            correct: false,
                            text: "1000000",
                          },
                          {
                            correct: false,
                            text: "1000001",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "The sum of 50000 and 250000 is:",
                        order: 29,
                        difficulty: 1,
                        id: 1227,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "300000",
                          },
                          {
                            correct: false,
                            text: "350000",
                          },
                          {
                            correct: false,
                            text: "400000",
                          },
                          {
                            correct: false,
                            text: "450000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the word form of 987654?",
                        order: 30,
                        difficulty: 1,
                        id: 1228,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Nine million eight hundred seventy-six thousand, five hundred fifty-four",
                          },
                          {
                            correct: false,
                            text: "Nine hundred eighty-seven thousand, six hundred fifty-four",
                          },
                          {
                            correct: false,
                            text: "Ninety-eight thousand, seven hundred fifty-four",
                          },
                          {
                            correct: true,
                            text: "Nine lakh, eighty-seven thousand, six hundred and fifty-four",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How many times does 0 appear in the number 108305070?",
                        order: 31,
                        difficulty: 2,
                        id: 1229,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "2",
                          },
                          {
                            correct: false,
                            text: "3",
                          },
                          {
                            correct: true,
                            text: "4",
                          },
                          {
                            correct: false,
                            text: "5",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "If you round 786543 to the nearest ten thousand, the result is:",
                        order: 32,
                        difficulty: 2,
                        id: 1230,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "780000",
                          },
                          {
                            correct: true,
                            text: "790000",
                          },
                          {
                            correct: false,
                            text: "785000",
                          },
                          {
                            correct: false,
                            text: "788000",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Add 456789, 1234567, and 3456789:",
                        order: 33,
                        difficulty: 2,
                        id: 1231,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "5154135",
                          },
                          {
                            correct: false,
                            text: "5154355",
                          },
                          {
                            correct: false,
                            text: "5154789",
                          },
                          {
                            correct: false,
                            text: "5154305",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the product of 789012 and 3456?",
                        order: 34,
                        difficulty: 3,
                        id: 1232,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "2726598912",
                          },
                          {
                            correct: false,
                            text: "2726548912",
                          },
                          {
                            correct: false,
                            text: "2726438912",
                          },
                          {
                            correct: true,
                            text: "2726488912",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Subtract 6543210 from 9087654:",
                        order: 35,
                        difficulty: 3,
                        id: 1233,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "2544444",
                          },
                          {
                            correct: true,
                            text: "2544434",
                          },
                          {
                            correct: false,
                            text: "2544440",
                          },
                          {
                            correct: false,
                            text: "2544420",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Divide 987654321 by 54321 and round to the nearest whole number:",
                        order: 36,
                        difficulty: 3,
                        id: 1234,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "18178",
                          },
                          {
                            correct: false,
                            text: "18168",
                          },
                          {
                            correct: true,
                            text: "18198",
                          },
                          {
                            correct: false,
                            text: "18208",
                          },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 170,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "1. What Are Large Numbers?",
                        body: `Large numbers are numbers with many digits. We encounter them in various situations:\n• Population of countries\n• Distances in space\n• Money in national budgets\n• Number of cells in the human body\n\nUnderstanding large numbers helps us make sense of important information in the world around us.`,
                      },
                      {
                        id: 180,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "2. Indian Number System",
                        body: `In India, we use a unique system to write and read large numbers:\n• 1,000 = One thousand\n• 10,000 = Ten thousand\n• 1,00,000 = One lakh\n• 10,00,000 = Ten lakh\n• 1,00,00,000 = One crore\n\nWe use commas to separate these groups, making large numbers easier to read.`,
                      },
                      {
                        id: 190,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "3. Reading Large Numbers",
                        body: `To read large numbers, follow these steps:\n1. Start from the rightmost comma\n2. Read each group of digits\n3. Add the place value (thousand, lakh, crore)\n\nExample: 23,45,678\n• 678 - six hundred seventy-eight\n• 45 - forty-five thousand\n• 23 - twenty-three lakh\n\nSo, we read it as 'twenty-three lakh, forty-five thousand, six hundred seventy-eight'`,
                      },
                      {
                        id: 200,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "4. Writing Large Numbers in Words",
                        body: `When writing large numbers in words:\n• Use hyphens for compound numbers (twenty-one, thirty-five)\n• Use commas to separate thousands, lakhs, and crores\n• Don't use 'and' except for decimal parts\n\nExample: 3,14,159\nThree lakh, fourteen thousand, one hundred fifty-nine`,
                      },
                      {
                        id: 210,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "5. Comparing Large Numbers",
                        body: `To compare large numbers:\n1. First, look at the number of digits\n2. If they have the same number of digits, compare from left to right\n3. Use symbols: > (greater than), < (less than), = (equal to)\n\nExamples:\n45,67,890 > 45,67,889\n12,34,567 < 23,45,678`,
                      },
                      {
                        id: 220,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "6. Ordering Large Numbers",
                        body: `To put large numbers in order:\n1. Compare the numbers using the method above\n2. Arrange them from smallest to largest (ascending order) or largest to smallest (descending order)\n\nExample (ascending order):\n12,34,567 < 23,45,678 < 45,67,890`,
                      },
                      {
                        id: 230,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "7. Rounding Large Numbers",
                        body: `Rounding makes large numbers easier to work with:\n1. Identify the place value to round to\n2. Look at the digit to its right\n3. If it's 5 or more, round up; if less than 5, round down\n\nExample: Round 3,456,789 to the nearest lakh\n1. We're rounding to the lakhs place (3rd digit from right)\n2. The digit to its right is 4\n3. Since 4 < 5, we round down\nResult: 3,400,000 or 34 lakh`,
                      },
                      {
                        id: 240,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "8. Estimating with Large Numbers",
                        body: `Estimating is useful when we don't need exact numbers:\n1. Round the numbers to make them easier to work with\n2. Do the calculation with the rounded numbers\n3. Use words like 'about' or 'approximately' with the answer\n\nExample: Estimate 3,456,789 + 2,987,654\nRound both to nearest million: 3,000,000 + 3,000,000\nEstimated sum: about 6,000,000 or approximately 6 million`,
                      },
                      {
                        id: 250,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "9. Simple Calculations with Large Numbers",
                        body: `When adding or subtracting large numbers:\n1. Line up the digits by place value\n2. Start from the right (ones place) and move left\n3. Remember to carry over or borrow when needed\n\nExample:\n  45,67,890\n+ 23,45,678\n-----------\n  69,13,568`,
                      },
                      {
                        id: 260,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "10. Large Numbers in Real Life",
                        body: `We encounter large numbers in many situations:\n• Population: India's population is about 138 crore (1,38,00,00,000)\n• Distance: The Moon is about 3,84,400 km from Earth\n• Money: India's GDP is about ₹232 lakh crore (₹232,00,00,00,00,000)\n• Technology: A terabyte of data is 1,00,00,00,00,000 bytes`,
                      },
                      {
                        id: 270,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "11. Scientific Notation",
                        body: `For very large numbers, we use scientific notation:\n• 10,00,000 = 1 × 10^6\n• 1,00,00,000 = 1 × 10^7\n• 1,00,00,00,000 = 1 × 10^9\n\nThis is useful in science and math for expressing very large or very small numbers efficiently.`,
                      },
                      {
                        id: 280,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "12. Practical Applications",
                        body: `Understanding large numbers helps us:\n• Read news about population, economy, or space exploration\n• Manage personal finances and understand compound interest\n• Appreciate the scale of scientific discoveries\n• Understand environmental issues, like plastic pollution in oceans\n• Interpret data in fields like technology, business, and social sciences`,
                      },
                      {
                        id: 290,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 300,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 310,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 320,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 330,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
              {
                id: 30,
                description: `Simplifying Calculations with Brackets`,
                order: 3,
                title: "Topic 3",
                lessons: [
                  {
                    id: 113,
                    title: "Using Brackets",
                    order: 3,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Solve the expression: 7 + (6 × 5 - 3)",
                        order: 1,
                        difficulty: 1,
                        id: 1300,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "20",
                          },
                          {
                            correct: false,
                            text: "34",
                          },
                          {
                            correct: true,
                            text: "37",
                          },
                          {
                            correct: false,
                            text: "32",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What should be the first operation according to BODMAS in the expression 6 + 18 ÷ 3 × 2 - 4?",
                        order: 2,
                        difficulty: 1,
                        id: 1301,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Addition",
                          },
                          {
                            correct: true,
                            text: "Division",
                          },
                          {
                            correct: false,
                            text: "Multiplication",
                          },
                          {
                            correct: false,
                            text: "Subtraction",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Calculate: 4 + {6 × [5 + (3 - 1)]}",
                        order: 3,
                        difficulty: 1,
                        id: 1302,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "34",
                          },
                          {
                            correct: true,
                            text: "46",
                          },
                          {
                            correct: false,
                            text: "52",
                          },
                          {
                            correct: false,
                            text: "31",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Evaluate: (8 + 2) × (6 ÷ 3)",
                        order: 4,
                        difficulty: 2,
                        id: 1303,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "30",
                          },
                          {
                            correct: true,
                            text: "20",
                          },
                          {
                            correct: false,
                            text: "16",
                          },
                          {
                            correct: false,
                            text: "40",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the result of the expression: 15 - [3 × {2 + (4 - 2)}]",
                        order: 5,
                        difficulty: 2,
                        id: 1304,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "9",
                          },
                          {
                            correct: true,
                            text: "3",
                          },
                          {
                            correct: false,
                            text: "15",
                          },
                          {
                            correct: false,
                            text: "5",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Evaluate: {10 + [2 × (3 + 7)]} - 5",
                        order: 6,
                        difficulty: 2,
                        id: 1305,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "20",
                          },
                          {
                            correct: false,
                            text: "25",
                          },
                          {
                            correct: false,
                            text: "30",
                          },
                          {
                            correct: false,
                            text: "35",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Simplify: 3 + 6 × (5 + 4) ÷ 3 - 7",
                        order: 7,
                        difficulty: 3,
                        id: 1306,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "14",
                          },
                          {
                            correct: true,
                            text: "11",
                          },
                          {
                            correct: false,
                            text: "13",
                          },
                          {
                            correct: false,
                            text: "12",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Evaluate: 12 × (3 + [4 - 2] × 2)",
                        order: 8,
                        difficulty: 3,
                        id: 1307,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "96",
                          },
                          {
                            correct: true,
                            text: "108",
                          },
                          {
                            correct: false,
                            text: "84",
                          },
                          {
                            correct: false,
                            text: "72",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Calculate: 8 × {[5 + (3 × 2)] - 4}",
                        order: 9,
                        difficulty: 3,
                        id: 1308,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "56",
                          },
                          {
                            correct: false,
                            text: "40",
                          },
                          {
                            correct: false,
                            text: "32",
                          },
                          {
                            correct: false,
                            text: "64",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Find the value of 5 + [3 × (12 ÷ 4)]",
                        order: 10,
                        difficulty: 1,
                        id: 1309,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "11",
                          },
                          {
                            correct: true,
                            text: "14",
                          },
                          {
                            correct: false,
                            text: "17",
                          },
                          {
                            correct: false,
                            text: "20",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the result of: 2 × (5 + 3) - 4",
                        order: 11,
                        difficulty: 1,
                        id: 1310,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "12",
                          },
                          {
                            correct: false,
                            text: "14",
                          },
                          {
                            correct: false,
                            text: "10",
                          },
                          {
                            correct: false,
                            text: "8",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Solve: (8 - 3) × (4 + 2)",
                        order: 12,
                        difficulty: 1,
                        id: 1311,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "30",
                          },
                          {
                            correct: true,
                            text: "28",
                          },
                          {
                            correct: false,
                            text: "40",
                          },
                          {
                            correct: false,
                            text: "50",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Evaluate: (6 × 2) + [4 × {2 + (3 - 1)}]",
                        order: 13,
                        difficulty: 2,
                        id: 1312,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "26",
                          },
                          {
                            correct: false,
                            text: "32",
                          },
                          {
                            correct: false,
                            text: "24",
                          },
                          {
                            correct: false,
                            text: "28",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Calculate the value of: 10 - {2 + [3 × (6 - 4)]}",
                        order: 14,
                        difficulty: 2,
                        id: 1313,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "4",
                          },
                          {
                            correct: false,
                            text: "8",
                          },
                          {
                            correct: false,
                            text: "6",
                          },
                          {
                            correct: true,
                            text: "2",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Find the result: (9 ÷ 3) + [8 - {6 - (3 + 2)}]",
                        order: 15,
                        difficulty: 2,
                        id: 1314,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "7",
                          },
                          {
                            correct: false,
                            text: "5",
                          },
                          {
                            correct: false,
                            text: "10",
                          },
                          {
                            correct: false,
                            text: "8",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Evaluate: 20 - [3 + 2 × (8 - 4)]",
                        order: 16,
                        difficulty: 3,
                        id: 1315,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "8",
                          },
                          {
                            correct: false,
                            text: "12",
                          },
                          {
                            correct: false,
                            text: "4",
                          },
                          {
                            correct: false,
                            text: "10",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Simplify: {10 + (6 × 2) - [4 ÷ (1 + 1)]}",
                        order: 17,
                        difficulty: 3,
                        id: 1316,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "21",
                          },
                          {
                            correct: true,
                            text: "22",
                          },
                          {
                            correct: false,
                            text: "24",
                          },
                          {
                            correct: false,
                            text: "20",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Calculate: 15 + [3 × (10 - 5) - {8 + (4 ÷ 2)}]",
                        order: 18,
                        difficulty: 3,
                        id: 1317,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "22",
                          },
                          {
                            correct: false,
                            text: "25",
                          },
                          {
                            correct: true,
                            text: "27",
                          },
                          {
                            correct: false,
                            text: "29",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the value of: 5 × (4 + 3)",
                        order: 19,
                        difficulty: 1,
                        id: 1318,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "21",
                          },
                          {
                            correct: false,
                            text: "30",
                          },
                          {
                            correct: true,
                            text: "35",
                          },
                          {
                            correct: false,
                            text: "40",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Solve: 8 + {2 × (10 - 5)}",
                        order: 20,
                        difficulty: 1,
                        id: 1319,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "18",
                          },
                          {
                            correct: false,
                            text: "20",
                          },
                          {
                            correct: false,
                            text: "30",
                          },
                          {
                            correct: false,
                            text: "28",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Find the result of: 12 - (6 ÷ 2)",
                        order: 21,
                        difficulty: 1,
                        id: 1320,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "10",
                          },
                          {
                            correct: false,
                            text: "9",
                          },
                          {
                            correct: true,
                            text: "8",
                          },
                          {
                            correct: false,
                            text: "6",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Calculate: [20 - 5 × (4 ÷ 2)]",
                        order: 22,
                        difficulty: 2,
                        id: 1321,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "5",
                          },
                          {
                            correct: false,
                            text: "10",
                          },
                          {
                            correct: true,
                            text: "15",
                          },
                          {
                            correct: false,
                            text: "20",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Evaluate: 18 ÷ {2 + (4 × 2) - 3}",
                        order: 23,
                        difficulty: 2,
                        id: 1322,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "2",
                          },
                          {
                            correct: false,
                            text: "3",
                          },
                          {
                            correct: false,
                            text: "4",
                          },
                          {
                            correct: true,
                            text: "6",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Simplify: {30 + [12 ÷ (3 × 2)]} - 4",
                        order: 24,
                        difficulty: 2,
                        id: 1323,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "26",
                          },
                          {
                            correct: true,
                            text: "28",
                          },
                          {
                            correct: false,
                            text: "30",
                          },
                          {
                            correct: false,
                            text: "32",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Find the value of: {[5 + (12 - 3)] × 2} ÷ 7",
                        order: 25,
                        difficulty: 3,
                        id: 1324,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "6",
                          },
                          {
                            correct: false,
                            text: "7",
                          },
                          {
                            correct: true,
                            text: "4",
                          },
                          {
                            correct: false,
                            text: "5",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Calculate: 50 ÷ [10 - (8 - 3)]",
                        order: 26,
                        difficulty: 3,
                        id: 1325,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "6",
                          },
                          {
                            correct: false,
                            text: "10",
                          },
                          {
                            correct: false,
                            text: "8",
                          },
                          {
                            correct: true,
                            text: "5",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Simplify: {100 ÷ (5 × 2)} + [8 - (3 + 2)]",
                        order: 27,
                        difficulty: 3,
                        id: 1326,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "6",
                          },
                          {
                            correct: false,
                            text: "8",
                          },
                          {
                            correct: false,
                            text: "5",
                          },
                          {
                            correct: false,
                            text: "7",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Evaluate: 9 + (3 × 4)",
                        order: 28,
                        difficulty: 1,
                        id: 1327,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "15",
                          },
                          {
                            correct: true,
                            text: "21",
                          },
                          {
                            correct: false,
                            text: "24",
                          },
                          {
                            correct: false,
                            text: "30",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Solve: 7 - (3 + 2)",
                        order: 29,
                        difficulty: 1,
                        id: 1328,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "2",
                          },
                          {
                            correct: false,
                            text: "3",
                          },
                          {
                            correct: false,
                            text: "4",
                          },
                          {
                            correct: false,
                            text: "1",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Find the result of: 10 ÷ (2 + 3)",
                        order: 30,
                        difficulty: 1,
                        id: 1329,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "2",
                          },
                          {
                            correct: false,
                            text: "5",
                          },
                          {
                            correct: false,
                            text: "1",
                          },
                          {
                            correct: false,
                            text: "3",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Calculate: (15 + 5) ÷ (2 × 2)",
                        order: 31,
                        difficulty: 2,
                        id: 1330,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "4",
                          },
                          {
                            correct: true,
                            text: "5",
                          },
                          {
                            correct: false,
                            text: "2.5",
                          },
                          {
                            correct: false,
                            text: "3",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the value of: 12 × {3 - (1 + 1)}",
                        order: 32,
                        difficulty: 2,
                        id: 1331,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "16",
                          },
                          {
                            correct: false,
                            text: "18",
                          },
                          {
                            correct: true,
                            text: "24",
                          },
                          {
                            correct: false,
                            text: "12",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Evaluate: (14 - 7) × {2 + (3 ÷ 1)}",
                        order: 33,
                        difficulty: 2,
                        id: 1332,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "30",
                          },
                          {
                            correct: false,
                            text: "45",
                          },
                          {
                            correct: false,
                            text: "42",
                          },
                          {
                            correct: false,
                            text: "35",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Simplify: {[6 × (9 - 5)] ÷ 3} + 7",
                        order: 34,
                        difficulty: 3,
                        id: 1333,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "15",
                          },
                          {
                            correct: false,
                            text: "16",
                          },
                          {
                            correct: true,
                            text: "17",
                          },
                          {
                            correct: false,
                            text: "18",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Calculate the value of: 20 ÷ {2 + [3 × (7 - 5)]}",
                        order: 35,
                        difficulty: 3,
                        id: 1334,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "4",
                          },
                          {
                            correct: false,
                            text: "2",
                          },
                          {
                            correct: false,
                            text: "5",
                          },
                          {
                            correct: true,
                            text: "3",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Evaluate: {50 + (6 ÷ 2) × 3} ÷ 8",
                        order: 36,
                        difficulty: 3,
                        id: 1335,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "8",
                          },
                          {
                            correct: false,
                            text: "9",
                          },
                          {
                            correct: false,
                            text: "10",
                          },
                          {
                            correct: true,
                            text: "7",
                          },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 340,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "1. Introduction to Brackets",
                        body: `Brackets are symbols used in mathematics to group numbers and operations. They help us solve problems in the correct order and avoid confusion.\n\nCommon types of brackets:\n• ( ) - Round brackets or parentheses\n• [ ] - Square brackets\n• { } - Curly brackets\n\nIn Class 6, we'll focus mainly on round brackets ( ).`,
                      },
                      {
                        id: 350,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "2. Why Do We Use Brackets?",
                        body: `Brackets serve two main purposes:\n1. They group numbers or operations that should be done together.\n2. They change the order in which operations are performed.\n\nFor example:\n• 2 + 3 × 4 = 14 (multiplication is done first)\n• (2 + 3) × 4 = 20 (addition inside brackets is done first)`,
                      },
                      {
                        id: 360,
                        type: contentBlockTypeEnum.enumValues[1],
                        title:
                          "3. Basic Rules for Solving Expressions with Brackets",
                        body: `When solving expressions with brackets, follow these steps:\n1. Always solve what's inside the brackets first.\n2. After solving the brackets, follow the normal order of operations.\n\nExample:\n(10 - 4) + 3 = 6 + 3 = 9`,
                      },
                      {
                        id: 370,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "4. Order of Operations with Brackets (BODMAS)",
                        body: `BODMAS helps us remember the correct order of operations:\nB - Brackets\nO - Of (multiplication implied by 'of')\nD - Division\nM - Multiplication\nA - Addition\nS - Subtraction\n\nRemember: After brackets, division and multiplication have equal priority (solve left to right), and the same for addition and subtraction.`,
                      },
                      {
                        id: 380,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "5. Applying BODMAS with Brackets",
                        body: `Let's apply BODMAS to an expression with brackets:\n\n20 - (5 + 3) × 2\n\nStep 1: Solve inside brackets first\n20 - 8 × 2\n\nStep 2: Multiplication before subtraction\n20 - 16\n\nStep 3: Subtraction\n4\n\nSo, 20 - (5 + 3) × 2 = 4`,
                      },
                      {
                        id: 390,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "6. Nested Brackets",
                        body: `Sometimes, we see brackets inside other brackets. These are called nested brackets.\n\nWhen solving nested brackets:\n1. Start with the innermost brackets and work your way out.\n2. Solve each set of brackets completely before moving to the next.\n\nExample:\n((4 + 2) × 3) - 5 = (6 × 3) - 5 = 18 - 5 = 13`,
                      },
                      {
                        id: 400,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "7. Solving Nested Brackets Step by Step",
                        body: `Let's solve a nested bracket problem step by step:\n\n(10 - (4 + 1)) × 2\n\nStep 1: Solve the innermost brackets\n(10 - 5) × 2\n\nStep 2: Solve the outer brackets\n5 × 2\n\nStep 3: Multiply\n10\n\nSo, (10 - (4 + 1)) × 2 = 10`,
                      },
                      {
                        id: 410,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "8. Using Brackets in Word Problems",
                        body: `Brackets are useful in solving word problems. They help us group operations that should be done together.\n\nExample:\nRam has 5 boxes with 4 chocolates in each. He eats 3 chocolates. How many are left?\nSolution: (5 × 4) - 3 = 20 - 3 = 17 chocolates`,
                      },
                      {
                        id: 420,
                        type: contentBlockTypeEnum.enumValues[1],
                        title:
                          "9. Translating Word Problems into Bracket Expressions",
                        body: `When solving word problems, look for phrases that indicate grouping or order of operations. For example:\n• 'Total of' or 'Sum of' usually means addition in brackets\n• 'Product of' usually means multiplication in brackets\n• 'Difference between' usually means subtraction in brackets\n\nExample:\nFind the difference between the sum of 8 and 6, and the product of 3 and 2.\nTranslation: (8 + 6) - (3 × 2) = 14 - 6 = 8`,
                      },
                      {
                        id: 430,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "10. Brackets with Negative Numbers",
                        body: `When we have negative numbers inside brackets, we need to be extra careful.\n\nRules:\n1. If there's a minus sign before the brackets, it changes the sign of everything inside the brackets.\n2. If there's a plus sign before the brackets, the signs inside remain the same.\n\nExamples:\n• -(3 - 5) = -3 + 5 = 2\n• +(3 - 5) = 3 - 5 = -2`,
                      },
                      {
                        id: 440,
                        type: contentBlockTypeEnum.enumValues[1],
                        title:
                          "11. Solving Expressions with Negative Numbers and Brackets",
                        body: `Let's solve an expression with negative numbers and brackets:\n\n10 - (-3 + 5)\n\nStep 1: Solve inside the brackets\n10 - (2)\n\nStep 2: Subtract\n10 - 2 = 8\n\nSo, 10 - (-3 + 5) = 8`,
                      },
                      {
                        id: 450,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 460,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 470,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 480,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 490,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
              {
                id: 40,
                description: `Reading and Writing Roman Numerals`,
                order: 4,
                title: "Topic 4",
                lessons: [
                  {
                    id: 114,
                    title: "Reading and Writing Roman Numerals",
                    order: 4,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following is the Roman numeral for 10?",
                        order: 1,
                        difficulty: 1,
                        id: 1400,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "V",
                          },
                          {
                            correct: true,
                            text: "X",
                          },
                          {
                            correct: false,
                            text: "L",
                          },
                          {
                            correct: false,
                            text: "I",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the Roman numeral for 5?",
                        order: 2,
                        difficulty: 1,
                        id: 1401,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "V",
                          },
                          {
                            correct: false,
                            text: "X",
                          },
                          {
                            correct: false,
                            text: "L",
                          },
                          {
                            correct: false,
                            text: "D",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Identify the Roman numeral for 50:",
                        order: 3,
                        difficulty: 1,
                        id: 1402,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "L",
                          },
                          {
                            correct: false,
                            text: "V",
                          },
                          {
                            correct: false,
                            text: "X",
                          },
                          {
                            correct: false,
                            text: "D",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following correctly represents the number 15 in Roman numerals?",
                        order: 4,
                        difficulty: 2,
                        id: 1403,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "XV",
                          },
                          {
                            correct: false,
                            text: "XX",
                          },
                          {
                            correct: false,
                            text: "XL",
                          },
                          {
                            correct: false,
                            text: "VV",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Convert the number 29 to Roman numerals:",
                        order: 5,
                        difficulty: 2,
                        id: 1404,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "XXXIX",
                          },
                          {
                            correct: true,
                            text: "XXIX",
                          },
                          {
                            correct: false,
                            text: "XXVII",
                          },
                          {
                            correct: false,
                            text: "IVXX",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Identify the Roman numeral for 40:",
                        order: 6,
                        difficulty: 2,
                        id: 1405,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "XL",
                          },
                          {
                            correct: false,
                            text: "LX",
                          },
                          {
                            correct: false,
                            text: "XX",
                          },
                          {
                            correct: false,
                            text: "IVX",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the Roman numeral for 96?",
                        order: 7,
                        difficulty: 3,
                        id: 1406,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "CXVI",
                          },
                          {
                            correct: true,
                            text: "XCVI",
                          },
                          {
                            correct: false,
                            text: "LXVI",
                          },
                          {
                            correct: false,
                            text: "VIC",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Convert the number 144 to Roman numerals:",
                        order: 8,
                        difficulty: 3,
                        id: 1407,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "CLXXIV",
                          },
                          {
                            correct: true,
                            text: "CXLIV",
                          },
                          {
                            correct: false,
                            text: "LXLIV",
                          },
                          {
                            correct: false,
                            text: "CLXIV",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which number is indicated by the Roman numeral LXIX?",
                        order: 9,
                        difficulty: 3,
                        id: 1408,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "59",
                          },
                          {
                            correct: true,
                            text: "69",
                          },
                          {
                            correct: false,
                            text: "79",
                          },
                          {
                            correct: false,
                            text: "89",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the Roman numeral for 100?",
                        order: 10,
                        difficulty: 1,
                        id: 1409,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "X",
                          },
                          {
                            correct: false,
                            text: "L",
                          },
                          {
                            correct: true,
                            text: "C",
                          },
                          {
                            correct: false,
                            text: "D",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "The Roman numeral for 20 is:",
                        order: 11,
                        difficulty: 1,
                        id: 1410,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "XX",
                          },
                          {
                            correct: false,
                            text: "XXX",
                          },
                          {
                            correct: false,
                            text: "XV",
                          },
                          {
                            correct: false,
                            text: "XII",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Convert 6 into Roman numerals:",
                        order: 12,
                        difficulty: 1,
                        id: 1411,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "IV",
                          },
                          {
                            correct: true,
                            text: "VI",
                          },
                          {
                            correct: false,
                            text: "II",
                          },
                          {
                            correct: false,
                            text: "XI",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Identify the Roman numeral for 70:",
                        order: 13,
                        difficulty: 2,
                        id: 1412,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "LXX",
                          },
                          {
                            correct: false,
                            text: "XX",
                          },
                          {
                            correct: false,
                            text: "LX",
                          },
                          {
                            correct: false,
                            text: "XXX",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the Roman numeral for 24?",
                        order: 14,
                        difficulty: 2,
                        id: 1413,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "XXIV",
                          },
                          {
                            correct: false,
                            text: "XIV",
                          },
                          {
                            correct: false,
                            text: "XXVI",
                          },
                          {
                            correct: false,
                            text: "XXV",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Convert 33 to Roman numerals:",
                        order: 15,
                        difficulty: 2,
                        id: 1414,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "XXVII",
                          },
                          {
                            correct: false,
                            text: "XXXIV",
                          },
                          {
                            correct: true,
                            text: "XXXIII",
                          },
                          {
                            correct: false,
                            text: "XXXII",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Which of these is the Roman numeral for 81?",
                        order: 16,
                        difficulty: 3,
                        id: 1415,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "LXXXI",
                          },
                          {
                            correct: false,
                            text: "LXXX",
                          },
                          {
                            correct: false,
                            text: "LXI",
                          },
                          {
                            correct: false,
                            text: "LXII",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Convert 208 to Roman numerals:",
                        order: 17,
                        difficulty: 3,
                        id: 1416,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "DDVIII",
                          },
                          {
                            correct: true,
                            text: "CCVIII",
                          },
                          {
                            correct: false,
                            text: "CCIIX",
                          },
                          {
                            correct: false,
                            text: "CCVIII",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Identify the Roman numeral MCMXCIX:",
                        order: 18,
                        difficulty: 3,
                        id: 1417,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "1989",
                          },
                          {
                            correct: true,
                            text: "1999",
                          },
                          {
                            correct: false,
                            text: "2009",
                          },
                          {
                            correct: false,
                            text: "2019",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Convert 3 into Roman numerals:",
                        order: 19,
                        difficulty: 1,
                        id: 1418,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "I",
                          },
                          {
                            correct: false,
                            text: "II",
                          },
                          {
                            correct: true,
                            text: "III",
                          },
                          {
                            correct: false,
                            text: "IV",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "The Roman numeral for 8 is:",
                        order: 20,
                        difficulty: 1,
                        id: 1419,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "XVIII",
                          },
                          {
                            correct: true,
                            text: "VIII",
                          },
                          {
                            correct: false,
                            text: "VII",
                          },
                          {
                            correct: false,
                            text: "VIV",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Convert 2 to Roman numerals:",
                        order: 21,
                        difficulty: 1,
                        id: 1420,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "I",
                          },
                          {
                            correct: true,
                            text: "II",
                          },
                          {
                            correct: false,
                            text: "IV",
                          },
                          {
                            correct: false,
                            text: "V",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Identify the Roman numeral for 35:",
                        order: 22,
                        difficulty: 2,
                        id: 1421,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "XXXV",
                          },
                          {
                            correct: false,
                            text: "XXX",
                          },
                          {
                            correct: false,
                            text: "XXV",
                          },
                          {
                            correct: false,
                            text: "XXXIV",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the Roman numeral for 49?",
                        order: 23,
                        difficulty: 2,
                        id: 1422,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "XLIX",
                          },
                          {
                            correct: false,
                            text: "XXXIX",
                          },
                          {
                            correct: false,
                            text: "XXXXIV",
                          },
                          {
                            correct: false,
                            text: "XLV",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Convert 47 to Roman numerals:",
                        order: 24,
                        difficulty: 2,
                        id: 1423,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "XLVII",
                          },
                          {
                            correct: false,
                            text: "XXXVII",
                          },
                          {
                            correct: false,
                            text: "XXVII",
                          },
                          {
                            correct: false,
                            text: "XVII",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the Roman numeral for 99?",
                        order: 25,
                        difficulty: 3,
                        id: 1424,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "LXXXXIX",
                          },
                          {
                            correct: false,
                            text: "CIX",
                          },
                          {
                            correct: true,
                            text: "XCIX",
                          },
                          {
                            correct: false,
                            text: "XLIX",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Convert 176 to Roman numerals:",
                        order: 26,
                        difficulty: 3,
                        id: 1425,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "CLXXVI",
                          },
                          {
                            correct: false,
                            text: "DCCLX",
                          },
                          {
                            correct: false,
                            text: "LXXVI",
                          },
                          {
                            correct: false,
                            text: "CXVI",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which Roman numeral represents the number 246?",
                        order: 27,
                        difficulty: 3,
                        id: 1426,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "CCLVII",
                          },
                          {
                            correct: true,
                            text: "CCXLVI",
                          },
                          {
                            correct: false,
                            text: "CCVII",
                          },
                          {
                            correct: false,
                            text: "XXVI",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Convert 4 into Roman numerals:",
                        order: 28,
                        difficulty: 1,
                        id: 1427,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "I",
                          },
                          {
                            correct: false,
                            text: "II",
                          },
                          {
                            correct: false,
                            text: "III",
                          },
                          {
                            correct: true,
                            text: "IV",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "The Roman numeral for 9 is:",
                        order: 29,
                        difficulty: 1,
                        id: 1428,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "VIII",
                          },
                          {
                            correct: true,
                            text: "IX",
                          },
                          {
                            correct: false,
                            text: "VII",
                          },
                          {
                            correct: false,
                            text: "XI",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Convert 7 to Roman numerals:",
                        order: 30,
                        difficulty: 1,
                        id: 1429,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "III",
                          },
                          {
                            correct: true,
                            text: "VII",
                          },
                          {
                            correct: false,
                            text: "VIII",
                          },
                          {
                            correct: false,
                            text: "IX",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Identify the Roman numeral for 45:",
                        order: 31,
                        difficulty: 2,
                        id: 1430,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "XL",
                          },
                          {
                            correct: false,
                            text: "IX",
                          },
                          {
                            correct: true,
                            text: "XLV",
                          },
                          {
                            correct: false,
                            text: "XLVI",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the Roman numeral for 22:",
                        order: 32,
                        difficulty: 2,
                        id: 1431,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "X",
                          },
                          {
                            correct: false,
                            text: "XII",
                          },
                          {
                            correct: false,
                            text: "XLII",
                          },
                          {
                            correct: true,
                            text: "XXII",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Convert 38 to Roman numerals:",
                        order: 33,
                        difficulty: 2,
                        id: 1432,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "XXXVII",
                          },
                          {
                            correct: false,
                            text: "LXXVIII",
                          },
                          {
                            correct: true,
                            text: "XXXVIII",
                          },
                          {
                            correct: false,
                            text: "LXXXIII",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Simplify: Which of these is the Roman numeral for 87:",
                        order: 34,
                        difficulty: 3,
                        id: 1433,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "XXXVII",
                          },
                          {
                            correct: true,
                            text: "LXXXVII",
                          },
                          {
                            correct: false,
                            text: "XLVII",
                          },
                          {
                            correct: false,
                            text: "XXVII",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Convert 178 to Roman numerals:",
                        order: 35,
                        difficulty: 3,
                        id: 1434,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "CXVIII",
                          },
                          {
                            correct: true,
                            text: "CLXXVIII",
                          },
                          {
                            correct: false,
                            text: "CLXVIII",
                          },
                          {
                            correct: false,
                            text: "CLVIII",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Identify the Roman numeral CXLI:",
                        order: 36,
                        difficulty: 3,
                        id: 1435,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "151",
                          },
                          {
                            correct: false,
                            text: "161",
                          },
                          {
                            correct: true,
                            text: "141",
                          },
                          {
                            correct: false,
                            text: "131",
                          },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 500,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "1. Introduction to Roman Numerals",
                        body: `Roman numerals are a number system that originated in ancient Rome. They use letters instead of digits to represent numbers. We still see Roman numerals today in many places, such as:\n\n• Clock faces\n• Chapter numbers in books\n• Movie sequel titles\n• Names of kings and queens\n\nLearning Roman numerals helps us read these numbers and understand their historical importance.`,
                      },
                      {
                        id: 510,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "2. Basic Roman Numeral Symbols",
                        body: `Let's start with the seven basic symbols used in Roman numerals:\n\nI = 1\nV = 5\nX = 10\nL = 50\nC = 100\nD = 500\nM = 1000\n\nThese symbols are the building blocks for all Roman numerals. We'll learn how to combine them to create different numbers.`,
                      },
                      {
                        id: 520,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "3. Writing Numbers 1 to 10 in Roman Numerals",
                        body: `Now, let's see how to write the numbers 1 to 10 using Roman numerals:\n\n1 = I\n2 = II\n3 = III\n4 = IV\n5 = V\n6 = VI\n7 = VII\n8 = VIII\n9 = IX\n10 = X\n\nNotice how we use combinations of I, V, and X to represent these numbers.`,
                      },
                      {
                        id: 530,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "4. Basic Rules for Writing Roman Numerals",
                        body: `There are three main rules for writing Roman numerals:\n\n1. Repetition: A symbol can be repeated up to three times to add its value.\n   Example: III = 3, XX = 20\n\n2. Addition: When a symbol is placed after another of equal or greater value, add their values.\n   Example: VI = 6 (5 + 1), XV = 15 (10 + 5)\n\n3. Subtraction: When a symbol is placed before one of greater value, subtract the smaller value.\n   Example: IV = 4 (5 - 1), IX = 9 (10 - 1)`,
                      },
                      {
                        id: 540,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "5. Writing Numbers 11 to 39 in Roman Numerals",
                        body: `Let's extend our knowledge to write numbers from 11 to 39:\n\n11 = XI\n12 = XII\n13 = XIII\n14 = XIV\n15 = XV\n16 = XVI\n...\n20 = XX\n21 = XXI\n...\n30 = XXX\n31 = XXXI\n...\n39 = XXXIX\n\nNotice how we combine X with the symbols we learned earlier to represent these numbers.`,
                      },
                      {
                        id: 550,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "6. Using L (50) in Roman Numerals",
                        body: `Now let's introduce L, which represents 50. We can use it to write numbers from 40 to 89:\n\n40 = XL (50 - 10)\n50 = L\n51 = LI\n60 = LX\n70 = LXX\n80 = LXXX\n89 = LXXXIX\n\nRemember, when a smaller value comes before a larger one, we subtract.`,
                      },
                      {
                        id: 560,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "7. Introducing C (100) in Roman Numerals",
                        body: `C represents 100 in Roman numerals. We can use it to write numbers from 90 to 399:\n\n90 = XC (100 - 10)\n100 = C\n101 = CI\n150 = CL\n200 = CC\n300 = CCC\n399 = CCCXCIX\n\nNotice how we combine C with the symbols we've already learned to represent these larger numbers.`,
                      },
                      {
                        id: 570,
                        type: contentBlockTypeEnum.enumValues[1],
                        title:
                          "8. Using D (500) and M (1000) in Roman Numerals",
                        body: `Finally, let's introduce D (500) and M (1000) to write even larger numbers:\n\n400 = CD (500 - 100)\n500 = D\n600 = DC\n900 = CM (1000 - 100)\n1000 = M\n1500 = MD\n2000 = MM\n\nThese symbols allow us to represent numbers up to 3999 (MMMCMXCIX) in Roman numerals.`,
                      },
                      {
                        id: 580,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "9. Reading Roman Numerals",
                        body: `To read Roman numerals:\n1. Start from the left and move right.\n2. Add the values of symbols that are the same or decreasing in value.\n3. Subtract when a symbol is followed by one of greater value.\n\nExample: MCMLIV\nM = 1000\nCM = 900 (1000 - 100)\nL = 50\nIV = 4 (5 - 1)\n\nTotal: 1000 + 900 + 50 + 4 = 1954`,
                      },
                      {
                        id: 590,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "10. Roman Numerals in Everyday Life",
                        body: `Roman numerals are still used in various contexts today:\n\n• Clock faces: Many clocks use Roman numerals for hours.\n• Book chapters: Some books use Roman numerals for chapter numbers.\n• Movie sequels: Films like 'Star Wars IV' use Roman numerals.\n• Sports events: The Super Bowl uses Roman numerals (e.g., Super Bowl LV).\n• Monarchs' names: Kings and queens are often numbered with Roman numerals (e.g., Elizabeth II).`,
                      },
                      {
                        id: 600,
                        type: contentBlockTypeEnum.enumValues[1],
                        title:
                          "11. Converting Between Roman and Hindu-Arabic Numerals",
                        body: `To convert from Roman to Hindu-Arabic numerals:\n1. Break the Roman numeral into symbols.\n2. Convert each symbol to its Hindu-Arabic value.\n3. Apply addition and subtraction rules.\n4. Add up the results.\n\nTo convert from Hindu-Arabic to Roman numerals:\n1. Break the number into thousands, hundreds, tens, and ones.\n2. Convert each part to Roman numerals.\n3. Combine the parts.`,
                      },
                      {
                        id: 610,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 620,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 630,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 640,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 650,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        subjectId: 2,
        title: "Science",
        imageSrc: "/man.svg",
        chapters: [
          {
            id: 21,
            description: `Components of Food`,
            order: 1,
            title: "Chapter 1",
            topics: [
              {
                id: 1010,
                description: `What do different food items contain?`,
                order: 1,
                title: "Topic 1",
                lessons: [
                  {
                    id: 211,
                    title: "What do different food items contain?",
                    order: 1,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient is abundantly found in rice and wheat?",
                        order: 1,
                        difficulty: 1,
                        id: 7824,
                        challengeOptions: [
                          { correct: false, text: "Proteins" },
                          { correct: false, text: "Fats" },
                          { correct: true, text: "Carbohydrates" },
                          { correct: false, text: "Vitamins" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the primary nutrient found in dal (lentils)?",
                        order: 2,
                        difficulty: 2,
                        id: 3492,
                        challengeOptions: [
                          { correct: false, text: "Carbohydrates" },
                          { correct: true, text: "Proteins" },
                          { correct: false, text: "Fats" },
                          { correct: false, text: "Vitamins" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Which of these foods is rich in fats?",
                        order: 3,
                        difficulty: 1,
                        id: 5963,
                        challengeOptions: [
                          { correct: false, text: "Rice" },
                          { correct: false, text: "Dal" },
                          { correct: true, text: "Ghee" },
                          { correct: false, text: "Spinach" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which vitamin is found in abundant quantities in citrus fruits like oranges?",
                        order: 4,
                        difficulty: 2,
                        id: 2235,
                        challengeOptions: [
                          { correct: false, text: "Vitamin A" },
                          { correct: false, text: "Vitamin B" },
                          { correct: true, text: "Vitamin C" },
                          { correct: false, text: "Vitamin D" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which mineral is found in good quantities in milk and milk products?",
                        order: 5,
                        difficulty: 3,
                        id: 8766,
                        challengeOptions: [
                          { correct: false, text: "Iron" },
                          { correct: false, text: "Iodine" },
                          { correct: true, text: "Calcium" },
                          { correct: false, text: "Sodium" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these foods is a good source of dietary fiber?",
                        order: 6,
                        difficulty: 1,
                        id: 2469,
                        challengeOptions: [
                          { correct: false, text: "Milk" },
                          { correct: false, text: "Eggs" },
                          { correct: true, text: "Whole grains" },
                          { correct: false, text: "Butter" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient is found in large quantities in eggs?",
                        order: 7,
                        difficulty: 2,
                        id: 1358,
                        challengeOptions: [
                          { correct: false, text: "Carbohydrates" },
                          { correct: true, text: "Proteins" },
                          { correct: false, text: "Fiber" },
                          { correct: false, text: "Vitamin C" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these foods contains all major nutrients in good proportions?",
                        order: 8,
                        difficulty: 3,
                        id: 9877,
                        challengeOptions: [
                          { correct: false, text: "Rice" },
                          { correct: false, text: "Apple" },
                          { correct: true, text: "Egg" },
                          { correct: false, text: "Oil" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the main nutrient found in cooking oils?",
                        order: 9,
                        difficulty: 1,
                        id: 3580,
                        challengeOptions: [
                          { correct: false, text: "Proteins" },
                          { correct: false, text: "Carbohydrates" },
                          { correct: true, text: "Fats" },
                          { correct: false, text: "Vitamins" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Which of these foods is rich in Vitamin A?",
                        order: 10,
                        difficulty: 2,
                        id: 2581,
                        challengeOptions: [
                          { correct: false, text: "Rice" },
                          { correct: true, text: "Carrots" },
                          { correct: false, text: "Bread" },
                          { correct: false, text: "Fish" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient is found in significant amounts in both plant and animal-based foods?",
                        order: 11,
                        difficulty: 3,
                        id: 7531,
                        challengeOptions: [
                          { correct: false, text: "Carbohydrates" },
                          { correct: false, text: "Fats" },
                          { correct: true, text: "Proteins" },
                          { correct: false, text: "Fiber" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the primary nutrient found in sugarcane and honey?",
                        order: 12,
                        difficulty: 1,
                        id: 6420,
                        challengeOptions: [
                          { correct: false, text: "Proteins" },
                          { correct: false, text: "Fats" },
                          { correct: true, text: "Carbohydrates" },
                          { correct: false, text: "Vitamins" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these foods is a good source of iron?",
                        order: 13,
                        difficulty: 2,
                        id: 9753,
                        challengeOptions: [
                          { correct: false, text: "Milk" },
                          { correct: true, text: "Spinach" },
                          { correct: false, text: "Rice" },
                          { correct: false, text: "Potato" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which vitamin is found in good quantities in fish liver oil?",
                        order: 14,
                        difficulty: 3,
                        id: 8642,
                        challengeOptions: [
                          { correct: true, text: "Vitamin A" },
                          { correct: false, text: "Vitamin B" },
                          { correct: false, text: "Vitamin C" },
                          { correct: false, text: "Vitamin E" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these foods contains the highest amount of water?",
                        order: 15,
                        difficulty: 1,
                        id: 5314,
                        challengeOptions: [
                          { correct: false, text: "Bread" },
                          { correct: false, text: "Rice" },
                          { correct: true, text: "Watermelon" },
                          { correct: false, text: "Potato" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What nutrient is predominantly found in meat and fish?",
                        order: 16,
                        difficulty: 2,
                        id: 4206,
                        challengeOptions: [
                          { correct: false, text: "Carbohydrates" },
                          { correct: true, text: "Proteins" },
                          { correct: false, text: "Fiber" },
                          { correct: false, text: "Vitamin C" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these foods contains a good amount of both proteins and carbohydrates?",
                        order: 17,
                        difficulty: 3,
                        id: 3097,
                        challengeOptions: [
                          { correct: false, text: "Ghee" },
                          { correct: false, text: "Spinach" },
                          { correct: true, text: "Soybean" },
                          { correct: false, text: "Sugar" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient is found in large quantities in nuts like almonds and walnuts?",
                        order: 18,
                        difficulty: 1,
                        id: 2185,
                        challengeOptions: [
                          { correct: false, text: "Carbohydrates" },
                          { correct: false, text: "Proteins" },
                          { correct: true, text: "Fats" },
                          { correct: false, text: "Vitamin C" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these foods is a good source of iodine?",
                        order: 19,
                        difficulty: 2,
                        id: 1073,
                        challengeOptions: [
                          { correct: true, text: "Seafood" },
                          { correct: false, text: "Apples" },
                          { correct: false, text: "Wheat" },
                          { correct: false, text: "Milk" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient is found in higher quantities in fruit juices compared to whole fruits?",
                        order: 20,
                        difficulty: 3,
                        id: 6951,
                        challengeOptions: [
                          { correct: false, text: "Fiber" },
                          { correct: false, text: "Vitamins" },
                          { correct: false, text: "Minerals" },
                          { correct: true, text: "Sugar (Carbohydrates)" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the main nutrient found in butter?",
                        order: 21,
                        difficulty: 1,
                        id: 5842,
                        challengeOptions: [
                          { correct: false, text: "Proteins" },
                          { correct: false, text: "Carbohydrates" },
                          { correct: true, text: "Fats" },
                          { correct: false, text: "Vitamins" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these foods contains a significant amount of Vitamin K?",
                        order: 22,
                        difficulty: 2,
                        id: 4731,
                        challengeOptions: [
                          { correct: false, text: "Oranges" },
                          { correct: true, text: "Green leafy vegetables" },
                          { correct: false, text: "Rice" },
                          { correct: false, text: "Milk" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient is found in higher quantities in sprouted seeds compared to unsprouted seeds?",
                        order: 23,
                        difficulty: 3,
                        id: 3620,
                        challengeOptions: [
                          { correct: false, text: "Fats" },
                          { correct: false, text: "Carbohydrates" },
                          { correct: false, text: "Proteins" },
                          { correct: true, text: "Vitamins" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Which of these foods is rich in Vitamin C?",
                        order: 24,
                        difficulty: 1,
                        id: 2509,
                        challengeOptions: [
                          { correct: false, text: "Rice" },
                          { correct: false, text: "Bread" },
                          { correct: true, text: "Amla (Indian gooseberry)" },
                          { correct: false, text: "Milk" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the primary nutrient found in jaggery (gur)?",
                        order: 25,
                        difficulty: 2,
                        id: 1398,
                        challengeOptions: [
                          { correct: false, text: "Proteins" },
                          { correct: false, text: "Fats" },
                          { correct: true, text: "Carbohydrates" },
                          { correct: false, text: "Vitamins" },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 1010,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Introduction to Food Components",
                        body: `Have you ever wondered why we eat different types of food? It's because our body needs various substances to stay healthy and grow. These substances are called nutrients, and they are the components of our food.`,
                      },
                      {
                        id: 1020,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "The Main Nutrients",
                        body: `There are six main types of nutrients that our body needs:\n\n1. Carbohydrates\n2. Proteins\n3. Fats\n4. Vitamins\n5. Minerals\n6. Water\n\nEach of these nutrients has a special job in keeping us healthy.`,
                      },
                      {
                        id: 1030,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Carbohydrates: Our Energy Source",
                        body: `Carbohydrates are like fuel for our body. They give us energy to play, study, and do all our daily activities. We can find carbohydrates in foods like:\n\n• Rice\n• Bread\n• Potatoes\n• Cereals`,
                      },
                      {
                        id: 1040,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Proteins: The Body Builders",
                        body: `Proteins help our body grow and repair itself. They are like the building blocks for our muscles, skin, and hair. We can find proteins in:\n\n• Eggs\n• Milk\n• Pulses (like dal)\n• Fish and meat`,
                      },
                      {
                        id: 1050,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Fats: Energy Storage and Protection",
                        body: `Fats store energy for our body. They also help protect our organs and keep us warm. We can find fats in:\n\n• Butter\n• Oil\n• Nuts\n• Cheese`,
                      },
                      {
                        id: 1070,
                        type: contentBlockTypeEnum.enumValues[1],
                        title:
                          "Vitamins and Minerals: The Protective Nutrients",
                        body: `Vitamins and minerals are needed in small quantities, but they're very important. They help our body fight diseases and stay healthy. We can find them in:\n\n• Fruits (like oranges, apples)\n• Vegetables (like carrots, spinach)\n• Milk\n• Eggs`,
                      },
                      {
                        id: 1080,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Water: The Essential Nutrient",
                        body: `Water is also a nutrient! It's found in all parts of our body and is essential for life. We get water from:\n\n• Drinking water\n• Juices\n• Fruits and vegetables\n• Milk`,
                      },
                      {
                        id: 1090,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Foods Contain Multiple Nutrients",
                        body: `It's important to remember that most foods contain more than one nutrient. For example:\n\n• Milk has proteins, fats, and calcium (a mineral)\n• An apple has carbohydrates, vitamins, and water\n• An egg has proteins and fats`,
                      },
                      {
                        id: 1110,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1120,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1130,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1140,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1150,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
              {
                id: 1020,
                description: `What do Various Nutrients do for our Body?`,
                order: 2,
                title: "Topic 2",
                lessons: [
                  {
                    id: 212,
                    title: "What do various nutrients do for our body?",
                    order: 2,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the primary function of carbohydrates in our body?",
                        order: 1,
                        difficulty: 1,
                        id: 782300,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Building muscles",
                          },
                          {
                            correct: true,
                            text: "Providing energy",
                          },
                          {
                            correct: false,
                            text: "Protecting against diseases",
                          },
                          {
                            correct: false,
                            text: "Regulating body temperature",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is NOT a function of proteins in our body?",
                        order: 2,
                        difficulty: 2,
                        id: 349100,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Growth and repair of tissues",
                          },
                          {
                            correct: false,
                            text: "Forming enzymes",
                          },
                          {
                            correct: true,
                            text: "Providing quick energy",
                          },
                          {
                            correct: false,
                            text: "Building muscles",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What do fats do in our body?",
                        order: 3,
                        difficulty: 1,
                        id: 596200,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Produce red blood cells",
                          },
                          {
                            correct: false,
                            text: "Form bones",
                          },
                          {
                            correct: true,
                            text: "Provide insulation",
                          },
                          {
                            correct: false,
                            text: "Create enzymes",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient helps in the absorption of calcium and phosphorus?",
                        order: 4,
                        difficulty: 2,
                        id: 123400,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Vitamin A",
                          },
                          {
                            correct: false,
                            text: "Vitamin B",
                          },
                          {
                            correct: false,
                            text: "Vitamin C",
                          },
                          {
                            correct: true,
                            text: "Vitamin D",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the role of iron in our body?",
                        order: 5,
                        difficulty: 3,
                        id: 876500,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Strengthening bones",
                          },
                          {
                            correct: false,
                            text: "Improving eyesight",
                          },
                          {
                            correct: true,
                            text: "Carrying oxygen in blood",
                          },
                          {
                            correct: false,
                            text: "Regulating body temperature",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the main function of dietary fiber?",
                        order: 6,
                        difficulty: 1,
                        id: 246800,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Providing energy",
                          },
                          {
                            correct: false,
                            text: "Building muscles",
                          },
                          {
                            correct: true,
                            text: "Aiding in digestion",
                          },
                          {
                            correct: false,
                            text: "Producing hormones",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which vitamin is important for maintaining healthy skin and good eyesight?",
                        order: 7,
                        difficulty: 2,
                        id: 135700,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "Vitamin A",
                          },
                          {
                            correct: false,
                            text: "Vitamin B",
                          },
                          {
                            correct: false,
                            text: "Vitamin C",
                          },
                          {
                            correct: false,
                            text: "Vitamin D",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the function of iodine in our body?",
                        order: 8,
                        difficulty: 3,
                        id: 987600,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Strengthening bones",
                          },
                          {
                            correct: true,
                            text: "Proper functioning of the thyroid gland",
                          },
                          {
                            correct: false,
                            text: "Improving digestion",
                          },
                          {
                            correct: false,
                            text: "Building muscles",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the primary function of water in our body?",
                        order: 9,
                        difficulty: 1,
                        id: 357900,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Providing energy",
                          },
                          {
                            correct: false,
                            text: "Building muscles",
                          },
                          {
                            correct: true,
                            text: "Regulating body temperature",
                          },
                          {
                            correct: false,
                            text: "Producing hormones",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient is essential for blood clotting?",
                        order: 10,
                        difficulty: 2,
                        id: 258000,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Vitamin A",
                          },
                          {
                            correct: false,
                            text: "Vitamin C",
                          },
                          {
                            correct: false,
                            text: "Vitamin E",
                          },
                          {
                            correct: true,
                            text: "Vitamin K",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the role of calcium in our body?",
                        order: 11,
                        difficulty: 3,
                        id: 113600,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Carrying oxygen in blood",
                          },
                          {
                            correct: false,
                            text: "Improving eyesight",
                          },
                          {
                            correct: true,
                            text: "Strengthening bones and teeth",
                          },
                          {
                            correct: false,
                            text: "Aiding in digestion",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Which nutrient helps in healing wounds?",
                        order: 12,
                        difficulty: 1,
                        id: 224700,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Carbohydrates",
                          },
                          {
                            correct: false,
                            text: "Proteins",
                          },
                          {
                            correct: false,
                            text: "Fats",
                          },
                          {
                            correct: true,
                            text: "Vitamin C",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the function of Vitamin B complex in our body?",
                        order: 13,
                        difficulty: 2,
                        id: 335800,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Improving eyesight",
                          },
                          {
                            correct: false,
                            text: "Strengthening bones",
                          },
                          {
                            correct: true,
                            text: "Helping in energy release from food",
                          },
                          {
                            correct: false,
                            text: "Regulating body temperature",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient is important for the formation of hemoglobin?",
                        order: 14,
                        difficulty: 3,
                        id: 446900,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Calcium",
                          },
                          {
                            correct: true,
                            text: "Iron",
                          },
                          {
                            correct: false,
                            text: "Iodine",
                          },
                          {
                            correct: false,
                            text: "Vitamin D",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the main function of Vitamin C in our body?",
                        order: 15,
                        difficulty: 1,
                        id: 558000,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Providing energy",
                          },
                          {
                            correct: false,
                            text: "Building muscles",
                          },
                          {
                            correct: true,
                            text: "Protecting against infections",
                          },
                          {
                            correct: false,
                            text: "Regulating body temperature",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient is important for proper nerve function?",
                        order: 16,
                        difficulty: 2,
                        id: 669100,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Carbohydrates",
                          },
                          {
                            correct: false,
                            text: "Fats",
                          },
                          {
                            correct: false,
                            text: "Proteins",
                          },
                          {
                            correct: true,
                            text: "Potassium",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the role of phosphorus in our body?",
                        order: 17,
                        difficulty: 3,
                        id: 780200,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Improving eyesight",
                          },
                          {
                            correct: false,
                            text: "Aiding in digestion",
                          },
                          {
                            correct: true,
                            text: "Formation of bones and teeth",
                          },
                          {
                            correct: false,
                            text: "Producing red blood cells",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient provides the most energy per gram?",
                        order: 18,
                        difficulty: 1,
                        id: 891300,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Carbohydrates",
                          },
                          {
                            correct: false,
                            text: "Proteins",
                          },
                          {
                            correct: true,
                            text: "Fats",
                          },
                          {
                            correct: false,
                            text: "Vitamins",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the function of Vitamin E in our body?",
                        order: 19,
                        difficulty: 2,
                        id: 1002400,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Strengthening bones",
                          },
                          {
                            correct: false,
                            text: "Improving digestion",
                          },
                          {
                            correct: true,
                            text: "Acting as an antioxidant",
                          },
                          {
                            correct: false,
                            text: "Producing red blood cells",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient is essential for the synthesis of thyroid hormones?",
                        order: 20,
                        difficulty: 3,
                        id: 103500,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Calcium",
                          },
                          {
                            correct: false,
                            text: "Iron",
                          },
                          {
                            correct: true,
                            text: "Iodine",
                          },
                          {
                            correct: false,
                            text: "Vitamin A",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the primary function of proteins in our body?",
                        order: 21,
                        difficulty: 1,
                        id: 204500,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Providing energy",
                          },
                          {
                            correct: true,
                            text: "Building and repairing tissues",
                          },
                          {
                            correct: false,
                            text: "Storing vitamins",
                          },
                          {
                            correct: false,
                            text: "Regulating body temperature",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient helps in the absorption of iron in our body?",
                        order: 22,
                        difficulty: 2,
                        id: 305500,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Vitamin A",
                          },
                          {
                            correct: false,
                            text: "Vitamin B",
                          },
                          {
                            correct: true,
                            text: "Vitamin C",
                          },
                          {
                            correct: false,
                            text: "Vitamin D",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the role of zinc in our body?",
                        order: 23,
                        difficulty: 3,
                        id: 406500,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Improving eyesight",
                          },
                          {
                            correct: false,
                            text: "Strengthening bones",
                          },
                          {
                            correct: true,
                            text: "Aiding in wound healing and immune function",
                          },
                          {
                            correct: false,
                            text: "Regulating body temperature",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient is important for maintaining fluid balance in our body?",
                        order: 24,
                        difficulty: 1,
                        id: 507500,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Carbohydrates",
                          },
                          {
                            correct: false,
                            text: "Proteins",
                          },
                          {
                            correct: false,
                            text: "Fats",
                          },
                          {
                            correct: true,
                            text: "Sodium",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the function of Vitamin B12 in our body?",
                        order: 25,
                        difficulty: 2,
                        id: 608500,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Improving eyesight",
                          },
                          {
                            correct: true,
                            text: "Formation of red blood cells",
                          },
                          {
                            correct: false,
                            text: "Strengthening bones",
                          },
                          {
                            correct: false,
                            text: "Regulating body temperature",
                          },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 1160,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Introduction to Nutrient Functions",
                        body: `We've learned that food contains different nutrients. But why does our body need these nutrients? Each nutrient has a special job to do in our body, helping us stay healthy and grow.`,
                      },
                      {
                        id: 1161,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Carbohydrates: Our Energy Providers",
                        body: `Carbohydrates are like fuel for our body. They:\n• Give us energy to play, study, and do all our daily activities\n• Help our brain function properly\n• Provide fiber for good digestion`,
                      },
                      {
                        id: 1170,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Proteins: The Body's Building Blocks`,
                        body: `Proteins are very important for our body. They:\n• Help in growth and repair of body tissues\n• Build and maintain muscles\n• Help in making enzymes and hormones\n• Support our immune system to fight diseases`,
                      },
                      {
                        id: 1171,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Fats: Energy Storage and More`,
                        body: `Fats might seem bad, but they're actually very important. They:\n• Store energy for later use\n• Protect our organs\n• Help our body absorb certain vitamins\n• Keep our skin healthy\n• Help us feel full after eating`,
                      },
                      {
                        id: 1180,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Vitamins: The Protective Nutrients`,
                        body: `Vitamins are needed in small amounts, but they're crucial for our health. They:\n• Boost our immune system to fight diseases\n• Help in various bodily functions\n• Support growth and development\n• Keep our eyes, skin, and bones healthy`,
                      },
                      {
                        id: 1190,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Minerals: The Body's Helpers`,
                        body: `Minerals work alongside vitamins to keep us healthy. They:\n• Help in building strong bones and teeth (like calcium)\n• Aid in carrying oxygen in blood (like iron)\n• Regulate fluid balance in the body (like sodium and potassium)\n• Support proper nerve and muscle function`,
                      },
                      {
                        id: 1200,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Water: The Essential Nutrient`,
                        body: `Water is often forgotten as a nutrient, but it's crucial for life. It:\n• Regulates body temperature\n• Helps in digestion of food\n• Carries nutrients and oxygen to cells\n• Removes waste products from our body\n• Keeps our joints lubricated`,
                      },
                      {
                        id: 1210,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Working Together`,
                        body: `All these nutrients work together in our body. For example:\n• Carbohydrates give us energy to play\n• Proteins help build the muscles we use while playing\n• Water helps regulate our body temperature when we get hot from playing\n• Vitamins and minerals keep us healthy so we can continue to play`,
                      },
                      {
                        id: 1220,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1230,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1240,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1250,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1260,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
              {
                id: 1030,
                description: `Balanced diet`,
                order: 3,
                title: "Topic 3",
                lessons: [
                  {
                    id: 213,
                    title: "Understanding Balanced Diet",
                    order: 3,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is a balanced diet?",
                        order: 1,
                        difficulty: 1,
                        id: 782600,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "A diet with only fruits and vegetables",
                          },
                          {
                            correct: true,
                            text: "A diet with all nutrients in the right quantities",
                          },
                          {
                            correct: false,
                            text: "A diet with mostly proteins",
                          },
                          {
                            correct: false,
                            text: "A diet without any fats",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is NOT a characteristic of a balanced diet?",
                        order: 2,
                        difficulty: 2,
                        id: 349400,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It contains all essential nutrients",
                          },
                          {
                            correct: false,
                            text: "It provides adequate energy",
                          },
                          {
                            correct: true,
                            text: "It consists of only organic foods",
                          },
                          {
                            correct: false,
                            text: "It helps in maintaining good health",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Why is a balanced diet important?",
                        order: 3,
                        difficulty: 1,
                        id: 596500,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "To gain weight quickly",
                          },
                          {
                            correct: false,
                            text: "To eat only tasty foods",
                          },
                          {
                            correct: true,
                            text: "To maintain good health and proper growth",
                          },
                          {
                            correct: false,
                            text: "To avoid eating vegetables",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient should form the largest portion of a balanced diet?",
                        order: 4,
                        difficulty: 2,
                        id: 123700,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Proteins",
                          },
                          {
                            correct: false,
                            text: "Fats",
                          },
                          {
                            correct: true,
                            text: "Carbohydrates",
                          },
                          {
                            correct: false,
                            text: "Vitamins",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these combinations represents a balanced meal?",
                        order: 5,
                        difficulty: 3,
                        id: 876800,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "Rice, dal, vegetable curry, curd, and fruit",
                          },
                          {
                            correct: false,
                            text: "Bread and jam",
                          },
                          {
                            correct: false,
                            text: "Noodles and soft drink",
                          },
                          {
                            correct: false,
                            text: "Chips and chocolate",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How many major food groups are there in a balanced diet?",
                        order: 6,
                        difficulty: 1,
                        id: 247100,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Three",
                          },
                          {
                            correct: false,
                            text: "Four",
                          },
                          {
                            correct: true,
                            text: "Five",
                          },
                          {
                            correct: false,
                            text: "Six",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is NOT a major food group in a balanced diet?",
                        order: 7,
                        difficulty: 2,
                        id: 136000,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Fruits and vegetables",
                          },
                          {
                            correct: false,
                            text: "Grains",
                          },
                          {
                            correct: false,
                            text: "Protein foods",
                          },
                          {
                            correct: true,
                            text: "Sugary foods",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What happens if a person's diet lacks variety?",
                        order: 8,
                        difficulty: 3,
                        id: 987900,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They will always feel energetic",
                          },
                          {
                            correct: true,
                            text: "They may develop nutrient deficiencies",
                          },
                          {
                            correct: false,
                            text: "They will never fall ill",
                          },
                          {
                            correct: false,
                            text: "They will grow faster",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which food group provides us with most of our energy?",
                        order: 9,
                        difficulty: 1,
                        id: 358200,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Fruits and vegetables",
                          },
                          {
                            correct: false,
                            text: "Dairy",
                          },
                          {
                            correct: true,
                            text: "Grains",
                          },
                          {
                            correct: false,
                            text: "Meat",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why are fruits and vegetables important in a balanced diet?",
                        order: 10,
                        difficulty: 2,
                        id: 258300,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They provide all the proteins we need",
                          },
                          {
                            correct: true,
                            text: "They are rich in vitamins, minerals, and fiber",
                          },
                          {
                            correct: false,
                            text: "They are the main source of fats",
                          },
                          {
                            correct: false,
                            text: "They provide most of our energy",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which statement about a balanced diet is TRUE?",
                        order: 11,
                        difficulty: 3,
                        id: 113700,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It should eliminate all fats",
                          },
                          {
                            correct: false,
                            text: "It should consist of only raw foods",
                          },
                          {
                            correct: true,
                            text: "It should be adjusted according to age, gender, and activity level",
                          },
                          {
                            correct: false,
                            text: "It should be the same for everyone",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is a good source of proteins in a vegetarian diet?",
                        order: 12,
                        difficulty: 1,
                        id: 224800,
                        challengeOptions: [
                          { correct: false, text: "Rice" },
                          { correct: false, text: "Potato" },
                          { correct: true, text: "Pulses (Dal)" },
                          { correct: false, text: "Ghee" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why is water considered an important part of a balanced diet?",
                        order: 13,
                        difficulty: 2,
                        id: 335900,
                        challengeOptions: [
                          { correct: false, text: "It provides energy" },
                          { correct: false, text: "It builds muscles" },
                          {
                            correct: true,
                            text: "It helps in digestion and other body functions",
                          },
                          {
                            correct: false,
                            text: "It is a source of vitamins",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What role does dietary fiber play in a balanced diet?",
                        order: 14,
                        difficulty: 3,
                        id: 447000,
                        challengeOptions: [
                          { correct: false, text: "It provides quick energy" },
                          { correct: false, text: "It builds muscles" },
                          {
                            correct: true,
                            text: "It aids in digestion and prevents constipation",
                          },
                          {
                            correct: false,
                            text: "It is the main source of vitamins",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is NOT a benefit of a balanced diet?",
                        order: 15,
                        difficulty: 1,
                        id: 558100,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Proper growth and development",
                          },
                          { correct: false, text: "Strong immunity" },
                          { correct: true, text: "Rapid weight gain" },
                          { correct: false, text: "Good mental health" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How often should fruits and vegetables be included in a balanced diet?",
                        order: 16,
                        difficulty: 2,
                        id: 669200,
                        challengeOptions: [
                          { correct: false, text: "Once a week" },
                          { correct: false, text: "Only on weekends" },
                          { correct: true, text: "Daily" },
                          { correct: false, text: "Once a month" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these factors does NOT need to be considered while planning a balanced diet?",
                        order: 17,
                        difficulty: 3,
                        id: 780300,
                        challengeOptions: [
                          { correct: false, text: "Age" },
                          { correct: false, text: "Gender" },
                          { correct: false, text: "Activity level" },
                          { correct: true, text: "Hair color" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What type of foods should be limited in a balanced diet?",
                        order: 18,
                        difficulty: 1,
                        id: 891400,
                        challengeOptions: [
                          { correct: false, text: "Fruits" },
                          { correct: false, text: "Vegetables" },
                          { correct: false, text: "Whole grains" },
                          { correct: true, text: "Processed and junk foods" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why are dairy products important in a balanced diet?",
                        order: 19,
                        difficulty: 2,
                        id: 1002500,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They are the only source of proteins",
                          },
                          {
                            correct: true,
                            text: "They provide calcium for strong bones and teeth",
                          },
                          {
                            correct: false,
                            text: "They are the main source of vitamin C",
                          },
                          {
                            correct: false,
                            text: "They provide most of our energy",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the recommended way to include fats in a balanced diet?",
                        order: 20,
                        difficulty: 3,
                        id: 1113600,
                        challengeOptions: [
                          { correct: false, text: "Avoid all fats" },
                          { correct: false, text: "Eat only saturated fats" },
                          {
                            correct: true,
                            text: "Include healthy fats in moderation",
                          },
                          {
                            correct: false,
                            text: "Fats should be the main component of diet",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is a sign that your diet might not be balanced?",
                        order: 21,
                        difficulty: 1,
                        id: 1224700,
                        challengeOptions: [
                          { correct: false, text: "Feeling energetic" },
                          {
                            correct: false,
                            text: "Maintaining a healthy weight",
                          },
                          { correct: true, text: "Frequent illnesses" },
                          { correct: false, text: "Good skin health" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How does a balanced diet help in maintaining a healthy weight?",
                        order: 22,
                        difficulty: 2,
                        id: 1335800,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "By including only low-calorie foods",
                          },
                          {
                            correct: true,
                            text: "By providing the right amount of nutrients and energy",
                          },
                          {
                            correct: false,
                            text: "By eliminating all carbohydrates",
                          },
                          {
                            correct: false,
                            text: "By including only proteins",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the importance of including a variety of foods in a balanced diet?",
                        order: 23,
                        difficulty: 3,
                        id: 1446900,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It makes meals more colorful",
                          },
                          {
                            correct: true,
                            text: "It ensures intake of all essential nutrients",
                          },
                          { correct: false, text: "It is more expensive" },
                          { correct: false, text: "It always tastes better" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these meals is closest to being balanced?",
                        order: 24,
                        difficulty: 1,
                        id: 1558000,
                        challengeOptions: [
                          { correct: false, text: "Burger and fries" },
                          {
                            correct: true,
                            text: "Roti, dal, vegetables, and curd",
                          },
                          { correct: false, text: "Pizza and cola" },
                          { correct: false, text: "Noodles and chips" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why should sugary and fatty foods be limited in a balanced diet?",
                        order: 25,
                        difficulty: 2,
                        id: 1669100,
                        challengeOptions: [
                          { correct: false, text: "They are expensive" },
                          { correct: false, text: "They don't taste good" },
                          {
                            correct: true,
                            text: "They can lead to health problems if consumed in excess",
                          },
                          {
                            correct: false,
                            text: "They are difficult to cook",
                          },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 1270,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `What is a Balanced Diet?`,
                        body: `A balanced diet is a way of eating that gives our body all the nutrients it needs in the right amounts. It's like giving our body a perfect mix of different foods to keep us healthy and growing.`,
                      },
                      {
                        id: 1280,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Why is a Balanced Diet Important?`,
                        body: `A balanced diet is important because it:\n• Helps us grow properly\n• Keeps us healthy and strong\n• Gives us energy for daily activities\n• Helps our brain work well\n• Protects us from diseases`,
                      },
                      {
                        id: 1290,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Components of a Balanced Diet`,
                        body: `A balanced diet includes different types of foods in the right amounts:\n1. Cereals and pulses\n2. Fruits and vegetables\n3. Milk and milk products\n4. Meat, fish, or eggs (for non-vegetarians)\n5. Nuts and oilseeds\n6. Fats and sugars (in small quantities)`,
                      },
                      {
                        id: 1300,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Cereals and Pulses`,
                        body: `Cereals (like rice, wheat) and pulses (like dal) are rich in carbohydrates and proteins. They give us energy and help in body building. We should include these in most of our meals.`,
                      },
                      {
                        id: 1310,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Fruits and Vegetables`,
                        body: `Fruits and vegetables are packed with vitamins, minerals, and fiber. They help protect our body from diseases. We should eat a variety of colorful fruits and vegetables every day.`,
                      },
                      {
                        id: 1320,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Milk and Milk Products`,
                        body: `Milk, curd, and cheese are rich in proteins and calcium. They help in building strong bones and teeth. It's good to have milk or milk products daily.`,
                      },
                      {
                        id: 1330,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Meat, Fish, and Eggs`,
                        body: `These are excellent sources of proteins. They help in body building and repair. For vegetarians, pulses and nuts can provide similar nutrients.`,
                      },
                      {
                        id: 1340,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Nuts and Oilseeds`,
                        body: `Nuts and oilseeds (like almonds, walnuts, peanuts) contain healthy fats, proteins, and minerals. They are good for our brain and heart when eaten in small quantities.`,
                      },
                      {
                        id: 1350,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Fats and Sugars`,
                        body: `While fats and sugars are part of a balanced diet, we need them in small amounts. They provide energy, but eating too much can lead to health problems.`,
                      },
                      {
                        id: 1360,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Creating a Balanced Meals`,
                        body: `A balanced meal should include:\n• A portion of cereals or pulses\n• Some vegetables and/or fruits\n• A small serving of milk or milk product\n• A small portion of meat, fish, egg, or additional pulses for vegetarians\n• Water to stay hydrated`,
                      },
                      {
                        id: 1370,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Remember`,
                        body: `Eat a variety of foods\n• Include all food groups in your diet\n• Eat fresh fruits and vegetables daily\n• Drink plenty of water\n• Avoid too much of junk food or sugary drinks`,
                      },
                      {
                        id: 1380,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1390,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1400,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1410,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1420,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
              {
                id: 1040,
                description: `Deficiency diseases`,
                order: 4,
                title: "Topic 4",
                lessons: [
                  {
                    id: 214,
                    title: "Understanding Deficiency Diseases",
                    order: 4,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What are deficiency diseases?",
                        order: 1,
                        difficulty: 1,
                        id: 7927,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Diseases caused by excess nutrients",
                          },
                          {
                            correct: true,
                            text: "Diseases caused by lack of nutrients",
                          },
                          {
                            correct: false,
                            text: "Diseases caused by bacteria",
                          },
                          {
                            correct: false,
                            text: "Diseases caused by viruses",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which deficiency disease is caused by lack of Vitamin C?",
                        order: 2,
                        difficulty: 2,
                        id: 3595,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Rickets",
                          },
                          {
                            correct: true,
                            text: "Scurvy",
                          },
                          {
                            correct: false,
                            text: "Night blindness",
                          },
                          {
                            correct: false,
                            text: "Goitre",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the deficiency disease caused by lack of both proteins and carbohydrates?",
                        order: 3,
                        difficulty: 3,
                        id: 6066,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Kwashiorkor",
                          },
                          {
                            correct: true,
                            text: "Marasmus",
                          },
                          {
                            correct: false,
                            text: "Anaemia",
                          },
                          {
                            correct: false,
                            text: "Beriberi",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which nutrient deficiency causes night blindness?",
                        order: 4,
                        difficulty: 1,
                        id: 1338,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "Vitamin A",
                          },
                          {
                            correct: false,
                            text: "Vitamin B",
                          },
                          {
                            correct: false,
                            text: "Vitamin C",
                          },
                          {
                            correct: false,
                            text: "Vitamin D",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the main symptom of anaemia?",
                        order: 5,
                        difficulty: 2,
                        id: 8869,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Weak bones",
                          },
                          {
                            correct: false,
                            text: "Poor eyesight",
                          },
                          {
                            correct: true,
                            text: "Fatigue and weakness",
                          },
                          {
                            correct: false,
                            text: "Swelling in the neck",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which deficiency disease affects the thyroid gland?",
                        order: 6,
                        difficulty: 3,
                        id: 2572,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Rickets",
                          },
                          {
                            correct: false,
                            text: "Scurvy",
                          },
                          {
                            correct: true,
                            text: "Goitre",
                          },
                          {
                            correct: false,
                            text: "Beriberi",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which vitamin deficiency can lead to poor wound healing?",
                        order: 7,
                        difficulty: 1,
                        id: 1461,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Vitamin A",
                          },
                          {
                            correct: false,
                            text: "Vitamin B",
                          },
                          {
                            correct: true,
                            text: "Vitamin C",
                          },
                          {
                            correct: false,
                            text: "Vitamin D",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the main cause of rickets?",
                        order: 8,
                        difficulty: 2,
                        id: 9980,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Lack of Vitamin A",
                          },
                          {
                            correct: false,
                            text: "Lack of Vitamin B",
                          },
                          {
                            correct: false,
                            text: "Lack of Vitamin C",
                          },
                          {
                            correct: true,
                            text: "Lack of Vitamin D",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which deficiency disease is characterized by swollen belly and changes in hair color?",
                        order: 9,
                        difficulty: 3,
                        id: 3683,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Marasmus",
                          },
                          {
                            correct: true,
                            text: "Kwashiorkor",
                          },
                          {
                            correct: false,
                            text: "Anaemia",
                          },
                          {
                            correct: false,
                            text: "Beriberi",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Which mineral deficiency causes anaemia?",
                        order: 10,
                        difficulty: 1,
                        id: 2684,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Calcium",
                          },
                          {
                            correct: true,
                            text: "Iron",
                          },
                          {
                            correct: false,
                            text: "Iodine",
                          },
                          {
                            correct: false,
                            text: "Potassium",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the main symptom of scurvy?",
                        order: 11,
                        difficulty: 2,
                        id: 10111,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Weak bones",
                          },
                          {
                            correct: true,
                            text: "Bleeding gums",
                          },
                          {
                            correct: false,
                            text: "Hair loss",
                          },
                          {
                            correct: false,
                            text: "Weight gain",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which vitamin deficiency can cause beriberi?",
                        order: 12,
                        difficulty: 3,
                        id: 10112,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Vitamin A",
                          },
                          {
                            correct: true,
                            text: "Vitamin B1 (Thiamine)",
                          },
                          {
                            correct: false,
                            text: "Vitamin C",
                          },
                          {
                            correct: false,
                            text: "Vitamin D",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the main function of Vitamin A in our body?",
                        order: 13,
                        difficulty: 1,
                        id: 10113,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Strengthening bones",
                          },
                          {
                            correct: true,
                            text: "Maintaining healthy skin and vision",
                          },
                          {
                            correct: false,
                            text: "Clotting blood",
                          },
                          {
                            correct: false,
                            text: "Producing energy",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is NOT a symptom of protein deficiency?",
                        order: 14,
                        difficulty: 2,
                        id: 10114,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Stunted growth",
                          },
                          {
                            correct: false,
                            text: "Weak muscles",
                          },
                          {
                            correct: true,
                            text: "Increased immunity",
                          },
                          {
                            correct: false,
                            text: "Swelling (edema)",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the role of iodine in preventing goitre?",
                        order: 15,
                        difficulty: 3,
                        id: 10115,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "It helps in producing thyroid hormones",
                          },
                          {
                            correct: false,
                            text: "It strengthens the neck muscles",
                          },
                          {
                            correct: false,
                            text: "It improves blood circulation",
                          },
                          {
                            correct: false,
                            text: "It reduces inflammation",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these foods can help prevent iron deficiency anaemia?",
                        order: 16,
                        difficulty: 1,
                        id: 10116,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Oranges",
                          },
                          {
                            correct: true,
                            text: "Spinach",
                          },
                          {
                            correct: false,
                            text: "Rice",
                          },
                          {
                            correct: false,
                            text: "Potatoes",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is xerophthalmia?",
                        order: 17,
                        difficulty: 2,
                        id: 10117,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "A type of eye infection",
                          },
                          {
                            correct: true,
                            text: "Dryness of eyes due to Vitamin A deficiency",
                          },
                          {
                            correct: false,
                            text: "Improved night vision",
                          },
                          {
                            correct: false,
                            text: "Swelling of the eye",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How does Vitamin D deficiency lead to rickets?",
                        order: 18,
                        difficulty: 3,
                        id: 10118,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It causes inflammation in bones",
                          },
                          {
                            correct: true,
                            text: "It prevents calcium absorption, leading to weak bones",
                          },
                          {
                            correct: false,
                            text: "It increases bone density",
                          },
                          {
                            correct: false,
                            text: "It causes excessive bone growth",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which age group is most vulnerable to kwashiorkor?",
                        order: 19,
                        difficulty: 1,
                        id: 10119,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "Infants",
                          },
                          {
                            correct: false,
                            text: "Teenagers",
                          },
                          {
                            correct: false,
                            text: "Adults",
                          },
                          {
                            correct: false,
                            text: "Elderly",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the difference between kwashiorkor and marasmus?",
                        order: 20,
                        difficulty: 2,
                        id: 10120,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "Kwashiorkor is caused by protein deficiency, marasmus by overall calorie deficiency",
                          },
                          {
                            correct: false,
                            text: "Kwashiorkor affects adults, marasmus affects children",
                          },
                          {
                            correct: false,
                            text: "Kwashiorkor causes weight gain, marasmus causes weight loss",
                          },
                          {
                            correct: false,
                            text: "There is no difference, they are the same disease",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How does Vitamin C deficiency lead to scurvy?",
                        order: 21,
                        difficulty: 3,
                        id: 10121,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It causes overproduction of blood cells",
                          },
                          {
                            correct: true,
                            text: "It prevents the formation of collagen, affecting skin and blood vessels",
                          },
                          {
                            correct: false,
                            text: "It leads to overactive thyroid",
                          },
                          {
                            correct: false,
                            text: "It causes excessive iron absorption",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is a good source of Vitamin D?",
                        order: 22,
                        difficulty: 1,
                        id: 10122,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Carrots",
                          },
                          {
                            correct: true,
                            text: "Sunlight exposure",
                          },
                          {
                            correct: false,
                            text: "Lemons",
                          },
                          {
                            correct: false,
                            text: "Red meat",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What can prolonged iron deficiency lead to besides anaemia?",
                        order: 23,
                        difficulty: 2,
                        id: 10123,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Improved cardiovascular health",
                          },
                          {
                            correct: false,
                            text: "Better cognitive function",
                          },
                          {
                            correct: true,
                            text: "Decreased work capacity and cognitive function",
                          },
                          {
                            correct: false,
                            text: "Increased immunity",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How does iodine deficiency in pregnant women affect the fetus?",
                        order: 24,
                        difficulty: 3,
                        id: 10124,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It leads to increased birth weight",
                          },
                          {
                            correct: true,
                            text: "It can cause mental retardation and developmental issues",
                          },
                          {
                            correct: false,
                            text: "It improves fetal brain development",
                          },
                          {
                            correct: false,
                            text: "It has no effect on the fetus",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is NOT a way to prevent nutrient deficiencies?",
                        order: 25,
                        difficulty: 1,
                        id: 10125,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Eating a balanced diet",
                          },
                          {
                            correct: false,
                            text: "Taking supplements when necessary",
                          },
                          {
                            correct: true,
                            text: "Avoiding all types of fats",
                          },
                          {
                            correct: false,
                            text: "Consuming fortified foods",
                          },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 1430,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `What are Deficiency Diseases?`,
                        body: `Deficiency diseases are health problems that occur when our body doesn't get enough of certain nutrients. It's like when a car runs out of fuel and stops working properly. Our body also needs the right 'fuel' (nutrients) to work well.`,
                      },
                      {
                        id: 1440,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Why Do Deficiency Diseases Happen?`,
                        body: `Deficiency diseases can happen when:\n• We don't eat a balanced diet\n• Our body can't absorb certain nutrients properly\n• We have increased nutrient needs (like during growth or illness) that aren't met`,
                      },
                      {
                        id: 1450,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Common Deficiency Diseases: Vitamin A Deficiency`,
                        body: `One common deficiency disease is caused by lack of Vitamin A.\n• Vitamin A is important for our eyes and skin\n• It's found in foods like carrots, sweet potatoes, and milk\n• Lack of Vitamin A can cause night blindness, where it's hard to see in dim light`,
                      },
                      {
                        id: 1460,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Common Deficiency Diseases: Vitamin C Deficiency`,
                        body: `Another deficiency disease is caused by lack of Vitamin C.\n• Vitamin C helps our body heal and fight infections\n• It's found in citrus fruits, berries, and many vegetables\n• Lack of Vitamin C can cause a disease called scurvy, which makes gums bleed and wounds heal slowly`,
                      },
                      {
                        id: 1470,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Common Deficiency Diseases: Vitamin D Deficiency`,
                        body: `Vitamin D deficiency is also common.\n• Vitamin D helps our body absorb calcium for strong bones\n• We can get Vitamin D from sunlight and foods like fish and eggs\n• Lack of Vitamin D can cause a disease called rickets in children, which leads to weak and soft bones`,
                      },
                      {
                        id: 1480,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Common Deficiency Diseases: Iron Deficiency`,
                        body: `Iron deficiency is very common, especially in children and women.\n• Iron helps our blood carry oxygen around the body\n• It's found in foods like red meat, beans, and green leafy vegetables\n• Lack of iron can cause anemia, which makes people feel weak and tired`,
                      },
                      {
                        id: 1490,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Common Deficiency Diseases: Iodine Deficiency`,
                        body: `Iodine deficiency affects many people worldwide.\n• Iodine is important for proper functioning of the thyroid gland\n• It's found in iodized salt and seafood\n• Lack of iodine can cause goiter, a swelling in the neck, and can affect brain development in children`,
                      },
                      {
                        id: 1500,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Preventing Deficiency Diseases`,
                        body: `We can prevent most deficiency diseases by:\n• Eating a balanced diet with a variety of foods\n• Including plenty of fruits and vegetables in our meals\n• Getting some sunlight for Vitamin D\n• Using iodized salt\n• Taking supplements if recommended by a doctor`,
                      },
                      {
                        id: 1510,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Remember`,
                        body: `• Deficiency diseases happen when we don't get enough of certain nutrients\n• Different nutrients cause different deficiency diseases\n• We can prevent most deficiency diseases by eating a balanced diet\n• If you're concerned about deficiencies, always talk to a doctor or a nutritionist`,
                      },
                      {
                        id: 1520,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1530,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1540,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1550,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1560,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
              {
                id: 1050,
                description: `Test for Presence of Different Components in Food`,
                order: 5,
                title: "Topic 5",
                lessons: [
                  {
                    id: 215,
                    title: "Testing for Different Food Components",
                    order: 5,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What color does iodine solution turn when starch is present?",
                        order: 1,
                        difficulty: 1,
                        id: 7830,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Red",
                          },
                          {
                            correct: true,
                            text: "Blue-black",
                          },
                          {
                            correct: false,
                            text: "Green",
                          },
                          {
                            correct: false,
                            text: "Yellow",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which solution is used to test for the presence of proteins?",
                        order: 2,
                        difficulty: 2,
                        id: 3498,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Iodine solution",
                          },
                          {
                            correct: true,
                            text: "Copper sulphate solution and sodium hydroxide",
                          },
                          {
                            correct: false,
                            text: "Benedict's solution",
                          },
                          {
                            correct: false,
                            text: "Water",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What color change indicates the presence of proteins in the biuret test?",
                        order: 3,
                        difficulty: 3,
                        id: 5969,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "Blue to purple",
                          },
                          {
                            correct: false,
                            text: "Colorless to blue",
                          },
                          {
                            correct: false,
                            text: "Green to red",
                          },
                          {
                            correct: false,
                            text: "Yellow to blue",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which food component turns blue-black with iodine?",
                        order: 4,
                        difficulty: 1,
                        id: 1241,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Fats",
                          },
                          {
                            correct: false,
                            text: "Proteins",
                          },
                          {
                            correct: true,
                            text: "Starch",
                          },
                          {
                            correct: false,
                            text: "Vitamins",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the paper test used to detect?",
                        order: 5,
                        difficulty: 2,
                        id: 8771,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Proteins",
                          },
                          {
                            correct: false,
                            text: "Carbohydrates",
                          },
                          {
                            correct: false,
                            text: "Vitamins",
                          },
                          {
                            correct: true,
                            text: "Fats",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "In the paper test for fats, what happens to the paper?",
                        order: 6,
                        difficulty: 3,
                        id: 2474,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It turns blue",
                          },
                          {
                            correct: true,
                            text: "It becomes transparent",
                          },
                          {
                            correct: false,
                            text: "It turns red",
                          },
                          {
                            correct: false,
                            text: "It disintegrates",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Which of these is NOT a common food test?",
                        order: 7,
                        difficulty: 1,
                        id: 1363,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Iodine test",
                          },
                          {
                            correct: false,
                            text: "Biuret test",
                          },
                          {
                            correct: false,
                            text: "Paper test",
                          },
                          {
                            correct: true,
                            text: "Taste test",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What component does Benedict's solution test for?",
                        order: 8,
                        difficulty: 2,
                        id: 9882,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Proteins",
                          },
                          {
                            correct: false,
                            text: "Fats",
                          },
                          {
                            correct: true,
                            text: "Reducing sugars",
                          },
                          {
                            correct: false,
                            text: "Vitamins",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What color change indicates a positive result in Benedict's test?",
                        order: 9,
                        difficulty: 3,
                        id: 3585,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "Blue to brick red",
                          },
                          {
                            correct: false,
                            text: "Colorless to blue",
                          },
                          {
                            correct: false,
                            text: "Yellow to green",
                          },
                          {
                            correct: false,
                            text: "Red to purple",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which test involves rubbing the food on paper?",
                        order: 10,
                        difficulty: 1,
                        id: 2586,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Iodine test",
                          },
                          {
                            correct: false,
                            text: "Biuret test",
                          },
                          {
                            correct: true,
                            text: "Paper test",
                          },
                          {
                            correct: false,
                            text: "Benedict's test",
                          },
                        ],
                      },

                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the first step in testing for proteins in food?",
                        order: 11,
                        difficulty: 2,
                        id: 20011,
                        challengeOptions: [
                          { correct: false, text: "Add water to the food" },
                          {
                            correct: true,
                            text: "Grind the food into a paste",
                          },
                          { correct: false, text: "Heat the food" },
                          { correct: false, text: "Add iodine to the food" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why is the food sample heated in Benedict's test?",
                        order: 12,
                        difficulty: 3,
                        id: 20012,
                        challengeOptions: [
                          { correct: false, text: "To dissolve the food" },
                          { correct: false, text: "To evaporate water" },
                          { correct: true, text: "To speed up the reaction" },
                          {
                            correct: false,
                            text: "To change the color of the solution",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What type of food would likely turn iodine solution blue-black?",
                        order: 13,
                        difficulty: 1,
                        id: 20013,
                        challengeOptions: [
                          { correct: false, text: "Butter" },
                          { correct: false, text: "Egg white" },
                          { correct: true, text: "Potato" },
                          { correct: false, text: "Olive oil" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "In the biuret test, what causes the color change?",
                        order: 14,
                        difficulty: 2,
                        id: 20014,
                        challengeOptions: [
                          { correct: false, text: "The presence of starch" },
                          {
                            correct: true,
                            text: "The presence of peptide bonds in proteins",
                          },
                          { correct: false, text: "The presence of fats" },
                          { correct: false, text: "The presence of vitamins" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the principle behind the paper test for fats?",
                        order: 15,
                        difficulty: 3,
                        id: 20015,
                        challengeOptions: [
                          { correct: false, text: "Fats dissolve in water" },
                          { correct: false, text: "Fats react with paper" },
                          {
                            correct: true,
                            text: "Fats leave a translucent mark on paper",
                          },
                          {
                            correct: false,
                            text: "Fats change the color of paper",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these foods would likely test positive for starch?",
                        order: 16,
                        difficulty: 1,
                        id: 20016,
                        challengeOptions: [
                          { correct: false, text: "Cooking oil" },
                          { correct: true, text: "Bread" },
                          { correct: false, text: "Egg white" },
                          { correct: false, text: "Butter" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the purpose of adding sodium hydroxide in the biuret test?",
                        order: 17,
                        difficulty: 2,
                        id: 20017,
                        challengeOptions: [
                          { correct: false, text: "To dissolve the food" },
                          {
                            correct: true,
                            text: "To create an alkaline environment",
                          },
                          {
                            correct: false,
                            text: "To neutralize the solution",
                          },
                          {
                            correct: false,
                            text: "To change the color of the solution",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why might a food sample containing only complex carbohydrates not show a positive result in Benedict's test?",
                        order: 18,
                        difficulty: 3,
                        id: 20018,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Complex carbohydrates are not sugars",
                          },
                          {
                            correct: true,
                            text: "Benedict's solution only reacts with reducing sugars",
                          },
                          {
                            correct: false,
                            text: "Complex carbohydrates are too large to react",
                          },
                          {
                            correct: false,
                            text: "The test is not sensitive enough",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What color is Benedict's solution before any reaction occurs?",
                        order: 19,
                        difficulty: 1,
                        id: 20019,
                        challengeOptions: [
                          { correct: false, text: "Red" },
                          { correct: true, text: "Blue" },
                          { correct: false, text: "Green" },
                          { correct: false, text: "Colorless" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these would give a positive result in the paper test?",
                        order: 20,
                        difficulty: 2,
                        id: 20020,
                        challengeOptions: [
                          { correct: false, text: "Sugar solution" },
                          { correct: false, text: "Salt solution" },
                          { correct: true, text: "Vegetable oil" },
                          { correct: false, text: "Starch solution" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What would be the result if you performed the iodine test on pure glucose?",
                        order: 21,
                        difficulty: 3,
                        id: 20021,
                        challengeOptions: [
                          { correct: false, text: "It would turn blue-black" },
                          {
                            correct: true,
                            text: "It would remain yellow/brown",
                          },
                          { correct: false, text: "It would turn green" },
                          { correct: false, text: "It would turn colorless" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which test is used to detect the presence of simple sugars?",
                        order: 22,
                        difficulty: 1,
                        id: 20022,
                        challengeOptions: [
                          { correct: false, text: "Iodine test" },
                          { correct: false, text: "Biuret test" },
                          { correct: true, text: "Benedict's test" },
                          { correct: false, text: "Paper test" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the purpose of grinding or mashing the food sample before testing?",
                        order: 23,
                        difficulty: 2,
                        id: 20023,
                        challengeOptions: [
                          { correct: false, text: "To make it taste better" },
                          { correct: false, text: "To change its color" },
                          {
                            correct: true,
                            text: "To increase the surface area for reaction",
                          },
                          {
                            correct: false,
                            text: "To remove water from the sample",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why might a food sample containing protein not show a positive result in the biuret test?",
                        order: 24,
                        difficulty: 3,
                        id: 20024,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "The protein concentration is too low",
                          },
                          { correct: false, text: "The protein is denatured" },
                          {
                            correct: false,
                            text: "The test is not accurate for proteins",
                          },
                          {
                            correct: false,
                            text: "Proteins do not react in the biuret test",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is NOT a result you would expect in food component tests?",
                        order: 25,
                        difficulty: 1,
                        id: 20025,
                        challengeOptions: [
                          { correct: false, text: "Color change" },
                          { correct: false, text: "Precipitation" },
                          { correct: false, text: "Transparency on paper" },
                          { correct: true, text: "Explosion" },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 1570,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Why Do We Test Food?`,
                        body: `Just like detectives use clues to solve mysteries, scientists use tests to find out what's in our food. These tests help us understand which nutrients are present in different foods. This knowledge helps us make better choices about what we eat.`,
                      },
                      {
                        id: 1580,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `What Can We Test For?`,
                        body: `We can test food for the presence of different nutrients like:\n• Carbohydrates (especially starch)\n• Proteins\n• Fats\n\nLet's learn about each test one by one!`,
                      },
                      {
                        id: 1590,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Testing for Starch`,
                        body: `Starch is a type of carbohydrate. Here's how we test for it:\n1. We use a liquid called iodine solution.\n2. Iodine solution is yellowish-brown in color.\n3. When we add iodine to food containing starch, it turns blue-black.\n4. If there's no starch, the color stays yellowish-brown.`,
                      },
                      {
                        id: 1600,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Starch Test: What to Expect`,
                        body: `• Foods like rice, potato, and bread will turn blue-black (positive test).\n• Foods like meat and most fruits will not change color (negative test).`,
                      },
                      {
                        id: 1610,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Testing for Proteins`,
                        body: `Proteins are important for growth and repair. Here's how we test for them:\n1. We use a solution called copper sulphate solution and caustic soda.\n2. When we add these to food containing protein, the mixture turns violet or purple.\n3. If there's no protein, the color doesn't change much.`,
                      },
                      {
                        id: 1620,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Protein Test: What to Expect`,
                        body: `• Foods like eggs, milk, and pulses will turn violet (positive test).\n• Foods like sugar and most fruits will not change color much (negative test).`,
                      },
                      {
                        id: 1630,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Testing for Fats`,
                        body: `Fats are important for energy and protecting our organs. Here's a simple test for fats:\n1. Take a small piece of food and rub it on a piece of paper.\n2. Let the paper dry.\n3. If the paper becomes translucent (you can partially see through it), fat is present.\n4. If the paper doesn't change, there's likely no fat.`,
                      },
                      {
                        id: 1640,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Fat Test: What to Expect`,
                        body: `• Foods like butter, oils, and nuts will make the paper translucent (positive test).\n• Foods like fruits and vegetables usually won't change the paper (negative test).`,
                      },
                      {
                        id: 1650,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Conducting Food Tests`,
                        body: `When conducting these tests:\n• Always be careful with chemicals and follow your teacher's instructions.\n• Use small amounts of food and testing solutions.\n• Observe the color changes carefully.\n• Record your observations.\n• Wash your hands after the experiments.`,
                      },
                      {
                        id: 1660,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Why These Tests are Important`,
                        body: `• They help us understand what nutrients are in our food.\n• This knowledge helps us make better food choices.\n• Scientists use more advanced versions of these tests to study food.\n• These tests can help people with special dietary needs.`,
                      },
                      {
                        id: 1670,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1680,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1690,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1700,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1710,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
              {
                id: 1060,
                description: `Roughage and its Importance`,
                order: 6,
                title: "Topic 6",
                lessons: [
                  {
                    id: 216,
                    title: "Roughage and its Importance",
                    order: 6,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is another term for roughage?",
                        order: 1,
                        difficulty: 1,
                        id: 7931,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Proteins",
                          },
                          {
                            correct: false,
                            text: "Fats",
                          },
                          {
                            correct: true,
                            text: "Dietary fiber",
                          },
                          {
                            correct: false,
                            text: "Vitamins",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is NOT a good source of roughage?",
                        order: 2,
                        difficulty: 2,
                        id: 3599,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Whole grains",
                          },
                          {
                            correct: false,
                            text: "Fruits with skin",
                          },
                          {
                            correct: true,
                            text: "Refined flour",
                          },
                          {
                            correct: false,
                            text: "Leafy vegetables",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "How does roughage help in digestion?",
                        order: 3,
                        difficulty: 3,
                        id: 6070,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "By providing energy",
                          },
                          {
                            correct: false,
                            text: "By building muscles",
                          },
                          {
                            correct: true,
                            text: "By adding bulk to stool and preventing constipation",
                          },
                          {
                            correct: false,
                            text: "By producing digestive enzymes",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Can humans digest roughage?",
                        order: 4,
                        difficulty: 1,
                        id: 1342,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Yes, completely",
                          },
                          {
                            correct: false,
                            text: "Yes, partially",
                          },
                          {
                            correct: true,
                            text: "No, not at all",
                          },
                          {
                            correct: false,
                            text: "Only if cooked",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is a benefit of including roughage in diet?",
                        order: 5,
                        difficulty: 2,
                        id: 8872,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It provides quick energy",
                          },
                          {
                            correct: false,
                            text: "It helps in building muscles",
                          },
                          {
                            correct: true,
                            text: "It aids in maintaining a healthy digestive system",
                          },
                          {
                            correct: false,
                            text: "It is the main source of vitamins",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How does roughage help in weight management?",
                        order: 6,
                        difficulty: 3,
                        id: 2575,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "By adding calories to the diet",
                          },
                          {
                            correct: false,
                            text: "By increasing fat absorption",
                          },
                          {
                            correct: true,
                            text: "By providing a feeling of fullness with fewer calories",
                          },
                          {
                            correct: false,
                            text: "By speeding up metabolism",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which part of a fruit often contains the most roughage?",
                        order: 7,
                        difficulty: 1,
                        id: 1464,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "The juice",
                          },
                          {
                            correct: true,
                            text: "The skin",
                          },
                          {
                            correct: false,
                            text: "The seeds",
                          },
                          {
                            correct: false,
                            text: "The pulp",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What happens if a person's diet lacks roughage?",
                        order: 8,
                        difficulty: 2,
                        id: 9983,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "They may develop constipation",
                          },
                          {
                            correct: false,
                            text: "They will gain weight quickly",
                          },
                          {
                            correct: false,
                            text: "They will have excess energy",
                          },
                          {
                            correct: false,
                            text: "They will absorb more vitamins",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How does roughage affect blood sugar levels?",
                        order: 9,
                        difficulty: 3,
                        id: 3686,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It causes rapid spikes in blood sugar",
                          },
                          {
                            correct: false,
                            text: "It has no effect on blood sugar",
                          },
                          {
                            correct: true,
                            text: "It helps in maintaining steady blood sugar levels",
                          },
                          {
                            correct: false,
                            text: "It always lowers blood sugar",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Which of these foods is rich in roughage?",
                        order: 10,
                        difficulty: 1,
                        id: 2687,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "White bread",
                          },
                          {
                            correct: false,
                            text: "Milk",
                          },
                          {
                            correct: true,
                            text: "Oatmeal",
                          },
                          {
                            correct: false,
                            text: "Cheese",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What type of fiber helps in lowering cholesterol levels?",
                        order: 11,
                        difficulty: 2,
                        id: 20111,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Insoluble fiber",
                          },
                          {
                            correct: true,
                            text: "Soluble fiber",
                          },
                          {
                            correct: false,
                            text: "All types of fiber",
                          },
                          {
                            correct: false,
                            text: "Fiber has no effect on cholesterol",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How does roughage contribute to colon health?",
                        order: 12,
                        difficulty: 3,
                        id: 20112,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "By providing nutrients to colon cells",
                          },
                          {
                            correct: false,
                            text: "By absorbing toxins",
                          },
                          {
                            correct: true,
                            text: "By promoting growth of beneficial gut bacteria",
                          },
                          {
                            correct: false,
                            text: "By increasing colon size",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is NOT a type of dietary fiber?",
                        order: 13,
                        difficulty: 1,
                        id: 20113,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Cellulose",
                          },
                          {
                            correct: false,
                            text: "Hemicellulose",
                          },
                          {
                            correct: true,
                            text: "Protein fiber",
                          },
                          {
                            correct: false,
                            text: "Lignin",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How much fiber is recommended for an average adult per day?",
                        order: 14,
                        difficulty: 2,
                        id: 20114,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "5-10 grams",
                          },
                          {
                            correct: false,
                            text: "15-20 grams",
                          },
                          {
                            correct: true,
                            text: "25-30 grams",
                          },
                          {
                            correct: false,
                            text: "40-50 grams",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the difference between soluble and insoluble fiber?",
                        order: 15,
                        difficulty: 3,
                        id: 20115,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "Soluble fiber dissolves in water, insoluble doesn't",
                          },
                          {
                            correct: false,
                            text: "Soluble fiber is found in animals, insoluble in plants",
                          },
                          {
                            correct: false,
                            text: "Soluble fiber provides energy, insoluble doesn't",
                          },
                          {
                            correct: false,
                            text: "There is no difference",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Which of these vegetables is high in fiber?",
                        order: 16,
                        difficulty: 1,
                        id: 20116,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Potato (without skin)",
                          },
                          {
                            correct: true,
                            text: "Broccoli",
                          },
                          {
                            correct: false,
                            text: "Cucumber (without skin)",
                          },
                          {
                            correct: false,
                            text: "Boiled carrots",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How does fiber intake affect water consumption?",
                        order: 17,
                        difficulty: 2,
                        id: 20117,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It decreases the need for water",
                          },
                          {
                            correct: true,
                            text: "It increases the need for water",
                          },
                          {
                            correct: false,
                            text: "It has no effect on water needs",
                          },
                          {
                            correct: false,
                            text: "It replaces the need for water",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is NOT a function of dietary fiber?",
                        order: 18,
                        difficulty: 3,
                        id: 20118,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Promotes regular bowel movements",
                          },
                          {
                            correct: false,
                            text: "Helps maintain bowel health",
                          },
                          {
                            correct: true,
                            text: "Provides essential amino acids",
                          },
                          {
                            correct: false,
                            text: "Aids in achieving healthy weight",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these fruits is a good source of fiber?",
                        order: 19,
                        difficulty: 1,
                        id: 20119,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Peeled apple",
                          },
                          {
                            correct: false,
                            text: "Grape juice",
                          },
                          {
                            correct: false,
                            text: "Canned pears",
                          },
                          {
                            correct: true,
                            text: "Raspberries",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How does cooking affect the fiber content of foods?",
                        order: 20,
                        difficulty: 2,
                        id: 20120,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It always increases fiber content",
                          },
                          {
                            correct: false,
                            text: "It always decreases fiber content",
                          },
                          {
                            correct: true,
                            text: "It can increase or decrease fiber content depending on the method",
                          },
                          {
                            correct: false,
                            text: "Cooking has no effect on fiber content",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What role does fiber play in the absorption of minerals?",
                        order: 21,
                        difficulty: 3,
                        id: 20121,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It always enhances mineral absorption",
                          },
                          {
                            correct: true,
                            text: "It can bind to some minerals, potentially reducing their absorption",
                          },
                          {
                            correct: false,
                            text: "It has no effect on mineral absorption",
                          },
                          {
                            correct: false,
                            text: "It only affects vitamin absorption, not minerals",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these grains is the best source of fiber?",
                        order: 22,
                        difficulty: 1,
                        id: 20122,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "White rice",
                          },
                          {
                            correct: true,
                            text: "Whole wheat",
                          },
                          {
                            correct: false,
                            text: "Polished rice",
                          },
                          {
                            correct: false,
                            text: "White bread",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How does fiber help in preventing certain types of cancer?",
                        order: 23,
                        difficulty: 2,
                        id: 20123,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "By killing cancer cells",
                          },
                          {
                            correct: true,
                            text: "By speeding up digestion, reducing exposure to carcinogens",
                          },
                          {
                            correct: false,
                            text: "By providing antioxidants",
                          },
                          {
                            correct: false,
                            text: "Fiber has no effect on cancer prevention",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the role of fiber in gut microbiome health?",
                        order: 24,
                        difficulty: 3,
                        id: 20124,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It kills harmful bacteria",
                          },
                          {
                            correct: true,
                            text: "It serves as a food source for beneficial gut bacteria",
                          },
                          {
                            correct: false,
                            text: "It has no effect on gut bacteria",
                          },
                          {
                            correct: false,
                            text: "It reduces the number of all gut bacteria",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of these is true about the caloric value of fiber?",
                        order: 25,
                        difficulty: 1,
                        id: 20125,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It provides 9 calories per gram",
                          },
                          {
                            correct: false,
                            text: "It provides 4 calories per gram",
                          },
                          {
                            correct: false,
                            text: "It provides 2 calories per gram",
                          },
                          {
                            correct: true,
                            text: "It provides no calories",
                          },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 1720,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `What is Roughage?`,
                        body: `Roughage, also known as dietary fiber, is a type of carbohydrate found in plants that our body cannot digest. It's like the 'tough' part of plants that passes through our digestive system mostly unchanged.`,
                      },
                      {
                        id: 1730,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Where Do We Find Roughage?`,
                        body: `Roughage is found in many plant-based foods. Some good sources are:\n• Fruits (especially with edible skins and seeds)\n• Vegetables\n• Whole grains\n• Legumes (like beans and lentils)\n• Nuts and seeds`,
                      },
                      {
                        id: 1740,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Types of Roughage`,
                        body: `There are two main types of roughage:\n1. Soluble fiber: This type dissolves in water. It's found in foods like oats, peas, and apples.\n2. Insoluble fiber: This type doesn't dissolve in water. It's found in foods like wheat bran, nuts, and many vegetables.`,
                      },
                      {
                        id: 1750,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Why is Roughage Important? Reason 1: Digestive Health`,
                        body: `Roughage is very important for our digestive system:\n• It helps food move through our digestive tract\n• It prevents constipation by adding bulk to our stool\n• It helps us feel full, which can prevent overeating`,
                      },
                      {
                        id: 1760,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Why is Roughage Important? Reason 2: Blood Sugar Control`,
                        body: `Roughage, especially soluble fiber, can help control blood sugar levels:\n• It slows down the absorption of sugar\n• This can help prevent rapid spikes in blood sugar after meals\n• This is especially important for people with diabetes`,
                      },
                      {
                        id: 1770,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Why is Roughage Important? Reason 3: Heart Health`,
                        body: `Roughage can be good for our heart:\n• It can help lower cholesterol levels\n• This can reduce the risk of heart diseases\n• It may also help control blood pressure`,
                      },
                      {
                        id: 1780,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Why is Roughage Important? Reason 4: Weight Management`,
                        body: `Roughage can help in maintaining a healthy weight:\n• It makes us feel full for longer\n• This can prevent overeating\n• Foods high in fiber are often lower in calories`,
                      },
                      {
                        id: 1790,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `How Much Roughage Do We Need?`,
                        body: `• Children your age should aim for about 20-25 grams of fiber per day\n• You can get this by eating plenty of fruits, vegetables, and whole grains\n• It's better to get fiber from food rather than supplements\n• Increase fiber intake gradually and drink plenty of water`,
                      },
                      {
                        id: 1800,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: `Remember`,
                        body: `• Roughage is the part of plant foods that our body doesn't digest\n• It's important for digestive health, blood sugar control, heart health, and weight management\n• Good sources include fruits, vegetables, whole grains, and legumes\n• Aim to include fiber-rich foods in your daily diet`,
                      },
                      {
                        id: 1810,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1820,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1830,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1840,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 1850,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        subjectId: 3,
        title: "History",
        imageSrc: "/man.svg",
        chapters: [
          {
            id: 31,
            description: `From Hunting-Gathering to Growing Food`,
            order: 1,
            title: "Chapter 1",
            topics: [
              {
                id: 2010,
                description: `Hunter-gatherers and their lifestyle`,
                order: 1,
                title: "Topic 1",
                lessons: [
                  {
                    id: 311,
                    title: "Understanding Early Human Survival",
                    order: 1,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Who were the hunter-gatherers?",
                        order: 1,
                        difficulty: 1,
                        id: 90011001,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "People who grew crops",
                          },
                          {
                            correct: true,
                            text: "People who hunted animals and gathered wild plants",
                          },
                          {
                            correct: false,
                            text: "People who built large cities",
                          },
                          {
                            correct: false,
                            text: "People who worked in factories",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was the primary occupation of hunter-gatherers?",
                        order: 2,
                        difficulty: 1,
                        id: 90011002,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Farming",
                          },
                          {
                            correct: false,
                            text: "Trading",
                          },
                          {
                            correct: true,
                            text: "Hunting animals and gathering plants",
                          },
                          {
                            correct: false,
                            text: "Fishing",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why did hunter-gatherers move from place to place?",
                        order: 3,
                        difficulty: 1,
                        id: 90011003,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "To find new lands to farm",
                          },
                          {
                            correct: true,
                            text: "To follow animal herds and seasonal plants",
                          },
                          {
                            correct: false,
                            text: "To build permanent homes",
                          },
                          {
                            correct: false,
                            text: "To start businesses",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which tools were commonly used by hunter-gatherers?",
                        order: 4,
                        difficulty: 1,
                        id: 90011004,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Ploughs and hoes",
                          },
                          {
                            correct: true,
                            text: "Bows, arrows, and stone tools",
                          },
                          {
                            correct: false,
                            text: "Tractors and combines",
                          },
                          {
                            correct: false,
                            text: "Computers and phones",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What did hunter-gatherers mainly rely on for their diet?",
                        order: 5,
                        difficulty: 1,
                        id: 90011005,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Cultivated crops",
                          },
                          {
                            correct: true,
                            text: "Hunted animals and gathered wild fruits and nuts",
                          },
                          {
                            correct: false,
                            text: "Dairy products",
                          },
                          {
                            correct: false,
                            text: "Imported foods",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Where did hunter-gatherers live?",
                        order: 6,
                        difficulty: 1,
                        id: 90011006,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "In cities",
                          },
                          {
                            correct: false,
                            text: "In permanent houses",
                          },
                          {
                            correct: true,
                            text: "In temporary shelters or caves",
                          },
                          {
                            correct: false,
                            text: "In skyscrapers",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is a key characteristic of the hunter-gatherer lifestyle?",
                        order: 7,
                        difficulty: 1,
                        id: 90011007,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Farming on large fields",
                          },
                          {
                            correct: true,
                            text: "Nomadic movement and seasonal migration",
                          },
                          {
                            correct: false,
                            text: "Building large stone monuments",
                          },
                          {
                            correct: false,
                            text: "Writing and recording history",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What type of society did hunter-gatherers live in?",
                        order: 8,
                        difficulty: 1,
                        id: 90011008,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Industrial",
                          },
                          {
                            correct: false,
                            text: "Agrarian",
                          },
                          {
                            correct: true,
                            text: "Nomadic and egalitarian",
                          },
                          {
                            correct: false,
                            text: "Urban",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "How did hunter-gatherers obtain food?",
                        order: 9,
                        difficulty: 1,
                        id: 90011009,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "By buying it from stores",
                          },
                          {
                            correct: false,
                            text: "By growing it themselves",
                          },
                          {
                            correct: true,
                            text: "By hunting animals and gathering wild plants",
                          },
                          {
                            correct: false,
                            text: "By trading with other countries",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What did hunter-gatherers use to hunt animals?",
                        order: 10,
                        difficulty: 1,
                        id: 90011010,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Fireworks",
                          },
                          {
                            correct: false,
                            text: "Guns",
                          },
                          {
                            correct: true,
                            text: "Spears and bows",
                          },
                          {
                            correct: false,
                            text: "Tractors",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What kind of shelters did hunter-gatherers use?",
                        order: 11,
                        difficulty: 1,
                        id: 90011011,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Permanent stone houses",
                          },
                          {
                            correct: false,
                            text: "Mud huts",
                          },
                          {
                            correct: true,
                            text: "Temporary shelters like tents or caves",
                          },
                          {
                            correct: false,
                            text: "Wooden cabins",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "How did hunter-gatherers make their tools?",
                        order: 12,
                        difficulty: 1,
                        id: 90011012,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Using metal foundries",
                          },
                          {
                            correct: true,
                            text: "By carving stone, bone, and wood",
                          },
                          {
                            correct: false,
                            text: "By 3D printing",
                          },
                          {
                            correct: false,
                            text: "By buying them from markets",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was a common feature of hunter-gatherer societies?",
                        order: 13,
                        difficulty: 1,
                        id: 90011013,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Large armies",
                          },
                          {
                            correct: false,
                            text: "Permanent farms",
                          },
                          {
                            correct: true,
                            text: "Shared resources and communal living",
                          },
                          {
                            correct: false,
                            text: "Tall buildings",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following was NOT a typical activity of hunter-gatherers?",
                        order: 14,
                        difficulty: 1,
                        id: 90011014,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "Farming",
                          },
                          {
                            correct: false,
                            text: "Gathering berries",
                          },
                          {
                            correct: false,
                            text: "Hunting deer",
                          },
                          {
                            correct: false,
                            text: "Fishing",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why is the lifestyle of hunter-gatherers considered nomadic?",
                        order: 15,
                        difficulty: 1,
                        id: 90011015,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They stayed in one place permanently",
                          },
                          {
                            correct: true,
                            text: "They moved frequently in search of food and resources",
                          },
                          {
                            correct: false,
                            text: "They built permanent cities",
                          },
                          {
                            correct: false,
                            text: "They owned large amounts of land",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which materials were primarily used by hunter-gatherers to make their tools?",
                        order: 16,
                        difficulty: 2,
                        id: 90012001,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Metal and plastic",
                          },
                          {
                            correct: true,
                            text: "Stone, bone, and wood",
                          },
                          {
                            correct: false,
                            text: "Concrete and glass",
                          },
                          {
                            correct: false,
                            text: "Steel and rubber",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the hunter-gatherer way of life affect their social structure?",
                        order: 17,
                        difficulty: 2,
                        id: 90012002,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It created a complex class system",
                          },
                          {
                            correct: true,
                            text: "It promoted equality and cooperation within small groups",
                          },
                          {
                            correct: false,
                            text: "It led to the establishment of monarchies",
                          },
                          {
                            correct: false,
                            text: "It resulted in a capitalist economy",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was the role of women in hunter-gatherer societies?",
                        order: 18,
                        difficulty: 2,
                        id: 90012003,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Only hunting",
                          },
                          {
                            correct: false,
                            text: "Only gathering",
                          },
                          {
                            correct: true,
                            text: "Gathering, food preparation, and sometimes hunting",
                          },
                          {
                            correct: false,
                            text: "Leading armies",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following statements about hunter-gatherer diet is true?",
                        order: 19,
                        difficulty: 2,
                        id: 90012004,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They ate only meat",
                          },
                          {
                            correct: true,
                            text: "They had a varied diet including meat, fish, fruits, nuts, and vegetables",
                          },
                          {
                            correct: false,
                            text: "They ate only plants",
                          },
                          {
                            correct: false,
                            text: "They relied on dairy products",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did hunter-gatherers adapt to their environment?",
                        order: 20,
                        difficulty: 2,
                        id: 90012005,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "By building large farms",
                          },
                          {
                            correct: true,
                            text: "By creating tools and strategies to hunt and gather effectively",
                          },
                          {
                            correct: false,
                            text: "By constructing skyscrapers",
                          },
                          {
                            correct: false,
                            text: "By forming large governments",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was the main reason hunter-gatherers moved with the seasons?",
                        order: 21,
                        difficulty: 2,
                        id: 90012006,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "To attend festivals",
                          },
                          {
                            correct: true,
                            text: "To follow the migration patterns of animals and availability of plants",
                          },
                          {
                            correct: false,
                            text: "To build new homes",
                          },
                          {
                            correct: false,
                            text: "To visit other tribes",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the use of fire benefit hunter-gatherers?",
                        order: 22,
                        difficulty: 2,
                        id: 90012007,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It provided a source of light and heat",
                          },
                          {
                            correct: true,
                            text: "It allowed them to cook food and protect themselves from predators",
                          },
                          {
                            correct: false,
                            text: "It helped them create metal tools",
                          },
                          {
                            correct: false,
                            text: "It was used mainly for decoration",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was the significance of rock paintings created by hunter-gatherers?",
                        order: 23,
                        difficulty: 2,
                        id: 90012008,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They were just for decoration",
                          },
                          {
                            correct: true,
                            text: "They recorded important events and daily activities",
                          },
                          {
                            correct: false,
                            text: "They served as advertisements",
                          },
                          {
                            correct: false,
                            text: "They were used as maps",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why is the study of hunter-gatherer societies important for understanding human history?",
                        order: 24,
                        difficulty: 2,
                        id: 90012009,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It shows the origins of agriculture",
                          },
                          {
                            correct: true,
                            text: "It reveals the ways early humans adapted to their environment and organized their societies",
                          },
                          {
                            correct: false,
                            text: "It highlights ancient technology",
                          },
                          {
                            correct: false,
                            text: "It focuses on ancient civilizations",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What kind of evidence do archaeologists find to learn about hunter-gatherer life?",
                        order: 25,
                        difficulty: 2,
                        id: 90012010,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Written records",
                          },
                          {
                            correct: true,
                            text: "Tools, bones, and cave paintings",
                          },
                          {
                            correct: false,
                            text: "Modern buildings",
                          },
                          {
                            correct: false,
                            text: "Newspapers",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was one of the main challenges faced by hunter-gatherers?",
                        order: 26,
                        difficulty: 2,
                        id: 90012011,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Lack of water",
                          },
                          {
                            correct: true,
                            text: "Finding enough food throughout the year",
                          },
                          {
                            correct: false,
                            text: "Building permanent homes",
                          },
                          {
                            correct: false,
                            text: "Communicating with other tribes",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What does the term 'Paleolithic' refer to?",
                        order: 27,
                        difficulty: 2,
                        id: 90012012,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "New Stone Age",
                          },
                          {
                            correct: true,
                            text: "Old Stone Age",
                          },
                          {
                            correct: false,
                            text: "Iron Age",
                          },
                          {
                            correct: false,
                            text: "Bronze Age",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the invention of tools impact the hunter-gatherer lifestyle?",
                        order: 28,
                        difficulty: 2,
                        id: 90012013,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It made hunting and gathering less efficient",
                          },
                          {
                            correct: true,
                            text: "It increased their ability to hunt and gather food more effectively",
                          },
                          {
                            correct: false,
                            text: "It was only used for decoration",
                          },
                          {
                            correct: false,
                            text: "It led to the abandonment of hunting",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why were hunter-gatherer groups typically small?",
                        order: 29,
                        difficulty: 2,
                        id: 90012014,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Because they wanted to avoid detection",
                          },
                          {
                            correct: true,
                            text: "To ensure mobility and ease of resource sharing",
                          },
                          {
                            correct: false,
                            text: "Because they didn't like large groups",
                          },
                          {
                            correct: false,
                            text: "Because they had limited tools",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is an example of a natural resource that hunter-gatherers depended on?",
                        order: 30,
                        difficulty: 2,
                        id: 90012015,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Oil",
                          },
                          {
                            correct: true,
                            text: "Wild plants and animals",
                          },
                          {
                            correct: false,
                            text: "Manufactured goods",
                          },
                          {
                            correct: false,
                            text: "Electronics",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did hunter-gatherers contribute to the spread of early human populations?",
                        order: 31,
                        difficulty: 3,
                        id: 90013001,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "By staying in one place",
                          },
                          {
                            correct: true,
                            text: "By migrating to new areas and adapting to different environments",
                          },
                          {
                            correct: false,
                            text: "By building cities",
                          },
                          {
                            correct: false,
                            text: "By writing historical records",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What evidence supports the theory that early humans practiced collective hunting strategies?",
                        order: 32,
                        difficulty: 3,
                        id: 90013002,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Solitary hunting tools",
                          },
                          {
                            correct: true,
                            text: "Large animal bones found with multiple tool marks",
                          },
                          {
                            correct: false,
                            text: "Written documents from that period",
                          },
                          {
                            correct: false,
                            text: "Photographs of hunts",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did changes in climate affect hunter-gatherer lifestyles?",
                        order: 33,
                        difficulty: 3,
                        id: 90013003,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It had no effect",
                          },
                          {
                            correct: true,
                            text: "It influenced migration patterns and availability of food resources",
                          },
                          {
                            correct: false,
                            text: "It made them settle permanently",
                          },
                          {
                            correct: false,
                            text: "It led to the invention of agriculture",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the significance of the discovery of cave paintings in understanding hunter-gatherer cultures?",
                        order: 34,
                        difficulty: 3,
                        id: 90013004,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They were purely decorative",
                          },
                          {
                            correct: true,
                            text: "They provide insights into their daily lives, beliefs, and environment",
                          },
                          {
                            correct: false,
                            text: "They were used for trade",
                          },
                          {
                            correct: false,
                            text: "They were made by modern humans",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did hunter-gatherers' knowledge of plants benefit their survival?",
                        order: 35,
                        difficulty: 3,
                        id: 90013005,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It had no benefit",
                          },
                          {
                            correct: true,
                            text: "It helped them identify edible and medicinal plants",
                          },
                          {
                            correct: false,
                            text: "It was used to create gardens",
                          },
                          {
                            correct: false,
                            text: "It was only theoretical knowledge",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why are hunter-gatherers considered to have an egalitarian social structure?",
                        order: 36,
                        difficulty: 3,
                        id: 90013006,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They had strict class systems",
                          },
                          {
                            correct: true,
                            text: "Resources were shared equally and decisions were made collectively",
                          },
                          {
                            correct: false,
                            text: "They had kings and queens",
                          },
                          {
                            correct: false,
                            text: "They lived in large cities",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What methods did hunter-gatherers use to ensure the sustainability of their resources?",
                        order: 37,
                        difficulty: 3,
                        id: 90013007,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Overhunting",
                          },
                          {
                            correct: true,
                            text: "Moving to new areas to allow resources to replenish",
                          },
                          {
                            correct: false,
                            text: "Storing large quantities of food",
                          },
                          {
                            correct: false,
                            text: "Farming intensively",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the seasonal movement of hunter-gatherers impact their social interactions?",
                        order: 38,
                        difficulty: 3,
                        id: 90013008,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It isolated them from other groups",
                          },
                          {
                            correct: true,
                            text: "It facilitated the exchange of ideas, tools, and cultural practices with other groups",
                          },
                          {
                            correct: false,
                            text: "It prevented them from meeting others",
                          },
                          {
                            correct: false,
                            text: "It limited their ability to develop new technologies",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What role did animals play in the life of hunter-gatherers?",
                        order: 39,
                        difficulty: 3,
                        id: 90013009,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They were only used as pets",
                          },
                          {
                            correct: true,
                            text: "They were hunted for food, and their bones and hides were used for tools and clothing",
                          },
                          {
                            correct: false,
                            text: "They were worshipped exclusively",
                          },
                          {
                            correct: false,
                            text: "They were kept in zoos",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the development of language impact hunter-gatherer societies?",
                        order: 40,
                        difficulty: 3,
                        id: 90013010,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It had no impact",
                          },
                          {
                            correct: true,
                            text: "It enabled better coordination during hunts and the sharing of knowledge and traditions",
                          },
                          {
                            correct: false,
                            text: "It made communication more difficult",
                          },
                          {
                            correct: false,
                            text: "It was only used for writing",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What does the term 'Mesolithic' refer to?",
                        order: 41,
                        difficulty: 3,
                        id: 90013011,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "New Stone Age",
                          },
                          {
                            correct: true,
                            text: "Middle Stone Age",
                          },
                          {
                            correct: false,
                            text: "Iron Age",
                          },
                          {
                            correct: false,
                            text: "Bronze Age",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why is the study of hunter-gatherer societies important for modern humans?",
                        order: 42,
                        difficulty: 3,
                        id: 90013012,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It has no relevance",
                          },
                          {
                            correct: true,
                            text: "It helps us understand the foundations of human survival, adaptation, and social organization",
                          },
                          {
                            correct: false,
                            text: "It only interests historians",
                          },
                          {
                            correct: false,
                            text: "It shows us how to build modern tools",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is one way that hunter-gatherers influenced their environment?",
                        order: 43,
                        difficulty: 3,
                        id: 90013013,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "By building dams",
                          },
                          {
                            correct: true,
                            text: "Through controlled use of fire to manage vegetation",
                          },
                          {
                            correct: false,
                            text: "By constructing large buildings",
                          },
                          {
                            correct: false,
                            text: "By mining extensively",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did hunter-gatherers' knowledge of animal behavior aid their hunting practices?",
                        order: 44,
                        difficulty: 3,
                        id: 90013014,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It was irrelevant",
                          },
                          {
                            correct: true,
                            text: "It allowed them to predict animal movements and devise effective hunting strategies",
                          },
                          {
                            correct: false,
                            text: "It made hunting more dangerous",
                          },
                          {
                            correct: false,
                            text: "It led to the domestication of animals",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why did hunter-gatherers create art and symbolic objects?",
                        order: 45,
                        difficulty: 3,
                        id: 90013015,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "For no reason",
                          },
                          {
                            correct: true,
                            text: "To express beliefs, record events, and enhance social cohesion",
                          },
                          {
                            correct: false,
                            text: "Only to sell them",
                          },
                          {
                            correct: false,
                            text: "To destroy them later",
                          },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 2010,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "What are hunter-gatherers?",
                        body: `Hunter-gatherers were early humans who lived by hunting animals and gathering wild plants for food. They didn't grow crops or keep animals like we do today.`,
                      },
                      {
                        id: 2020,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "How did they get food?",
                        body: `• Hunting: They caught animals like deer, rabbits, and fish for meat.\n• Gathering: They collected fruits, nuts, roots, and leaves from plants in their surroundings.`,
                      },
                      {
                        id: 2030,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Where did they live?",
                        body: `Hunter-gatherers were nomads. This means they didn't have permanent homes. Instead, they moved from place to place in search of food and water.`,
                      },
                      {
                        id: 2040,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Why did they move around?",
                        body: `• To follow animal herds they hunted\n• To find new areas with plenty of plants to gather\n• To locate water sources\n• To adapt to changing seasons`,
                      },
                      {
                        id: 2050,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "How did they live?",
                        body: `• In small groups: Usually 20-30 people, often related to each other\n• Sharing: They shared food and resources within their group\n• Simple shelters: They made temporary homes from materials like animal skins or tree branches\n• Division of tasks: Different group members had different jobs, like hunting or tool-making`,
                      },
                      {
                        id: 2060,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "What skills did they need?",
                        body: `Hunter-gatherers needed many skills to survive:\n• Tracking animals\n• Making and using tools\n• Identifying safe plants to eat\n• Finding water\n• Building shelters\n• Working together as a team`,
                      },
                      {
                        id: 2070,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "How was their life different from ours?",
                        body: `• No farming: They didn't grow their own food\n• No domesticated animals: They didn't keep animals like cows or chickens\n• Constant movement: They didn't live in one place all year\n• Close to nature: Their survival depended on understanding their environment\n• No money or markets: They used what they found or made themselves`,
                      },
                      {
                        id: 2080,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2090,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2100,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2110,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2111,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
              {
                id: 2020,
                description: `Tools and Implements used by early humans`,
                order: 2,
                title: "Topic 2",
                lessons: [
                  {
                    id: 312,
                    title: "Discovering How Our Ancestors Shaped Their World",
                    order: 2,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What materials did early humans use to make their tools?",
                        order: 1,
                        difficulty: 1,
                        id: 90022050,
                        challengeOptions: [
                          { correct: false, text: "Plastic and metal" },
                          { correct: true, text: "Stone, bone, and wood" },
                          { correct: false, text: "Concrete and steel" },
                          { correct: false, text: "Rubber and glass" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is a primary purpose of early human tools?",
                        order: 2,
                        difficulty: 1,
                        id: 90022051,
                        challengeOptions: [
                          { correct: false, text: "Decoration" },
                          { correct: true, text: "Hunting and gathering" },
                          { correct: false, text: "Writing" },
                          { correct: false, text: "Transportation" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is a common tool used by early humans?",
                        order: 3,
                        difficulty: 1,
                        id: 90022052,
                        challengeOptions: [
                          { correct: false, text: "Hammer" },
                          { correct: true, text: "Spear" },
                          { correct: false, text: "Computer" },
                          { correct: false, text: "Telephone" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Why did early humans make tools from stone?",
                        order: 4,
                        difficulty: 1,
                        id: 90022053,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "Stone was easily available and could be shaped",
                          },
                          { correct: false, text: "Stone was colorful" },
                          { correct: false, text: "Stone was rare" },
                          {
                            correct: false,
                            text: "Stone was soft and flexible",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the name of the period when early humans used stone tools?",
                        order: 5,
                        difficulty: 1,
                        id: 90022054,
                        challengeOptions: [
                          { correct: false, text: "Bronze Age" },
                          { correct: false, text: "Iron Age" },
                          { correct: true, text: "Stone Age" },
                          { correct: false, text: "Modern Age" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which tool was commonly used by early humans for cutting?",
                        order: 6,
                        difficulty: 1,
                        id: 90022055,
                        challengeOptions: [
                          { correct: false, text: "Knife" },
                          { correct: true, text: "Axe" },
                          { correct: false, text: "Scissors" },
                          { correct: false, text: "Saw" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What tool did early humans use to hunt animals from a distance?",
                        order: 7,
                        difficulty: 1,
                        id: 90022056,
                        challengeOptions: [
                          { correct: true, text: "Bow and arrow" },
                          { correct: false, text: "Hammer" },
                          { correct: false, text: "Knife" },
                          { correct: false, text: "Hoe" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which tool was primarily used for digging and preparing the ground?",
                        order: 8,
                        difficulty: 1,
                        id: 90022057,
                        challengeOptions: [
                          { correct: true, text: "Hoe" },
                          { correct: false, text: "Axe" },
                          { correct: false, text: "Spear" },
                          { correct: false, text: "Needle" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was a hand axe used for by early humans?",
                        order: 9,
                        difficulty: 1,
                        id: 90022058,
                        challengeOptions: [
                          { correct: false, text: "Writing" },
                          {
                            correct: true,
                            text: "Digging, cutting, and hunting",
                          },
                          { correct: false, text: "Cooking" },
                          { correct: false, text: "Painting" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "How were early human tools typically made?",
                        order: 10,
                        difficulty: 1,
                        id: 90022059,
                        challengeOptions: [
                          { correct: false, text: "Forging in fire" },
                          { correct: true, text: "Carving and chipping stone" },
                          { correct: false, text: "Molding plastic" },
                          { correct: false, text: "Using machines" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is a characteristic of the tools used in the Paleolithic era?",
                        order: 11,
                        difficulty: 1,
                        id: 90022060,
                        challengeOptions: [
                          { correct: false, text: "Complex designs" },
                          { correct: true, text: "Simple and functional" },
                          { correct: false, text: "Electronic components" },
                          { correct: false, text: "Made of gold" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Which tool was not used by early humans?",
                        order: 12,
                        difficulty: 1,
                        id: 90022061,
                        challengeOptions: [
                          { correct: false, text: "Spear" },
                          { correct: false, text: "Bow and arrow" },
                          { correct: true, text: "Tractor" },
                          { correct: false, text: "Hand axe" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What purpose did the early human tool called a 'scraper' serve?",
                        order: 13,
                        difficulty: 1,
                        id: 90022062,
                        challengeOptions: [
                          { correct: false, text: "Writing" },
                          { correct: true, text: "Scraping animal hides" },
                          { correct: false, text: "Building houses" },
                          { correct: false, text: "Playing music" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Why were tools important for early humans?",
                        order: 14,
                        difficulty: 1,
                        id: 90022063,
                        challengeOptions: [
                          { correct: false, text: "For artistic expression" },
                          {
                            correct: true,
                            text: "To make their daily tasks easier and more efficient",
                          },
                          {
                            correct: false,
                            text: "For trading with other communities",
                          },
                          { correct: false, text: "For religious rituals" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What does the term 'Neolithic' refer to in terms of tools?",
                        order: 15,
                        difficulty: 1,
                        id: 90022064,
                        challengeOptions: [
                          { correct: true, text: "New Stone Age" },
                          { correct: false, text: "Old Stone Age" },
                          { correct: false, text: "Iron Age" },
                          { correct: false, text: "Bronze Age" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which tool innovation is attributed to the Mesolithic period?",
                        order: 16,
                        difficulty: 2,
                        id: 90022065,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "Microblades and composite tools",
                          },
                          { correct: false, text: "Iron tools" },
                          { correct: false, text: "Metal weapons" },
                          { correct: false, text: "Complex machinery" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was a significant improvement in tools during the Neolithic period?",
                        order: 17,
                        difficulty: 2,
                        id: 90022066,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Introduction of iron tools",
                          },
                          {
                            correct: true,
                            text: "Polished stone tools and farming implements",
                          },
                          { correct: false, text: "Use of plastic" },
                          {
                            correct: false,
                            text: "Development of electronics",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "How did early humans shape stone tools?",
                        order: 18,
                        difficulty: 2,
                        id: 90022067,
                        challengeOptions: [
                          { correct: false, text: "By melting and molding" },
                          {
                            correct: true,
                            text: "By flaking and chipping away at the stone",
                          },
                          {
                            correct: false,
                            text: "By using chemical reactions",
                          },
                          { correct: false, text: "By 3D printing" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following tools was used for grinding grain?",
                        order: 19,
                        difficulty: 2,
                        id: 90022068,
                        challengeOptions: [
                          { correct: false, text: "Bow and arrow" },
                          { correct: true, text: "Grinding stone or quern" },
                          { correct: false, text: "Spear" },
                          { correct: false, text: "Knife" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is a 'microlith'?",
                        order: 20,
                        difficulty: 2,
                        id: 90022069,
                        challengeOptions: [
                          { correct: false, text: "A large stone tool" },
                          {
                            correct: true,
                            text: "A small, finely made stone tool",
                          },
                          { correct: false, text: "A type of metal tool" },
                          { correct: false, text: "A bone tool" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "Why were composite tools significant?",
                        order: 21,
                        difficulty: 2,
                        id: 90022070,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They were made from a single material",
                          },
                          {
                            correct: true,
                            text: "They combined different materials for greater efficiency",
                          },
                          {
                            correct: false,
                            text: "They were purely decorative",
                          },
                          {
                            correct: false,
                            text: "They were used for farming",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the use of bone and antler in tool-making benefit early humans?",
                        order: 22,
                        difficulty: 2,
                        id: 90022071,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "These materials were harder to work with",
                          },
                          {
                            correct: true,
                            text: "They provided greater flexibility and resilience",
                          },
                          {
                            correct: false,
                            text: "They were less durable than stone",
                          },
                          { correct: false, text: "They were more colorful" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the significance of finding tools at archaeological sites?",
                        order: 23,
                        difficulty: 2,
                        id: 90022072,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It shows the artistic abilities of early humans",
                          },
                          {
                            correct: true,
                            text: "It provides evidence of early human activities and adaptations",
                          },
                          { correct: false, text: "It is not significant" },
                          { correct: false, text: "It indicates trade routes" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the importance of the discovery of early human tools in Africa?",
                        order: 24,
                        difficulty: 2,
                        id: 90022073,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It is the only place tools were found",
                          },
                          {
                            correct: true,
                            text: "It supports the theory that Africa is the cradle of humankind",
                          },
                          {
                            correct: false,
                            text: "It disproves human evolution",
                          },
                          {
                            correct: false,
                            text: "It suggests humans originated elsewhere",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which tool would early humans most likely use for fishing?",
                        order: 25,
                        difficulty: 2,
                        id: 90022074,
                        challengeOptions: [
                          { correct: false, text: "Bow and arrow" },
                          {
                            correct: true,
                            text: "Fishing hooks made of bone or wood",
                          },
                          { correct: false, text: "Hand axe" },
                          { correct: false, text: "Grinding stone" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was a major advancement in tool-making during the Mesolithic era?",
                        order: 26,
                        difficulty: 2,
                        id: 90022075,
                        challengeOptions: [
                          { correct: false, text: "Use of metal tools" },
                          {
                            correct: true,
                            text: "Creation of smaller, more complex tools like microliths",
                          },
                          {
                            correct: false,
                            text: "Development of electronic devices",
                          },
                          {
                            correct: false,
                            text: "Construction of large buildings",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why is the study of early human tools important?",
                        order: 27,
                        difficulty: 2,
                        id: 90022076,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It shows the level of technological advancement",
                          },
                          {
                            correct: true,
                            text: "It helps understand the daily lives and survival strategies of early humans",
                          },
                          {
                            correct: false,
                            text: "It has no historical value",
                          },
                          {
                            correct: false,
                            text: "It is only of interest to tool makers",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did early humans use the natural environment to create tools?",
                        order: 28,
                        difficulty: 2,
                        id: 90022077,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They relied solely on imported materials",
                          },
                          {
                            correct: true,
                            text: "They used locally available materials like stone, wood, and bone",
                          },
                          {
                            correct: false,
                            text: "They created synthetic materials",
                          },
                          {
                            correct: false,
                            text: "They avoided using natural materials",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was a 'burin' used for by early humans?",
                        order: 29,
                        difficulty: 2,
                        id: 90022078,
                        challengeOptions: [
                          { correct: false, text: "Hunting large animals" },
                          { correct: true, text: "Engraving or carving" },
                          { correct: false, text: "Grinding grains" },
                          { correct: false, text: "Building structures" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which advancement marks the transition from the Paleolithic to the Neolithic period?",
                        order: 30,
                        difficulty: 2,
                        id: 90022079,
                        challengeOptions: [
                          { correct: false, text: "Use of electronic tools" },
                          {
                            correct: true,
                            text: "Development of agriculture and more advanced tools",
                          },
                          { correct: false, text: "Invention of the wheel" },
                          { correct: false, text: "Use of iron" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the significance of the Acheulean hand axe?",
                        order: 31,
                        difficulty: 3,
                        id: 90022080,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It was the first metal tool",
                          },
                          {
                            correct: true,
                            text: "It represents a major advancement in tool-making with its standardized design",
                          },
                          { correct: false, text: "It was used for writing" },
                          { correct: false, text: "It was made of plastic" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the development of tool-making skills impact early human societies?",
                        order: 32,
                        difficulty: 3,
                        id: 90022081,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It made them more dependent on other species",
                          },
                          {
                            correct: true,
                            text: "It enhanced their ability to adapt and survive in diverse environments",
                          },
                          {
                            correct: false,
                            text: "It isolated them from one another",
                          },
                          { correct: false, text: "It limited their mobility" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What does the term 'Oldowan' refer to?",
                        order: 33,
                        difficulty: 3,
                        id: 90022082,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "A type of advanced electronic device",
                          },
                          {
                            correct: true,
                            text: "The earliest known stone tool industry",
                          },
                          {
                            correct: false,
                            text: "A modern tool-making technique",
                          },
                          {
                            correct: false,
                            text: "A type of Neolithic pottery",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What innovation is associated with the Upper Paleolithic period?",
                        order: 34,
                        difficulty: 3,
                        id: 90022083,
                        challengeOptions: [
                          { correct: false, text: "Simple stone flakes" },
                          {
                            correct: true,
                            text: "Sophisticated tools like blades and burins",
                          },
                          { correct: false, text: "Iron tools" },
                          { correct: false, text: "Wooden tools" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the discovery of controlled use of fire affect early tool-making?",
                        order: 35,
                        difficulty: 3,
                        id: 90022084,
                        challengeOptions: [
                          { correct: false, text: "It had no impact" },
                          {
                            correct: true,
                            text: "It allowed for the hardening of wooden tools and the development of new techniques",
                          },
                          {
                            correct: false,
                            text: "It made tools less effective",
                          },
                          {
                            correct: false,
                            text: "It was only used for cooking",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is a 'biface' and why is it important?",
                        order: 36,
                        difficulty: 3,
                        id: 90022085,
                        challengeOptions: [
                          { correct: false, text: "A single-edged tool" },
                          {
                            correct: true,
                            text: "A stone tool flaked on both sides, showing advanced skill",
                          },
                          { correct: false, text: "A tool made of metal" },
                          { correct: false, text: "A decorative item" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why is the Levallois technique significant in the study of early tools?",
                        order: 37,
                        difficulty: 3,
                        id: 90022086,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It was the first use of metal",
                          },
                          {
                            correct: true,
                            text: "It shows a sophisticated method of producing uniformly shaped flakes",
                          },
                          {
                            correct: false,
                            text: "It was used for creating pottery",
                          },
                          {
                            correct: false,
                            text: "It was a method of fishing",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What does the presence of specialized tools at an archaeological site indicate?",
                        order: 38,
                        difficulty: 3,
                        id: 90022087,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "The site was used for recreational purposes",
                          },
                          {
                            correct: true,
                            text: "Early humans had diverse activities and roles",
                          },
                          {
                            correct: false,
                            text: "Tools were used as currency",
                          },
                          {
                            correct: false,
                            text: "The site was abandoned quickly",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was the purpose of early human tools like the atlatl?",
                        order: 39,
                        difficulty: 3,
                        id: 90022088,
                        challengeOptions: [
                          { correct: false, text: "Writing" },
                          {
                            correct: true,
                            text: "Throwing spears with greater force and accuracy",
                          },
                          { correct: false, text: "Cooking" },
                          { correct: false, text: "Building shelters" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What evidence suggests that early humans had a deep understanding of material properties?",
                        order: 40,
                        difficulty: 3,
                        id: 90022089,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Randomly selected materials",
                          },
                          {
                            correct: true,
                            text: "Choice of specific stones for different tools based on hardness and sharpness",
                          },
                          { correct: false, text: "Avoidance of stone tools" },
                          {
                            correct: false,
                            text: "Use of materials that were aesthetically pleasing",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did early humans adapt their tools to different environments?",
                        order: 41,
                        difficulty: 3,
                        id: 90022090,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They used the same tools everywhere",
                          },
                          {
                            correct: true,
                            text: "They developed region-specific tools using local materials",
                          },
                          { correct: false, text: "They avoided making tools" },
                          {
                            correct: false,
                            text: "They traded tools across continents",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What does the variety of tools found at archaeological sites suggest about early human behavior?",
                        order: 42,
                        difficulty: 3,
                        id: 90022091,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They had a simple, monotonous lifestyle",
                          },
                          {
                            correct: true,
                            text: "They had complex social structures and division of labor",
                          },
                          {
                            correct: false,
                            text: "They did not use tools often",
                          },
                          {
                            correct: false,
                            text: "They were highly dependent on other animals",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the significance of finding wear patterns on early tools?",
                        order: 43,
                        difficulty: 3,
                        id: 90022092,
                        challengeOptions: [
                          { correct: false, text: "It has no significance" },
                          {
                            correct: true,
                            text: "It helps determine how tools were used and for what purposes",
                          },
                          {
                            correct: false,
                            text: "It indicates poor craftsmanship",
                          },
                          {
                            correct: false,
                            text: "It shows they were used as currency",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the development of tools influence early human migration?",
                        order: 44,
                        difficulty: 3,
                        id: 90022093,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It restricted their movement",
                          },
                          {
                            correct: true,
                            text: "It enabled them to exploit new environments and expand their territories",
                          },
                          { correct: false, text: "It had no impact" },
                          {
                            correct: false,
                            text: "It caused them to settle permanently",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What can the study of tool-making techniques tell us about early human cognition?",
                        order: 45,
                        difficulty: 3,
                        id: 90022094,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It reveals nothing about their thinking",
                          },
                          {
                            correct: true,
                            text: "It provides insights into their problem-solving abilities and creativity",
                          },
                          {
                            correct: false,
                            text: "It shows they were not intelligent",
                          },
                          {
                            correct: false,
                            text: "It is irrelevant to their cognitive abilities",
                          },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 2120,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "What are tools?",
                        body: `Tools are objects that humans use to make tasks easier. Early humans made simple tools to help them survive and do daily activities like hunting, gathering food, and making shelters.`,
                      },
                      {
                        id: 2130,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "The first tools",
                        body: `• Stone tools: The earliest tools were made from stones.\n• How they were made: Early humans would strike one stone against another to create sharp edges.\n• Uses: These sharp stone tools were used for cutting meat, scraping animal hides, and digging for roots.`,
                      },
                      {
                        id: 2140,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Types of stone tools",
                        body: `1. Handaxes: Teardrop-shaped tools used for cutting and chopping.\n2. Scrapers: Tools with a flat edge used to clean animal hides.\n3. Choppers: Heavy tools used for breaking bones and woody plants.\n4. Points: Sharp tools used as spearheads for hunting.`,
                      },
                      {
                        id: 2150,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Beyond stone: Other materials",
                        body: `As time passed, early humans learned to use other materials:\n• Wood: Used to make spears, clubs, and handles for stone tools.\n• Bone: Animal bones were shaped into needles, fishhooks, and harpoons.\n• Animal hides: Used to make clothing and shelters.`,
                      },
                      {
                        id: 2160,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Composite tools",
                        body: `Early humans eventually learned to combine materials to make more effective tools:\n• Stone axe heads attached to wooden handles\n• Bone points fixed to wooden spears\n• Stone blades inserted into bone or wooden handles to make knives`,
                      },
                      {
                        id: 2170,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "How tools changed over time",
                        body: `• Became more specialized: Tools were designed for specific tasks\n• Improved techniques: Better ways of shaping stone and other materials\n• New materials: Use of softer stones and eventually metals\n• Complex designs: Tools with multiple parts working together`,
                      },
                      {
                        id: 2180,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Importance of tools for early humans",
                        body: `Tools were crucial for early human survival and development:\n• Made hunting and gathering more efficient\n• Allowed humans to access new food sources\n• Helped in making clothing and shelters\n• Enabled humans to defend themselves against predators\n• Led to the development of new skills and knowledge`,
                      },
                      {
                        id: 2190,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2200,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2210,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2220,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2221,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
              {
                id: 2030,
                description: `Discovery of Fire`,
                order: 3,
                title: "Topic 3",
                lessons: [
                  {
                    id: 313,
                    title: "Discovery of Fire",
                    order: 3,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "How did early humans discover fire?",
                        order: 1,
                        difficulty: 1,
                        id: 900320100,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "By rubbing two stones together",
                          },
                          {
                            correct: false,
                            text: "By mixing chemicals",
                          },
                          {
                            correct: false,
                            text: "By striking iron tools",
                          },
                          {
                            correct: false,
                            text: "By boiling water",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was one of the first uses of fire by early humans?",
                        order: 2,
                        difficulty: 1,
                        id: 900320101,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "Cooking food",
                          },
                          {
                            correct: false,
                            text: "Building houses",
                          },
                          {
                            correct: false,
                            text: "Writing",
                          },
                          {
                            correct: false,
                            text: "Transporting goods",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What did fire help early humans to do at night?",
                        order: 3,
                        difficulty: 1,
                        id: 900320102,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Travel long distances",
                          },
                          {
                            correct: false,
                            text: "Sleep comfortably",
                          },
                          {
                            correct: true,
                            text: "Keep wild animals away",
                          },
                          {
                            correct: false,
                            text: "Gather food",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Fire was essential for early humans primarily for which of the following activities?",
                        order: 4,
                        difficulty: 1,
                        id: 900320103,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Fishing",
                          },
                          {
                            correct: false,
                            text: "Drawing",
                          },
                          {
                            correct: true,
                            text: "Cooking and warmth",
                          },
                          {
                            correct: false,
                            text: "Singing",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following was NOT a use of fire by early humans?",
                        order: 5,
                        difficulty: 1,
                        id: 900320104,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Keeping warm",
                          },
                          {
                            correct: false,
                            text: "Lighting up caves",
                          },
                          {
                            correct: true,
                            text: "Writing books",
                          },
                          {
                            correct: false,
                            text: "Cooking food",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What material did early humans use to create fire?",
                        order: 6,
                        difficulty: 1,
                        id: 900320105,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Paper",
                          },
                          {
                            correct: false,
                            text: "Metal",
                          },
                          {
                            correct: true,
                            text: "Stone and wood",
                          },
                          {
                            correct: false,
                            text: "Plastic",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What natural occurrence might have first introduced early humans to fire?",
                        order: 7,
                        difficulty: 1,
                        id: 900320106,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Volcanic eruption",
                          },
                          {
                            correct: true,
                            text: "Lightning strike",
                          },
                          {
                            correct: false,
                            text: "Solar eclipse",
                          },
                          {
                            correct: false,
                            text: "Earthquake",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was a secondary benefit of fire apart from cooking?",
                        order: 8,
                        difficulty: 1,
                        id: 900320107,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Growing plants faster",
                          },
                          {
                            correct: true,
                            text: "Protection from predators",
                          },
                          {
                            correct: false,
                            text: "Increased rainfall",
                          },
                          {
                            correct: false,
                            text: "Easier hunting",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the discovery of fire change the dietary habits of early humans?",
                        order: 9,
                        difficulty: 2,
                        id: 900320108,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They started eating raw food",
                          },
                          {
                            correct: false,
                            text: "They stopped eating meat",
                          },
                          {
                            correct: true,
                            text: "They began cooking their food, making it easier to digest",
                          },
                          {
                            correct: false,
                            text: "They started eating plants only",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following statements is true about the discovery of fire?",
                        order: 10,
                        difficulty: 2,
                        id: 900320109,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "It was discovered by chance and later controlled for various uses",
                          },
                          {
                            correct: false,
                            text: "It was invented using advanced technology",
                          },
                          {
                            correct: false,
                            text: "It was used only for warmth",
                          },
                          {
                            correct: false,
                            text: "It had no significant impact on early human life",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What impact did the discovery of fire have on the social life of early humans?",
                        order: 11,
                        difficulty: 2,
                        id: 900320110,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It led to isolation as people stayed inside",
                          },
                          {
                            correct: false,
                            text: "It encouraged people to live separately",
                          },
                          {
                            correct: true,
                            text: "It promoted social gatherings around the fire",
                          },
                          {
                            correct: false,
                            text: "It made communication difficult",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why was the control of fire considered a significant achievement for early humans?",
                        order: 12,
                        difficulty: 2,
                        id: 900320111,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It allowed them to create new tools",
                          },
                          {
                            correct: false,
                            text: "It made travel unnecessary",
                          },
                          {
                            correct: true,
                            text: "It provided a source of light and heat, improving their quality of life",
                          },
                          {
                            correct: false,
                            text: "It led to the invention of the wheel",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did fire influence the settlement patterns of early humans?",
                        order: 13,
                        difficulty: 2,
                        id: 900320112,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They avoided areas with natural resources",
                          },
                          {
                            correct: false,
                            text: "They settled only near water bodies",
                          },
                          {
                            correct: true,
                            text: "They began to live in larger groups for safety and warmth",
                          },
                          {
                            correct: false,
                            text: "They started living underground",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following was a benefit of cooking food with fire?",
                        order: 14,
                        difficulty: 2,
                        id: 900320113,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It made food spoil faster",
                          },
                          {
                            correct: true,
                            text: "It made food easier to chew and digest",
                          },
                          {
                            correct: false,
                            text: "It made food less nutritious",
                          },
                          {
                            correct: false,
                            text: "It made food poisonous",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What other discoveries were made possible by the control of fire?",
                        order: 15,
                        difficulty: 2,
                        id: 900320114,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Invention of the wheel",
                          },
                          {
                            correct: true,
                            text: "Development of pottery and metalworking",
                          },
                          {
                            correct: false,
                            text: "Discovery of agriculture",
                          },
                          {
                            correct: false,
                            text: "Domestication of animals",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which aspect of fire usage improved the safety of early human settlements?",
                        order: 16,
                        difficulty: 2,
                        id: 900320115,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It provided entertainment",
                          },
                          {
                            correct: true,
                            text: "It increased visibility at night and deterred predators",
                          },
                          {
                            correct: false,
                            text: "It made them invisible to enemies",
                          },
                          {
                            correct: false,
                            text: "It reduced the need for shelter",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "In what way did the use of fire influence the migration of early humans?",
                        order: 17,
                        difficulty: 3,
                        id: 900320116,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It restricted them to one area",
                          },
                          {
                            correct: true,
                            text: "It allowed them to move to colder climates",
                          },
                          {
                            correct: false,
                            text: "It prevented them from crossing rivers",
                          },
                          {
                            correct: false,
                            text: "It made them dependent on forests",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following was a technological advancement linked to the control of fire?",
                        order: 18,
                        difficulty: 3,
                        id: 900320117,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Invention of the wheel",
                          },
                          {
                            correct: true,
                            text: "Creation of metal tools through metallurgy",
                          },
                          {
                            correct: false,
                            text: "Development of agriculture",
                          },
                          {
                            correct: false,
                            text: "Domestication of animals",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What archaeological evidence suggests the use of fire by early humans?",
                        order: 19,
                        difficulty: 3,
                        id: 900320118,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Stone carvings",
                          },
                          {
                            correct: true,
                            text: "Charred bones and hearths found in ancient caves",
                          },
                          {
                            correct: false,
                            text: "Written records",
                          },
                          {
                            correct: false,
                            text: "Fossilized remains of plants",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the discovery and use of fire affect the health of early humans?",
                        order: 20,
                        difficulty: 3,
                        id: 900320119,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It made them more prone to diseases",
                          },
                          {
                            correct: false,
                            text: "It had no impact on their health",
                          },
                          {
                            correct: true,
                            text: "It improved their nutrition by making food easier to digest and safer to eat",
                          },
                          {
                            correct: false,
                            text: "It caused respiratory issues due to smoke",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which theory about early human development is supported by the discovery of fire?",
                        order: 21,
                        difficulty: 3,
                        id: 900320120,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "Fire allowed humans to develop larger brains by providing cooked food",
                          },
                          {
                            correct: false,
                            text: "Fire was primarily used for hunting purposes",
                          },
                          {
                            correct: false,
                            text: "Fire led to the extinction of certain species",
                          },
                          {
                            correct: false,
                            text: "Fire discouraged the development of language",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What role did fire play in the development of early human societies?",
                        order: 22,
                        difficulty: 3,
                        id: 900320121,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It had no role",
                          },
                          {
                            correct: true,
                            text: "It was central to the development of social structures and community living",
                          },
                          {
                            correct: false,
                            text: "It led to the extinction of human societies",
                          },
                          {
                            correct: false,
                            text: "It was only used for ceremonial purposes",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the use of fire influence early human cognitive and cultural development?",
                        order: 23,
                        difficulty: 3,
                        id: 900320122,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It slowed down cognitive development",
                          },
                          {
                            correct: false,
                            text: "It had no influence",
                          },
                          {
                            correct: true,
                            text: "It promoted technological and cultural innovations, such as cooking and tool-making",
                          },
                          {
                            correct: false,
                            text: "It made humans less social",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What evidence of fire usage has been found in prehistoric archaeological sites?",
                        order: 24,
                        difficulty: 3,
                        id: 900320123,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Fossilized water bodies",
                          },
                          {
                            correct: true,
                            text: "Charred wood, ashes, and hearths",
                          },
                          {
                            correct: false,
                            text: "Metal artifacts",
                          },
                          {
                            correct: false,
                            text: "Written inscriptions",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why is the ability to control fire considered a major milestone in human evolution?",
                        order: 25,
                        difficulty: 3,
                        id: 900320124,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It was the first form of technology invented",
                          },
                          {
                            correct: true,
                            text: "It significantly improved survival and living conditions",
                          },
                          {
                            correct: false,
                            text: "It led to the development of modern languages",
                          },
                          {
                            correct: false,
                            text: "It allowed humans to travel to space",
                          },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 2230,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "What is fire?",
                        body: `Fire is a natural phenomenon that produces heat and light. It occurs when a material burns or undergoes combustion. Early humans observed fire in nature, such as from lightning strikes or volcanic activity.`,
                      },
                      {
                        id: 2240,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "How did early humans discover fire?",
                        body: `• Observation: They first saw fire occurring naturally in their environment.\n• Preservation: They learned to keep natural fires burning by adding fuel.\n• Creation: Eventually, they discovered how to make fire themselves.`,
                      },
                      {
                        id: 2250,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Methods of making fire",
                        body: `Early humans developed various methods to create fire:\n• Friction: Rubbing two pieces of wood together\n• Striking: Hitting certain types of stones together to create sparks\n• Drilling: Rapidly spinning a stick against a wooden board`,
                      },
                      {
                        id: 2260,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Uses of fire: Warmth and light",
                        body: `Fire provided many benefits to early humans:\n• Warmth: It allowed them to stay warm in cold climates and at night.\n• Light: Fire provided light in the darkness, extending their active hours.\n• Protection: The light and heat from fire kept predators away from their camps.`,
                      },
                      {
                        id: 2270,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Uses of fire: Cooking and food preservation",
                        body: `Fire revolutionized how early humans ate:\n• Cooking meat: Made it easier to eat and digest, and killed harmful bacteria.\n• Cooking plants: Made some inedible plants safe to eat and improved flavor.\n• Food preservation: Smoking meat over fire helped preserve it for longer periods.`,
                      },
                      {
                        id: 2280,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Uses of fire: Tool making",
                        body: `Fire helped early humans improve their tools:\n• Hardening wood: Fire could harden wooden spears, making them more effective.\n• Shaping stones: Heating certain stones made them easier to shape into tools.\n• Creating new materials: Eventually, humans used fire to work with metals.`,
                      },
                      {
                        id: 2290,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Social impact of fire",
                        body: `Fire changed how early humans interacted:\n• Gathering point: People gathered around fires, promoting social interaction.\n• Storytelling: The fireplace became a center for sharing stories and knowledge.\n• Expanded territories: With fire, humans could survive in colder regions.`,
                      },
                      {
                        id: 2300,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Long-term effects of fire use",
                        body: `The mastery of fire had far-reaching effects:\n• Brain development: Cooked food provided more energy, possibly aiding brain growth.\n• Cultural development: Fire rituals became part of early human culture and beliefs.\n• Technological advancement: Understanding fire was a stepping stone to more complex technologies.`,
                      },
                      {
                        id: 2310,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2320,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2330,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2340,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2341,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
              {
                id: 2040,
                description: `Beginning of Agriculture and Domestication of Animals`,
                order: 4,
                title: "Topic 4",
                lessons: [
                  {
                    id: 314,
                    title:
                      "Beginning of Agriculture and Domestication of Animals",
                    order: 4,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What is the term used for growing crops?",
                        order: 1,
                        difficulty: 1,
                        id: 900420125,
                        challengeOptions: [
                          { correct: false, text: "Hunting" },
                          { correct: false, text: "Fishing" },
                          { correct: true, text: "Agriculture" },
                          { correct: false, text: "Gathering" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following animals was one of the first to be domesticated?",
                        order: 2,
                        difficulty: 1,
                        id: 900420126,
                        challengeOptions: [
                          { correct: false, text: "Tiger" },
                          { correct: true, text: "Dog" },
                          { correct: false, text: "Elephant" },
                          { correct: false, text: "Lion" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What does the term 'domestication' refer to?",
                        order: 3,
                        difficulty: 1,
                        id: 900420127,
                        challengeOptions: [
                          { correct: false, text: "Training animals to hunt" },
                          {
                            correct: true,
                            text: "Taming animals for human use",
                          },
                          {
                            correct: false,
                            text: "Building homes for animals",
                          },
                          { correct: false, text: "None of the above" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which crop was among the first to be cultivated by early humans?",
                        order: 4,
                        difficulty: 1,
                        id: 900420128,
                        challengeOptions: [
                          { correct: true, text: "Wheat" },
                          { correct: false, text: "Cotton" },
                          { correct: false, text: "Coffee" },
                          { correct: false, text: "Tea" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is the primary purpose of domesticating animals?",
                        order: 5,
                        difficulty: 1,
                        id: 900420129,
                        challengeOptions: [
                          { correct: false, text: "For companionship" },
                          {
                            correct: true,
                            text: "For food, labor, and other resources",
                          },
                          { correct: false, text: "To use as guards" },
                          { correct: false, text: "For entertainment" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following is NOT a result of the beginning of agriculture?",
                        order: 6,
                        difficulty: 1,
                        id: 900420130,
                        challengeOptions: [
                          { correct: false, text: "Permanent settlements" },
                          { correct: false, text: "Increased food supply" },
                          { correct: true, text: "Nomadic lifestyle" },
                          { correct: false, text: "Growth of communities" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which tool is closely associated with early agriculture?",
                        order: 7,
                        difficulty: 1,
                        id: 900420131,
                        challengeOptions: [
                          { correct: false, text: "Bow and arrow" },
                          { correct: true, text: "Plough" },
                          { correct: false, text: "Spear" },
                          { correct: false, text: "Fishing net" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why was the domestication of animals important for early humans?",
                        order: 8,
                        difficulty: 1,
                        id: 900420132,
                        challengeOptions: [
                          {
                            correct: true,
                            text: "It provided a source of labor and food",
                          },
                          { correct: false, text: "It made travel impossible" },
                          {
                            correct: false,
                            text: "It led to the extinction of wild animals",
                          },
                          {
                            correct: false,
                            text: "It was only for entertainment purposes",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What change occurred as a result of the shift from hunting-gathering to agriculture?",
                        order: 9,
                        difficulty: 2,
                        id: 900420133,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Decrease in food production",
                          },
                          {
                            correct: true,
                            text: "Establishment of permanent settlements",
                          },
                          {
                            correct: false,
                            text: "Increased nomadic behavior",
                          },
                          { correct: false, text: "Reduced use of tools" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following best describes the process of domestication?",
                        order: 10,
                        difficulty: 2,
                        id: 900420134,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Catching wild animals and keeping them in cages",
                          },
                          {
                            correct: true,
                            text: "Training animals to perform tasks and live in close association with humans",
                          },
                          { correct: false, text: "Hunting animals for sport" },
                          {
                            correct: false,
                            text: "Keeping animals away from human settlements",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the domestication of plants and animals contribute to the development of human societies?",
                        order: 11,
                        difficulty: 2,
                        id: 900420135,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It decreased social interactions",
                          },
                          {
                            correct: true,
                            text: "It led to the creation of complex societies and trade",
                          },
                          {
                            correct: false,
                            text: "It had no significant impact",
                          },
                          { correct: false, text: "It caused frequent wars" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which area is considered one of the earliest centers of agriculture?",
                        order: 12,
                        difficulty: 2,
                        id: 900420136,
                        challengeOptions: [
                          { correct: false, text: "Antarctica" },
                          { correct: true, text: "Mesopotamia" },
                          { correct: false, text: "Australia" },
                          { correct: false, text: "Sahara Desert" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was the impact of agriculture on the lifestyle of early humans?",
                        order: 13,
                        difficulty: 2,
                        id: 900420137,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It encouraged a nomadic lifestyle",
                          },
                          {
                            correct: true,
                            text: "It led to settled communities and the growth of villages",
                          },
                          {
                            correct: false,
                            text: "It reduced the need for tools",
                          },
                          {
                            correct: false,
                            text: "It decreased food security",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did agriculture affect the social structure of early human communities?",
                        order: 14,
                        difficulty: 2,
                        id: 900420138,
                        challengeOptions: [
                          { correct: false, text: "It led to social equality" },
                          {
                            correct: true,
                            text: "It created differences in social status and roles",
                          },
                          {
                            correct: false,
                            text: "It eliminated the need for leadership",
                          },
                          {
                            correct: false,
                            text: "It made social structures irrelevant",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following is a direct result of the domestication of animals?",
                        order: 15,
                        difficulty: 2,
                        id: 900420139,
                        challengeOptions: [
                          { correct: false, text: "Development of the wheel" },
                          {
                            correct: true,
                            text: "Increased mobility and transport",
                          },
                          { correct: false, text: "Invention of writing" },
                          { correct: false, text: "Construction of cities" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which domesticated animal was primarily used for ploughing fields?",
                        order: 16,
                        difficulty: 2,
                        id: 900420140,
                        challengeOptions: [
                          { correct: false, text: "Dog" },
                          { correct: false, text: "Elephant" },
                          { correct: true, text: "Ox" },
                          { correct: false, text: "Horse" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What evidence suggests the beginning of agriculture in ancient times?",
                        order: 17,
                        difficulty: 3,
                        id: 900420141,
                        challengeOptions: [
                          { correct: false, text: "Cave paintings" },
                          {
                            correct: false,
                            text: "Fossilized remains of dinosaurs",
                          },
                          {
                            correct: true,
                            text: "Archaeological findings of grain storage and farming tools",
                          },
                          {
                            correct: false,
                            text: "Ancient scripts on hunting techniques",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the domestication of animals influence early human trade?",
                        order: 18,
                        difficulty: 3,
                        id: 900420142,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It reduced trade activities",
                          },
                          {
                            correct: true,
                            text: "It facilitated the transport of goods over long distances",
                          },
                          { correct: false, text: "It made trade unnecessary" },
                          {
                            correct: false,
                            text: "It only affected local trade",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What role did women play in the early agricultural societies?",
                        order: 19,
                        difficulty: 3,
                        id: 900420143,
                        challengeOptions: [
                          { correct: false, text: "Primarily hunters" },
                          { correct: true, text: "Gatherers and farmers" },
                          { correct: false, text: "Warriors" },
                          { correct: false, text: "Toolmakers" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which domesticated plant was crucial for the development of settled agricultural communities?",
                        order: 20,
                        difficulty: 3,
                        id: 900420144,
                        challengeOptions: [
                          { correct: true, text: "Wheat" },
                          { correct: false, text: "Cotton" },
                          { correct: false, text: "Tea" },
                          { correct: false, text: "Coffee" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following statements is true about the beginning of agriculture?",
                        order: 21,
                        difficulty: 3,
                        id: 900420145,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It began simultaneously across all continents",
                          },
                          {
                            correct: true,
                            text: "It started in specific regions and spread gradually",
                          },
                          {
                            correct: false,
                            text: "It had no impact on human settlements",
                          },
                          {
                            correct: false,
                            text: "It led to immediate urbanization",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why is the Neolithic Revolution considered a turning point in human history?",
                        order: 22,
                        difficulty: 3,
                        id: 900420146,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It marked the beginning of tool-making",
                          },
                          {
                            correct: true,
                            text: "It led to the establishment of agriculture and permanent settlements",
                          },
                          {
                            correct: false,
                            text: "It resulted in the discovery of fire",
                          },
                          {
                            correct: false,
                            text: "It initiated the practice of hunting",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the beginning of agriculture affect the environment?",
                        order: 23,
                        difficulty: 3,
                        id: 900420147,
                        challengeOptions: [
                          { correct: false, text: "It had no impact" },
                          {
                            correct: true,
                            text: "It led to deforestation and changes in land use",
                          },
                          {
                            correct: false,
                            text: "It preserved natural landscapes",
                          },
                          {
                            correct: false,
                            text: "It decreased human impact on nature",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which domesticated animal was integral to early human societies for transportation and labor?",
                        order: 24,
                        difficulty: 3,
                        id: 900420148,
                        challengeOptions: [
                          { correct: false, text: "Sheep" },
                          { correct: true, text: "Camel" },
                          { correct: false, text: "Dog" },
                          { correct: false, text: "Fish" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was the significance of irrigation in the development of agriculture?",
                        order: 25,
                        difficulty: 3,
                        id: 900420149,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It made agriculture difficult",
                          },
                          {
                            correct: true,
                            text: "It allowed for the cultivation of crops in arid regions",
                          },
                          {
                            correct: false,
                            text: "It was irrelevant to agriculture",
                          },
                          { correct: false, text: "It only helped in hunting" },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 2350,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "What is agriculture?",
                        body: `Agriculture is the practice of growing plants and raising animals for food and other uses. It began when humans started to grow their own food instead of just gathering wild plants.`,
                      },
                      {
                        id: 2360,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "How did agriculture begin?",
                        body: `• Observation: People noticed that dropped seeds grew into new plants.\n• Experimentation: They started planting seeds on purpose.\n• Selection: They chose to plant seeds from the best plants.\n• Cultivation: They began to care for the plants as they grew.`,
                      },
                      {
                        id: 2370,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Early crops",
                        body: `Different crops were first grown in different parts of the world:\n• Wheat and barley in the Middle East\n• Rice in China and India\n• Corn (maize) in Central America\n• Potatoes in South America`,
                      },
                      {
                        id: 2380,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "What is animal domestication?",
                        body: `Animal domestication is the process of taming wild animals and breeding them to live alongside humans. Domesticated animals provided food, labor, and other resources.`,
                      },
                      {
                        id: 2390,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "How did animal domestication begin?",
                        body: `• Hunting: Humans first hunted wild animals for food.\n• Taming: They captured young animals and raised them.\n• Breeding: They selectively bred the tamest animals.\n• Care: They provided food and protection to the animals.`,
                      },
                      {
                        id: 2400,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Early domesticated animals",
                        body: `Different animals were domesticated in different regions:\n• Dogs: First domesticated animal, used for hunting and protection\n• Sheep and goats: For meat, milk, and wool\n• Cattle: For meat, milk, and as draft animals\n• Chickens: For meat and eggs`,
                      },
                      {
                        id: 2410,
                        type: contentBlockTypeEnum.enumValues[1],
                        title:
                          "Benefits of agriculture and animal domestication",
                        body: `These practices brought many changes:\n• Reliable food source: Less dependence on hunting and gathering\n• Surplus food: Ability to store food for future use\n• Larger populations: More food could support more people\n• Permanent settlements: People could stay in one place\n• New technologies: Development of farming tools and techniques`,
                      },
                      {
                        id: 2420,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Changes in society",
                        body: `Agriculture and animal domestication led to big changes in how people lived:\n• Division of labor: Different jobs for different people\n• Social hierarchy: Some people became wealthier or more powerful\n• Trade: Exchange of surplus food and goods\n• Cultural development: More time for art, religion, and learning`,
                      },
                      {
                        id: 2430,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Challenges of early agriculture",
                        body: `The shift to farming wasn't always easy:\n• Hard work: Farming required more labor than hunting and gathering\n• Crop failures: Droughts or pests could destroy food supply\n• Less varied diet: People relied on fewer types of food\n• New diseases: Living close to animals led to new illnesses`,
                      },
                      {
                        id: 2440,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2450,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2460,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2470,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2471,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
              {
                id: 2050,
                description: `Settlements and community life`,
                order: 5,
                title: "Topic 5",
                lessons: [
                  {
                    id: 315,
                    title: "Settlements and community life",
                    order: 5,
                    challenges: [
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question: "What does the term 'settlement' refer to?",
                        order: 1,
                        difficulty: 1,
                        id: 900520150,
                        challengeOptions: [
                          { correct: true, text: "A place where people live" },
                          {
                            correct: false,
                            text: "A place where animals live",
                          },
                          { correct: false, text: "A place where people hunt" },
                          {
                            correct: false,
                            text: "A place where crops are grown",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why did early humans start settling in one place?",
                        order: 2,
                        difficulty: 1,
                        id: 900520151,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Because they ran out of food",
                          },
                          {
                            correct: true,
                            text: "Because they discovered agriculture",
                          },
                          {
                            correct: false,
                            text: "Because they wanted to travel less",
                          },
                          {
                            correct: false,
                            text: "Because they found better tools",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was one of the main reasons for the development of community life?",
                        order: 3,
                        difficulty: 1,
                        id: 900520152,
                        challengeOptions: [
                          { correct: false, text: "Discovery of fire" },
                          { correct: true, text: "Beginning of agriculture" },
                          { correct: false, text: "Development of language" },
                          { correct: false, text: "Domestication of animals" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What type of houses did early settlers build?",
                        order: 4,
                        difficulty: 1,
                        id: 900520153,
                        challengeOptions: [
                          { correct: false, text: "Stone houses" },
                          { correct: true, text: "Mud houses" },
                          { correct: false, text: "Wooden houses" },
                          { correct: false, text: "Brick houses" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which of the following is NOT a characteristic of early settlements?",
                        order: 5,
                        difficulty: 1,
                        id: 900520154,
                        challengeOptions: [
                          { correct: false, text: "Permanent houses" },
                          { correct: false, text: "Growing their own food" },
                          { correct: true, text: "Moving constantly" },
                          { correct: false, text: "Living in groups" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What activity became possible because of settled life?",
                        order: 6,
                        difficulty: 1,
                        id: 900520155,
                        challengeOptions: [
                          { correct: false, text: "Hunting" },
                          { correct: true, text: "Trade and exchange" },
                          { correct: false, text: "Fishing" },
                          { correct: false, text: "Painting" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "In early settlements, what did people use to build their homes?",
                        order: 7,
                        difficulty: 1,
                        id: 900520156,
                        challengeOptions: [
                          { correct: false, text: "Metal and glass" },
                          { correct: true, text: "Mud, wood, and stone" },
                          { correct: false, text: "Plastic and concrete" },
                          { correct: false, text: "Leaves and straw" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which development led to the formation of villages?",
                        order: 8,
                        difficulty: 1,
                        id: 900520157,
                        challengeOptions: [
                          { correct: false, text: "Use of advanced tools" },
                          {
                            correct: true,
                            text: "Start of agriculture and settled life",
                          },
                          { correct: false, text: "Domestication of animals" },
                          { correct: false, text: "Discovery of fire" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the development of agriculture impact community life?",
                        order: 9,
                        difficulty: 2,
                        id: 900520158,
                        challengeOptions: [
                          { correct: false, text: "It reduced food supply" },
                          {
                            correct: false,
                            text: "It increased the need for hunting",
                          },
                          {
                            correct: true,
                            text: "It allowed people to stay in one place and form communities",
                          },
                          {
                            correct: false,
                            text: "It made people more nomadic",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What role did surplus food production play in early communities?",
                        order: 10,
                        difficulty: 2,
                        id: 900520159,
                        challengeOptions: [
                          { correct: false, text: "It led to food shortages" },
                          {
                            correct: true,
                            text: "It allowed trade and specialization of labor",
                          },
                          {
                            correct: false,
                            text: "It made people travel more",
                          },
                          {
                            correct: false,
                            text: "It decreased the need for cooperation",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did early communities ensure their security?",
                        order: 11,
                        difficulty: 2,
                        id: 900520160,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "By building high walls around their settlements",
                          },
                          {
                            correct: false,
                            text: "By relying on individual protection",
                          },
                          { correct: false, text: "By migrating constantly" },
                          {
                            correct: true,
                            text: "By forming large groups for mutual protection",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What is a key feature of community life that emerged with settled agriculture?",
                        order: 12,
                        difficulty: 2,
                        id: 900520161,
                        challengeOptions: [
                          { correct: false, text: "Individualistic living" },
                          {
                            correct: true,
                            text: "Collective effort and cooperation",
                          },
                          { correct: false, text: "Isolation from others" },
                          { correct: false, text: "Constant conflict" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did early humans' social structures change with the advent of settled life?",
                        order: 13,
                        difficulty: 2,
                        id: 900520162,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "They became more egalitarian",
                          },
                          {
                            correct: true,
                            text: "They became more complex with defined roles and hierarchies",
                          },
                          {
                            correct: false,
                            text: "They became less organized",
                          },
                          {
                            correct: false,
                            text: "They eliminated social roles",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which innovation was crucial for the development of larger communities and cities?",
                        order: 14,
                        difficulty: 2,
                        id: 900520163,
                        challengeOptions: [
                          { correct: false, text: "Fishing nets" },
                          { correct: true, text: "Writing and record-keeping" },
                          { correct: false, text: "Hunting tools" },
                          { correct: false, text: "Stone tools" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the formation of early settlements influence the environment?",
                        order: 15,
                        difficulty: 2,
                        id: 900520164,
                        challengeOptions: [
                          { correct: false, text: "It had no impact" },
                          {
                            correct: true,
                            text: "It led to deforestation and changes in land use",
                          },
                          {
                            correct: false,
                            text: "It preserved natural habitats",
                          },
                          {
                            correct: false,
                            text: "It decreased human impact on nature",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was one of the major economic activities in early settled communities besides agriculture?",
                        order: 16,
                        difficulty: 2,
                        id: 900520165,
                        challengeOptions: [
                          { correct: false, text: "Industrial production" },
                          {
                            correct: true,
                            text: "Trade and exchange of goods",
                          },
                          { correct: false, text: "High-tech manufacturing" },
                          { correct: false, text: "Software development" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What evidence do archaeologists use to study early human settlements?",
                        order: 17,
                        difficulty: 3,
                        id: 900520166,
                        challengeOptions: [
                          { correct: false, text: "Modern buildings" },
                          {
                            correct: true,
                            text: "Remains of houses, tools, and pottery",
                          },
                          {
                            correct: false,
                            text: "Written documents from the time",
                          },
                          {
                            correct: false,
                            text: "Fossilized remains of ancient plants",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which early settlement is known for being one of the first to practice advanced agriculture and animal domestication?",
                        order: 18,
                        difficulty: 3,
                        id: 900520167,
                        challengeOptions: [
                          { correct: false, text: "Ancient Egypt" },
                          { correct: true, text: "Mesopotamia" },
                          { correct: false, text: "Indus Valley" },
                          { correct: false, text: "Sahara Desert" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the practice of settled agriculture lead to technological advancements?",
                        order: 19,
                        difficulty: 3,
                        id: 900520168,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It decreased the need for innovation",
                          },
                          {
                            correct: true,
                            text: "It created a surplus of food, allowing people time to develop new tools and technologies",
                          },
                          {
                            correct: false,
                            text: "It made technology irrelevant",
                          },
                          {
                            correct: false,
                            text: "It led to technological decline",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What role did religion play in early settled communities?",
                        order: 20,
                        difficulty: 3,
                        id: 900520169,
                        challengeOptions: [
                          { correct: false, text: "It had no role" },
                          {
                            correct: true,
                            text: "It became a central part of community life, influencing social and political structures",
                          },
                          {
                            correct: false,
                            text: "It was only for entertainment",
                          },
                          {
                            correct: false,
                            text: "It discouraged community living",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "What was the impact of the Neolithic Revolution on human population?",
                        order: 21,
                        difficulty: 3,
                        id: 900520170,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Population remained static",
                          },
                          {
                            correct: true,
                            text: "Population increased significantly due to stable food supplies",
                          },
                          {
                            correct: false,
                            text: "Population decreased due to wars",
                          },
                          {
                            correct: false,
                            text: "Population dispersed and became nomadic again",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did the formation of settlements influence the development of culture and arts?",
                        order: 22,
                        difficulty: 3,
                        id: 900520171,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It led to the decline of cultural activities",
                          },
                          {
                            correct: true,
                            text: "It provided stability and resources that allowed for the development of culture and arts",
                          },
                          {
                            correct: false,
                            text: "It had no effect on cultural development",
                          },
                          { correct: false, text: "It made arts irrelevant" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Which social changes accompanied the transition from nomadic to settled life?",
                        order: 23,
                        difficulty: 3,
                        id: 900520172,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "Increase in social equality",
                          },
                          {
                            correct: true,
                            text: "Emergence of defined social roles and hierarchies",
                          },
                          {
                            correct: false,
                            text: "Reduction in social interactions",
                          },
                          {
                            correct: false,
                            text: "Elimination of leadership roles",
                          },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "Why were early settled communities often located near rivers?",
                        order: 24,
                        difficulty: 3,
                        id: 900520173,
                        challengeOptions: [
                          { correct: false, text: "For aesthetic beauty" },
                          {
                            correct: true,
                            text: "For access to water for drinking, irrigation, and transportation",
                          },
                          { correct: false, text: "To avoid predators" },
                          { correct: false, text: "To isolate themselves" },
                        ],
                      },
                      {
                        type: schema.challengesEnum.enumValues[0],
                        question:
                          "How did settled life contribute to the development of government and administration?",
                        order: 25,
                        difficulty: 3,
                        id: 900520174,
                        challengeOptions: [
                          {
                            correct: false,
                            text: "It eliminated the need for governance",
                          },
                          {
                            correct: true,
                            text: "It required organized leadership and administrative systems to manage resources and people",
                          },
                          {
                            correct: false,
                            text: "It made governance chaotic",
                          },
                          {
                            correct: false,
                            text: "It had no effect on administration",
                          },
                        ],
                      },
                    ],
                    blocks: [
                      {
                        id: 2480,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "What is a settlement?",
                        body: `A settlement is a place where people live together. Early human settlements were the first villages and towns that people built when they stopped moving around and started growing food.`,
                      },
                      {
                        id: 2490,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "From nomads to settlers",
                        body: `• Nomads: Hunter-gatherers who moved from place to place.\n• Settlers: People who stayed in one place to farm and raise animals.\n• Reason for change: Farming required people to stay near their crops.`,
                      },
                      {
                        id: 2500,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Early settlements",
                        body: `The first settlements were small villages:\n• Location: Near water sources and good farming land\n• Housing: Simple homes made of mud, wood, or stone\n• Size: Usually home to a few families or a small community\n• Layout: Houses grouped together, often with a central area`,
                      },
                      {
                        id: 2510,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Community life in early settlements",
                        body: `Living in settlements changed how people interacted:\n• Cooperation: People worked together to farm and build\n• Shared resources: Tools and food were often shared\n• Social gatherings: More opportunities for group activities\n• Decision making: Leaders emerged to guide the community`,
                      },
                      {
                        id: 2520,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Division of labor",
                        body: `As settlements grew, people started to have different jobs:\n• Farmers: Grew crops and raised animals\n• Craftspeople: Made tools, pottery, and clothing\n• Builders: Constructed homes and other structures\n• Leaders: Made decisions for the community`,
                      },
                      {
                        id: 2530,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Trade and exchange",
                        body: `Settlements allowed for new forms of exchange:\n• Surplus: Extra food could be traded for other goods\n• Specialization: People could focus on making specific items to trade\n• Markets: Places where people met to exchange goods\n• Long-distance trade: Exchange with other settlements`,
                      },
                      {
                        id: 2540,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Cultural developments",
                        body: `Settled life allowed for new cultural practices:\n• Art: More time for creating pottery, sculptures, and paintings\n• Religion: Building of temples and development of rituals\n• Learning: Passing down of knowledge and skills\n• Technology: Invention of new tools and techniques`,
                      },
                      {
                        id: 2550,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Changes in society",
                        body: `Settlements led to more complex social structures:\n• Social hierarchy: Some people became wealthier or more powerful\n• Property ownership: Land and resources could be owned\n• Rules and laws: Development of community guidelines\n• Conflict: Disputes over resources or power could arise`,
                      },
                      {
                        id: 2560,
                        type: contentBlockTypeEnum.enumValues[1],
                        title: "Growth of settlements",
                        body: `Over time, some settlements grew larger:\n• Villages: Small farming communities\n• Towns: Larger settlements with more diverse activities\n• Cities: Very large settlements with complex organization\n• This growth led to the development of early civilizations`,
                      },
                      {
                        id: 2570,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2580,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2590,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                      {
                        id: 2600,
                        type: contentBlockTypeEnum.enumValues[0],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    // Insert subjects
    const subjects = await db
      .insert(schema.subjects)
      .values(
        subjectsData.map((eachSubject) => {
          return {
            id: eachSubject.subjectId,
            title: eachSubject.title,
            imageSrc: eachSubject.imageSrc,
          };
        })
      )
      .returning();

    console.log(`Inserted ${subjects.length} subjects.`);

    // For each subject, insert chapters
    for (const subject of subjectsData) {
      const chapters = await db
        .insert(schema.chapters)
        .values(
          subject.chapters.map((eachChapter) => {
            return { subjectId: subject.subjectId, ...eachChapter };
          })
        )
        .returning();

      console.log(
        `Inserted ${chapters.length} chapter(s): subject "${subject.title}"`
      );

      // For each chapter, insert topics
      for (const chapter of subject.chapters) {
        const topics = await db
          .insert(schema.topics)
          .values(
            chapter.topics.map((eachTopic) => {
              return { chapterId: chapter.id, ...eachTopic };
            })
          )
          .returning();
        console.log(
          `Inserted ${topics.length} topic(s): ${subject.title}/${chapter.title}`
        );

        // For each topic, insert lessons
        for (const topic of chapter.topics) {
          const lessons = await db
            .insert(schema.lessons)
            .values(
              topic.lessons.map((eachLesson) => {
                const contentBlockIds = eachLesson.blocks.map(
                  (contentBlock) => contentBlock.id
                );
                return { topicId: topic.id, contentBlockIds, ...eachLesson };
              })
            )
            .returning();
          console.log(
            `Inserted ${lessons.length} lesson(s): ${subject.title}/${chapter.title}/${topic.title}`
          );

          // For each lesson, insert content blocks and challenges
          for (const lesson of topic.lessons) {
            const contentBlocks = await db
              .insert(schema.contentBlocks)
              .values(
                lesson.blocks.map((contentData) => {
                  return {
                    id: contentData.id,
                    type: contentData.type,
                    title: contentData.title,
                    body: contentData.body,
                    lessonId: lesson.id,
                  };
                })
              )
              .returning();
            console.log(
              `Inserted ${contentBlocks.length} content blocks: ${subject.title}/${chapter.title}/${topic.title}/${lesson.title}`
            );

            const challenges = await db
              .insert(schema.challenges)
              .values(
                lesson.challenges.map((eachChallenge) => {
                  return {
                    lessonId: lesson.id,
                    type: eachChallenge.type,
                    question: eachChallenge.question,
                    order: eachChallenge.order,
                    difficulty: eachChallenge.difficulty,
                    id: eachChallenge.id,
                  };
                })
              )
              .returning();
            console.log(
              `Inserted ${challenges.length} challenges: ${subject.title}/${chapter.title}/${topic.title}/${lesson.title}`
            );

            // For each challenge, insert challenge options
            for (const challenge of lesson.challenges) {
              await db.insert(schema.challengeOptions).values(
                challenge.challengeOptions.map((eachOption) => {
                  return { challengeId: challenge.id, ...eachOption };
                })
              );
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
