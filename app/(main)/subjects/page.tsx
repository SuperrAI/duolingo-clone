import { getSubjects, getUserProgress } from "@/db/queries";

import { List } from "./list";

const SubjectsPage = async () => {
  const subjectsData = getSubjects();
  const userProgressData = getUserProgress();

  const [subjects, userProgress] = await Promise.all([
    subjectsData,
    userProgressData,
  ]);

  return (
    <div className="mx-auto h-full max-w-[912px] px-3">
      <h1 className="text-2xl font-bold text-neutral-700">Language Subjects</h1>

      <List subjects={subjects} activeSubjectId={userProgress?.activeSubjectId} />
    </div>
  );
};

export default SubjectsPage;
