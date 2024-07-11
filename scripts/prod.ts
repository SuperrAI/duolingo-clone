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
      // db.delete(schema.userProgress),
      db.delete(schema.challenges),
      db.delete(schema.units),
      db.delete(schema.lessons),
      db.delete(schema.courses),
      db.delete(schema.challengeOptions),
      // db.delete(schema.userSubscription),
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
            description: `Basic Math Questions`,
            order: 1,
            title: "Unit 1",
            lessons: [
              {
                id: 111,
                title: "Lesson 1",
                order: 1,
                challenges: [
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question:
                      "Write 5 million, 3 thousand, and 21 in numerals.",
                    order: 1,
                    difficulty: 1,
                    id: 1111,
                    challengeOptions: [
                      {
                        correct: true,
                        text: "5,003,021",
                      },
                      {
                        correct: false,
                        text: "5,300,021",
                      },
                      {
                        correct: false,
                        text: "5,030,021",
                      },
                      {
                        correct: false,
                        text: "5,000,321",
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
                    id: 1235,
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
                    id: 7823,
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
                    id: 3491,
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
                    id: 5962,
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
                    id: 1234,
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
                    id: 8765,
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
                    id: 2468,
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
                    id: 1357,
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
                    id: 9876,
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
                    id: 3579,
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
                    id: 2580,
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
                    id: 1136,
                    challengeOptions: [
                      { correct: false, text: "Carrying oxygen in blood" },
                      { correct: false, text: "Improving eyesight" },
                      { correct: true, text: "Strengthening bones and teeth" },
                      { correct: false, text: "Aiding in digestion" },
                    ],
                  },
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question: "Which nutrient helps in healing wounds?",
                    order: 12,
                    difficulty: 1,
                    id: 2247,
                    challengeOptions: [
                      { correct: false, text: "Carbohydrates" },
                      { correct: false, text: "Proteins" },
                      { correct: false, text: "Fats" },
                      { correct: true, text: "Vitamin C" },
                    ],
                  },
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question:
                      "What is the function of Vitamin B complex in our body?",
                    order: 13,
                    difficulty: 2,
                    id: 3358,
                    challengeOptions: [
                      { correct: false, text: "Improving eyesight" },
                      { correct: false, text: "Strengthening bones" },
                      {
                        correct: true,
                        text: "Helping in energy release from food",
                      },
                      { correct: false, text: "Regulating body temperature" },
                    ],
                  },
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question:
                      "Which nutrient is important for the formation of hemoglobin?",
                    order: 14,
                    difficulty: 3,
                    id: 4469,
                    challengeOptions: [
                      { correct: false, text: "Calcium" },
                      { correct: true, text: "Iron" },
                      { correct: false, text: "Iodine" },
                      { correct: false, text: "Vitamin D" },
                    ],
                  },
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question:
                      "What is the main function of Vitamin C in our body?",
                    order: 15,
                    difficulty: 1,
                    id: 5580,
                    challengeOptions: [
                      { correct: false, text: "Providing energy" },
                      { correct: false, text: "Building muscles" },
                      { correct: true, text: "Protecting against infections" },
                      { correct: false, text: "Regulating body temperature" },
                    ],
                  },
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question:
                      "Which nutrient is important for proper nerve function?",
                    order: 16,
                    difficulty: 2,
                    id: 6691,
                    challengeOptions: [
                      { correct: false, text: "Carbohydrates" },
                      { correct: false, text: "Fats" },
                      { correct: false, text: "Proteins" },
                      { correct: true, text: "Potassium" },
                    ],
                  },
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question: "What is the role of phosphorus in our body?",
                    order: 17,
                    difficulty: 3,
                    id: 7802,
                    challengeOptions: [
                      { correct: false, text: "Improving eyesight" },
                      { correct: false, text: "Aiding in digestion" },
                      { correct: true, text: "Formation of bones and teeth" },
                      { correct: false, text: "Producing red blood cells" },
                    ],
                  },
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question:
                      "Which nutrient provides the most energy per gram?",
                    order: 18,
                    difficulty: 1,
                    id: 8913,
                    challengeOptions: [
                      { correct: false, text: "Carbohydrates" },
                      { correct: false, text: "Proteins" },
                      { correct: true, text: "Fats" },
                      { correct: false, text: "Vitamins" },
                    ],
                  },
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question: "What is the function of Vitamin E in our body?",
                    order: 19,
                    difficulty: 2,
                    id: 10024,
                    challengeOptions: [
                      { correct: false, text: "Strengthening bones" },
                      { correct: false, text: "Improving digestion" },
                      { correct: true, text: "Acting as an antioxidant" },
                      { correct: false, text: "Producing red blood cells" },
                    ],
                  },
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question:
                      "Which nutrient is essential for the synthesis of thyroid hormones?",
                    order: 20,
                    difficulty: 3,
                    id: 1035,
                    challengeOptions: [
                      { correct: false, text: "Calcium" },
                      { correct: false, text: "Iron" },
                      { correct: true, text: "Iodine" },
                      { correct: false, text: "Vitamin A" },
                    ],
                  },
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question:
                      "What is the primary function of proteins in our body?",
                    order: 21,
                    difficulty: 1,
                    id: 2045,
                    challengeOptions: [
                      { correct: false, text: "Providing energy" },
                      { correct: true, text: "Building and repairing tissues" },
                      { correct: false, text: "Storing vitamins" },
                      { correct: false, text: "Regulating body temperature" },
                    ],
                  },
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question:
                      "Which nutrient helps in the absorption of iron in our body?",
                    order: 22,
                    difficulty: 2,
                    id: 3055,
                    challengeOptions: [
                      { correct: false, text: "Vitamin A" },
                      { correct: false, text: "Vitamin B" },
                      { correct: true, text: "Vitamin C" },
                      { correct: false, text: "Vitamin D" },
                    ],
                  },
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question: "What is the role of zinc in our body?",
                    order: 23,
                    difficulty: 3,
                    id: 4065,
                    challengeOptions: [
                      { correct: false, text: "Improving eyesight" },
                      { correct: false, text: "Strengthening bones" },
                      {
                        correct: true,
                        text: "Aiding in wound healing and immune function",
                      },
                      { correct: false, text: "Regulating body temperature" },
                    ],
                  },
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question:
                      "Which nutrient is important for maintaining fluid balance in our body?",
                    order: 24,
                    difficulty: 1,
                    id: 5075,
                    challengeOptions: [
                      { correct: false, text: "Carbohydrates" },
                      { correct: false, text: "Proteins" },
                      { correct: false, text: "Fats" },
                      { correct: true, text: "Sodium" },
                    ],
                  },
                  {
                    type: schema.challengesEnum.enumValues[0],
                    question:
                      "What is the function of Vitamin B12 in our body?",
                    order: 25,
                    difficulty: 2,
                    id: 6085,
                    challengeOptions: [
                      { correct: false, text: "Improving eyesight" },
                      { correct: true, text: "Formation of red blood cells" },
                      { correct: false, text: "Strengthening bones" },
                      { correct: false, text: "Regulating body temperature" },
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
                    id: 7826,
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
                    id: 3494,
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
                    id: 5965,
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
                    id: 1237,
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
                    id: 8768,
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
                    id: 2471,
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
                    id: 1360,
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
                    id: 9879,
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
                    id: 3582,
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
                    id: 2583,
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
                    id: 1137,
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
                    id: 2248,
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
                    id: 3359,
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
                    id: 4470,
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
                    id: 5581,
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
                    id: 6692,
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
                    id: 7803,
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
                    id: 8914,
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
                    id: 10025,
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
                    id: 11136,
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
                    id: 12247,
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
                    id: 13358,
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
                    id: 14469,
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
                    id: 15580,
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
                    id: 16691,
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
