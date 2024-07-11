import { redirect } from "next/navigation";

import { getSkill, getUserProgress, getUserSubscription } from "@/db/queries";

import { Quiz } from "./quiz";

const SkillPage = async () => {
  const skillData = getSkill();
  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();

  const [skill, userProgress, userSubscription] = await Promise.all([
    skillData,
    userProgressData,
    userSubscriptionData,
  ]);

  if (!skill || !userProgress) return redirect("/learn");

  const initialPercentage =
    (skill.challenges.filter((challenge) => challenge.completed).length /
      skill.challenges.length) *
    100;

  return (
    <Quiz
      initialSkillId={skill.id}
      initialSkillChallenges={skill.challenges}
      initialHearts={userProgress.hearts}
      initialPercentage={initialPercentage}
      userSubscription={userSubscription}
    />
  );
};

export default SkillPage;
