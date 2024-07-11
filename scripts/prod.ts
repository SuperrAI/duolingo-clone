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
                    id: 7827,
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
                    id: 3495,
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
                    id: 5966,
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
                    id: 1238,
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
                    id: 8769,
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
                    id: 2472,
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
                    id: 1361,
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
                    id: 9880,
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
                    id: 3583,
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
                    id: 2584,
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
                    id: 7831,
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
                    id: 3499,
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
                    id: 5970,
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
                    id: 1242,
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
                    id: 8772,
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
                    id: 2475,
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
                    id: 1364,
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
                    id: 9883,
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
                    id: 3586,
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
                    id: 2587,
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
