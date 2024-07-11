import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";

const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql, { schema });

const createTables = async () => {
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
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_correct BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
  );`;

  await sql`CREATE TABLE IF NOT EXISTS lesson_progress (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    current_difficulty INTEGER,
    correct_answers INTEGER,
    total_attempts INTEGER,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_attempted_at TIMESTAMP NOT NULL DEFAULT now()
  );`;

  await sql`CREATE TABLE IF NOT EXISTS user_progress (
    user_id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL DEFAULT 'User',
    user_image_src TEXT NOT NULL DEFAULT '/man.svg',
    active_course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    current_lesson_id INTEGER REFERENCES lessons(id),
    last_attempted_challenge_id INTEGER REFERENCES challenges(id),
    hearts INTEGER NOT NULL DEFAULT 50,
    points INTEGER NOT NULL DEFAULT 0
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

    /**
     * Maths data
     */
    const coursesData = [
      {
        courseId: 1,
        title: "Math",
        imageSrc: "/man.svg",
        units: [
          {
            id: 11,
            description: `Knowing Our Numbers`,
            order: 1,
            title: "Unit 1",
            lessons: [
              {
                id: 111,
                title: "Comparing Large and Small Numbers",
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
                        correct: true,
                        text: "6000",
                      },
                      {
                        correct: false,
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
                    question: "The place value of 8 in the number 38542 is:",
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
                    question: "Which of the following is the smallest number?",
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
              },
              {
                id: 112,
                title: "Understanding and Using Large Number in Practice",
                order: 2,
                challenges: [
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question: "What is the word form of the number 2345678?",
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
                    question: "What is the sum of 123456, 789012, and 654321?",
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
                    question: "Calculate the sum: 1234567 + 7654321 + 8765432:",
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
              },
              {
                id: 113,
                title: "Simplifying Calculations with Brackets",
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
                    question: "Find the result: (9 ÷ 3) + [8 - {6 - (3 + 2)}]",
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
                    question: "Calculate: 15 + [3 × (10 - 5) - {8 + (4 ÷ 2)}]",
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
              },
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
                    question: "Which Roman numeral represents the number 246?",
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
              },
            ],
          },
        ],
      },
      {
        courseId: 2,
        title: "Science",
        imageSrc: "/man.svg",
        units: [
          {
            id: 21,
            description: `Components of Food`,
            order: 1,
            title: "Unit 1",
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
                    question: "Which of these foods is a good source of iron?",
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
              },
              {
                id: 587,
                title: "What do Various Nutrients do for our Body?",
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
                    question: "Which nutrient is essential for blood clotting?",
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
                    question: "What is the function of Vitamin E in our body?",
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
              },
              {
                id: 943,
                title: "Balanced diet",
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
                    question: "What happens if a person's diet lacks variety?",
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
                    question: "Which statement about a balanced diet is TRUE?",
                    order: 11,
                    difficulty: 3,
                    id: 113700,
                    challengeOptions: [
                      { correct: false, text: "It should eliminate all fats" },
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
                      { correct: false, text: "It is a source of vitamins" },
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
                      { correct: false, text: "Proper growth and development" },
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
                      { correct: false, text: "Maintaining a healthy weight" },
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
                      { correct: false, text: "By including only proteins" },
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
                      { correct: false, text: "It makes meals more colorful" },
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
                      { correct: false, text: "They are difficult to cook" },
                    ],
                  },
                ],
              },
              {
                id: 325,
                title: "Deficiency diseases",
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
                    question: "Which vitamin deficiency can cause beriberi?",
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
                    question: "How does Vitamin D deficiency lead to rickets?",
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
                    question: "How does Vitamin C deficiency lead to scurvy?",
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
                    question: "Which of these is a good source of Vitamin D?",
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
              },
              {
                id: 761,
                title: "Test for Presence of Different Components in Food",
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
                    question: "Which test involves rubbing the food on paper?",
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
                      { correct: true, text: "Grind the food into a paste" },
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
                      { correct: false, text: "To neutralize the solution" },
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
                      { correct: true, text: "It would remain yellow/brown" },
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
              },
              {
                id: 104,
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
                    question: "How does roughage help in weight management?",
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
                    question: "What happens if a person's diet lacks roughage?",
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
                    question: "How does roughage affect blood sugar levels?",
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
                    question: "How does roughage contribute to colon health?",
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
                    question: "Which of these is NOT a type of dietary fiber?",
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
                    question: "How does fiber intake affect water consumption?",
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
              },
            ],
          },
        ],
      },
    ];

    // Insert courses
    const courses = await db
      .insert(schema.courses)
      // .values([{ title: "Math", imageSrc: "/man.svg" }, { title: "Science", imageSrc: "/man.svg" }])
      .values(
        coursesData.map((eachCourse) => {
          return {
            id: eachCourse.courseId,
            title: eachCourse.title,
            imageSrc: eachCourse.imageSrc,
          };
        })
      )
      .returning();

    console.log(`Inserted ${courses.length} courses.`);

    // For each course, insert units
    for (const course of coursesData) {
      const units = await db
        .insert(schema.units)
        .values(
          course.units.map((eachUnit) => {
            return { courseId: course.courseId, ...eachUnit };
          })
        )
        .returning();

      console.log(`Inserted ${units.length} units of course "${course.title}"`);

      // For each unit, insert lessons
      for (const courseUnits of course.units) {
        const lessons = await db
          .insert(schema.lessons)
          .values(
            courseUnits.lessons.map((eachLesson) => {
              return { unitId: courseUnits.id, ...eachLesson };
            })
          )
          .returning();
        console.log(
          `Inserted ${lessons.length} units of unit "${courseUnits.title}"`
        );

        // For each lesson, insert challenges
        for (const lesson of courseUnits.lessons) {
          const challenges = await db
            .insert(schema.challenges)
            .values(
              lesson.challenges.map((eachChallenge) => {
                return {
                  lessonId: lesson.id,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
            `Inserted ${challenges.length} challenges of lesson "${lesson.title}"`
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
    console.log("Database seeded successfully");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to seed database");
  }
};

void main();
